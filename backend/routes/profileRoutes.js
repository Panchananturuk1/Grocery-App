const express = require('express');
const router = express.Router();
const {
  getUserAddresses,
  getOrderHistory,
  getOrderDetails,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// All profile routes require authentication
router.use(protect);

// Address routes
router.get('/addresses', getUserAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

// Order history routes
router.get('/orders', getOrderHistory);
router.get('/orders/:id', getOrderDetails);

module.exports = router; 