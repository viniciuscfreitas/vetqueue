const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/properties - Listar todas as propriedades (público)
router.get('/', (req, res) => {
    try {
        // Ordenar: featured primeiro, depois por data
        const properties = db.prepare('SELECT * FROM properties ORDER BY featured DESC, created_at DESC').all();

        // Parser tags de JSON string para array
        const parsedProperties = properties.map(prop => ({
            ...prop,
            tags: prop.tags ? JSON.parse(prop.tags) : [],
            featured: prop.featured === 1 // Converter INTEGER para boolean
        }));

        res.json(parsedProperties);
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ error: 'Erro ao buscar imóveis' });
    }
});

// GET /api/properties/:id - Buscar uma propriedade
router.get('/:id', (req, res) => {
    try {
        const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);

        if (!property) {
            return res.status(404).json({ error: 'Imóvel não encontrado' });
        }

        property.tags = property.tags ? JSON.parse(property.tags) : [];
        property.featured = property.featured === 1;
        res.json(property);
    } catch (error) {
        console.error('Error fetching property:', error);
        res.status(500).json({ error: 'Erro ao buscar imóvel' });
    }
});

// POST /api/properties - Criar propriedade (protegido)
router.post('/', requireAuth, (req, res) => {
    try {
        const { title, subtitle, price, image, bairro, tipo, specs, tags, featured } = req.body;

        // Validação básica
        if (!title || !price || !bairro || !tipo) {
            return res.status(400).json({ error: 'Campos obrigatórios: title, price, bairro, tipo' });
        }

        // Inserir no banco
        const insert = db.prepare(`
      INSERT INTO properties (title, subtitle, price, image, bairro, tipo, specs, tags, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const result = insert.run(
            title,
            subtitle || null,
            price,
            image || null,
            bairro,
            tipo,
            specs || null,
            tags ? JSON.stringify(tags) : null,
            featured ? 1 : 0
        );

        // Buscar o imóvel criado
        const newProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(result.lastInsertRowid);
        newProperty.tags = newProperty.tags ? JSON.parse(newProperty.tags) : [];
        newProperty.featured = newProperty.featured === 1;

        res.status(201).json(newProperty);
    } catch (error) {
        console.error('Error creating property:', error);
        res.status(500).json({ error: 'Erro ao criar imóvel' });
    }
});

// PUT /api/properties/:id - Atualizar propriedade (protegido)
router.put('/:id', requireAuth, (req, res) => {
    try {
        const { title, subtitle, price, image, bairro, tipo, specs, tags, featured } = req.body;

        // Verificar se existe
        const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Imóvel não encontrado' });
        }

        // Atualizar
        const update = db.prepare(`
      UPDATE properties
      SET title = ?, subtitle = ?, price = ?, image = ?, bairro = ?, tipo = ?, specs = ?, tags = ?, featured = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

        update.run(
            title,
            subtitle || null,
            price,
            image || null,
            bairro,
            tipo,
            specs || null,
            tags ? JSON.stringify(tags) : null,
            featured ? 1 : 0,
            req.params.id
        );

        // Retornar atualizado
        const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
        updated.tags = updated.tags ? JSON.parse(updated.tags) : [];
        updated.featured = updated.featured === 1;

        res.json(updated);
    } catch (error) {
        console.error('Error updating property:', error);
        res.status(500).json({ error: 'Erro ao atualizar imóvel' });
    }
});

// PATCH /api/properties/:id/featured - Toggle featured (protegido, limite 4)
router.patch('/:id/featured', requireAuth, (req, res) => {
    try {
        const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);

        if (!property) {
            return res.status(404).json({ error: 'Imóvel não encontrado' });
        }

        const currentFeatured = property.featured === 1;
        const newFeatured = !currentFeatured;

        // Se está marcando como featured, verificar se já existem 4
        if (newFeatured) {
            const featuredCount = db.prepare('SELECT COUNT(*) as count FROM properties WHERE featured = 1').get();
            if (featuredCount.count >= 4) {
                return res.status(400).json({ error: 'Limite de 4 imóveis na Curadoria da Semana atingido. Desmarque um imóvel primeiro.' });
            }
        }

        // Atualizar
        db.prepare('UPDATE properties SET featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
            newFeatured ? 1 : 0,
            req.params.id
        );

        // Retornar atualizado
        const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
        updated.tags = updated.tags ? JSON.parse(updated.tags) : [];
        updated.featured = updated.featured === 1;

        res.json(updated);
    } catch (error) {
        console.error('Error toggling featured:', error);
        res.status(500).json({ error: 'Erro ao atualizar curadoria' });
    }
});

// DELETE /api/properties/:id - Deletar propriedade (protegido)
router.delete('/:id', requireAuth, (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);

        if (!existing) {
            return res.status(404).json({ error: 'Imóvel não encontrado' });
        }

        db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);

        res.json({ message: 'Imóvel deletado com sucesso! 🦖' });
    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({ error: 'Erro ao deletar imóvel' });
    }
});

module.exports = router;
