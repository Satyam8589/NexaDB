export function buildSelectAST(columns, table, where = null) {
    return {
        type: 'SELECT',
        columns,
        table,
        where
    };
}

export function buildInsertAST(table, values) {
    return {
        type: 'INSERT',
        table,
        values
    };
}

export function buildCreateAST(table, columns) {
    return {
        type: 'CREATE',
        table,
        columns
    };
}

export function buildDeleteAST(table, where = null) {
    return {
        type: 'DELETE',
        table,
        where
    };
}

export function buildUpdateAST(table, updates, where = null) {
    return {
        type: 'UPDATE',
        table,
        updates,
        where
    };
}

export function buildWhereCondition(column, operator, value) {
    return {
        column,
        operator,
        value
    };
}

export function buildCompoundCondition(conditions) {
    return {
        type: 'COMPOUND',
        conditions
    };
}

export function buildColumnDefinition(name, type) {
    return {
        name,
        type
    };
}

export function buildUpdateAssignment(column, value) {
    return {
        column,
        value
    };
}

export function validateAST(ast) {
    if (!ast || typeof ast !== 'object') {
        throw new Error('Invalid AST: must be an object');
    }

    if (!ast.type) {
        throw new Error('Invalid AST: missing type field');
    }

    const validTypes = ['SELECT', 'INSERT', 'CREATE', 'DELETE', 'UPDATE'];
    if (!validTypes.includes(ast.type)) {
        throw new Error(`Invalid AST type: ${ast.type}`);
    }

    switch (ast.type) {
        case 'SELECT':
            validateSelectAST(ast);
            break;
        case 'INSERT':
            validateInsertAST(ast);
            break;
        case 'CREATE':
            validateCreateAST(ast);
            break;
        case 'DELETE':
            validateDeleteAST(ast);
            break;
        case 'UPDATE':
            validateUpdateAST(ast);
            break;
    }

    return true;
}

function validateSelectAST(ast) {
    if (!ast.columns || !Array.isArray(ast.columns)) {
        throw new Error('SELECT AST must have columns array');
    }

    if (!ast.table || typeof ast.table !== 'string') {
        throw new Error('SELECT AST must have table name');
    }

    if (ast.where !== null && ast.where !== undefined) {
        validateWhereClause(ast.where);
    }
}

function validateInsertAST(ast) {
    if (!ast.table || typeof ast.table !== 'string') {
        throw new Error('INSERT AST must have table name');
    }

    if (!ast.values || !Array.isArray(ast.values)) {
        throw new Error('INSERT AST must have values array');
    }
}

function validateCreateAST(ast) {
    if (!ast.table || typeof ast.table !== 'string') {
        throw new Error('CREATE AST must have table name');
    }

    if (!ast.columns || !Array.isArray(ast.columns)) {
        throw new Error('CREATE AST must have columns array');
    }

    ast.columns.forEach((col, index) => {
        if (!col.name || !col.type) {
            throw new Error(`Column ${index} must have name and type`);
        }
    });
}

function validateDeleteAST(ast) {
    if (!ast.table || typeof ast.table !== 'string') {
        throw new Error('DELETE AST must have table name');
    }

    if (ast.where !== null && ast.where !== undefined) {
        validateWhereClause(ast.where);
    }
}

function validateUpdateAST(ast) {
    if (!ast.table || typeof ast.table !== 'string') {
        throw new Error('UPDATE AST must have table name');
    }

    if (!ast.updates || !Array.isArray(ast.updates)) {
        throw new Error('UPDATE AST must have updates array');
    }

    ast.updates.forEach((update, index) => {
        if (!update.column || update.value === undefined) {
            throw new Error(`Update ${index} must have column and value`);
        }
    });

    if (ast.where !== null && ast.where !== undefined) {
        validateWhereClause(ast.where);
    }
}

function validateWhereClause(where) {
    if (where.type === 'COMPOUND') {
        if (!where.conditions || !Array.isArray(where.conditions)) {
            throw new Error('Compound WHERE must have conditions array');
        }
        where.conditions.forEach((condition, index) => {
            if (condition.logicalOperator) {
                validateWhereClause(condition.condition);
            } else {
                validateSimpleCondition(condition);
            }
        });
    } else {
        validateSimpleCondition(where);
    }
}

function validateSimpleCondition(condition) {
    if (!condition.column || !condition.operator || condition.value === undefined) {
        throw new Error('WHERE condition must have column, operator, and value');
    }

    const validOperators = ['=', '!=', '<>', '<', '>', '<=', '>='];
    if (!validOperators.includes(condition.operator)) {
        throw new Error(`Invalid operator: ${condition.operator}`);
    }
}

export function printAST(ast, indent = 0) {
    const spaces = ' '.repeat(indent);
    
    if (typeof ast !== 'object' || ast === null) {
        console.log(`${spaces}${ast}`);
        return;
    }

    if (Array.isArray(ast)) {
        console.log(`${spaces}[`);
        ast.forEach(item => printAST(item, indent + 2));
        console.log(`${spaces}]`);
        return;
    }

    console.log(`${spaces}{`);
    Object.entries(ast).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            console.log(`${spaces}  ${key}:`);
            printAST(value, indent + 4);
        } else {
            console.log(`${spaces}  ${key}: ${JSON.stringify(value)}`);
        }
    });
    console.log(`${spaces}}`);
}

export function cloneAST(ast) {
    return JSON.parse(JSON.stringify(ast));
}

export function compareAST(ast1, ast2) {
    return JSON.stringify(ast1) === JSON.stringify(ast2);
}

export default {
    buildSelectAST,
    buildInsertAST,
    buildCreateAST,
    buildDeleteAST,
    buildUpdateAST,
    buildWhereCondition,
    buildCompoundCondition,
    buildColumnDefinition,
    buildUpdateAssignment,
    validateAST,
    printAST,
    cloneAST,
    compareAST
};
