import express from "express";
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

export default router;
