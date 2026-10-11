const express = require('express');
const mongoose = require('mongoose');
const FoodItem = require('../models/FoodItem');

const router = express.Router();

/**
 * Helper to verify database connectivity
 */
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

const GULAB_JAMUN_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Gulab-jamun-wallpaper-1.jpg/800px-Gulab-jamun-wallpaper-1.jpg';
const SAMOSA_IMAGE = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80';
const BUTTER_CHICKEN_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Butter_Chicken_%26_Butter_Naan_-_Home_-_Chandigarh_-_India_-_0006.jpg/800px-Butter_Chicken_%26_Butter_Naan_-_Home_-_Chandigarh_-_India_-_0006.jpg';

/**
 * Normalizes food item image URLs to ensure Gulab Jamun displays Gulab Jamun
 * and Samosa displays Samosas, automatically healing legacy seeded database records.
 */
function normalizeFoodItemImage(doc) {
  const item = doc.toObject ? doc.toObject() : { ...doc };
  if (/Gulab\s*Jamun/i.test(item.name)) {
    if (!item.image || item.image.includes('1601050690597') || !item.image.includes('Gulab-jamun')) {
      item.image = GULAB_JAMUN_IMAGE;
      FoodItem.updateOne({ _id: doc._id }, { $set: { image: GULAB_JAMUN_IMAGE } }).catch(err => {
        console.warn('Notice: Could not sync Gulab Jamun image in MongoDB:', err.message);
      });
    }
  } else if (/Samosa/i.test(item.name)) {
    if (!item.image) {
      item.image = SAMOSA_IMAGE;
    }
  } else if (/Butter\s*Chicken/i.test(item.name)) {
    if (!item.image || item.image.includes('1588166524941')) {
      item.image = BUTTER_CHICKEN_IMAGE;
      FoodItem.updateOne({ _id: doc._id }, { $set: { image: BUTTER_CHICKEN_IMAGE } }).catch(err => {
        console.warn('Notice: Could not sync Butter Chicken image in MongoDB:', err.message);
      });
    }
  }
  return item;
}

/**
 * GET /api/foods
 * Retrieve all food items from the FoodItems collection
 */
router.get('/foods', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Please verify that MongoDB is running and MONGODB_URI is properly configured.'
    });
  }

  try {
    const items = await FoodItem.find().sort({ id: 1, createdAt: 1 });
    const normalizedItems = items.map(normalizeFoodItemImage);
    res.status(200).json(normalizedItems);
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve food items from database',
      error: error.message
    });
  }
});

/**
 * GET /api/menu
 * Alias for /api/foods to maintain compatibility with script.js configuration
 */
router.get('/menu', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Please verify that MongoDB is running and MONGODB_URI is properly configured.'
    });
  }

  try {
    const items = await FoodItem.find().sort({ id: 1, createdAt: 1 });
    const normalizedItems = items.map(normalizeFoodItemImage);
    res.status(200).json(normalizedItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve menu items from database',
      error: error.message
    });
  }
});

module.exports = router;
