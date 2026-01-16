import storageManager from '../storage/storageManager.js';

export function executeSelect(ast) {
    if (!ast || ast.type !== 'SELECT') {
        throw new Error('Invalid SELECT AST');
    }

    const { columns, table, where } = ast;

    if (!storageManager.tableExists(table)) {
        throw new Error(`Table '${table}' does not exist`);
    }

    let rows = storageManager.getAllRows(table);

    if (where) {
        rows = applyWhereClause(rows, where);
    }

    if (columns[0] === '*') {
        return {
            success: true,
            data: rows,
            rowCount: rows.length
        };
    }

    const projectedRows = projectColumns(rows, columns);

    return {
        success: true,
        data: projectedRows,
        rowCount: projectedRows.length
    };
}

function applyWhereClause(rows, where) {
    if (where.type === 'COMPOUND') {
        return applyCompoundCondition(rows, where);
    }

    return rows.filter(row => evaluateCondition(row, where));
}

function applyCompoundCondition(rows, compoundWhere) {
    const { conditions } = compoundWhere;

    return rows.filter(row => {
        let result = evaluateCondition(row, conditions[0]);

        for (let i = 1; i < conditions.length; i++) {
            const { logicalOperator, condition } = conditions[i];
            const conditionResult = evaluateCondition(row, condition);

            if (logicalOperator === 'AND') {
                result = result && conditionResult;
            } else if (logicalOperator === 'OR') {
                result = result || conditionResult;
            }
        }

        return result;
    });
}

function evaluateCondition(row, condition) {
    const { column, operator, value } = condition;

    if (!(column in row)) {
        throw new Error(`Column '${column}' does not exist in table`);
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

function projectColumns(rows, columns) {
    return rows.map(row => {
        const projectedRow = {};
        
        columns.forEach(column => {
            if (!(column in row)) {
                throw new Error(`Column '${column}' does not exist in table`);
            }
            projectedRow[column] = row[column];
        });

        return projectedRow;
    });
}

export function explainSelect(ast) {
    const { columns, table, where } = ast;

    const explanation = {
        operation: 'SELECT',
        table: table,
        steps: []
    };

    explanation.steps.push({
        step: 1,
        action: 'TABLE_SCAN',
        description: `Scan all rows from table '${table}'`
    });

    if (where) {
        if (where.type === 'COMPOUND') {
            explanation.steps.push({
                step: 2,
                action: 'FILTER_COMPOUND',
                description: `Apply compound WHERE conditions (${where.conditions.length} conditions)`
            });
        } else {
            explanation.steps.push({
                step: 2,
                action: 'FILTER',
                description: `Filter rows where ${where.column} ${where.operator} ${where.value}`
            });
        }
    }

    if (columns[0] !== '*') {
        explanation.steps.push({
            step: where ? 3 : 2,
            action: 'PROJECT',
            description: `Select columns: ${columns.join(', ')}`
        });
    }

    explanation.steps.push({
        step: explanation.steps.length + 1,
        action: 'RETURN',
        description: 'Return result set'
    });

    return explanation;
}

export default { executeSelect, explainSelect };
