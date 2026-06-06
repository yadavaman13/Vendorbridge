import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import envConfig from "./config/envConfig.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import categoriesRoutes from './routes/categories.routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: envConfig.CLIENT_ORIGINS,
    credentials: true,
  }),
);
app.use(morgan("combined")); //  Logging middleware for better debugging

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use('/api/categories', categoriesRoutes);

export default app;
