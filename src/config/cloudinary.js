import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lynxbio_uploads', // Nombre de carpeta más genérico
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // Sacamos el crop fijo para que los fondos no se rompan
    transformation: [{ width: 1200, crop: 'limit' }] 
  },
});

export const upload = multer({ storage: storage });