const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { supabase } = require('../config/supabase');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          is_admin: false,
        },
      ])
      .select();

    if (error) {
      console.error('Error creating user:', error);
      return res.status(400).json({ message: 'Invalid user data' });
    }

    if (newUser) {
      res.status(201).json({
        id: newUser[0].id,
        name: newUser[0].name,
        email: newUser[0].email,
        isAdmin: newUser[0].is_admin,
        token: generateToken(newUser[0].id),
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const { data: user, error } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // User is attached to req from middleware
    const user = req.user;
    
    if (user) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password } = req.body;

    // Get current user data
    const { data: user, error } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare update data
    const updateData = {
      name: name || user.name,
      email: email || user.email,
    };

    // If password is being updated, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Update user
    const { data: updatedUser, updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(400).json({ message: 'Update failed' });
    }

    res.json({
      id: updatedUser[0].id,
      name: updatedUser[0].name,
      email: updatedUser[0].email,
      isAdmin: updatedUser[0].is_admin,
      token: generateToken(updatedUser[0].id),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add address
// @route   POST /api/users/address
// @access  Private
const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { address_line, city, state, pincode, type } = req.body;

    if (!address_line || !city || !state || !pincode || !type) {
      return res.status(400).json({ message: 'Please fill all address fields' });
    }

    // Add address
    const { data: newAddress, error } = await supabase
      .from('addresses')
      .insert([
        {
          user_id: userId,
          address_line,
          city,
          state,
          pincode,
          type,
        },
      ])
      .select();

    if (error) {
      console.error('Address creation error:', error);
      return res.status(400).json({ message: 'Could not add address' });
    }

    res.status(201).json(newAddress[0]);
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update address
// @route   PUT /api/users/address/:id
// @access  Private
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    const { address_line, city, state, pincode, type } = req.body;

    // Verify the address belongs to the user
    const { data: existingAddress } = await supabase
      .from('addresses')
      .select()
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (!existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Prepare update data
    const updateData = {
      address_line: address_line || existingAddress.address_line,
      city: city || existingAddress.city,
      state: state || existingAddress.state,
      pincode: pincode || existingAddress.pincode,
      type: type || existingAddress.type,
    };

    // Update address
    const { data: updatedAddress, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Address update error:', error);
      return res.status(400).json({ message: 'Could not update address' });
    }

    res.json(updatedAddress[0]);
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete address
// @route   DELETE /api/users/address/:id
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    // Verify the address belongs to the user
    const { data: existingAddress } = await supabase
      .from('addresses')
      .select()
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (!existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Delete address
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      console.error('Address deletion error:', error);
      return res.status(400).json({ message: 'Could not delete address' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!user) {
      // For security reasons, always return success even if email not found
      return res.json({ message: 'Password reset link sent if email exists' });
    }

    // In a real application, send email with reset link
    // Here we'll just return a success message
    
    res.json({ message: 'Password reset link sent if email exists' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  forgotPassword,
}; 