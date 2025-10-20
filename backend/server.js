// /backend/server.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import journalRoutes from "./routes/journalRoutes.js" // Will add later

dotenv.config();

const port = process.env.PORT || 5000;

connectDB(); // Connect to MongoDB

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // React app origin
    credentials: true, // Allow cookies to be sent
}));
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
app.use(cookieParser()); // Middleware to parse cookies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/journals', journalRoutes); // Future routes

app.get('/', (req, res) => res.send('Server is ready'));

// Custom Error Handler (for simplicity)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

app.listen(port, () => console.log(`Server running on port ${port}`));