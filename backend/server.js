require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Routes
const propertiesRouter = require('./routes/properties');
const leadsRouter = require('./routes/leads');
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3001;

const morgan = require('morgan');
const helmet = require('helmet');

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging (Grug likes logs)
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', // Allow configuration
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Servir uploads estaticamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/properties', propertiesRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Grug backend is alive! 🦖' });
});

// Error handler (Grug style - simples!)
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Algo deu errado! Grug vai investigar.' });
});

app.listen(PORT, () => {
    console.log(`🦖 Grug backend rodando na porta ${PORT}`);
    console.log(`📍 http://localhost:${PORT}/api/health`);
});
