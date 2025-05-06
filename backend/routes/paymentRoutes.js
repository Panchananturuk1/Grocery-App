const express = require('express');
const router = express.Router();
// Will connect controller functions later

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private
router.post('/create-order', (req, res) => {
  res.json({ message: 'Create Razorpay order endpoint' });
});

// @route   POST /api/payments/verify
// @desc    Verify payment
// @access  Private
router.post('/verify', (req, res) => {
  res.json({ message: 'Verify payment endpoint' });
});

// @route   POST /api/payments/webhook
// @desc    Razorpay webhook
// @access  Public
router.post('/webhook', (req, res) => {
  res.json({ message: 'Razorpay webhook endpoint' });
});

module.exports = router; 