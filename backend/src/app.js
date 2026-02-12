const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const { CORS_ORIGIN } = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const facultyRoutes = require('./routes/faculty.routes');
const followsRoutes = require('./routes/follows.routes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Health check route
app.get('/health', (req, res) => { res.json({status: 'OK',timestamp: new Date().toISOString() });});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/follows', followsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
