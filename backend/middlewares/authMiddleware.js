// /backend/middlewares/authMiddleware.js

import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/UserModel.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Check for the JWT token in cookies
    token = req.cookies.jwt; 

    if (token) {
        try {
            // 2. Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Find the user associated with the token (excluding password)
            req.user = await User.findById(decoded.userId).select('-password');

            next(); // Proceed to the route handler
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

export { protect };