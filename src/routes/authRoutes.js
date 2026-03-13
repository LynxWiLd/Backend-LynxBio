import express from "express";
import { register, login } from "../controllers/authController.js"; // Agregamos login
import auth from '../middleware/auth.js';

const router = express.Router();

router.post("/register", register);
router.post("/login", login); // Nueva ruta de login
router.get('/profile/:username', getPublicProfile);
router.put('/settings', auth, updateSettings);
// Recordá importar 'auth' si no está
router.get('/me', auth, getMe);
export default router;
