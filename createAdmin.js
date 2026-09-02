import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/userModel.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@bookstore.com' });
        
        if (adminExists) {
            // Ensure existing admin has the admin role
            if (adminExists.role !== 'admin') {
                adminExists.role = 'admin';
                await adminExists.save();
                console.log('Admin role updated for existing admin user!');
            }
            console.log('Admin user already exists!');
            console.log('Email: admin@bookstore.com');
            console.log('Password: Admin@123');
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@bookstore.com',
            password: 'Admin@123',
            role: 'admin'
        });

        console.log('Admin user created successfully!');
        console.log('Email: admin@bookstore.com');
        console.log('Password: Admin@123');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();