// src/app.ts
import express from 'express';
import bodyParser from 'body-parser';
import adminRouter from './routes/adminRoutes';
import userRouter from './routes/userRoutes';

const app = express();

// Middleware
app.use(bodyParser.json()); 

// Routes
app.use('/admin', adminRouter);
app.use('/user', userRouter);

export default app;
