const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  id: {
    type: Number
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Item price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Item quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  itemTotal: {
    type: Number,
    default: function() {
      return (this.price || 0) * (this.quantity || 1);
    }
  }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    sparse: true
  },
  customer: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true
    },
    notes: {
      type: String,
      default: null
    }
  },
  items: {
    type: [OrderItemSchema],
    validate: {
      validator: function(items) {
        return Array.isArray(items) && items.length > 0;
      },
      message: 'Order must contain at least one food item'
    }
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: [true, 'Total amount is required']
    }
  },
  totalAmount: {
    type: Number
  },
  paymentMethod: {
    type: String,
    default: 'Cash on Delivery'
  },
  status: {
    type: String,
    default: 'Order Received'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'Orders'
});

// Pre-save hook to ensure orderId and totalAmount are synchronised
OrderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'QS-' + Math.floor(100000 + Math.random() * 900000);
  }
  if (!this.totalAmount && this.pricing && this.pricing.total != null) {
    this.totalAmount = this.pricing.total;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema, 'Orders');
