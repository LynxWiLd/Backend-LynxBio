import express from "express";
import { 
    register, login, getPublicProfile, updateSettings, getMe 
} from "../controllers/authController.js"; 
import auth from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js'; // 1. Importá el config de Cloudinary

const router = express.Router();

router.post("/register", register);
router.post("/login", login); 
router.get('/me', auth, getMe);
router.get('/profile/:username', getPublicProfile);
router.put('/settings', auth, updateSettings);

// 2. AGREGÁ ESTA RUTA PARA EL AVATAR
router.post('/upload-avatar', auth, upload.single('image'), async (req, res) => {
    try {
        // req.file.path es la URL que nos da Cloudinary
        res.json({ url: req.file.path });
    } catch (err) {
        res.status(500).json({ msg: 'Error al subir a Cloudinary' });
    }
});

export default router;