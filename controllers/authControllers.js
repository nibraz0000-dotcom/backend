import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import User from '../models/userModel.js';
import nodemailer from 'nodemailer';
import { protect } from '../middleware/authMiddleware.js';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: errors.array()[0].msg 
            });
        }

        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists with this email' 
            });
        }

        const user = await User.create({
            name,
            email,
            password
        });

        if (user) {
            res.status(201).json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ 
                success: false,
                message: 'Invalid user data' 
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration: ' + error.message 
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: errors.array()[0].msg 
            });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide email and password' 
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        const isPasswordCorrect = await user.matchPassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login: ' + error.message 
        });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { email } = req.body;

        // Must select +password so required validation passes on save()
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');

        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        try {
            const transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            const mailOptions = {
                from: `"Book Store" <${process.env.EMAIL_FROM}>`,
                to: email,
                subject: 'Password Reset Request - Book Store',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; text-align: center;">
                            <h2 style="color: #4a5568; margin-bottom: 20px;">Password Reset Request</h2>
                            <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">You requested a password reset. Click the button below to reset your password:</p>
                            <a href="${resetUrl}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-size: 16px;">Reset Password</a>
                            <p style="color: #718096; font-size: 14px; margin-top: 20px;">This link will expire in <strong>10 minutes</strong>.</p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                            <p style="color: #a0aec0; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);

            res.json({
                success: true,
                message: 'Password reset link has been sent to ' + email,
                email: email
            });
        } catch (emailError) {
            console.error('Email error:', emailError);
            
            // Check if email config is set up properly
            const emailConfigured = 
                process.env.EMAIL_USER && 
                !process.env.EMAIL_USER.includes('your-email') && 
                process.env.EMAIL_PASSWORD && 
                !process.env.EMAIL_PASSWORD.includes('your-16') &&
                process.env.EMAIL_PASSWORD.length >= 8;

            if (!emailConfigured) {
                // Email not configured - provide clear guidance
                return res.json({
                    success: true,
                    message: 'Password reset link could not be emailed. Please configure Gmail credentials in backend/.env (EMAIL_USER, EMAIL_PASSWORD).',
                    resetToken: resetToken,
                    email: email
                });
            }

            // Only return token in development
            const isDev = process.env.NODE_ENV !== 'production';
            res.json({
                success: true,
                message: isDev 
                    ? 'Password reset link could not be sent. Check server console for demo token.'
                    : 'Password reset link could not be sent. Please try again later.',
                ...(isDev && { resetToken: resetToken }),
                email: email
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid or expired reset token' 
            });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful',
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
};