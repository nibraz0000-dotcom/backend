import { createBook, allBook, searchBook, findBook, updateBook, deleteBook } from "../controllers/bookControllers.js";
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";


const router = express.Router();

// Admin only - create book
router.post("/", protect, adminOnly, (req, res, next) => {
  req.upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }
    next()
  })
}, createBook);

// Public - get all books
router.get("/", allBook);

// Public - search books
router.get("/search", searchBook);

// Public - get one book
router.get("/:id", findBook)

// Admin only - update book
router.put("/:id", protect, adminOnly, (req, res, next) => {
  req.upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }
    next()
  })
}, updateBook);

// Admin only - delete book
router.delete("/:id", protect, adminOnly, deleteBook);



export default router;