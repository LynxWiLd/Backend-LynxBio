import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// --- REGISTRO DE USUARIO ---
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log("Intentando registrar a:", email);

    // 1. Verificar si el usuario o email ya existen
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: "El usuario o email ya existe" });
    }

    // 2. Crear instancia del usuario
    user = new User({ username, email, password });

    // 3. Encriptar contraseña
    // (Asegurate de que en models/User.js NO tengas un pre-save que vuelva a encriptar)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Guardar en DB
    await user.save();
    console.log("Usuario guardado exitosamente");

    // 5. Crear el Token (JWT)
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

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

    // 1. Verificar si el usuario existe
    let user = await User.findOne({ email });
    if (!user) {
      console.log("Login fallido: Email no encontrado");
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    // 2. Comparar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("¿La contraseña coincide?:", isMatch);

    if (!isMatch) {
      console.log("Login fallido: Contraseña incorrecta");
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    // 3. Si es correcto, crear y enviar el Token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      username: user.username,
      profile: user.profile,
      theme: user.theme,
      socials: user.socials,
    });
  } catch (err) {
    console.error("Error en Login:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// --- OBTENER PERFIL PÚBLICO (Sin Token) ---
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select(
      "profile theme links socials username",
    );

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json(user);
  } catch (err) {
    console.error("Error en getPublicProfile:", err);
    res.status(500).send("Error al obtener el perfil");
  }
};

// --- ACTUALIZAR CONFIGURACIÓN (Privado) ---
export const updateSettings = async (req, res) => {
  try {
    console.log("Datos recibidos para actualizar:", req.body);

    const { profile, theme, socials } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { profile, theme, socials },
      { new: true, runValidators: true },
    );

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json(user);
  } catch (err) {
    console.error("Error en updateSettings:", err);
    res.status(500).json({ msg: "Error al guardar la configuración" });
  }
};

// --- OBTENER MI PROPIO PERFIL (Privado) ---
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json(user);
  } catch (err) {
    console.error("Error en getMe:", err);
    res.status(500).send("Error al obtener datos del usuario");
  }
};
