import { parse } from './parser/parser.js';
import { executeSelect } from './executor/selectExecutor.js';
import { executeInsert } from './executor/insertExecutor.js';
import { executeCreate } from './executor/createExecutor.js';
import { executeUpdate } from './executor/updateExecutor.js';
import { executeDelete } from './executor/deleteExecutor.js';
import storageManager from './storage/storageManager.js';

export function executeSQL(sql) {
    try {
        const ast = parse(sql);
        
        switch (ast.type) {
            case 'SELECT':
                return executeSelect(ast);
            
            case 'INSERT':
                return executeInsert(ast);
            
            case 'CREATE':
                return executeCreate(ast);
            
            case 'DELETE':
                return executeDelete(ast);
            
            case 'UPDATE':
                return executeUpdate(ast);
            
            default:
                throw new Error(`Unsupported query type: ${ast.type}`);
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
}



function evaluateCondition(row, condition) {
    if (condition.type === 'COMPOUND') {
        const { conditions } = condition;
        let result = evaluateSimpleCondition(row, conditions[0]);

        for (let i = 1; i < conditions.length; i++) {
            const { logicalOperator, condition: cond } = conditions[i];
            const condResult = evaluateSimpleCondition(row, cond);

            if (logicalOperator === 'AND') {
                result = result && condResult;
            } else if (logicalOperator === 'OR') {
                result = result || condResult;
            }
        }

        return result;
    }

    return evaluateSimpleCondition(row, condition);
}

function evaluateSimpleCondition(row, condition) {
    const { column, operator, value } = condition;

    if (!(column in row)) {
        throw new Error(`Column '${column}' does not exist`);
    }

    const rowValue = row[column];

    switch (operator) {
        case '=':
            return rowValue === value;
        case '!=':
        case '<>':
            return rowValue !== value;
        case '<':
            return rowValue < value;
        case '>':
            return rowValue > value;
        case '<=':
            return rowValue <= value;
        case '>=':
            return rowValue >= value;
        default:
            throw new Error(`Unsupported operator: ${operator}`);
    }
}

export function listTables() {
    return storageManager.listAllTables();
}

export function getTableInfo(tableName) {
    if (!storageManager.tableExists(tableName)) {
        throw new Error(`Table '${tableName}' does not exist`);
    }

    const schema = storageManager.getSchema(tableName);
    const stats = storageManager.getTableStats(tableName);

    return {
        table: tableName,
        schema: schema,
        stats: stats
    };
}

export function dropTable(tableName) {
    if (!storageManager.tableExists(tableName)) {
        throw new Error(`Table '${tableName}' does not exist`);
    }

    storageManager.deleteTable(tableName);

    return {
        success: true,
        message: `Table '${tableName}' dropped successfully`
    };
}

export default {
    executeSQL,
    listTables,
    getTableInfo,
    dropTable
};
