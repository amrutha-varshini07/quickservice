const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const foodRoutes = require('./routes/foodRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`QuickServe backend running on port ${PORT}`);
});
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Setup
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB successfully.');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
    });
} else {
  console.log('Notice: MONGODB_URI environment variable is not defined. Database routes will return 503 until configured.');
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = !MONGODB_URI 
    ? 'not_configured' 
    : (mongoose.connection.readyState === 1 ? 'connected' : 'disconnected');

  res.status(200).json({
    status: 'ok',
    message: 'QuickServe backend is running successfully',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api', foodRoutes);
app.use('/api', orderRoutes);

// Global 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`QuickServe backend server running on http://localhost:${PORT}`);
});

