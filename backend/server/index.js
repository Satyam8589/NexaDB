import express from "express";
import dotenv from "dotenv";
import queryRoutes from "./routes/query.routes.js";
import cors from "cors";
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/query", queryRoutes);

app.get("/", (req, res) => {
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
});

const start = async () => {
    try {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port http://localhost:${process.env.PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
}

start();