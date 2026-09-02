import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title:{
    type:String,
    required:[true,"Book title is required"],
    trim:true 
  },  
  author:{
    type:String,
    required:true,
    trim:true 
  },
  price:{
    type: Number,
    required:true,
    min: 0
  },
  stock:{
    type: Number,
    required:true,
    min: 0
  },
  image:{
    type:String,
    default:""
  },
  createdAT:{
    type:Date,
    default:Date.now   
  }
})

export const Books = mongoose.model("Book",bookSchema)