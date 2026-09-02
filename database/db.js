import mongoose from 'mongoose';

// Cache the database connection across serverless warm starts
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDB() {
  // Return existing connection if already connected
  if (cached.conn) return cached.conn;

  // Reuse an in-progress connection attempt
  if (!cached.promise) {
    const url = process.env.MONGO_URL;

    if (!url) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(url).then((mongooseInstance) => {
      console.log('Database connected successfully');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset the promise so the next request can retry
    cached.promise = null;
    console.error('Database connection failed:', error.message);
    throw error;
  }

  return cached.conn;
}