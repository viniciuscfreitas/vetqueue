const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/leads - Listar todos os leads (protegido)
router.get('/', requireAuth, (req, res) => {
    try {
        const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
        res.json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Erro ao buscar leads' });
    }
});

// POST /api/leads - Criar lead (público - vem do site)
router.post('/', (req, res) => {
    try {
        const { name, phone, property_id, property_title, type } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ error: 'Nome e telefone obrigatórios' });
        }

        const insert = db.prepare(`
      INSERT INTO leads (name, phone, property_id, property_title, type)
      VALUES (?, ?, ?, ?, ?)
    `);

        const result = insert.run(
            name,
            phone,
            property_id || null,
            property_title || null,
            type || 'gate'
        );

        const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json(newLead);
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ error: 'Erro ao criar lead' });
    }
});

// DELETE /api/leads/:id - Deletar lead (protegido)
router.delete('/:id', requireAuth, (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);

        if (!existing) {
            return res.status(404).json({ error: 'Lead não encontrado' });
        }

        db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);

        res.json({ message: 'Lead deletado com sucesso!' });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ error: 'Erro ao deletar lead' });
    }
});

module.exports = router;
