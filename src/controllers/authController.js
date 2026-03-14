import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// --- REGISTRO DE USUARIO ---
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log("Intentando registrar a:", email);

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: "El usuario o email ya existe" });
    }

    user = new User({ username, email, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({ token, username: user.username });
  } catch (err) {
    console.error("Error en Register:", err);
    res.status(500).json({ msg: "Error al registrar usuario" });
  }
};

// --- LOGIN DE USUARIO ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Intento de login para:", email);

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

    // IMPORTANTE: Devolvemos todo el objeto theme para que el Dashboard lo tenga al entrar
    res.json({
      token,
      username: user.username,
      profile: user.profile,
      theme: user.theme, // Aquí ya viajan backgroundImage y textColor
      socials: user.socials,
    });
  } catch (err) {
    console.error("Error en Login:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// --- OBTENER PERFIL PÚBLICO (Para la PublicPage) ---
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    // Seleccionamos theme para que traiga el fondo y el color de texto
    const user = await User.findOne({ username }).select(
      "profile theme links socials username"
    );

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json(user);
  } catch (err) {
    console.error("Error en getPublicProfile:", err);
    res.status(500).json({ msg: "Error al obtener el perfil" });
  }
};

// --- ACTUALIZAR CONFIGURACIÓN (Privado) ---
export const updateSettings = async (req, res) => {
  try {
    console.log("Datos recibidos para actualizar:", req.body);

    const { profile, theme, socials } = req.body;

    // Actualizamos y pedimos que nos devuelva el documento nuevo ({new: true})
    const user = await User.findByIdAndUpdate(
      req.userId,
      { 
        $set: { profile, theme, socials } // Usamos $set para asegurar una actualización limpia
      },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json(user);
  } catch (err) {
    console.error("Error en updateSettings:", err);
    res.status(500).json({ msg: "Error al guardar la configuración" });
  }
};

// --- OBTENER MI PROPIO PERFIL (Para el Dashboard) ---
export const getMe = async (req, res) => {
  try {
    // Traemos todo menos el password
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json(user);
  } catch (err) {
    console.error("Error en getMe:", err);
    res.status(500).json({ msg: "Error al obtener datos del usuario" });
  }
};