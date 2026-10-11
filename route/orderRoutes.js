const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');

const router = express.Router();

/**
 * Helper to verify database connectivity
 */
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * POST /api/orders
 * Validate and save a customer order to the Orders collection
 */
router.post('/orders', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Cannot save order without an active MongoDB connection.'
    });
  }

  try {
    const rawData = req.body || {};

    // Normalize customer details (supporting both nested & flat payload shapes)
    const customer = rawData.customer || {
      name: rawData.customerName || rawData.name,
      phone: rawData.customerPhone || rawData.phone || '',
      address: rawData.customerAddress || rawData.deliveryAddress || rawData.address,
      notes: rawData.customerNotes || rawData.notes || null
    };

    if (!customer.name || customer.name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer name. Full name must be at least 3 characters.'
      });
    }

    if (!customer.address || customer.address.trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery address. Address must be at least 8 characters.'
      });
    }

    // Validate items
    const items = rawData.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart cannot be empty. At least one item is required.'
      });
    }

    // Normalize pricing
    const pricing = rawData.pricing || {
      subtotal: rawData.subtotal || rawData.totalAmount || 0,
      deliveryFee: rawData.deliveryFee || 0,
      tax: rawData.tax || 0,
      total: rawData.totalAmount || rawData.total || 0
    };

    if (pricing.total == null || pricing.total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order total. Total amount must be greater than zero.'
      });
    }

    const orderPayload = {
      orderId: rawData.orderId || ('QS-' + Math.floor(100000 + Math.random() * 900000)),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone ? customer.phone.trim() : '',
        address: customer.address.trim(),
        notes: customer.notes ? customer.notes.trim() : null
      },
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        itemTotal: Number(item.itemTotal) || (Number(item.price) * (Number(item.quantity) || 1))
      })),
      pricing: {
        subtotal: Number(pricing.subtotal),
        deliveryFee: Number(pricing.deliveryFee) || 0,
        tax: Number(pricing.tax) || 0,
        total: Number(pricing.total)
      },
      totalAmount: Number(pricing.total),
      paymentMethod: rawData.paymentMethod || 'Cash on Delivery',
      status: rawData.status || 'Order Received',
      createdAt: rawData.createdAt ? new Date(rawData.createdAt) : new Date()
    };

    const newOrder = new Order(orderPayload);
    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order saved successfully in MongoDB Orders collection',
      order: savedOrder
    });

  } catch (error) {
    console.error('Error saving order to MongoDB:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save order to database',
      error: error.message
    });
  }
});

/**
 * GET /api/orders
 * Retrieve recent orders (for verifying saved orders)
 */
router.get('/orders', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Please verify that MongoDB is running and MONGODB_URI is properly configured.'
    });
  }

  try {
    const filter = {};
    if (req.query.phone) {
      filter['customer.phone'] = req.query.phone.trim();
    }
    if (req.query.orderId) {
      filter.orderId = req.query.orderId.trim();
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders from database',
      error: error.message
    });
  }
});

module.exports = router;
