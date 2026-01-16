import storageManager from '../storage/storageManager.js';

export function executeDelete(ast) {
    if (!ast || ast.type !== 'DELETE') {
        throw new Error('Invalid DELETE AST');
    }

    const { table, where } = ast;

    if (!storageManager.tableExists(table)) {
        throw new Error(`Table '${table}' does not exist`);
    }

    if (!where) {
        const tableData = storageManager.getTable(table);
        const rowCount = tableData.rows.length;
        storageManager.truncateTable(table);
        
        return {
            success: true,
            message: `Deleted all rows from '${table}'`,
            deletedCount: rowCount
        };
    }

    const conditionFn = (row) => {
        return evaluateCondition(row, where);
    };

    const result = storageManager.deleteRows(table, conditionFn);

    return {
        success: true,
        message: `Deleted ${result.deletedCount} rows from '${table}'`,
        deletedCount: result.deletedCount
    };
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

export function explainDelete(ast) {
    const { table, where } = ast;

    const steps = [
        {
            step: 1,
            action: 'VALIDATE_TABLE',
            description: `Check if table '${table}' exists`
        }
    ];

    if (!where) {
        steps.push({
            step: 2,
            action: 'TRUNCATE',
            description: `Delete all rows from table '${table}'`
        });
    } else {
        steps.push({
            step: 2,
            action: 'FILTER_ROWS',
            description: where.type === 'COMPOUND' 
                ? 'Apply compound WHERE conditions'
                : `Filter rows where ${where.column} ${where.operator} ${where.value}`
        });

        steps.push({
            step: 3,
            action: 'DELETE_ROWS',
            description: 'Remove matching rows from table'
        });
    }

    steps.push({
        step: steps.length + 1,
        action: 'WRITE_TO_DISK',
        description: `Save updated table to disk`
    });

    steps.push({
        step: steps.length + 1,
        action: 'RETURN',
        description: 'Return deletion count'
    });

    return {
        operation: 'DELETE',
        table: table,
        steps: steps
    };
}

export default { executeDelete, explainDelete };
