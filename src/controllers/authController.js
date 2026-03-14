import User from "../models/User.js"; // El .js es obligatorio aquí
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Verificar si el usuario o email ya existen
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: "El usuario o email ya existe" });
    }

    // 2. Crear instancia del usuario
    user = new User({ username, email, password });

    // 3. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Guardar en DB
    await user.save();

    // 5. Crear el Token (JWT)
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error en el servidor");
  }
};
// Agrega "login" a tus exports en src/controllers/authController.js
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Verificar si el usuario existe
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    // 2. Comparar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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
      profile: user.profile, // Mandamos esto para que el front sepa qué mostrar
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error en el servidor");
  }
};
// Buscamos un usuario por su username para mostrar su página pública
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    // Buscamos solo los datos necesarios (nombre, bio, links, perfil, redes)
    const user = await User.findOne({ username }).select(
      "profile theme links socials username",
    );

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json(user);
  } catch (err) {
    res.status(500).send("Error al obtener el perfil");
  }
};
// Agrega esta función a authController.js
export const updateSettings = async (req, res) => {
  try {
    // 👇 AGREGÁ ESTA LÍNEA PARA DEBUGEAR
    console.log("Datos recibidos en el backend:", req.body);

    const { profile, theme, socials } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { profile, theme, socials },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json(user);
  } catch (err) {
    console.error("Error al actualizar settings:", err);
    res.status(500).json({ msg: "Error al guardar la configuración" });
  }
};
export const getMe = async (req, res) => {
  try {
    // Buscamos al usuario por el ID que el middleware 'auth' puso en req.userId
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json(user);
  } catch (err) {
    res.status(500).send("Error al obtener datos del usuario");
  }
};
