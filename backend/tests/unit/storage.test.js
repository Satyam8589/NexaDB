/**
 * UNIT TEST: STORAGE ENGINE
 * 
 * This file tests the fileStorage.js module
 * Run with: node backend/tests/unit/storage.test.js
 */

import * as storage from '../../engine/storage/fileStorage.js';

console.log('🧪 Testing Storage Engine...\n');

try {
    // Test 1: Create a table
    console.log('📝 Test 1: Creating table "users"...');
    const createResult = storage.createTable('users', [
        { name: 'id', type: 'NUMBER' },
        { name: 'name', type: 'STRING' },
        { name: 'age', type: 'NUMBER' }
    ]);
    console.log(createResult);
    console.log('');

    // Test 2: Insert rows
    console.log('📝 Test 2: Inserting rows...');
    storage.insertRow('users', { id: 1, name: 'Alice', age: 25 });
    storage.insertRow('users', { id: 2, name: 'Bob', age: 30 });
    storage.insertRow('users', { id: 3, name: 'Charlie', age: 22 });
    console.log('');

    // Test 3: Read all rows
    console.log('📝 Test 3: Reading all rows...');
    const rows = storage.getAllRows('users');
    console.log('Rows:', rows);
    console.log('');

    // Test 4: Get schema
    console.log('📝 Test 4: Getting schema...');
    const schema = storage.getTableSchema('users');
    console.log('Schema:', schema);
    console.log('');

    // Test 5: Get table stats
    console.log('📝 Test 5: Getting table statistics...');
    const stats = storage.getTableStats('users');
    console.log('Stats:', stats);
    console.log('');

    // Test 6: List all tables
    console.log('📝 Test 6: Listing all tables...');
    const tables = storage.listAllTables();
    console.log('Tables:', tables);
    console.log('');

    // Test 7: Check if table exists
    console.log('📝 Test 7: Checking table existence...');
    console.log('users exists?', storage.tableExists('users'));
    console.log('orders exists?', storage.tableExists('orders'));
    console.log('');

    // Test 8: Delete table (cleanup)
    console.log('📝 Test 8: Cleaning up (deleting table)...');
    const deleteResult = storage.deleteTable('users');
    console.log(deleteResult);
    console.log('');

    console.log('✅ All tests passed!');

} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
}
