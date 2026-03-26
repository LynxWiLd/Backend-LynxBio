import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from 'cloudinary';
import { generateToken } from "../utils/jwt.js"; // 🪄 Tu nueva herramienta de rastro

// 🪄 CONSTANTE MAESTRA - Identidad visual de LynxBio
const DEFAULT_AVATAR = "https://res.cloudinary.com/dqlm5tnhk/image/upload/v1773873679/IconProfile_hoxpyj.svg";

/**
 * --- FUNCIÓN AUXILIAR: LIMPIEZA DE HUELLAS ---
 * Borra imágenes de Cloudinary para no saturar el storage.
 */
const deleteOldImage = async (url) => {
  if (!url || !url.includes("cloudinary") || url === DEFAULT_AVATAR) return;
  
  try {
    const parts = url.split('/');
    // Extraemos el folder/public_id (ej: "avatars/nombre_archivo")
    const folderAndId = parts.slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(folderAndId);
    console.log("Rastro borrado de Cloudinary:", folderAndId);
  } catch (err) {
    console.error("Error al limpiar rastro en Cloudinary:", err);
  }
};

/**
 * --- REGISTRO DE USUARIO ---
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 🛡️ Validación: No duplicados
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: "El lince ya existe (email o username ocupado)." });
    }

    user = new User({ 
      username, 
      email, 
      password,
      profile: { avatarUrl: DEFAULT_AVATAR, bio: "" }
    });

    // Hash de seguridad
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    // 🪄 Tokenización
    const token = generateToken({ userId: user.id });

    res.status(201).json({ 
      token, 
      username: user.username,
      msg: "¡Bienvenido a la manada!" 
    });
  } catch (err) {
    console.error("Error en Register:", err);
    res.status(500).json({ msg: "Error al registrar rastro digital." });
  }
};

/**
 * --- LOGIN DE USUARIO ---
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscamos al lince
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: "Credenciales inválidas. Revisá tu rastro." });
    }

    // Fix preventivo para usuarios sin avatar
    if (!user.profile.avatarUrl) {
      user.profile.avatarUrl = DEFAULT_AVATAR;
      await user.save();
    }

    // 🪄 Tokenización
    const token = generateToken({ userId: user.id });

    res.json({ 
      token, 
      username: user.username, 
      profile: user.profile, 
      theme: user.theme, 
      socials: user.socials 
    });
  } catch (err) {
    console.error("Error en Login:", err);
    res.status(500).json({ msg: "Error en el servidor al iniciar sesión." });
  }
};

/**
 * --- OBTENER MI PROPIO PERFIL ---
 * (Requiere Middleware de Protección)
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ msg: "Lince no encontrado." });

    if (user.profile && !user.profile.avatarUrl) {
      user.profile.avatarUrl = DEFAULT_AVATAR;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener datos de la manada." });
  }
};

/**
 * --- OBTENER PERFIL PÚBLICO ---
 * (Sin protección - Para que cualquiera vea el LynxBio)
 */
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select("profile theme links socials username");
    
    if (!user) return res.status(404).json({ msg: "Este rastro no existe." });

    if (!user.profile.avatarUrl) user.profile.avatarUrl = DEFAULT_AVATAR;

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener el rastro público." });
  }
};

/**
 * --- ACTUALIZAR CONFIGURACIÓN ---
 */
export const updateSettings = async (req, res) => {
  try {
    const { profile, theme, socials } = req.body;

    // Mantenemos el rastro default si el usuario borra la URL
    if (profile && !profile.avatarUrl) {
      profile.avatarUrl = DEFAULT_AVATAR;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { profile, theme, socials } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado." });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error al guardar tu nueva facha." });
  }
};

/**
 * --- SUBIR IMAGEN CON LIMPIEZA ---
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No se subió ninguna imagen." });
    
    const user = await User.findById(req.userId);
    const { type } = req.body; // 'avatar' o 'bg'

    // Limpiamos la imagen anterior antes de asignar la nueva
    const oldUrl = type === 'avatar' ? user.profile.avatarUrl : user.theme.backgroundImage;
    if (oldUrl) await deleteOldImage(oldUrl);

    // Devolvemos el path que nos da Multer-Cloudinary
    res.json({ url: req.file.path });
  } catch (err) {
    res.status(500).json({ msg: "Error al gestionar el rastro visual." });
  }
};

/**
 * --- REMOVER IMAGEN Y ASIGNAR DEFAULT ---
 */
export const removeImage = async (req, res) => {
  try {
    const { type } = req.body; 
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ msg: "Lince no encontrado." });

    if (type === 'avatar') {
      await deleteOldImage(user.profile.avatarUrl);
      user.profile.avatarUrl = DEFAULT_AVATAR;
    } else {
      if (user.theme.backgroundImage) {
        await deleteOldImage(user.theme.backgroundImage);
      }
      user.theme.backgroundImage = "";
    }

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error al resetear imagen." });
  }
};