import storageManager from '../storage/storageManager.js';

export function analyzeQuery(ast) {
    const analysis = {
        queryType: ast.type,
        table: ast.table || null,
        complexity: 'SIMPLE',
        estimatedCost: 0,
        recommendations: [],
        warnings: []
    };

    switch (ast.type) {
        case 'SELECT':
            return analyzeSelect(ast, analysis);
        case 'INSERT':
            return analyzeInsert(ast, analysis);
        case 'UPDATE':
            return analyzeUpdate(ast, analysis);
        case 'DELETE':
            return analyzeDelete(ast, analysis);
        case 'CREATE':
            return analyzeCreate(ast, analysis);
        default:
            analysis.warnings.push(`Unknown query type: ${ast.type}`);
            return analysis;
    }
}

function analyzeSelect(ast, analysis) {
    const { table, columns, where } = ast;

    if (!storageManager.tableExists(table)) {
        analysis.warnings.push(`Table '${table}' does not exist`);
        return analysis;
    }

    const stats = storageManager.getTableStats(table);
    const rowCount = stats.rowCount;

    analysis.estimatedCost = rowCount;

    if (columns[0] === '*') {
        analysis.recommendations.push('Consider selecting only needed columns instead of *');
    }

    if (!where) {
        analysis.complexity = 'SIMPLE';
        analysis.recommendations.push('Full table scan - consider adding WHERE clause if filtering is needed');
    } else {
        if (where.type === 'COMPOUND') {
            analysis.complexity = 'COMPLEX';
            analysis.estimatedCost += where.conditions.length * 10;
        } else {
            analysis.complexity = 'MODERATE';
            analysis.estimatedCost += 10;
        }
    }

    analysis.estimatedRows = where ? Math.floor(rowCount * 0.3) : rowCount;
    analysis.tableStats = stats;

    return analysis;
}

function analyzeInsert(ast, analysis) {
    const { table, values } = ast;

    if (!storageManager.tableExists(table)) {
        analysis.warnings.push(`Table '${table}' does not exist`);
        return analysis;
    }

    const schema = storageManager.getSchema(table);
    const stats = storageManager.getTableStats(table);

    analysis.estimatedCost = 50;
    analysis.complexity = 'SIMPLE';

    if (values.length !== schema.columns.length) {
        analysis.warnings.push(
            `Column count mismatch: expected ${schema.columns.length}, got ${values.length}`
        );
    }

    if (stats.rowCount > 10000) {
        analysis.recommendations.push('Large table - consider batch inserts for better performance');
    }

    analysis.tableStats = stats;

    return analysis;
}

function analyzeUpdate(ast, analysis) {
    const { table, updates, where } = ast;

    if (!storageManager.tableExists(table)) {
        analysis.warnings.push(`Table '${table}' does not exist`);
        return analysis;
    }

    const stats = storageManager.getTableStats(table);
    const rowCount = stats.rowCount;

    analysis.estimatedCost = rowCount + 50;

    if (!where) {
        analysis.complexity = 'MODERATE';
        analysis.warnings.push('UPDATE without WHERE will modify all rows');
        analysis.estimatedRows = rowCount;
    } else {
        if (where.type === 'COMPOUND') {
            analysis.complexity = 'COMPLEX';
            analysis.estimatedCost += where.conditions.length * 10;
        } else {
            analysis.complexity = 'MODERATE';
        }
        analysis.estimatedRows = Math.floor(rowCount * 0.3);
    }

    analysis.updatedColumns = updates.map(u => u.column);
    analysis.tableStats = stats;

    return analysis;
}

function analyzeDelete(ast, analysis) {
    const { table, where } = ast;

    if (!storageManager.tableExists(table)) {
        analysis.warnings.push(`Table '${table}' does not exist`);
        return analysis;
    }

    const stats = storageManager.getTableStats(table);
    const rowCount = stats.rowCount;

    analysis.estimatedCost = rowCount + 30;

    if (!where) {
        analysis.complexity = 'SIMPLE';
        analysis.warnings.push('DELETE without WHERE will remove all rows (TRUNCATE)');
        analysis.estimatedRows = rowCount;
        analysis.recommendations.push('Consider using TRUNCATE for better performance');
    } else {
        if (where.type === 'COMPOUND') {
            analysis.complexity = 'COMPLEX';
            analysis.estimatedCost += where.conditions.length * 10;
        } else {
            analysis.complexity = 'MODERATE';
        }
        analysis.estimatedRows = Math.floor(rowCount * 0.3);
    }

    analysis.tableStats = stats;

    return analysis;
}

