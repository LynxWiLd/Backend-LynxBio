import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from 'cloudinary'; // Importante para borrar

// --- FUNCIÓN AUXILIAR PARA BORRAR EN CLOUDINARY ---
// Extrae el ID público de la URL: "https://.../folder/image_id.jpg" -> "folder/image_id"
const deleteOldImage = async (url) => {
  if (!url || !url.includes("cloudinary")) return;
  try {
    const parts = url.split('/');
    const folderAndId = parts.slice(-2).join('/').split('.')[0]; // saca "folder/id"
    await cloudinary.uploader.destroy(folderAndId);
    console.log("Imagen eliminada de Cloudinary:", folderAndId);
  } catch (err) {
    console.error("Error al borrar en Cloudinary:", err);
  }
};

// --- REGISTRO DE USUARIO ---
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) return res.status(400).json({ msg: "El usuario o email ya existe" });

    user = new User({ username, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ msg: "Error al registrar usuario" });
  }
};

// --- LOGIN DE USUARIO ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, username: user.username, profile: user.profile, theme: user.theme, socials: user.socials });
  } catch (err) {
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// --- OBTENER PERFIL PÚBLICO ---
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select("profile theme links socials username");
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener el perfil" });
  }
};

// --- ACTUALIZAR CONFIGURACIÓN ---
export const updateSettings = async (req, res) => {
  try {
    const { profile, theme, socials } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { profile, theme, socials } },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error al guardar" });
  }
};

// --- OBTENER MI PROPIO PERFIL ---
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).send("Error al obtener datos");
  }
};

// --- NUEVA: SUBIR IMAGEN CON LIMPIEZA ---
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No se subió ninguna imagen" });

    const user = await User.findById(req.userId);
    const { type } = req.body; // 'avatar' o 'bg'

    // 1. Identificamos qué borrar
    const oldUrl = type === 'avatar' ? user.profile.avatarUrl : user.theme.backgroundImage;

    // 2. Borramos la vieja si existe
    if (oldUrl) {
      await deleteOldImage(oldUrl);
    }

    // 3. Devolvemos la nueva URL (req.file.path la genera multer-storage-cloudinary)
    res.json({ url: req.file.path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al gestionar la imagen" });
  }
};