import { executeCreate, explainCreate } from '../../engine/executor/createExecutor.js';
import storageManager from '../../engine/storage/storageManager.js';

console.log('Testing CREATE Executor...\n');

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

runTest('Create simple table', () => {
    const ast = {
        type: 'CREATE',
        table: 'users',
        columns: [
            { name: 'id', type: 'NUMBER' },
            { name: 'name', type: 'STRING' }
        ]
    };

    const result = executeCreate(ast);

    if (!result.success) {
        throw new Error('CREATE failed');
    }

    if (!storageManager.tableExists('users')) {
        throw new Error('Table was not created');
    }

    console.log('Result:', result);
    
    storageManager.deleteTable('users');
});

runTest('Create table with all data types', () => {
    const ast = {
        type: 'CREATE',
        table: 'test_types',
        columns: [
            { name: 'id', type: 'NUMBER' },
            { name: 'name', type: 'STRING' },
            { name: 'active', type: 'BOOLEAN' },
            { name: 'created', type: 'DATE' },
            { name: 'description', type: 'TEXT' },
            { name: 'count', type: 'INTEGER' },
            { name: 'price', type: 'FLOAT' }
        ]
    };

    const result = executeCreate(ast);

    if (!result.success) {
        throw new Error('CREATE failed');
    }

    const schema = storageManager.getSchema('test_types');
    if (schema.columns.length !== 7) {
        throw new Error('Not all columns were created');
    }

    storageManager.deleteTable('test_types');
});

runTest('Error - table already exists', () => {
    const ast = {
        type: 'CREATE',
        table: 'duplicate',
        columns: [
            { name: 'id', type: 'NUMBER' }
        ]
    };

    executeCreate(ast);

    try {
        executeCreate(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('already exists')) {
            throw error;
        }
    }

    storageManager.deleteTable('duplicate');
});

runTest('Error - no columns', () => {
    const ast = {
        type: 'CREATE',
        table: 'empty',
        columns: []
    };

    try {
        executeCreate(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('at least one column')) {
            throw error;
        }
    }
});

runTest('Error - invalid column type', () => {
    const ast = {
        type: 'CREATE',
        table: 'invalid_type',
        columns: [
            { name: 'id', type: 'INVALID_TYPE' }
        ]
    };

    try {
        executeCreate(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('Invalid type')) {
            throw error;
        }
    }
});

runTest('Error - duplicate column names', () => {
    const ast = {
        type: 'CREATE',
        table: 'duplicate_cols',
        columns: [
            { name: 'id', type: 'NUMBER' },
            { name: 'id', type: 'STRING' }
        ]
    };

    try {
        executeCreate(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('Duplicate column')) {
            throw error;
        }
    }
});

runTest('Error - missing column name', () => {
    const ast = {
        type: 'CREATE',
        table: 'no_name',
        columns: [
            { type: 'NUMBER' }
        ]
    };

    try {
        executeCreate(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('valid name')) {
            throw error;
        }
    }
});

runTest('Error - missing column type', () => {
    const ast = {
        type: 'CREATE',
        table: 'no_type',
        columns: [
            { name: 'id' }
        ]
    };

    try {
        executeCreate(ast);
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('valid type')) {
            throw error;
        }
    }
});

runTest('Verify table schema', () => {
    const ast = {
        type: 'CREATE',
        table: 'verify',
        columns: [
            { name: 'id', type: 'NUMBER' },
            { name: 'name', type: 'STRING' },
            { name: 'age', type: 'NUMBER' }
        ]
    };

    executeCreate(ast);

    const schema = storageManager.getSchema('verify');

    if (schema.tableName !== 'verify') {
        throw new Error('Table name incorrect');
    }

    if (schema.columns.length !== 3) {
        throw new Error('Column count incorrect');
    }

    if (schema.columns[0].name !== 'id' || schema.columns[0].type !== 'NUMBER') {
        throw new Error('Column definition incorrect');
    }

    storageManager.deleteTable('verify');
});

runTest('EXPLAIN CREATE query', () => {
    const ast = {
        type: 'CREATE',
        table: 'products',
        columns: [
            { name: 'id', type: 'NUMBER' },
            { name: 'name', type: 'STRING' }
        ]
    };

    const explanation = explainCreate(ast);

    console.log('\nQuery Explanation:');
    console.log(JSON.stringify(explanation, null, 2));

    if (explanation.operation !== 'CREATE') {
        throw new Error('Invalid explanation');
    }

    if (!explanation.steps || explanation.steps.length === 0) {
        throw new Error('Explanation should have steps');
    }
});

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 All CREATE executor tests passed!');
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
}
