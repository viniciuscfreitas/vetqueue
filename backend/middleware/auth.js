const jwt = require('jsonwebtoken');

// Middleware de autenticação (Grug style - simples!)
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Token inválido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token expirado ou inválido' });
    }
}

// Alias to keep existing import names
const requireAuth = authenticateToken;

module.exports = { requireAuth, authenticateToken };
