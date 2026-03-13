import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    // 1. Leer el token del header
    const token = req.header('x-auth-token');

    // 2. Revisar si no hay token
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }

    // 3. Validar el token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Añadimos el ID del usuario decodificado al objeto request (req)
        // para que cualquier ruta protegida sepa quién está operando.
        req.userId = decoded.userId;
        
        next(); // ¡Todo bien! Pasa a la siguiente función
    } catch (err) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};

export default auth;