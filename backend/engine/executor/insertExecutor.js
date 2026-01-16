import storageManager from '../storage/storageManager.js';

export function executeInsert(ast) {
    if (!ast || ast.type !== 'INSERT') {
        throw new Error('Invalid INSERT AST');
    }

    const { table, values } = ast;

    if (!storageManager.tableExists(table)) {
        throw new Error(`Table '${table}' does not exist`);
    }

    const schema = storageManager.getSchema(table);
    const columns = schema.columns;

    if (values.length !== columns.length) {
        throw new Error(
            `Column count mismatch: expected ${columns.length} values, got ${values.length}`
        );
    }

    const row = buildRow(columns, values);

    validateRow(row, columns);

    storageManager.insertRow(table, row);

    return {
        success: true,
        message: `Inserted 1 row into '${table}'`,
        rowCount: 1,
        data: row
    };
}

export function executeInsertBatch(table, rowsData) {
    if (!storageManager.tableExists(table)) {
        throw new Error(`Table '${table}' does not exist`);
    }

    const schema = storageManager.getSchema(table);
    const columns = schema.columns;

    const rows = rowsData.map(values => {
        if (values.length !== columns.length) {
            throw new Error(
                `Column count mismatch: expected ${columns.length} values, got ${values.length}`
            );
        }

        const row = buildRow(columns, values);
        validateRow(row, columns);
        return row;
    });

    storageManager.insertRows(table, rows);

    return {
        success: true,
        message: `Inserted ${rows.length} rows into '${table}'`,
        rowCount: rows.length
    };
}

function buildRow(columns, values) {
    const row = {};
    
    columns.forEach((col, index) => {
        row[col.name] = values[index];
    });

    return row;
}

function validateRow(row, columns) {
    columns.forEach(col => {
        const value = row[col.name];

        if (value === null || value === undefined) {
            return;
        }

        const isValid = validateType(value, col.type);

        if (!isValid) {
            throw new Error(
                `Type mismatch for column '${col.name}': expected ${col.type}, got ${typeof value}`
            );
        }
    });
}

function validateType(value, expectedType) {
    if (value === null || value === undefined) {
        return true;
    }

    switch (expectedType) {
        case 'NUMBER':
        case 'INTEGER':
        case 'FLOAT':
            return typeof value === 'number' && !isNaN(value);
        
        case 'STRING':
        case 'TEXT':
            return typeof value === 'string';
        
        case 'BOOLEAN':
            return typeof value === 'boolean';
        
        case 'DATE':
            return value instanceof Date || !isNaN(Date.parse(value));
        
        default:
            return true;
    }
}

export function explainInsert(ast) {
    const { table, values } = ast;

    return {
        operation: 'INSERT',
        table: table,
        steps: [
            {
                step: 1,
                action: 'VALIDATE_TABLE',
                description: `Check if table '${table}' exists`
            },
            {
                step: 2,
                action: 'VALIDATE_SCHEMA',
                description: `Verify ${values.length} values match table schema`
            },
            {
                step: 3,
                action: 'VALIDATE_TYPES',
                description: 'Check data types for each column'
            },
            {
                step: 4,
                action: 'BUILD_ROW',
                description: 'Construct row object from values'
            },
            {
                step: 5,
                action: 'WRITE_TO_DISK',
                description: `Append row to table '${table}'`
            },
            {
                step: 6,
                action: 'RETURN',
                description: 'Return success confirmation'
            }
        ]
    };
}

export default { executeInsert, executeInsertBatch, explainInsert };
