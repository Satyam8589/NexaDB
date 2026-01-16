import { Router } from "express";
import { 
    serverCheck, 
    executeQuery, 
    getTables, 
    getSchema, 
    analyzeQueryEndpoint, 
    getExecutionPlan,
    deleteTable
} from "../controllers/query.controller.js";

const router = Router();

// Server status
router.route("/").get(serverCheck);

// Execute SQL query
router.route("/execute").post(executeQuery);

// List all tables
router.route("/tables").get(getTables);

// Get table schema
router.route("/schema/:tableName").get(getSchema);

// Delete table
router.route("/table/:tableName").delete(deleteTable);

// Analyze query
router.route("/analyze").post(analyzeQueryEndpoint);

// Get execution plan
router.route("/plan").post(getExecutionPlan);

export default router;