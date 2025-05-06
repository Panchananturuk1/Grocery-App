const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/products
// @desc    Get all products with optional filtering
// @access  Public
router.get('/', getProducts);

// Note: The search route must be defined before the /:id route to avoid conflicts
// @route   GET /api/products/search/:keyword
// @desc    Search products by keyword
// @access  Public
router.get('/search/:keyword', searchProducts);

// @route   GET /api/products/:id
// @desc    Get a single product
// @access  Public
router.get('/:id', getProductById);

// @route   POST /api/products
// @desc    Create a product (Admin)
// @access  Private/Admin
router.post('/', protect, admin, createProduct);

// @route   PUT /api/products/:id
// @desc    Update a product (Admin)
// @access  Private/Admin
router.put('/:id', protect, admin, updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin)
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router; 