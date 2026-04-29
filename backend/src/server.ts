import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import healthRouter from './routes/health.js';
import categoriesRouter from './routes/categories.js';
import menuItemsRouter from './routes/menuItems.js';
import ordersRouter from './routes/orders.js';
import roleRouter from './routes/role.js';
import userRouter from './routes/user.js';
import { setupSwagger } from './swagger.js';
import { sendResponse } from './utils/response.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Swagger UI — http://localhost:3001/api/docs
setupSwagger(app);

// API Routes
app.use('/api/v1', authRouter);
app.use('/api/v1', healthRouter);
app.use('/api/v1', categoriesRouter);
app.use('/api/v1', menuItemsRouter);
app.use('/api/v1', ordersRouter);
app.use('/api/v1', roleRouter);
app.use('/api/v1', userRouter);

// 404 handler for unknown API routes
app.use('/api/v1/*', (_req, res) => {
  sendResponse(res, {
    success: false,
    status_code: 404,
    message: 'Không tìm thấy API endpoint',
    message_en: 'API endpoint not found',
    errors: ['API endpoint not found'],
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${FRONTEND_URL}`);
});
