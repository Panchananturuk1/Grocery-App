const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  forgotPassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/users
// @desc    Register a user
// @access  Public
router.post('/', registerUser);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateUserProfile);

// @route   POST /api/users/address
// @desc    Add new address
// @access  Private
router.post('/address', protect, addAddress);

// @route   PUT /api/users/address/:id
// @desc    Update address
// @access  Private
router.put('/address/:id', protect, updateAddress);

// @route   DELETE /api/users/address/:id
// @desc    Delete address
// @access  Private
router.delete('/address/:id', protect, deleteAddress);

// @route   POST /api/users/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', forgotPassword);

module.exports = router; 