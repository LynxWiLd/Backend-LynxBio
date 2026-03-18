import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from 'cloudinary';

// 🪄 LA CONSTANTE MAESTRA - Tu SVG de Cloudinary
const DEFAULT_AVATAR = "https://res.cloudinary.com/dqlm5tnhk/image/upload/v1773873679/IconProfile_hoxpyj.svg";

// --- FUNCIÓN AUXILIAR PARA BORRAR EN CLOUDINARY ---
const deleteOldImage = async (url) => {
  // 🔒 SEGURIDAD: Si la URL es la predeterminada o no es de Cloudinary, NO la borramos
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
      profile: {
        avatarUrl: DEFAULT_AVATAR, // Nace con el IconProfile
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

// --- LOGIN DE USUARIO ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    // Si el login es exitoso pero no tiene avatar por alguna razón (usuario viejo)
    if (!user.profile.avatarUrl) {
      user.profile.avatarUrl = DEFAULT_AVATAR;
      await user.save();
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

    // Refuerzo visual
    if (!user.profile.avatarUrl) user.profile.avatarUrl = DEFAULT_AVATAR;

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener el perfil" });
  }
};

// --- ACTUALIZAR CONFIGURACIÓN ---
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
    if (oldUrl) await deleteOldImage(oldUrl);

    res.json({ url: req.file.path });
  } catch (err) {
    res.status(500).json({ msg: "Error al gestionar la imagen" });
  }
};

// --- 🪄 NUEVA: REMOVER IMAGEN Y ASIGNAR DEFAULT ---
export const removeImage = async (req, res) => {
  try {
    const { type } = req.body; // 'avatar' o 'bg'
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    if (type === 'avatar') {
      const oldUrl = user.profile.avatarUrl;
      // Borramos de Cloudinary si no es el default
      await deleteOldImage(oldUrl);
      // Seteamos de vuelta el rastro original
      user.profile.avatarUrl = DEFAULT_AVATAR;
    } else {
      // Si es fondo, limpiamos de Cloudinary y vaciamos el campo
      if (user.theme.backgroundImage) {
        await deleteOldImage(user.theme.backgroundImage);
      }
      user.theme.backgroundImage = "";
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al resetear imagen" });
  }
};