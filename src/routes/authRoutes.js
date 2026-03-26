import express from "express";
import { 
    register, 
    login, 
    getPublicProfile, 
    updateSettings, 
    getMe,
    uploadImage, 
    removeImage 
} from "../controllers/authController.js"; 

// 🛡️ Middleware de protección - Corregido a importación por defecto
import protect from '../middleware/auth.js'; 
import { upload } from '../config/cloudinary.js';

const router = express.Router();

/**
 * ==========================================
 * 1. RUTAS PÚBLICAS
 * ==========================================
 */
router.post("/register", register);
router.post("/login", login); 
router.get('/profile/:username', getPublicProfile);

/**
 * ==========================================
 * 2. RUTAS PRIVADAS (Requieren Token)
 * ==========================================
 */
router.get('/me', protect, getMe);
router.put('/settings', protect, updateSettings);

/* --- 🖼️ GESTIÓN DE IMÁGENES --- */

// Subir avatar o fondo (usa multer + cloudinary y luego tu controlador)
router.post('/upload-avatar', protect, upload.single('image'), uploadImage);

// Resetear imagen al default
router.post('/remove-image', protect, removeImage);

export default router;