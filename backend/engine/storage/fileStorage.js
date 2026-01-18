import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use configurable data directory
const DATA_DIR = config.dataDirectory;
let currentDb = 'default';

const getDbPath = (dbName = currentDb) => {
    return path.join(DATA_DIR, dbName.toLowerCase());
};

const ensureDataDirectory = (dbName = currentDb) => {
    const dbPath = getDbPath(dbName);
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
        console.log(`Created database directory: ${dbPath}`);
    }
};

const getTablePath = (tableName, dbName = currentDb) => {
    return path.join(getDbPath(dbName), `${tableName.toLowerCase()}.json`);
};

export const setCurrentDatabase = (dbName) => {
    ensureDataDirectory(dbName);
    currentDb = dbName.toLowerCase();
    return { success: true, message: `Switched to database '${currentDb}'` };
};

export const getCurrentDatabase = () => {
    return currentDb;
};

export const createDatabase = (dbName) => {
    const dbPath = getDbPath(dbName);
    if (fs.existsSync(dbPath)) {
        throw new Error(`Database '${dbName}' already exists`);
    }
    fs.mkdirSync(dbPath, { recursive: true });
    return { success: true, message: `Database '${dbName}' created successfully` };
};

export const dropDatabase = (dbName) => {
    const dbPath = getDbPath(dbName);
    if (!fs.existsSync(dbPath)) {
        throw new Error(`Database '${dbName}' does not exist`);
    }
    fs.rmSync(dbPath, { recursive: true, force: true });
    if (currentDb === dbName.toLowerCase()) {
        currentDb = 'default';
        ensureDataDirectory(currentDb);
    }
    return { success: true, message: `Database '${dbName}' dropped successfully` };
};

export const listDatabases = () => {
    ensureDataDirectory('default');
    const files = fs.readdirSync(DATA_DIR);
    return files.filter(file => fs.statSync(path.join(DATA_DIR, file)).isDirectory());
};

export const tableExists = (tableName) => {
    const tablePath = getTablePath(tableName);
    return fs.existsSync(tablePath);
};

export const createTable = (tableName, columns) => {
    try {
        ensureDataDirectory();

        if (tableExists(tableName)) {
            throw new Error(`Table '${tableName}' already exists in database '${currentDb}'`);
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

        console.log(`Table '${tableName}' created successfully in database '${currentDb}'`);
        
        return {
            success: true,
            message: `Table '${tableName}' created successfully in database '${currentDb}'`,
            tableName: tableName.toLowerCase()
        };

    } catch (error) {
        console.error(`Error creating table '${tableName}':`, error.message);
        throw error;
    }
};

export const readTable = (tableName) => {
    try {
        if (!tableExists(tableName)) {
            throw new Error(`Table '${tableName}' does not exist in database '${currentDb}'`);
        }

        const tablePath = getTablePath(tableName);
        const rawData = fs.readFileSync(tablePath, 'utf-8');
        const tableData = JSON.parse(rawData);

        return tableData;

    } catch (error) {
        console.error(`Error reading table '${tableName}':`, error.message);
        throw error;
    }
};

export const writeTable = (tableName, tableData) => {
    try {
        ensureDataDirectory();

        const tablePath = getTablePath(tableName);
        fs.writeFileSync(tablePath, JSON.stringify(tableData, null, 2), 'utf-8');

        return {
            success: true,
            message: `Table '${tableName}' updated successfully`,
            rowCount: tableData.rows.length
        };

    } catch (error) {
        console.error(`Error writing table '${tableName}':`, error.message);
        throw error;
    }
};

export const insertRow = (tableName, rowData) => {
    try {
        const tableData = readTable(tableName);
        tableData.rows.push(rowData);
        writeTable(tableName, tableData);

        return {
            success: true,
            message: `Row inserted into '${tableName}'`,
            rowCount: tableData.rows.length
        };

    } catch (error) {
        throw error;
    }
};

export const getAllRows = (tableName) => {
    const tableData = readTable(tableName);
    return tableData.rows;
};

export const getTableSchema = (tableName) => {
    const tableData = readTable(tableName);
    return tableData.schema;
};

export const deleteTable = (tableName) => {
    try {
        if (!tableExists(tableName)) {
            throw new Error(`Table '${tableName}' does not exist`);
        }

        const tablePath = getTablePath(tableName);
        fs.unlinkSync(tablePath);

        return {
            success: true,
            message: `Table '${tableName}' deleted successfully`
        };

    } catch (error) {
        throw error;
    }
};

export const listAllTables = () => {
    try {
        ensureDataDirectory();
        const dbPath = getDbPath();
        const files = fs.readdirSync(dbPath);

        return files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));

    } catch (error) {
        return [];
    }
};

export const getTableStats = (tableName) => {
    try {
        const tableData = readTable(tableName);
        const tablePath = getTablePath(tableName);
        const stats = fs.statSync(tablePath);

        return {
            tableName: tableName.toLowerCase(),
            database: currentDb,
            rowCount: tableData.rows.length,
            columnCount: tableData.schema.columns.length,
            fileSizeBytes: stats.size,
            fileSizeKB: (stats.size / 1024).toFixed(2),
            createdAt: tableData.schema.createdAt,
            lastModified: stats.mtime.toISOString()
        };

    } catch (error) {
        throw error;
    }
};

ensureDataDirectory('default');
