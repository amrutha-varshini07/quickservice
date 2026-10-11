const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const foodRoutes = require('./routes/foodRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB successfully.');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
    });
} else {
  console.log('MONGODB_URI is not configured.');
}

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'QuickServe backend is running successfully',
    database: mongoose.connection.readyState === 1
      ? 'connected'
      : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', foodRoutes);
app.use('/api', orderRoutes);

// API 404 Handler
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Start Server ONCE
app.listen(PORT, '0.0.0.0', () => {
  console.log(`QuickServe backend running on port ${PORT}`);
});