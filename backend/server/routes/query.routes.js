import { Router } from "express";
import { serverCheck } from "../controllers/query.controller.js";

const router = Router();

router.route("/").get(serverCheck);

export default router;