import { executeSQL, listTables, getTableInfo, dropTable } from '../../engine/index.js';

console.log('Testing NexaDB Engine (End-to-End)...\n');

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

runTest('CREATE TABLE', () => {
    const result = executeSQL('CREATE TABLE users (id NUMBER, name STRING, age NUMBER, email STRING)');
    
    if (!result.success) {
        throw new Error('CREATE TABLE failed');
    }
    
    console.log('Result:', result);
});

runTest('INSERT single row', () => {
    const result = executeSQL("INSERT INTO users VALUES (1, 'Alice', 30, 'alice@example.com')");
    
    if (!result.success) {
        throw new Error('INSERT failed');
    }
    
    if (result.rowCount !== 1) {
        throw new Error(`Expected 1 row inserted, got ${result.rowCount}`);
    }
    
    console.log('Result:', result);
});

runTest('INSERT multiple rows', () => {
    executeSQL("INSERT INTO users VALUES (2, 'Bob', 25, 'bob@example.com')");
    executeSQL("INSERT INTO users VALUES (3, 'Charlie', 35, 'charlie@example.com')");
    executeSQL("INSERT INTO users VALUES (4, 'Diana', 28, 'diana@example.com')");
    executeSQL("INSERT INTO users VALUES (5, 'Eve', 22, 'eve@example.com')");
});

runTest('SELECT * FROM users', () => {
    const result = executeSQL('SELECT * FROM users');
    
    if (!result.success) {
        throw new Error('SELECT failed');
    }
    
    if (result.rowCount !== 5) {
        throw new Error(`Expected 5 rows, got ${result.rowCount}`);
    }
    
    console.log(`Retrieved ${result.rowCount} rows`);
});

runTest('SELECT with column projection', () => {
    const result = executeSQL('SELECT name, age FROM users');
    
    if (!result.success) {
        throw new Error('SELECT failed');
    }
    
    const firstRow = result.data[0];
    if (!('name' in firstRow) || !('age' in firstRow)) {
        throw new Error('Missing projected columns');
    }
    
    if ('id' in firstRow || 'email' in firstRow) {
        throw new Error('Should not include unprojected columns');
    }
    
    console.log('First row:', firstRow);
});

runTest('SELECT with WHERE clause', () => {
    const result = executeSQL('SELECT * FROM users WHERE age > 25');
    
    if (!result.success) {
        throw new Error('SELECT failed');
    }
    
    if (result.rowCount !== 3) {
        throw new Error(`Expected 3 rows, got ${result.rowCount}`);
    }
    
    result.data.forEach(row => {
        if (row.age <= 25) {
            throw new Error(`Row with age ${row.age} should not be included`);
        }
    });
    
    console.log(`Filtered to ${result.rowCount} rows`);
});

runTest('SELECT with compound WHERE (AND)', () => {
    const result = executeSQL("SELECT name FROM users WHERE age >= 25 AND name = 'Bob'");
    
    if (!result.success) {
        throw new Error('SELECT failed');
    }
    
    if (result.rowCount !== 1) {
        throw new Error(`Expected 1 row, got ${result.rowCount}`);
    }
    
    if (result.data[0].name !== 'Bob') {
        throw new Error('Should return Bob');
    }
    
    console.log('Result:', result.data);
});

runTest('UPDATE rows', () => {
    const result = executeSQL("UPDATE users SET age = 26 WHERE name = 'Bob'");
    
    if (!result.success) {
        throw new Error('UPDATE failed');
    }
    
    if (result.updatedCount !== 1) {
        throw new Error(`Expected 1 row updated, got ${result.updatedCount}`);
    }
    
    const verifyResult = executeSQL("SELECT age FROM users WHERE name = 'Bob'");
    if (verifyResult.data[0].age !== 26) {
        throw new Error('Age was not updated');
    }
    
    console.log('Result:', result);
});

runTest('UPDATE multiple rows', () => {
    const result = executeSQL("UPDATE users SET email = 'updated@example.com' WHERE age > 30");
    
    if (!result.success) {
        throw new Error('UPDATE failed');
    }
    
    console.log(`Updated ${result.updatedCount} rows`);
});

runTest('DELETE with WHERE', () => {
    const result = executeSQL('DELETE FROM users WHERE age < 25');
    
    if (!result.success) {
        throw new Error('DELETE failed');
    }
    
    if (result.deletedCount !== 1) {
        throw new Error(`Expected 1 row deleted, got ${result.deletedCount}`);
    }
    
    const verifyResult = executeSQL('SELECT * FROM users');
    if (verifyResult.rowCount !== 4) {
        throw new Error('Row was not deleted');
    }
    
    console.log('Result:', result);
});

runTest('List all tables', () => {
    const tables = listTables();
    
    if (!tables.includes('users')) {
        throw new Error('users table should be in the list');
    }
    
    console.log('Tables:', tables);
});

runTest('Get table info', () => {
    const info = getTableInfo('users');
    
    if (info.table !== 'users') {
        throw new Error('Invalid table info');
    }
    
    if (!info.schema || !info.stats) {
        throw new Error('Missing schema or stats');
    }
    
    console.log('Table info:', JSON.stringify(info, null, 2));
});

runTest('Error handling - non-existent table', () => {
    const result = executeSQL('SELECT * FROM nonexistent');
    
    if (result.success) {
        throw new Error('Should have failed');
    }
    
    if (!result.error.includes('does not exist')) {
        throw new Error('Wrong error message');
    }
    
    console.log('Error caught:', result.error);
});

runTest('Error handling - invalid SQL', () => {
    const result = executeSQL('INVALID SQL QUERY');
    
    if (result.success) {
        throw new Error('Should have failed');
    }
    
    console.log('Error caught:', result.error);
});

runTest('Complex query - projection + WHERE + compound', () => {
    const result = executeSQL("SELECT name, age FROM users WHERE age >= 26 AND age <= 30");
    
    if (!result.success) {
        throw new Error('Query failed');
    }
    
    console.log(`Retrieved ${result.rowCount} rows:`, result.data);
});

runTest('DROP TABLE', () => {
    const result = dropTable('users');
    
    if (!result.success) {
        throw new Error('DROP TABLE failed');
    }
    
    const tables = listTables();
    if (tables.includes('users')) {
        throw new Error('Table should be dropped');
    }
    
    console.log('Result:', result);
});

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 All engine tests passed!');
    console.log('\n✨ NexaDB Engine is fully functional!');
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
}
