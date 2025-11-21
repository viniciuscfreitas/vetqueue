const Database = require('better-sqlite3');
const path = require('path');

// Grug gosta: 1 arquivo SQLite, simples!
const db = new Database(path.join(__dirname, 'database.sqlite'));

// Configurar para melhor performance
db.pragma('journal_mode = WAL');

// Criar tabelas se não existirem
function initDatabase() {
    // Tabela de propriedades
    db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      price TEXT NOT NULL,
      image TEXT,
      bairro TEXT NOT NULL,
      tipo TEXT NOT NULL,
      specs TEXT,
      tags TEXT,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Migração: adicionar campo featured se não existir
    try {
        db.exec(`ALTER TABLE properties ADD COLUMN featured INTEGER DEFAULT 0`);
        console.log('✅ Migration: campo featured adicionado');
    } catch (error) {
        // Campo já existe, ignora
    }

    // Tabela de leads
    db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      property_id INTEGER,
      property_title TEXT,
      type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Tabela de usuário admin
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Migração: adicionar campo name se não existir
    try {
        db.exec(`ALTER TABLE users ADD COLUMN name TEXT`);
        console.log('✅ Migration: campo name adicionado');
    } catch (error) {
        // Campo já existe, ignora
    }

    console.log('✅ Database initialized!');
}

// Inicializar ao importar
initDatabase();

module.exports = db;
