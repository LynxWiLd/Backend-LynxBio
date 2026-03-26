import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  // 1. Buscamos el rastro (token)
  // Soportamos el estándar Bearer y tu x-auth-token original
  const authHeader = req.headers.authorization;
  const token = req.header('x-auth-token') || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  // 2. Revisar si no hay token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      msg: 'No hay rastro digital (token), acceso denegado.' 
    });
  }

  try {
    // 3. Validar y extraer el userId
    // Usamos el secreto de la manada para descifrar el rastro
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Inyectar en el request
    // Es vital que este nombre coincida con lo que esperan tus controllers
    req.userId = decoded.userId;
    
    next(); 
  } catch (err) {
    // 💡 TIP DE SENIOR: Diferenciamos el error para mejorar la UX del lince
    const isExpired = err.name === 'TokenExpiredError';
    
    console.error(`[AUTH ERROR]: ${err.message}`);

    res.status(401).json({ 
      success: false,
      msg: isExpired ? 'Tu rastro ha expirado. Iniciá sesión de nuevo.' : 'Rastro inválido o corrupto.',
      expired: isExpired // El frontend puede usar esto para redirigir al Login
    });
  }
};

export default auth;