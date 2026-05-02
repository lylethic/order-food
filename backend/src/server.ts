import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { setupSwagger } from './swagger.js';
import { sendResponse } from './utils/response.js';
import apiRouter from './controllers/index.js';

const app = express();
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

// Serve uploaded static files at /uploads/*
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Swagger UI — http://localhost:3001/api/docs
setupSwagger(app);

// Use the Master Router with the version prefix
app.use('/api/v1', apiRouter);

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

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${FRONTEND_URL}`);
});
