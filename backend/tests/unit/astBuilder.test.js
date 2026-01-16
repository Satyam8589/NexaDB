import {
    buildSelectAST,
    buildInsertAST,
    buildCreateAST,
    buildDeleteAST,
    buildUpdateAST,
    buildWhereCondition,
    buildCompoundCondition,
    buildColumnDefinition,
    buildUpdateAssignment,
    validateAST,
    printAST,
    cloneAST,
    compareAST
} from '../../engine/parser/astBuilder.js';

console.log('Testing AST Builder...\n');

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
        failedTests++;
    }
}

runTest('Build SELECT AST', () => {
    const ast = buildSelectAST(['*'], 'users', null);
    if (ast.type !== 'SELECT' || ast.table !== 'users') {
        throw new Error('Invalid SELECT AST');
    }
});

runTest('Build SELECT with WHERE', () => {
    const where = buildWhereCondition('age', '>', 25);
    const ast = buildSelectAST(['name'], 'users', where);
    if (!ast.where || ast.where.column !== 'age') {
        throw new Error('Invalid WHERE clause');
    }
});

runTest('Build INSERT AST', () => {
    const ast = buildInsertAST('users', [1, 'Alice', 30]);
    if (ast.type !== 'INSERT' || ast.values.length !== 3) {
        throw new Error('Invalid INSERT AST');
    }
});

runTest('Build CREATE AST', () => {
    const columns = [
        buildColumnDefinition('id', 'NUMBER'),
        buildColumnDefinition('name', 'STRING')
    ];
    const ast = buildCreateAST('users', columns);
    if (ast.type !== 'CREATE' || ast.columns.length !== 2) {
        throw new Error('Invalid CREATE AST');
    }
});

runTest('Build DELETE AST', () => {
    const where = buildWhereCondition('age', '<', 18);
    const ast = buildDeleteAST('users', where);
    if (ast.type !== 'DELETE' || !ast.where) {
        throw new Error('Invalid DELETE AST');
    }
});

runTest('Build UPDATE AST', () => {
    const updates = [buildUpdateAssignment('status', 'inactive')];
    const where = buildWhereCondition('age', '>', 65);
    const ast = buildUpdateAST('users', updates, where);
    if (ast.type !== 'UPDATE' || ast.updates.length !== 1) {
        throw new Error('Invalid UPDATE AST');
    }
});

runTest('Build compound WHERE condition', () => {
    const cond1 = buildWhereCondition('age', '>=', 18);
    const cond2 = buildWhereCondition('status', '=', 'active');
    const compound = buildCompoundCondition([
        cond1,
        { logicalOperator: 'AND', condition: cond2 }
    ]);
    if (compound.type !== 'COMPOUND' || compound.conditions.length !== 2) {
        throw new Error('Invalid compound condition');
    }
});

runTest('Validate valid SELECT AST', () => {
    const ast = buildSelectAST(['*'], 'users', null);
    validateAST(ast);
});

runTest('Validate valid INSERT AST', () => {
    const ast = buildInsertAST('users', [1, 'Alice', 30]);
    validateAST(ast);
});

runTest('Validate valid CREATE AST', () => {
    const columns = [
        buildColumnDefinition('id', 'NUMBER'),
        buildColumnDefinition('name', 'STRING')
    ];
    const ast = buildCreateAST('users', columns);
    validateAST(ast);
});

runTest('Reject invalid AST (missing type)', () => {
    try {
        validateAST({ table: 'users' });
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('missing type')) {
            throw error;
        }
    }
});

runTest('Reject invalid SELECT (missing columns)', () => {
    try {
        validateAST({ type: 'SELECT', table: 'users' });
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('columns')) {
            throw error;
        }
    }
});

runTest('Clone AST', () => {
    const original = buildSelectAST(['*'], 'users', null);
    const cloned = cloneAST(original);
    
    if (original === cloned) {
        throw new Error('Clone should be a different object');
    }
    
    if (!compareAST(original, cloned)) {
        throw new Error('Clone should have same content');
    }
});

runTest('Compare identical ASTs', () => {
    const ast1 = buildSelectAST(['*'], 'users', null);
    const ast2 = buildSelectAST(['*'], 'users', null);
    
    if (!compareAST(ast1, ast2)) {
        throw new Error('ASTs should be identical');
    }
});

runTest('Compare different ASTs', () => {
    const ast1 = buildSelectAST(['*'], 'users', null);
    const ast2 = buildSelectAST(['name'], 'users', null);
    
    if (compareAST(ast1, ast2)) {
        throw new Error('ASTs should be different');
    }
});

runTest('Print AST', () => {
    const ast = buildSelectAST(['name', 'age'], 'users', buildWhereCondition('age', '>', 25));
    console.log('\nPrinting AST:');
    printAST(ast);
});

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 All AST builder tests passed!');
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
}
