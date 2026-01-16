import * as fileStorage from './fileStorage.js';
import fs from 'fs';

class StorageManager {
    constructor() {
        this.cache = new Map();
        this.cacheEnabled = false;
    }

    enableCache() {
        this.cacheEnabled = true;
        console.log('Storage cache enabled');
    }

    disableCache() {
        this.cacheEnabled = false;
        this.cache.clear();
        console.log('Storage cache disabled and cleared');
    }

    clearCache(tableName = null) {
        if (tableName) {
            this.cache.delete(tableName.toLowerCase());
        } else {
            this.cache.clear();
        }
    }

    // Database Management
    createDatabase(dbName) {
        return fileStorage.createDatabase(dbName);
    }

    dropDatabase(dbName) {
        this.cache.clear(); // Clear all cache when switching or dropping
        return fileStorage.dropDatabase(dbName);
    }

    useDatabase(dbName) {
        this.cache.clear(); // Clear cache when switching databases
        return fileStorage.setCurrentDatabase(dbName);
    }

    getCurrentDatabase() {
        return fileStorage.getCurrentDatabase();
    }

    listDatabases() {
        return fileStorage.listDatabases();
    }

    // Table Management
    createTable(tableName, columns) {
        const result = fileStorage.createTable(tableName, columns);
        this.clearCache(tableName);
        return result;
    }

    tableExists(tableName) {
        return fileStorage.tableExists(tableName);
    }

    getTable(tableName) {
        const normalizedName = tableName.toLowerCase();

        if (this.cacheEnabled && this.cache.has(normalizedName)) {
            return this.cache.get(normalizedName);
        }

        const tableData = fileStorage.readTable(tableName);

        if (this.cacheEnabled) {
            this.cache.set(normalizedName, tableData);
        }

        return tableData;
    }

    saveTable(tableName, tableData) {
        const result = fileStorage.writeTable(tableName, tableData);
        this.clearCache(tableName);
        return result;
    }

    insertRow(tableName, rowData) {
        const result = fileStorage.insertRow(tableName, rowData);
        this.clearCache(tableName);
        return result;
    }

    insertRows(tableName, rowsArray) {
        if (!Array.isArray(rowsArray) || rowsArray.length === 0) {
            throw new Error('Rows must be a non-empty array');
        }

        const tableData = fileStorage.readTable(tableName);
        tableData.rows.push(...rowsArray);
        const result = fileStorage.writeTable(tableName, tableData);
        
        this.clearCache(tableName);
        
        return {
            success: true,
            message: `${rowsArray.length} rows inserted into '${tableName}'`,
            rowCount: tableData.rows.length
        };
    }

    getAllRows(tableName) {
        return fileStorage.getAllRows(tableName);
    }

    getRowsByCondition(tableName, conditionFn) {
        const rows = this.getAllRows(tableName);
        return rows.filter(conditionFn);
    }

    getSchema(tableName) {
        return fileStorage.getTableSchema(tableName);
    }

    deleteTable(tableName) {
        const result = fileStorage.deleteTable(tableName);
        this.clearCache(tableName);
        return result;
    }

    listAllTables() {
        return fileStorage.listAllTables();
    }

    getTableStats(tableName) {
        return fileStorage.getTableStats(tableName);
    }

    getAllTablesStats() {
        const tables = this.listAllTables();
        return tables.map(tableName => this.getTableStats(tableName));
    }

    truncateTable(tableName) {
        const tableData = fileStorage.readTable(tableName);
        const rowCount = tableData.rows.length;
        
        tableData.rows = [];
        fileStorage.writeTable(tableName, tableData);
        
        this.clearCache(tableName);
        
        return {
            success: true,
            message: `Table '${tableName}' truncated`,
            rowsDeleted: rowCount
        };
    }

    updateRows(tableName, conditionFn, updateFn) {
        const tableData = fileStorage.readTable(tableName);
        let updatedCount = 0;

        tableData.rows = tableData.rows.map(row => {
            if (conditionFn(row)) {
                updatedCount++;
                return updateFn(row);
            }
            return row;
        });

        fileStorage.writeTable(tableName, tableData);
        this.clearCache(tableName);

        return {
            success: true,
            message: `${updatedCount} rows updated in '${tableName}'`,
            updatedCount
        };
    }

    deleteRows(tableName, conditionFn) {
        const tableData = fileStorage.readTable(tableName);
        const originalCount = tableData.rows.length;

        tableData.rows = tableData.rows.filter(row => !conditionFn(row));
        
        const deletedCount = originalCount - tableData.rows.length;

        fileStorage.writeTable(tableName, tableData);
        this.clearCache(tableName);

        return {
            success: true,
            message: `${deletedCount} rows deleted from '${tableName}'`,
            deletedCount
        };
    }

    getRowCount(tableName) {
        const tableData = this.getTable(tableName);
        return tableData.rows.length;
    }

    getColumnNames(tableName) {
        const schema = this.getSchema(tableName);
        return schema.columns.map(col => col.name);
    }

    getColumnTypes(tableName) {
        const schema = this.getSchema(tableName);
        return schema.columns.reduce((acc, col) => {
            acc[col.name] = col.type;
            return acc;
        }, {});
    }
}

export default new StorageManager();
