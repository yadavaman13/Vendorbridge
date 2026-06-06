import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import envConfig from './config/envConfig.js';
import authRoutes from './routes/auth.routes.js';
<<<<<<< HEAD
import vendorsRoutes from './routes/vendors.routes.js';
import activityLogRoutes from './routes/activity-log.routes.js';
=======
import categoriesRoutes from './routes/categories.routes.js';
>>>>>>> 3d42ba51d29469245da40f8f79e64f94c428c5e6

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: envConfig.CLIENT_ORIGINS,
        credentials: true,
    }),
);
app.use(morgan('combined')); //  Logging middleware for better debugging

app.use('/api/auth', authRoutes);
<<<<<<< HEAD
app.use('/api/vendors', vendorsRoutes);
app.use('/api', activityLogRoutes);
=======
app.use('/api/categories', categoriesRoutes);
>>>>>>> 3d42ba51d29469245da40f8f79e64f94c428c5e6

export default app;
