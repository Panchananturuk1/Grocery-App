const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, is_admin')
        .eq('id', decoded.id)
        .single();

      if (error || !data) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      req.user = data;
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      res.json({
        message: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    res.status(401);
    res.json({
      message: 'Not authorized, no token',
    });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(401);
    res.json({
      message: 'Not authorized as an admin',
    });
  }
};

module.exports = { protect, admin }; 