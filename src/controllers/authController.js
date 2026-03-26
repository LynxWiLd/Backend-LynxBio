import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwt.js"; 

// 🪄 CONSTANTE MAESTRA - Identidad visual de LynxBio
const DEFAULT_AVATAR = "https://res.cloudinary.com/dqlm5tnhk/image/upload/v1773873679/IconProfile_hoxpyj.svg";

/**
 * --- FUNCIÓN AUXILIAR: LIMPIEZA DE RASTRO BLINDADA ---
 * Extrae el Public ID de Cloudinary y elimina el archivo físico.
 */
const deleteOldImage = async (url) => {
  // 1. Filtro de seguridad: No borramos si es null, si no es de Cloudinary o si es el default
  if (!url || !url.includes("res.cloudinary.com") || url === DEFAULT_AVATAR) {
    console.log("ℹ️ Omisión de borrado: URL externa o predeterminada.");
    return;
  }

  try {
    // 🪄 EXTRACCIÓN PRO: Buscamos el nombre de la carpeta configurada
    const folderName = "lynxbio_uploads";
    const parts = url.split(`${folderName}/`);

    if (parts.length < 2) {
      console.warn("⚠️ URL no pertenece a la carpeta de uploads. Omitiendo destroy.");
      return;
    }

    // 🛡️ FIX SENIOR: Buscamos el último punto para quitar SOLO la extensión (evita fallos si hay puntos en el nombre)
    const fileWithExtension = parts[1];
    const lastDotIndex = fileWithExtension.lastIndexOf(".");
    const publicIdWithoutExt = lastDotIndex !== -1 
      ? fileWithExtension.substring(0, lastDotIndex) 
      : fileWithExtension;

    const publicId = `${folderName}/${publicIdWithoutExt}`;

    console.log(`🚀 Intentando borrar en Cloudinary: [${publicId}]`);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      console.log("✅ Rastro eliminado con éxito de Cloudinary.");
    } else {
      console.warn("⚠️ Cloudinary no encontró el archivo o ya fue borrado:", result);
    }
  } catch (err) {
    console.error("❌ Error crítico al limpiar en Cloudinary:", err);
  }
};

/**
 * --- REGISTRO DE USUARIO ---
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: "El lince ya existe (email o username ocupado)." });
    }

    user = new User({
      username,
      email,
      password,
      profile: { avatarUrl: DEFAULT_AVATAR, bio: "" },
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const token = generateToken({ userId: user.id });

    res.status(201).json({
      token,
      username: user.username,
      msg: "¡Bienvenido a la manada!",
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

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: "Credenciales inválidas. Revisá tu rastro." });
    }

    // Fix preventivo para usuarios migrados
    if (!user.profile.avatarUrl) {
      user.profile.avatarUrl = DEFAULT_AVATAR;
      await user.save();
    }

    const token = generateToken({ userId: user.id });

    res.json({
      token,
      username: user.username,
      profile: user.profile,
      theme: user.theme,
      socials: user.socials,
    });
  } catch (err) {
    console.error("Error en Login:", err);
    res.status(500).json({ msg: "Error en el servidor al iniciar sesión." });
  }
};

/**
 * --- OBTENER MI PROPIO PERFIL (getMe) ---
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
    const { type } = req.body; // 'avatar' o 'background'

    // Identificamos el rastro viejo para borrarlo de Cloudinary
    const oldUrl = type === "avatar" ? user.profile.avatarUrl : user.theme.backgroundImage;
    
    // 🪄 Limpieza asíncrona pero esperada
    if (oldUrl) await deleteOldImage(oldUrl);

    res.json({ url: req.file.path });
  } catch (err) {
    console.error("Error en uploadImage:", err);
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

    if (type === "avatar") {
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
    res.status(500).json({ msg: "Error al resetear rastro visual." });
  }
};