import { executeInsert, executeInsertBatch, explainInsert } from '../../engine/executor/insertExecutor.js';
import storageManager from '../../engine/storage/storageManager.js';

console.log('Testing INSERT Executor...\n');

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
    { name: 'price', type: 'NUMBER' },
    { name: 'inStock', type: 'BOOLEAN' }
]);
console.log('Test table created.\n');

runTest('Insert single row', () => {
    const ast = {
        type: 'INSERT',
        table: 'products',
        values: [1, 'Laptop', 999.99, true]
    };

    const result = executeInsert(ast);

    if (!result.success) {
        throw new Error('Insert failed');
    }

    if (result.rowCount !== 1) {
        throw new Error(`Expected 1 row, got ${result.rowCount}`);
    }

    console.log('Result:', result);
});

runTest('Insert with correct types', () => {
    const ast = {
        type: 'INSERT',
        table: 'products',
        values: [2, 'Mouse', 29.99, false]
    };

    const result = executeInsert(ast);

    if (!result.success) {
        throw new Error('Insert failed');
    }

    const rows = storageManager.getAllRows('products');
    if (rows.length !== 2) {
        throw new Error('Row was not inserted');
    }
});

runTest('Insert with null values', () => {
    const ast = {
        type: 'INSERT',
        table: 'products',
        values: [3, 'Keyboard', null, true]
    };

    const result = executeInsert(ast);

    if (!result.success) {
        throw new Error('Insert with null should succeed');
    }
});

runTest('Batch insert multiple rows', () => {
    const rowsData = [
        [4, 'Monitor', 299.99, true],
        [5, 'Headphones', 149.99, false],
        [6, 'Webcam', 79.99, true]
    ];

    const result = executeInsertBatch('products', rowsData);

    if (!result.success) {
        throw new Error('Batch insert failed');
    }

    if (result.rowCount !== 3) {
        throw new Error(`Expected 3 rows, got ${result.rowCount}`);
    }

    const rows = storageManager.getAllRows('products');
    if (rows.length !== 6) {
        throw new Error('Rows were not inserted');
    }

    console.log('Result:', result);
});

runTest('Verify inserted data', () => {
    const rows = storageManager.getAllRows('products');

    if (rows[0].name !== 'Laptop') {
        throw new Error('First row data incorrect');
    }

    if (rows[0].price !== 999.99) {
        throw new Error('Price not stored correctly');
    }

    if (rows[0].inStock !== true) {
        throw new Error('Boolean not stored correctly');
    }
});

runTest('Error - non-existent table', () => {
    const ast = {
        type: 'INSERT',
        table: 'nonexistent',
        values: [1, 'Test', 10, true]
    };

    try {
        executeInsert(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('does not exist')) {
            throw error;
        }
    }
});

runTest('Error - column count mismatch (too few)', () => {
    const ast = {
        type: 'INSERT',
        table: 'products',
        values: [7, 'Incomplete']
    };

    try {
        executeInsert(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('mismatch')) {
            throw error;
        }
    }
});

runTest('Error - column count mismatch (too many)', () => {
    const ast = {
        type: 'INSERT',
        table: 'products',
        values: [8, 'Extra', 50, true, 'extra value']
    };

    try {
        executeInsert(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('mismatch')) {
            throw error;
        }
    }
});

runTest('Error - type mismatch (string instead of number)', () => {
    const ast = {
        type: 'INSERT',
        table: 'products',
        values: [9, 'Invalid', 'not a number', true]
    };

    try {
        executeInsert(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('Type mismatch')) {
            throw error;
        }
    }
});

runTest('Error - type mismatch (number instead of string)', () => {
    const ast = {
        type: 'INSERT',
        table: 'products',
        values: [10, 12345, 99.99, true]
    };

    try {
        executeInsert(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('Type mismatch')) {
            throw error;
        }
    }
});

runTest('EXPLAIN INSERT query', () => {
    const ast = {
        type: 'INSERT',
        table: 'products',
        values: [11, 'Test', 50, true]
    };

    const explanation = explainInsert(ast);

    console.log('\nQuery Explanation:');
    console.log(JSON.stringify(explanation, null, 2));

    if (explanation.operation !== 'INSERT') {
        throw new Error('Invalid explanation');
    }

    if (!explanation.steps || explanation.steps.length === 0) {
        throw new Error('Explanation should have steps');
    }
});

console.log('\nCleaning up...');
storageManager.deleteTable('products');

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 All INSERT executor tests passed!');
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
}
