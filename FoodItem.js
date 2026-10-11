const mongoose = require('mongoose');

const FoodItemSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Food item description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  categoryLabel: {
    type: String,
    default: function() {
      // Map category code to human-readable label if omitted
      const map = {
        biryani: 'Biryani & Rice',
        curry: 'Main Curries',
        fastfood: 'Fast Food',
        southindian: 'South Indian',
        desserts: 'Desserts & Drinks'
      };
      return map[this.category] || this.category;
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 1,
    max: 5
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  }
}, {
  timestamps: true,
  collection: 'FoodItems'
});

module.exports = mongoose.model('FoodItem', FoodItemSchema, 'FoodItems');
