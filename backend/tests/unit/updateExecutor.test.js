import { executeUpdate, explainUpdate } from '../../engine/executor/updateExecutor.js';
import storageManager from '../../engine/storage/storageManager.js';

console.log('Testing UPDATE Executor...\n');

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
storageManager.createTable('employees', [
    { name: 'id', type: 'NUMBER' },
    { name: 'name', type: 'STRING' },
    { name: 'salary', type: 'NUMBER' },
    { name: 'department', type: 'STRING' }
]);

storageManager.insertRows('employees', [
    { id: 1, name: 'Alice', salary: 50000, department: 'Engineering' },
    { id: 2, name: 'Bob', salary: 45000, department: 'Sales' },
    { id: 3, name: 'Charlie', salary: 60000, department: 'Engineering' },
    { id: 4, name: 'Diana', salary: 55000, department: 'Marketing' },
    { id: 5, name: 'Eve', salary: 48000, department: 'Sales' }
]);
console.log('Test data created.\n');

runTest('Update single column with WHERE', () => {
    const ast = {
        type: 'UPDATE',
        table: 'employees',
        updates: [
            { column: 'salary', value: 52000 }
        ],
        where: {
            column: 'name',
            operator: '=',
            value: 'Alice'
        }
    };

    const result = executeUpdate(ast);

    if (!result.success) {
        throw new Error('UPDATE failed');
    }

    if (result.updatedCount !== 1) {
        throw new Error(`Expected 1 row updated, got ${result.updatedCount}`);
    }

    const rows = storageManager.getAllRows('employees');
    const alice = rows.find(r => r.name === 'Alice');
    if (alice.salary !== 52000) {
        throw new Error('Salary was not updated');
    }

    console.log('Result:', result);
});

runTest('Update multiple columns', () => {
    const ast = {
        type: 'UPDATE',
        table: 'employees',
        updates: [
            { column: 'salary', value: 50000 },
            { column: 'department', value: 'IT' }
        ],
        where: {
            column: 'name',
            operator: '=',
            value: 'Bob'
        }
    };

    const result = executeUpdate(ast);

    if (result.updatedCount !== 1) {
        throw new Error(`Expected 1 row updated, got ${result.updatedCount}`);
    }

    const rows = storageManager.getAllRows('employees');
    const bob = rows.find(r => r.name === 'Bob');
    if (bob.salary !== 50000 || bob.department !== 'IT') {
        throw new Error('Columns were not updated');
    }
});

runTest('Update multiple rows with WHERE', () => {
    const ast = {
        type: 'UPDATE',
        table: 'employees',
        updates: [
            { column: 'salary', value: 70000 }
        ],
        where: {
            column: 'department',
            operator: '=',
            value: 'Engineering'
        }
    };

    const result = executeUpdate(ast);

    if (result.updatedCount !== 2) {
        throw new Error(`Expected 2 rows updated, got ${result.updatedCount}`);
    }

    const rows = storageManager.getAllRows('employees');
    const engineers = rows.filter(r => r.department === 'Engineering');
    engineers.forEach(emp => {
        if (emp.salary !== 70000) {
            throw new Error('Engineering salaries were not updated');
        }
    });
});

runTest('Update with compound WHERE (AND)', () => {
    const ast = {
        type: 'UPDATE',
        table: 'employees',
        updates: [
            { column: 'salary', value: 75000 }
        ],
        where: {
            type: 'COMPOUND',
            conditions: [
                { column: 'department', operator: '=', value: 'Engineering' },
                {
                    logicalOperator: 'AND',
                    condition: { column: 'salary', operator: '>=', value: 70000 }
                }
            ]
        }
    };

    const result = executeUpdate(ast);

    if (result.updatedCount !== 2) {
        throw new Error(`Expected 2 rows updated, got ${result.updatedCount}`);
    }
});

runTest('Update all rows (no WHERE)', () => {
    const ast = {
        type: 'UPDATE',
        table: 'employees',
        updates: [
            { column: 'department', value: 'General' }
        ],
        where: null
    };

    const result = executeUpdate(ast);

    if (result.updatedCount !== 5) {
        throw new Error(`Expected 5 rows updated, got ${result.updatedCount}`);
    }

    const rows = storageManager.getAllRows('employees');
    rows.forEach(emp => {
        if (emp.department !== 'General') {
            throw new Error('Not all departments were updated');
        }
    });
});

runTest('Update with greater than condition', () => {
    const ast = {
        type: 'UPDATE',
        table: 'employees',
        updates: [
            { column: 'salary', value: 80000 }
        ],
        where: {
            column: 'salary',
            operator: '>',
            value: 70000
        }
    };

    const result = executeUpdate(ast);

    if (result.updatedCount !== 2) {
        throw new Error(`Expected 2 rows updated, got ${result.updatedCount}`);
    }
});

runTest('Error - non-existent table', () => {
    const ast = {
        type: 'UPDATE',
        table: 'nonexistent',
        updates: [
            { column: 'salary', value: 50000 }
        ],
        where: null
    };

    try {
        executeUpdate(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('does not exist')) {
            throw error;
        }
    }
});

runTest('Error - non-existent column', () => {
    const ast = {
        type: 'UPDATE',
        table: 'employees',
        updates: [
            { column: 'nonexistent', value: 'test' }
        ],
        where: null
    };

    try {
        executeUpdate(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('does not exist')) {
            throw error;
        }
    }
});

runTest('Error - no updates specified', () => {
    const ast = {
        type: 'UPDATE',
        table: 'employees',
        updates: [],
        where: null
    };

    try {
        executeUpdate(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('at least one column')) {
            throw error;
        }
    }
});

runTest('EXPLAIN UPDATE query', () => {
    const ast = {
        type: 'UPDATE',
        table: 'employees',
        updates: [
            { column: 'salary', value: 60000 }
        ],
        where: {
            column: 'department',
            operator: '=',
            value: 'Sales'
        }
    };

    const explanation = explainUpdate(ast);

    console.log('\nQuery Explanation:');
    console.log(JSON.stringify(explanation, null, 2));

    if (explanation.operation !== 'UPDATE') {
        throw new Error('Invalid explanation');
    }

    if (!explanation.steps || explanation.steps.length === 0) {
        throw new Error('Explanation should have steps');
    }
});

console.log('\nCleaning up...');
storageManager.deleteTable('employees');

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 All UPDATE executor tests passed!');
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
}
