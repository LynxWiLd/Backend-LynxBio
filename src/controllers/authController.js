import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from 'cloudinary';

// 🪄 LA CONSTANTE MAESTRA
const DEFAULT_AVATAR = "https://res.cloudinary.com/dqlm5tnhk/image/upload/v1773873679/IconProfile_hoxpyj.svg";

// --- FUNCIÓN AUXILIAR PARA BORRAR EN CLOUDINARY ---
const deleteOldImage = async (url) => {
  // 🔒 SEGURIDAD: Si la URL es la predeterminada, NO la borramos
  if (!url || !url.includes("cloudinary") || url === DEFAULT_AVATAR) return;
  
  try {
    const parts = url.split('/');
    const folderAndId = parts.slice(-2).join('/').split('.')[0];
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

    user = new User({ 
      username, 
      email, 
      password,
      /* 🪄 Seteamos el avatar por defecto desde el nacimiento del usuario */
      profile: {
        avatarUrl: DEFAULT_AVATAR,
        bio: ""
      }
    });

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

// --- OBTENER PERFIL PÚBLICO ---
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select("profile theme links socials username");
    
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    // 🪄 REFUERZO: Si por alguna razón el avatar está vacío, mandamos el default
    if (!user.profile.avatarUrl) {
      user.profile.avatarUrl = DEFAULT_AVATAR;
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener el perfil" });
  }
};

// --- ACTUALIZAR CONFIGURACIÓN ---
export const updateSettings = async (req, res) => {
  try {
    const { profile, theme, socials } = req.body;

    // 🪄 Si el usuario intenta guardar un perfil con avatar vacío, le volvemos a poner el default
    if (profile && !profile.avatarUrl) {
      profile.avatarUrl = DEFAULT_AVATAR;
    }

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
    
    // 🪄 REFUERZO para usuarios viejos que no tengan avatar
    if (user && user.profile && !user.profile.avatarUrl) {
      user.profile.avatarUrl = DEFAULT_AVATAR;
    }

    res.json(user);
  } catch (err) {
    res.status(500).send("Error al obtener datos");
  }
};

// --- SUBIR IMAGEN CON LIMPIEZA ---
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No se subió ninguna imagen" });

    const user = await User.findById(req.userId);
    const { type } = req.body; 

    const oldUrl = type === 'avatar' ? user.profile.avatarUrl : user.theme.backgroundImage;

    // 🔒 deleteOldImage ya sabe que no tiene que borrar si es el DEFAULT_AVATAR
    if (oldUrl) {
      await deleteOldImage(oldUrl);
    }

    res.json({ url: req.file.path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al gestionar la imagen" });
  }
};