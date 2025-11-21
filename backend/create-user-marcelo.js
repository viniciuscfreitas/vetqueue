const db = require('./db');
const bcrypt = require('bcrypt');

const USERNAME = 'marcelo';
const PASSWORD = 'vini1234';
const NAME = 'Marcelo';

function createUserMarcelo() {
    try {
        // Verificar se já existe
        const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(USERNAME);

        if (existing) {
            console.log(`⚠️ Usuário ${USERNAME} já existe!`);
            // Atualizar senha e nome caso exista
            const hash = bcrypt.hashSync(PASSWORD, 10);
            db.prepare('UPDATE users SET password_hash = ?, name = ? WHERE username = ?').run(hash, NAME, USERNAME);
            console.log(`✅ Usuário atualizado!`);
            console.log(`👤 Username: ${USERNAME}`);
            console.log(`📝 Nome: ${NAME}`);
            console.log(`🔑 Password: ${PASSWORD}`);
            return;
        }

        const hash = bcrypt.hashSync(PASSWORD, 10);

        db.prepare('INSERT INTO users (username, password_hash, name) VALUES (?, ?, ?)').run(USERNAME, hash, NAME);

        console.log(`✅ Usuário criado com sucesso!`);
        console.log(`👤 Username: ${USERNAME}`);
        console.log(`📝 Nome: ${NAME}`);
        console.log(`🔑 Password: ${PASSWORD}`);
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
    }
}

createUserMarcelo();

