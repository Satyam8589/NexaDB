import express from "express";
import dotenv from "dotenv";
import queryRoutes from "./routes/query.routes.js";
import cors from "cors";
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/health", queryRoutes);

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