function analyzeCreate(ast, analysis) {
    const { table, columns } = ast;

    if (storageManager.tableExists(table)) {
        analysis.warnings.push(`Table '${table}' already exists`);
        return analysis;
    }

    analysis.estimatedCost = 100;
    analysis.complexity = 'SIMPLE';
    analysis.columnCount = columns.length;

    if (columns.length > 20) {
        analysis.recommendations.push('Large number of columns - consider normalizing the schema');
    }

    const columnNames = columns.map(c => c.name.toLowerCase());
    const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
        analysis.warnings.push(`Duplicate column names: ${duplicates.join(', ')}`);
    }

    return analysis;
}

export function generateExecutionPlan(ast) {
    const plan = {
        queryType: ast.type,
        steps: [],
        estimatedTime: 0,
        optimizations: []
    };

    switch (ast.type) {
        case 'SELECT':
            return generateSelectPlan(ast, plan);
        case 'INSERT':
            return generateInsertPlan(ast, plan);
        case 'UPDATE':
            return generateUpdatePlan(ast, plan);
        case 'DELETE':
            return generateDeletePlan(ast, plan);
        case 'CREATE':
            return generateCreatePlan(ast, plan);
        default:
            return plan;
    }
}

function generateSelectPlan(ast, plan) {
    const { table, columns, where } = ast;

    plan.steps.push({
        order: 1,
        operation: 'TABLE_SCAN',
        table: table,
        description: `Scan table '${table}'`
    });

    if (where) {
        plan.steps.push({
            order: 2,
            operation: 'FILTER',
            description: where.type === 'COMPOUND' 
                ? 'Apply compound WHERE conditions'
                : `Filter: ${where.column} ${where.operator} ${where.value}`
        });
    }

    if (columns[0] !== '*') {
        plan.steps.push({
            order: plan.steps.length + 1,
            operation: 'PROJECT',
            columns: columns,
            description: `Select columns: ${columns.join(', ')}`
        });
    }

    plan.estimatedTime = plan.steps.length * 10;

    return plan;
}

function generateInsertPlan(ast, plan) {
    const { table, values } = ast;

    plan.steps = [
        {
            order: 1,
            operation: 'VALIDATE_SCHEMA',
            description: 'Validate column count and types'
        },
        {
            order: 2,
            operation: 'BUILD_ROW',
            description: 'Construct row object'
        },
        {
            order: 3,
            operation: 'WRITE',
            table: table,
            description: `Insert into '${table}'`
        }
    ];

    plan.estimatedTime = 30;

    return plan;
}

function generateUpdatePlan(ast, plan) {
    const { table, updates, where } = ast;

    plan.steps.push({
        order: 1,
        operation: 'TABLE_SCAN',
        table: table,
        description: `Scan table '${table}'`
    });

    if (where) {
        plan.steps.push({
            order: 2,
            operation: 'FILTER',
            description: 'Filter rows matching WHERE'
        });
    }

    plan.steps.push({
        order: plan.steps.length + 1,
        operation: 'UPDATE',
        columns: updates.map(u => u.column),
        description: `Update columns: ${updates.map(u => u.column).join(', ')}`
    });

    plan.steps.push({
        order: plan.steps.length + 1,
        operation: 'WRITE',
        table: table,
        description: 'Write updated table to disk'
    });

    plan.estimatedTime = plan.steps.length * 15;

    return plan;
}

function generateDeletePlan(ast, plan) {
    const { table, where } = ast;

    if (!where) {
        plan.steps = [
            {
                order: 1,
                operation: 'TRUNCATE',
                table: table,
                description: `Truncate table '${table}'`
            }
        ];
        plan.estimatedTime = 20;
    } else {
        plan.steps = [
            {
                order: 1,
                operation: 'TABLE_SCAN',
                table: table,
                description: `Scan table '${table}'`
            },
            {
                order: 2,
                operation: 'FILTER',
                description: 'Filter rows matching WHERE'
            },
            {
                order: 3,
                operation: 'DELETE',
                description: 'Remove matching rows'
            },
            {
                order: 4,
                operation: 'WRITE',
                table: table,
                description: 'Write updated table to disk'
            }
        ];
        plan.estimatedTime = plan.steps.length * 12;
    }

    return plan;
}

function generateCreatePlan(ast, plan) {
    const { table, columns } = ast;

    plan.steps = [
        {
            order: 1,
            operation: 'VALIDATE_SCHEMA',
            description: `Validate ${columns.length} column definitions`
        },
        {
            order: 2,
            operation: 'CREATE_FILE',
            table: table,
            description: `Create table file for '${table}'`
        },
        {
            order: 3,
            operation: 'WRITE_SCHEMA',
            description: 'Write schema metadata'
        }
    ];

    plan.estimatedTime = 50;

    return plan;
}

export default { analyzeQuery, generateExecutionPlan };
