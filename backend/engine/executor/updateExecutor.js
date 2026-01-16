import storageManager from '../storage/storageManager.js';

export function executeUpdate(ast) {
    if (!ast || ast.type !== 'UPDATE') {
        throw new Error('Invalid UPDATE AST');
    }

    const { table, updates, where } = ast;

    if (!storageManager.tableExists(table)) {
        throw new Error(`Table '${table}' does not exist`);
    }

    validateUpdates(table, updates);

    const conditionFn = where ? (row) => evaluateCondition(row, where) : () => true;

    const updateFn = (row) => {
        const updatedRow = { ...row };
        updates.forEach(update => {
            updatedRow[update.column] = update.value;
        });
        return updatedRow;
    };

    const result = storageManager.updateRows(table, conditionFn, updateFn);

    return {
        success: true,
        message: `Updated ${result.updatedCount} rows in '${table}'`,
        updatedCount: result.updatedCount
    };
}

function validateUpdates(table, updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
        throw new Error('UPDATE must specify at least one column to update');
    }

    const schema = storageManager.getSchema(table);
    const validColumns = schema.columns.map(col => col.name);

    updates.forEach(update => {
        if (!update.column) {
            throw new Error('Update must specify a column name');
        }

        if (!validColumns.includes(update.column)) {
            throw new Error(`Column '${update.column}' does not exist in table '${table}'`);
        }

        if (update.value === undefined) {
            throw new Error(`Update for column '${update.column}' must have a value`);
        }
    });
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

export function explainUpdate(ast) {
    const { table, updates, where } = ast;

    const steps = [
        {
            step: 1,
            action: 'VALIDATE_TABLE',
            description: `Check if table '${table}' exists`
        },
        {
            step: 2,
            action: 'VALIDATE_COLUMNS',
            description: `Verify ${updates.length} column(s) exist in table`
        }
    ];

    if (where) {
        steps.push({
            step: 3,
            action: 'FILTER_ROWS',
            description: where.type === 'COMPOUND' 
                ? 'Apply compound WHERE conditions'
                : `Filter rows where ${where.column} ${where.operator} ${where.value}`
        });
    }

    steps.push({
        step: steps.length + 1,
        action: 'UPDATE_ROWS',
        description: `Update ${updates.map(u => u.column).join(', ')} in matching rows`
    });

    steps.push({
        step: steps.length + 1,
        action: 'WRITE_TO_DISK',
        description: `Save updated table to disk`
    });

    steps.push({
        step: steps.length + 1,
        action: 'RETURN',
        description: 'Return update count'
    });

    return {
        operation: 'UPDATE',
        table: table,
        steps: steps
    };
}

export default { executeUpdate, explainUpdate };
