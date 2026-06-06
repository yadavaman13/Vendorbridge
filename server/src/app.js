import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import envConfig from './config/envConfig.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

const isLocalDevOrigin = (origin) =>
    typeof origin === 'string' &&
    /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin);

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin(origin, callback) {
            if (!origin || envConfig.isAllowedClientOrigin(origin) || isLocalDevOrigin(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`), false);
        },
        credentials: true,
        optionsSuccessStatus: 200,
    }),
);
app.use(morgan('combined')); //  Logging middleware for better debugging

app.use('/api/auth', authRoutes);

export default app;
