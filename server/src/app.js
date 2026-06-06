import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import envConfig from './config/envConfig.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import vendorsRoutes from './routes/vendors.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import activityLogRoutes from './routes/activity-log.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import purchaseOrderRoutes from './routes/purchase-order.routes.js';
import rfqsRoutes from './routes/rfqs.routes.js';
import quotationsRoutes from './routes/quotations.routes.js';

const app = express();

const isLocalDevOrigin = (origin) =>
    typeof origin === 'string' &&
    /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin);

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: envConfig.CLIENT_ORIGINS,
        credentials: true,
    }),
);
app.use(morgan('combined'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/rfqs', rfqsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api', activityLogRoutes);
app.use('/api', approvalRoutes);
app.use('/api', purchaseOrderRoutes);

export default app;
