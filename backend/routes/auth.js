const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Login (Grug gosta: simples e funcional!)
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password obrigatórios' });
        }

        // Buscar usuário
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar senha
        const validPassword = bcrypt.compareSync(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gerar token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Token válido por 7 dias
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name || user.username
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro no login' });
    }
});

// Criar primeiro usuário admin (usar APENAS UMA VEZ!)
router.post('/setup', (req, res) => {
    try {
        // Verificar se já existe usuário
        const existingUser = db.prepare('SELECT COUNT(*) as count FROM users').get();

        if (existingUser.count > 0) {
            return res.status(400).json({ error: 'Usuário admin já existe!' });
        }

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password obrigatórios' });
        }

        // Hash da senha
        const passwordHash = bcrypt.hashSync(password, 10);

        // Inserir usuário
        const insert = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        insert.run(username, passwordHash);

        res.json({ message: 'Admin criado com sucesso! 🦖' });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: 'Erro ao criar admin' });
    }
});

module.exports = router;
