import { analyzeQuery, generateExecutionPlan } from '../../engine/executor/queryPlanner.js';
import storageManager from '../../engine/storage/storageManager.js';
import { parse } from '../../engine/parser/parser.js';

console.log('Testing Query Planner...\n');

let passedTests = 0;
let failedTests = 0;

function runTest(name, testFn) {
    try {
        console.log(`\nTest: ${name}`);
        testFn();
        console.log('✓ Passed');
        passedTests++;
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
        console.error(error.stack);
        failedTests++;
    }
}

console.log('Setting up test table...');
storageManager.createTable('products', [
    { name: 'id', type: 'NUMBER' },
    { name: 'name', type: 'STRING' },
    { name: 'price', type: 'NUMBER' }
]);

storageManager.insertRows('products', [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Mouse', price: 29 },
    { id: 3, name: 'Keyboard', price: 79 }
]);
console.log('Test table created.\n');

runTest('Analyze simple SELECT query', () => {
    const ast = parse('SELECT * FROM products');
    const analysis = analyzeQuery(ast);

    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    if (analysis.queryType !== 'SELECT') {
        throw new Error('Wrong query type');
    }

    if (analysis.complexity !== 'SIMPLE') {
        throw new Error('Should be SIMPLE complexity');
    }

    if (!analysis.tableStats) {
        throw new Error('Missing table stats');
    }
});

runTest('Analyze SELECT with WHERE', () => {
    const ast = parse('SELECT name FROM products WHERE price > 50');
    const analysis = analyzeQuery(ast);

    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    if (analysis.complexity !== 'MODERATE') {
        throw new Error('Should be MODERATE complexity');
    }

    if (analysis.estimatedCost <= 0) {
        throw new Error('Should have estimated cost');
    }
});

runTest('Analyze SELECT with compound WHERE', () => {
    const ast = parse("SELECT * FROM products WHERE price > 50 AND name = 'Laptop'");
    const analysis = analyzeQuery(ast);

    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    if (analysis.complexity !== 'COMPLEX') {
        throw new Error('Should be COMPLEX complexity');
    }
});

runTest('Analyze INSERT query', () => {
    const ast = parse("INSERT INTO products VALUES (4, 'Monitor', 299)");
    const analysis = analyzeQuery(ast);

    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    if (analysis.queryType !== 'INSERT') {
        throw new Error('Wrong query type');
    }

    if (analysis.complexity !== 'SIMPLE') {
        throw new Error('Should be SIMPLE complexity');
    }
});

runTest('Analyze UPDATE query', () => {
    const ast = parse("UPDATE products SET price = 999 WHERE id = 1");
    const analysis = analyzeQuery(ast);

    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    if (analysis.queryType !== 'UPDATE') {
        throw new Error('Wrong query type');
    }

    if (!analysis.updatedColumns) {
        throw new Error('Missing updated columns');
    }
});

runTest('Analyze UPDATE without WHERE', () => {
    const ast = parse("UPDATE products SET price = 0");
    const analysis = analyzeQuery(ast);

    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    if (analysis.warnings.length === 0) {
        throw new Error('Should have warning about UPDATE without WHERE');
    }
});

runTest('Analyze DELETE query', () => {
    const ast = parse('DELETE FROM products WHERE price < 50');
    const analysis = analyzeQuery(ast);

    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    if (analysis.queryType !== 'DELETE') {
        throw new Error('Wrong query type');
    }
});

runTest('Analyze DELETE without WHERE', () => {
    const ast = parse('DELETE FROM products');
    const analysis = analyzeQuery(ast);

    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    if (analysis.warnings.length === 0) {
        throw new Error('Should have warning about DELETE without WHERE');
    }

    if (analysis.recommendations.length === 0) {
        throw new Error('Should recommend TRUNCATE');
    }
});

runTest('Analyze CREATE TABLE', () => {
    const ast = parse('CREATE TABLE users (id NUMBER, name STRING)');
    const analysis = analyzeQuery(ast);

    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    if (analysis.queryType !== 'CREATE') {
        throw new Error('Wrong query type');
    }

    if (!analysis.columnCount) {
        throw new Error('Missing column count');
    }
});

runTest('Generate SELECT execution plan', () => {
    const ast = parse('SELECT name, price FROM products WHERE price > 50');
    const plan = generateExecutionPlan(ast);

    console.log('Execution Plan:', JSON.stringify(plan, null, 2));

    if (!plan.steps || plan.steps.length === 0) {
        throw new Error('Plan should have steps');
    }

    if (plan.estimatedTime <= 0) {
        throw new Error('Should have estimated time');
    }
});

runTest('Generate INSERT execution plan', () => {
    const ast = parse("INSERT INTO products VALUES (5, 'Webcam', 79)");
    const plan = generateExecutionPlan(ast);

    console.log('Execution Plan:', JSON.stringify(plan, null, 2));

    if (plan.steps.length !== 3) {
        throw new Error('INSERT should have 3 steps');
    }
});

runTest('Generate UPDATE execution plan', () => {
    const ast = parse("UPDATE products SET price = 99 WHERE id = 2");
    const plan = generateExecutionPlan(ast);

    console.log('Execution Plan:', JSON.stringify(plan, null, 2));

    if (!plan.steps.find(s => s.operation === 'UPDATE')) {
        throw new Error('Should have UPDATE step');
    }
});

runTest('Generate DELETE execution plan', () => {
    const ast = parse('DELETE FROM products WHERE price < 30');
    const plan = generateExecutionPlan(ast);

    console.log('Execution Plan:', JSON.stringify(plan, null, 2));

    if (!plan.steps.find(s => s.operation === 'DELETE')) {
        throw new Error('Should have DELETE step');
    }
});

runTest('Generate TRUNCATE execution plan', () => {
    const ast = parse('DELETE FROM products');
    const plan = generateExecutionPlan(ast);

    console.log('Execution Plan (TRUNCATE):', JSON.stringify(plan, null, 2));

    if (!plan.steps.find(s => s.operation === 'TRUNCATE')) {
        throw new Error('Should have TRUNCATE step');
    }
});

console.log('\nCleaning up...');
storageManager.deleteTable('products');

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 All query planner tests passed!');
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
}
