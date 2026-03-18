import express from "express";
import { 
    register, 
    login, 
    getPublicProfile, 
    updateSettings, 
    getMe,
    uploadImage, // 🪄 Importamos la lógica de subida con limpieza
    removeImage  // 🪄 Importamos el reseteo al IconProfile
} from "../controllers/authController.js"; 
import auth from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// --- RUTAS DE AUTENTICACIÓN ---
router.post("/register", register);
router.post("/login", login); 
router.get('/me', auth, getMe);

// --- RUTAS DE PERFIL Y CONFIGURACIÓN ---
router.get('/profile/:username', getPublicProfile);
router.put('/settings', auth, updateSettings);

// --- 🖼️ GESTIÓN DE IMÁGENES (AVATAR Y FONDO) ---

/**
 * SUBIR IMAGEN
 * Usamos el middleware 'upload.single' para procesar el archivo
 * y luego 'uploadImage' para limpiar la imagen vieja en Cloudinary.
 */
router.post('/upload-avatar', auth, upload.single('image'), uploadImage);

/**
 * REMOVER IMAGEN
 * Esta ruta resetea el avatar al 'IconProfile' oficial 
 * y borra la imagen personalizada de Cloudinary para ahorrar espacio.
 */
router.post('/remove-image', auth, removeImage);

export default router;