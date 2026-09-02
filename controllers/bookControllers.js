import { Books } from "../models/bookModels.js";


export const createBook = async (req, res) => {
    try {
        // Handle image upload
        let imagePath = ""
        
        if (req.file) {
          // memoryStorage: convert buffer to base64 data URL
          const mimeType = req.file.mimetype
          const base64 = req.file.buffer.toString('base64')
          imagePath = `data:${mimeType};base64,${base64}`
        } else if (req.body.image) {
          // If no file uploaded but image URL provided in body
          imagePath = req.body.image
        }
        
        const bookData = {
          ...req.body,
          image: imagePath
        }
        
        const book = await Books.create(bookData);

        res.status(201).json({ message: "Book created successfully.", book })
        
    } catch (error) {
        res.status(500).json({ message: "Connection failed", error: error.message })
    }
}



export const allBook = async (req,res) => {
    try {
        const books = await Books.find();
        res.status(200).json(books)
    } catch (error) {
        res.status(500).json({ message: "Connection Failed", error: error.message })
    }
};

export const searchBook = async (req,res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const books = await Books.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { author: { $regex: query, $options: 'i' } }
            ]
        });

        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: "Search failed", error: error.message })
    }
};



export const findBook = async (req,res) => {
    try {

    const findBook = await Books.findById( req.params.id );

    if (findBook) {
        res.status(200).json(findBook)
    } else {
        res.status(404).json({message: "Book not found"})
    }
    
    } catch (error) {
        res.status(500).json({ message: "Connection Failed", error: error.message })
    }
};



export const updateBook = async (req,res) => {
    try {
        // Handle image upload
        let imagePath = req.body.image
        
        if (req.file) {
          // memoryStorage: convert buffer to base64 data URL
          const mimeType = req.file.mimetype
          const base64 = req.file.buffer.toString('base64')
          imagePath = `data:${mimeType};base64,${base64}`
        }
        
        const updateData = {
          ...req.body,
          image: imagePath
        }

    const updateBook = await Books.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });

    if (updateBook) {
        res.status(200).json(updateBook)
    } else {
        res.status(404).json({message: "Book not found"})
    }
    
    } catch (error) {
        res.status(500).json({ message: "Connection Failed", error: error.message })
    }
};



export const deleteBook = async (req,res) => {
    try {

    const deleteBook = await Books.findByIdAndDelete( req.params.id );

    if (deleteBook) {
        res.status(200).json({message: "Book Deleted successfully"})
    } else {
        res.status(404).json({message: "Book not found"})
    }
    
    } catch (error) {
        res.status(500).json({ message: "Connection Failed", error: error.message })
    }
};