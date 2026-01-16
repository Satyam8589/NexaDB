import storageManager from '../../engine/storage/storageManager.js';

console.log('Testing Storage Manager...\n');

try {
    console.log('Test 1: Creating table...');
    storageManager.createTable('products', [
        { name: 'id', type: 'NUMBER' },
        { name: 'name', type: 'STRING' },
        { name: 'price', type: 'NUMBER' },
        { name: 'inStock', type: 'BOOLEAN' }
    ]);
    console.log('');

    console.log('Test 2: Inserting single row...');
    storageManager.insertRow('products', {
        id: 1,
        name: 'Laptop',
        price: 999.99,
        inStock: true
    });
    console.log('');

    console.log('Test 3: Inserting multiple rows...');
    storageManager.insertRows('products', [
        { id: 2, name: 'Mouse', price: 29.99, inStock: true },
        { id: 3, name: 'Keyboard', price: 79.99, inStock: false },
        { id: 4, name: 'Monitor', price: 299.99, inStock: true },
        { id: 5, name: 'Headphones', price: 149.99, inStock: false }
    ]);
    console.log('');

    console.log('Test 4: Getting all rows...');
    const allRows = storageManager.getAllRows('products');
    console.log('All products:', allRows);
    console.log('');

    console.log('Test 5: Getting rows by condition (in stock)...');
    const inStockProducts = storageManager.getRowsByCondition(
        'products',
        row => row.inStock === true
    );
    console.log('In stock products:', inStockProducts);
    console.log('');

    console.log('Test 6: Getting row count...');
    const rowCount = storageManager.getRowCount('products');
    console.log('Total products:', rowCount);
    console.log('');

    console.log('Test 7: Getting column names...');
    const columns = storageManager.getColumnNames('products');
    console.log('Columns:', columns);
    console.log('');

    console.log('Test 8: Getting column types...');
    const types = storageManager.getColumnTypes('products');
    console.log('Column types:', types);
    console.log('');

    console.log('Test 9: Updating rows (discount on expensive items)...');
    const updateResult = storageManager.updateRows(
        'products',
        row => row.price > 100,
        row => ({ ...row, price: row.price * 0.9 })
    );
    console.log(updateResult);
    console.log('Updated products:', storageManager.getAllRows('products'));
    console.log('');

    console.log('Test 10: Deleting rows (out of stock)...');
    const deleteResult = storageManager.deleteRows(
        'products',
        row => row.inStock === false
    );
    console.log(deleteResult);
    console.log('Remaining products:', storageManager.getAllRows('products'));
    console.log('');

    console.log('Test 11: Testing cache...');
    storageManager.enableCache();
    storageManager.getTable('products');
    storageManager.getTable('products');
    storageManager.disableCache();
    console.log('');

    console.log('Test 12: Getting table stats...');
    const stats = storageManager.getTableStats('products');
    console.log('Stats:', stats);
    console.log('');

    console.log('Test 13: Truncating table...');
    const truncateResult = storageManager.truncateTable('products');
    console.log(truncateResult);
    console.log('Rows after truncate:', storageManager.getRowCount('products'));
    console.log('');

    console.log('Test 14: Cleanup (deleting table)...');
    storageManager.deleteTable('products');
    console.log('');

    console.log('All tests passed!');

} catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
}
