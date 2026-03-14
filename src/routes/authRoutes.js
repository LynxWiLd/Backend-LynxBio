import express from "express";
import { upload } from '../config/cloudinary.js';
// Agregamos todas las funciones que faltaban al import
import {
  register,
  login,
  getPublicProfile,
  updateSettings,
  getMe,
} from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, getMe);
router.get("/profile/:username", getPublicProfile);
router.put("/settings", auth, updateSettings);
router.post('/upload-avatar', auth, upload.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.profile.avatarUrl = req.file.path; // La URL que nos da Cloudinary
    await user.save();
    res.json({ url: req.file.path });
  } catch (err) {
    res.status(500).send('Error al subir imagen');
  }
});


export default router;
