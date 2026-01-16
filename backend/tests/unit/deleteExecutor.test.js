import { executeDelete, explainDelete } from '../../engine/executor/deleteExecutor.js';
import storageManager from '../../engine/storage/storageManager.js';

console.log('Testing DELETE Executor...\n');

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
storageManager.createTable('orders', [
    { name: 'id', type: 'NUMBER' },
    { name: 'customer', type: 'STRING' },
    { name: 'amount', type: 'NUMBER' },
    { name: 'status', type: 'STRING' }
]);

storageManager.insertRows('orders', [
    { id: 1, customer: 'Alice', amount: 100, status: 'pending' },
    { id: 2, customer: 'Bob', amount: 200, status: 'completed' },
    { id: 3, customer: 'Charlie', amount: 150, status: 'pending' },
    { id: 4, customer: 'Diana', amount: 300, status: 'completed' },
    { id: 5, customer: 'Eve', amount: 50, status: 'cancelled' }
]);
console.log('Test data created.\n');

runTest('Delete single row with WHERE', () => {
    const ast = {
        type: 'DELETE',
        table: 'orders',
        where: {
            column: 'customer',
            operator: '=',
            value: 'Alice'
        }
    };

    const result = executeDelete(ast);

    if (!result.success) {
        throw new Error('DELETE failed');
    }

    if (result.deletedCount !== 1) {
        throw new Error(`Expected 1 row deleted, got ${result.deletedCount}`);
    }

    const rows = storageManager.getAllRows('orders');
    if (rows.length !== 4) {
        throw new Error('Row was not deleted');
    }

    const alice = rows.find(r => r.customer === 'Alice');
    if (alice) {
        throw new Error('Alice should be deleted');
    }

    console.log('Result:', result);
});

runTest('Delete multiple rows with WHERE', () => {
    const ast = {
        type: 'DELETE',
        table: 'orders',
        where: {
            column: 'status',
            operator: '=',
            value: 'pending'
        }
    };

    const result = executeDelete(ast);

    if (result.deletedCount !== 1) {
        throw new Error(`Expected 1 row deleted, got ${result.deletedCount}`);
    }

    const rows = storageManager.getAllRows('orders');
    const pending = rows.filter(r => r.status === 'pending');
    if (pending.length !== 0) {
        throw new Error('Pending orders should be deleted');
    }
});

runTest('Delete with greater than condition', () => {
    const ast = {
        type: 'DELETE',
        table: 'orders',
        where: {
            column: 'amount',
            operator: '>',
            value: 150
        }
    };

    const result = executeDelete(ast);

    if (result.deletedCount !== 2) {
        throw new Error(`Expected 2 rows deleted, got ${result.deletedCount}`);
    }

    const rows = storageManager.getAllRows('orders');
    rows.forEach(order => {
        if (order.amount > 150) {
            throw new Error('Orders with amount > 150 should be deleted');
        }
    });
});

runTest('Delete with less than condition', () => {
    const ast = {
        type: 'DELETE',
        table: 'orders',
        where: {
            column: 'amount',
            operator: '<',
            value: 100
        }
    };

    const result = executeDelete(ast);

    if (result.deletedCount !== 1) {
        throw new Error(`Expected 1 row deleted, got ${result.deletedCount}`);
    }
});

runTest('Delete with compound WHERE (AND)', () => {
    // Re-populate for this test
    storageManager.truncateTable('orders');
    storageManager.insertRows('orders', [
        { id: 1, customer: 'Alice', amount: 100, status: 'pending' },
        { id: 2, customer: 'Bob', amount: 200, status: 'completed' },
        { id: 3, customer: 'Charlie', amount: 150, status: 'pending' }
    ]);

    const ast = {
        type: 'DELETE',
        table: 'orders',
        where: {
            type: 'COMPOUND',
            conditions: [
                { column: 'status', operator: '=', value: 'pending' },
                {
                    logicalOperator: 'AND',
                    condition: { column: 'amount', operator: '>', value: 120 }
                }
            ]
        }
    };

    const result = executeDelete(ast);

    if (result.deletedCount !== 1) {
        throw new Error(`Expected 1 row deleted, got ${result.deletedCount}`);
    }
});

runTest('Delete with compound WHERE (OR)', () => {
    const ast = {
        type: 'DELETE',
        table: 'orders',
        where: {
            type: 'COMPOUND',
            conditions: [
                { column: 'amount', operator: '<', value: 120 },
                {
                    logicalOperator: 'OR',
                    condition: { column: 'amount', operator: '>', value: 180 }
                }
            ]
        }
    };

    const result = executeDelete(ast);

    if (result.deletedCount !== 2) {
        throw new Error(`Expected 2 rows deleted, got ${result.deletedCount}`);
    }
});

runTest('Delete all rows (no WHERE)', () => {
    // Re-populate
    storageManager.truncateTable('orders');
    storageManager.insertRows('orders', [
        { id: 1, customer: 'Alice', amount: 100, status: 'pending' },
        { id: 2, customer: 'Bob', amount: 200, status: 'completed' }
    ]);

    const ast = {
        type: 'DELETE',
        table: 'orders',
        where: null
    };

    const result = executeDelete(ast);

    if (result.deletedCount !== 2) {
        throw new Error(`Expected 2 rows deleted, got ${result.deletedCount}`);
    }

    const rows = storageManager.getAllRows('orders');
    if (rows.length !== 0) {
        throw new Error('All rows should be deleted');
    }
});

runTest('Error - non-existent table', () => {
    const ast = {
        type: 'DELETE',
        table: 'nonexistent',
        where: null
    };

    try {
        executeDelete(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('does not exist')) {
            throw error;
        }
    }
});

runTest('Error - non-existent column in WHERE', () => {
    // Re-populate
    storageManager.insertRows('orders', [
        { id: 1, customer: 'Alice', amount: 100, status: 'pending' }
    ]);

    const ast = {
        type: 'DELETE',
        table: 'orders',
        where: {
            column: 'nonexistent',
            operator: '=',
            value: 'test'
        }
    };

    try {
        executeDelete(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('does not exist')) {
            throw error;
        }
    }
});

runTest('EXPLAIN DELETE query with WHERE', () => {
    const ast = {
        type: 'DELETE',
        table: 'orders',
        where: {
            column: 'status',
            operator: '=',
            value: 'cancelled'
        }
    };

    const explanation = explainDelete(ast);

    console.log('\nQuery Explanation:');
    console.log(JSON.stringify(explanation, null, 2));

    if (explanation.operation !== 'DELETE') {
        throw new Error('Invalid explanation');
    }

    if (!explanation.steps || explanation.steps.length === 0) {
        throw new Error('Explanation should have steps');
    }
});

runTest('EXPLAIN DELETE query without WHERE', () => {
    const ast = {
        type: 'DELETE',
        table: 'orders',
        where: null
    };

    const explanation = explainDelete(ast);

    console.log('\nQuery Explanation (TRUNCATE):');
    console.log(JSON.stringify(explanation, null, 2));

    if (explanation.operation !== 'DELETE') {
        throw new Error('Invalid explanation');
    }
});

console.log('\nCleaning up...');
storageManager.deleteTable('orders');

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 All DELETE executor tests passed!');
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
}
