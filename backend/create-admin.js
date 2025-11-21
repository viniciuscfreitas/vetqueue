const db = require('./db');
const bcrypt = require('bcrypt');

const USERNAME = 'admin';
const PASSWORD = 'admin123';

function createAdmin() {
    try {
        // Verificar se já existe
        const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(USERNAME);

        if (existing) {
            console.log('⚠️ Admin user already exists!');
            return;
        }

        const hash = bcrypt.hashSync(PASSWORD, 10);

        db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(USERNAME, hash);

        console.log(`✅ Admin user created!`);
        console.log(`👤 Username: ${USERNAME}`);
        console.log(`🔑 Password: ${PASSWORD}`);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    }
}

createAdmin();
