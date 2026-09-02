import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectToDB } from './database/db.js'
import router from "./routes/bookRoutes.js";
import authRouter from "./routes/authRoutes.js";

// Only load .env locally - on Vercel env vars come from the dashboard
if (!process.env.VERCEL) {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();

app.use(cors())

// Configure multer for file uploads - use memoryStorage for Vercel compatibility
// (Vercel serverless functions have a read-only filesystem except /tmp)
const storage = multer.memoryStorage()

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'))
    }
  }
})

// Make upload available to routes
app.use((req, res, next) => {
  req.upload = upload
  next()
})

app.use(express.json())

// Serve static files from public directory (works locally; on Vercel images are stored as URLs/base64)
app.use('/images', express.static(path.join(__dirname, 'public', 'images')))

// Lazy database connection middleware - connects per-request on serverless
// (no module-scope side effects that can crash function invocation)
app.use(async (req, res, next) => {
  // Skip DB connection for the health check
  if (req.path === '/') return next();
  
  try {
    await connectToDB();
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Database connection failed: ' + error.message 
    });
  }
});

app.get("/",(req,res) => {
    res.status(200).json("welcome TO Book Store")
})

app.use("/api/Books",router)
app.use("/api/auth",authRouter)

// Global error handler - prevents serverless function crashes
app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ 
    success: false,
    message: "Server error", 
    error: err.message 
  })
})

// Only listen when running locally (not on Vercel)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME
if (!isVercel) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log("==================================");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("==================================");
  });
}

// Export the app for Vercel serverless
export default app;