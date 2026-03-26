import jwt from "jsonwebtoken";

/**
 * Genera un rastro digital (Token) seguro para el usuario.
 * @param {Object} payload - Datos mínimos (ID, rol, etc.) - NUNCA PASSWORDS.
 * @returns {string} Token firmado.
 */
export const generateToken = (payload) => {
  // 🛡️ Seguridad: Usamos una clave secreta desde .env
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error("⚠️ JWT_SECRET no definido en las variables de entorno.");
  }

  // 🪄 Firmamos el token con una expiración razonable (ej. 7 días)
  return jwt.sign(payload, secret, {
    expiresIn: "7d", 
  });
};

/**
 * Verifica si un rastro (Token) es auténtico y no ha expirado.
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Si el token expiró o es falso, devolvemos null
    return null;
  }
};