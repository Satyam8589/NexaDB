import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');

const ensureDataDirectory = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log(`📁 Created data directory: ${DATA_DIR}`);
    }
};

const getTablePath = (tableName) => {
    return path.join(DATA_DIR, `${tableName.toLowerCase()}.json`);
};

export const tableExists = (tableName) => {
    const tablePath = getTablePath(tableName);
    return fs.existsSync(tablePath);
};

export const createTable = (tableName, columns) => {
    try {
        ensureDataDirectory();

        if (tableExists(tableName)) {
            throw new Error(`Table '${tableName}' already exists`);
        }

        if (!Array.isArray(columns) || columns.length === 0) {
            throw new Error('Columns must be a non-empty array');
        }

        const tableData = {
            schema: {
                tableName: tableName.toLowerCase(),
                columns: columns,
                createdAt: new Date().toISOString()
            },
            rows: []
        };

        const tablePath = getTablePath(tableName);
        fs.writeFileSync(tablePath, JSON.stringify(tableData, null, 2), 'utf-8');

        console.log(`✅ Table '${tableName}' created successfully`);
        
        return {
            success: true,
            message: `Table '${tableName}' created successfully`,
            tableName: tableName.toLowerCase()
        };

    } catch (error) {
        console.error(`❌ Error creating table '${tableName}':`, error.message);
        throw error;
    }
};

export const readTable = (tableName) => {
    try {
        if (!tableExists(tableName)) {
            throw new Error(`Table '${tableName}' does not exist`);
        }

        const tablePath = getTablePath(tableName);
        const rawData = fs.readFileSync(tablePath, 'utf-8');
        const tableData = JSON.parse(rawData);

        console.log(`📖 Read table '${tableName}' (${tableData.rows.length} rows)`);

        return tableData;

    } catch (error) {
        console.error(`❌ Error reading table '${tableName}':`, error.message);
        throw error;
    }
};

export const writeTable = (tableName, tableData) => {
    try {
        ensureDataDirectory();

        if (!tableData.schema || !tableData.rows) {
            throw new Error('Invalid table data structure. Must have schema and rows');
        }

        const tablePath = getTablePath(tableName);
        fs.writeFileSync(tablePath, JSON.stringify(tableData, null, 2), 'utf-8');

        console.log(`💾 Wrote table '${tableName}' (${tableData.rows.length} rows)`);

        return {
            success: true,
            message: `Table '${tableName}' updated successfully`,
            rowCount: tableData.rows.length
        };

    } catch (error) {
        console.error(`❌ Error writing table '${tableName}':`, error.message);
        throw error;
    }
};

export const insertRow = (tableName, rowData) => {
    try {
        const tableData = readTable(tableName);

        tableData.rows.push(rowData);

        writeTable(tableName, tableData);

        console.log(`➕ Inserted row into '${tableName}'`);

        return {
            success: true,
            message: `Row inserted into '${tableName}'`,
            rowCount: tableData.rows.length
        };

    } catch (error) {
        console.error(`❌ Error inserting row into '${tableName}':`, error.message);
        throw error;
    }
};

export const getAllRows = (tableName) => {
    try {
        const tableData = readTable(tableName);
        return tableData.rows;
    } catch (error) {
        console.error(`❌ Error getting rows from '${tableName}':`, error.message);
        throw error;
    }
};

export const getTableSchema = (tableName) => {
    try {
        const tableData = readTable(tableName);
        return tableData.schema;
    } catch (error) {
        console.error(`❌ Error getting schema for '${tableName}':`, error.message);
        throw error;
    }
};

export const deleteTable = (tableName) => {
    try {
        if (!tableExists(tableName)) {
            throw new Error(`Table '${tableName}' does not exist`);
        }

        const tablePath = getTablePath(tableName);
        fs.unlinkSync(tablePath);

        console.log(`🗑️ Table '${tableName}' deleted successfully`);

        return {
            success: true,
            message: `Table '${tableName}' deleted successfully`
        };

    } catch (error) {
        console.error(`❌ Error deleting table '${tableName}':`, error.message);
        throw error;
    }
};

export const listAllTables = () => {
    try {
        ensureDataDirectory();

        const files = fs.readdirSync(DATA_DIR);

        const tables = files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));

        console.log(`📋 Found ${tables.length} tables: ${tables.join(', ')}`);

        return tables;

    } catch (error) {
        console.error('❌ Error listing tables:', error.message);
        throw error;
    }
};

export const getTableStats = (tableName) => {
    try {
        const tableData = readTable(tableName);
        const tablePath = getTablePath(tableName);
        const stats = fs.statSync(tablePath);

        return {
            tableName: tableName.toLowerCase(),
            rowCount: tableData.rows.length,
            columnCount: tableData.schema.columns.length,
            fileSizeBytes: stats.size,
            fileSizeKB: (stats.size / 1024).toFixed(2),
            createdAt: tableData.schema.createdAt,
            lastModified: stats.mtime.toISOString()
        };

    } catch (error) {
        console.error(`❌ Error getting stats for '${tableName}':`, error.message);
        throw error;
    }
};

ensureDataDirectory();
