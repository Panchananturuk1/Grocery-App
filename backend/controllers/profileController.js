const { supabase } = require('../config/supabase');

// @desc    Get user addresses
// @route   GET /api/profile/addresses
// @access  Private
const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      return res.status(400).json({ message: 'Error fetching addresses' });
    }

    res.json(addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user order history
// @route   GET /api/profile/orders
// @access  Private
const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get orders with order items
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_price,
        payment_status,
        order_status,
        created_at,
        order_items:order_items (
          id,
          product_id,
          product_name,
          price,
          quantity
        ),
        addresses:address_id (
          id, 
          address_line, 
          city, 
          state, 
          pincode
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(400).json({ message: 'Error fetching order history' });
    }

    // Format the response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      totalPrice: order.total_price,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
      createdAt: order.created_at,
      address: order.addresses,
      items: order.order_items
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get order details
// @route   GET /api/profile/orders/:id
// @access  Private
const getOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    // Get order with details
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_price,
        payment_status,
        payment_id,
        order_status,
        created_at,
        order_items:order_items (
          id,
          product_id,
          product_name,
          price,
          quantity
        ),
        addresses:address_id (
          id, 
          address_line, 
          city, 
          state, 
          pincode,
          type
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error || !order) {
      console.error('Error fetching order:', error);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Format the response
    const formattedOrder = {
      id: order.id,
      totalPrice: order.total_price,
      paymentStatus: order.payment_status,
      paymentId: order.payment_id,
      orderStatus: order.order_status,
      createdAt: order.created_at,
      address: order.addresses,
      items: order.order_items
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add a new address
// @route   POST /api/profile/addresses
// @access  Private
const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { address_line, city, state, pincode, type } = req.body;

    if (!address_line || !city || !state || !pincode || !type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Add address
    const { data: address, error } = await supabase
      .from('addresses')
      .insert([
        {
          user_id: userId,
          address_line,
          city,
          state,
          pincode,
          type
        }
      ])
      .select();

    if (error) {
      console.error('Error adding address:', error);
      return res.status(400).json({ message: 'Error adding address' });
    }

    res.status(201).json(address[0]);
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an address
// @route   PUT /api/profile/addresses/:id
// @access  Private
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    const { address_line, city, state, pincode, type } = req.body;

    // Verify address belongs to user
    const { data: existingAddress, error: findError } = await supabase
      .from('addresses')
      .select()
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (findError || !existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Update address
    const { data: updatedAddress, error } = await supabase
      .from('addresses')
      .update({
        address_line: address_line || existingAddress.address_line,
        city: city || existingAddress.city,
        state: state || existingAddress.state,
        pincode: pincode || existingAddress.pincode,
        type: type || existingAddress.type,
        updated_at: new Date()
      })
      .eq('id', addressId)
      .select();

    if (error) {
      console.error('Error updating address:', error);
      return res.status(400).json({ message: 'Error updating address' });
    }

    res.json(updatedAddress[0]);
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an address
// @route   DELETE /api/profile/addresses/:id
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    // Verify address belongs to user
    const { data: existingAddress, error: findError } = await supabase
      .from('addresses')
      .select()
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (findError || !existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Delete address
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      console.error('Error deleting address:', error);
      return res.status(400).json({ message: 'Error deleting address' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserAddresses,
  getOrderHistory,
  getOrderDetails,
  addAddress,
  updateAddress,
  deleteAddress
}; 