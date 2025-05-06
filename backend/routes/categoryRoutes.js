const express = require('express');
const router = express.Router();
// Will connect controller functions later

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', (req, res) => {
  res.json({ message: 'Get all categories endpoint' });
});

// @route   GET /api/categories/:id
// @desc    Get a single category
// @access  Public
router.get('/:id', (req, res) => {
  res.json({ message: `Get category with ID: ${req.params.id}` });
});

// @route   GET /api/categories/:id/products
// @desc    Get products by category
// @access  Public
router.get('/:id/products', (req, res) => {
  res.json({ message: `Get products for category ID: ${req.params.id}` });
});

// @route   POST /api/categories
// @desc    Create a category (Admin)
// @access  Private/Admin
router.post('/', (req, res) => {
  res.json({ message: 'Create category endpoint (Admin)' });
});

// @route   PUT /api/categories/:id
// @desc    Update a category (Admin)
// @access  Private/Admin
router.put('/:id', (req, res) => {
  res.json({ message: `Update category with ID: ${req.params.id} (Admin)` });
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category (Admin)
// @access  Private/Admin
router.delete('/:id', (req, res) => {
  res.json({ message: `Delete category with ID: ${req.params.id} (Admin)` });
});

module.exports = router; 