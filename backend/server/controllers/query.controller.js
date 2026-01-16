import { executeSQL, listTables, getTableInfo, dropTable } from '../../engine/index.js';
import { analyzeQuery, generateExecutionPlan } from '../../engine/executor/queryPlanner.js';
import { parse } from '../../engine/parser/parser.js';

export const serverCheck = async (req, res) => {
    return res.status(200).json({ 
        message: "NexaDB Server is running",
        version: "1.0.0",
        endpoints: {
            query: "POST /api/query",
            tables: "GET /api/query/tables",
            schema: "GET /api/query/schema/:tableName",
            analyze: "POST /api/query/analyze",
            plan: "POST /api/query/plan"
        }
    });
};

export const executeQuery = async (req, res) => {
    try {
        const { sql } = req.body;

        if (!sql) {
            return res.status(400).json({
                success: false,
                error: 'SQL query is required'
            });
        }

        const result = executeSQL(sql);

        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getTables = async (req, res) => {
    try {
        const tables = listTables();
        
        return res.status(200).json({
            success: true,
            tables: tables,
            count: tables.length
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getSchema = async (req, res) => {
    try {
        const { tableName } = req.params;

        if (!tableName) {
            return res.status(400).json({
                success: false,
                error: 'Table name is required'
            });
        }

        const info = getTableInfo(tableName);

        return res.status(200).json({
            success: true,
            ...info
        });

    } catch (error) {
        return res.status(404).json({
            success: false,
            error: error.message
        });
    }
};

export const analyzeQueryEndpoint = async (req, res) => {
    try {
        const { sql } = req.body;

        if (!sql) {
            return res.status(400).json({
                success: false,
                error: 'SQL query is required'
            });
        }

        const ast = parse(sql);
        const analysis = analyzeQuery(ast);

        return res.status(200).json({
            success: true,
            sql: sql,
            analysis: analysis
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

export const getExecutionPlan = async (req, res) => {
    try {
        const { sql } = req.body;

        if (!sql) {
            return res.status(400).json({
                success: false,
                error: 'SQL query is required'
            });
        }

        const ast = parse(sql);
        const plan = generateExecutionPlan(ast);

        return res.status(200).json({
            success: true,
            sql: sql,
            plan: plan
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

export const deleteTable = async (req, res) => {
    try {
        const { tableName } = req.params;

        if (!tableName) {
            return res.status(400).json({
                success: false,
                error: 'Table name is required'
            });
        }

        const result = dropTable(tableName);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(404).json({
            success: false,
            error: error.message
        });
    }
};