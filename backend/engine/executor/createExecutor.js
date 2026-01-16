import storageManager from '../storage/storageManager.js';

export function executeCreate(ast) {
    if (!ast || ast.type !== 'CREATE') {
        throw new Error('Invalid CREATE AST');
    }

    const { table, columns } = ast;

    if (storageManager.tableExists(table)) {
        throw new Error(`Table '${table}' already exists`);
    }

    validateColumns(columns);

    storageManager.createTable(table, columns);

    return {
        success: true,
        message: `Table '${table}' created successfully`,
        table: table,
        columns: columns
    };
}

function validateColumns(columns) {
    if (!Array.isArray(columns) || columns.length === 0) {
        throw new Error('Table must have at least one column');
    }

    const columnNames = new Set();
    const validTypes = ['NUMBER', 'STRING', 'BOOLEAN', 'DATE', 'TEXT', 'INTEGER', 'FLOAT'];

    columns.forEach((col, index) => {
        if (!col.name || typeof col.name !== 'string') {
            throw new Error(`Column ${index + 1} must have a valid name`);
        }

        if (!col.type || typeof col.type !== 'string') {
            throw new Error(`Column '${col.name}' must have a valid type`);
        }

        if (!validTypes.includes(col.type.toUpperCase())) {
            throw new Error(
                `Invalid type '${col.type}' for column '${col.name}'. Valid types: ${validTypes.join(', ')}`
            );
        }

        if (columnNames.has(col.name.toLowerCase())) {
            throw new Error(`Duplicate column name: '${col.name}'`);
        }

        columnNames.add(col.name.toLowerCase());
    });
}

export function explainCreate(ast) {
    const { table, columns } = ast;

    return {
        operation: 'CREATE',
        table: table,
        steps: [
            {
                step: 1,
                action: 'VALIDATE_TABLE_NAME',
                description: `Check if table '${table}' already exists`
            },
            {
                step: 2,
                action: 'VALIDATE_COLUMNS',
                description: `Validate ${columns.length} column definitions`
            },
            {
                step: 3,
                action: 'CHECK_TYPES',
                description: 'Verify all column types are valid'
            },
            {
                step: 4,
                action: 'CHECK_DUPLICATES',
                description: 'Ensure no duplicate column names'
            },
            {
                step: 5,
                action: 'CREATE_SCHEMA',
                description: 'Build table schema structure'
            },
            {
                step: 6,
                action: 'WRITE_TO_DISK',
                description: `Create table file for '${table}'`
            },
            {
                step: 7,
                action: 'RETURN',
                description: 'Return success confirmation'
            }
        ]
    };
}

export default { executeCreate, explainCreate };
