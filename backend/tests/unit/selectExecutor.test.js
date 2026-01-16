import { executeSelect, explainSelect } from '../../engine/executor/selectExecutor.js';
import storageManager from '../../engine/storage/storageManager.js';

console.log('Testing SELECT Executor...\n');

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

console.log('Setting up test data...');
storageManager.createTable('users', [
    { name: 'id', type: 'NUMBER' },
    { name: 'name', type: 'STRING' },
    { name: 'age', type: 'NUMBER' },
    { name: 'status', type: 'STRING' }
]);

storageManager.insertRows('users', [
    { id: 1, name: 'Alice', age: 30, status: 'active' },
    { id: 2, name: 'Bob', age: 25, status: 'active' },
    { id: 3, name: 'Charlie', age: 35, status: 'inactive' },
    { id: 4, name: 'Diana', age: 28, status: 'active' },
    { id: 5, name: 'Eve', age: 22, status: 'inactive' }
]);

console.log('Test data created.\n');

runTest('SELECT * FROM users', () => {
    const ast = {
        type: 'SELECT',
        columns: ['*'],
        table: 'users',
        where: null
    };

    const result = executeSelect(ast);

    if (!result.success) {
        throw new Error('Query failed');
    }

    if (result.rowCount !== 5) {
        throw new Error(`Expected 5 rows, got ${result.rowCount}`);
    }

    if (result.data[0].name !== 'Alice') {
        throw new Error('First row should be Alice');
    }
});

runTest('SELECT specific columns', () => {
    const ast = {
        type: 'SELECT',
        columns: ['name', 'age'],
        table: 'users',
        where: null
    };

    const result = executeSelect(ast);

    if (result.rowCount !== 5) {
        throw new Error(`Expected 5 rows, got ${result.rowCount}`);
    }

    const firstRow = result.data[0];
    if (!('name' in firstRow) || !('age' in firstRow)) {
        throw new Error('Missing expected columns');
    }

    if ('id' in firstRow || 'status' in firstRow) {
        throw new Error('Should not include unprojected columns');
    }
});

runTest('SELECT with WHERE (equals)', () => {
    const ast = {
        type: 'SELECT',
        columns: ['*'],
        table: 'users',
        where: {
            column: 'name',
            operator: '=',
            value: 'Alice'
        }
    };

    const result = executeSelect(ast);

    if (result.rowCount !== 1) {
        throw new Error(`Expected 1 row, got ${result.rowCount}`);
    }

    if (result.data[0].name !== 'Alice') {
        throw new Error('Should return Alice');
    }
});

runTest('SELECT with WHERE (greater than)', () => {
    const ast = {
        type: 'SELECT',
        columns: ['*'],
        table: 'users',
        where: {
            column: 'age',
            operator: '>',
            value: 28
        }
    };

    const result = executeSelect(ast);

    if (result.rowCount !== 2) {
        throw new Error(`Expected 2 rows, got ${result.rowCount}`);
    }

    result.data.forEach(row => {
        if (row.age <= 28) {
            throw new Error(`Row with age ${row.age} should not be included`);
        }
    });
});

runTest('SELECT with WHERE (less than or equal)', () => {
    const ast = {
        type: 'SELECT',
        columns: ['*'],
        table: 'users',
        where: {
            column: 'age',
            operator: '<=',
            value: 25
        }
    };

    const result = executeSelect(ast);

    if (result.rowCount !== 2) {
        throw new Error(`Expected 2 rows, got ${result.rowCount}`);
    }
});

runTest('SELECT with WHERE (not equals)', () => {
    const ast = {
        type: 'SELECT',
        columns: ['*'],
        table: 'users',
        where: {
            column: 'status',
            operator: '!=',
            value: 'active'
        }
    };

    const result = executeSelect(ast);

    if (result.rowCount !== 2) {
        throw new Error(`Expected 2 rows, got ${result.rowCount}`);
    }

    result.data.forEach(row => {
        if (row.status === 'active') {
            throw new Error('Should not include active users');
        }
    });
});

runTest('SELECT with compound WHERE (AND)', () => {
    const ast = {
        type: 'SELECT',
        columns: ['*'],
        table: 'users',
        where: {
            type: 'COMPOUND',
            conditions: [
                { column: 'age', operator: '>=', value: 25 },
                {
                    logicalOperator: 'AND',
                    condition: { column: 'status', operator: '=', value: 'active' }
                }
            ]
        }
    };

    const result = executeSelect(ast);

    if (result.rowCount !== 3) {
        throw new Error(`Expected 3 rows, got ${result.rowCount}`);
    }

    result.data.forEach(row => {
        if (row.age < 25 || row.status !== 'active') {
            throw new Error('Row does not match compound condition');
        }
    });
});

runTest('SELECT with compound WHERE (OR)', () => {
    const ast = {
        type: 'SELECT',
        columns: ['*'],
        table: 'users',
        where: {
            type: 'COMPOUND',
            conditions: [
                { column: 'age', operator: '<', value: 25 },
                {
                    logicalOperator: 'OR',
                    condition: { column: 'age', operator: '>', value: 30 }
                }
            ]
        }
    };

    const result = executeSelect(ast);

    if (result.rowCount !== 2) {
        throw new Error(`Expected 2 rows, got ${result.rowCount}`);
    }
});

runTest('SELECT with projection and WHERE', () => {
    const ast = {
        type: 'SELECT',
        columns: ['name', 'age'],
        table: 'users',
        where: {
            column: 'status',
            operator: '=',
            value: 'active'
        }
    };

    const result = executeSelect(ast);

    if (result.rowCount !== 3) {
        throw new Error(`Expected 3 rows, got ${result.rowCount}`);
    }

    result.data.forEach(row => {
        if (!('name' in row) || !('age' in row)) {
            throw new Error('Missing projected columns');
        }
        if ('id' in row || 'status' in row) {
            throw new Error('Should not include unprojected columns');
        }
    });
});

runTest('SELECT from non-existent table', () => {
    const ast = {
        type: 'SELECT',
        columns: ['*'],
        table: 'nonexistent',
        where: null
    };

    try {
        executeSelect(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('does not exist')) {
            throw error;
        }
    }
});

runTest('SELECT non-existent column', () => {
    const ast = {
        type: 'SELECT',
        columns: ['nonexistent'],
        table: 'users',
        where: null
    };

    try {
        executeSelect(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('does not exist')) {
            throw error;
        }
    }
});

runTest('EXPLAIN SELECT query', () => {
    const ast = {
        type: 'SELECT',
        columns: ['name', 'age'],
        table: 'users',
        where: {
            column: 'age',
            operator: '>',
            value: 25
        }
    };

    const explanation = explainSelect(ast);

    console.log('\nQuery Explanation:');
    console.log(JSON.stringify(explanation, null, 2));

    if (explanation.operation !== 'SELECT') {
        throw new Error('Invalid explanation');
    }

    if (!explanation.steps || explanation.steps.length === 0) {
        throw new Error('Explanation should have steps');
    }
});

console.log('\nCleaning up...');
storageManager.deleteTable('users');

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 All SELECT executor tests passed!');
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
}
