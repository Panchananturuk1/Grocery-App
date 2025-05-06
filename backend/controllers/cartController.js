const { supabase } = require('../config/supabase');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get cart items with product details
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id, 
        quantity, 
        products:product_id (
          id, 
          name, 
          price, 
          image_url, 
          stock,
          categories:category_id (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching cart:', error);
      return res.status(400).json({ message: 'Error fetching cart' });
    }

    // Calculate total
    const total = cartItems.reduce(
      (sum, item) => sum + item.products.price * item.quantity,
      0
    );

    res.json({
      items: cartItems,
      total,
      count: cartItems.length,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists and is in stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Check if item already exists in cart
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        return res.status(400).json({ message: 'Not enough stock available' });
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity, updated_at: new Date() })
        .eq('id', existingItem.id)
        .select();

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        return res.status(400).json({ message: 'Could not update cart item' });
      }

      return res.json(updatedItem[0]);
    } else {
      // Add new item to cart
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert([
          {
            user_id: userId,
            product_id: productId,
            quantity,
          },
        ])
        .select();

      if (insertError) {
        console.error('Error adding to cart:', insertError);
        return res.status(400).json({ message: 'Could not add to cart' });
      }

      return res.status(201).json(newItem[0]);
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Check if item exists and belongs to user
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select('id, product_id')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (itemError || !cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', cartItem.product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Update quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date() })
      .eq('id', itemId)
      .select();

    if (updateError) {
      console.error('Error updating cart item:', updateError);
      return res.status(400).json({ message: 'Could not update cart item' });
    }

    res.json(updatedItem[0]);
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    // Check if item exists and belongs to user
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select()
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (itemError || !cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Delete item
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Error removing from cart:', deleteError);
      return res.status(400).json({ message: 'Could not remove from cart' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clear user's cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all cart items for user
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing cart:', error);
      return res.status(400).json({ message: 'Could not clear cart' });
    }

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
}; 