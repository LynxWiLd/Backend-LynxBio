import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    // 1. Leer el token (se mantiene igual)
    const token = req.header('x-auth-token');

    // 2. Revisar si no hay token
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }

    try {
        // 3. Validar y extraer el userId directamente con destructuring
        const { userId } = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Inyectar en el request
        req.userId = userId;
        
        next(); 
    } catch (err) {
        // 💡 Tip extra: Si el token expiró, jwt.verify tira un error específico.
        // Por ahora, este 401 genérico está perfecto para seguridad.
        res.status(401).json({ msg: 'Token no es válido o ha expirado' });
    }
};

export default auth;