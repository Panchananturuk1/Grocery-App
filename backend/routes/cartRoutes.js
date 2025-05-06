const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/cart
// @desc    Get user cart
// @access  Private
router.get('/', protect, getCart);

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', protect, addToCart);

// @route   PUT /api/cart/:id
// @desc    Update cart item quantity
// @access  Private
router.put('/:id', protect, updateCartItem);

// @route   DELETE /api/cart/:id
// @desc    Remove item from cart
// @access  Private
router.delete('/:id', protect, removeFromCart);

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', protect, clearCart);

module.exports = router; 