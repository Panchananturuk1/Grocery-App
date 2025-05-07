import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import supabase from '../utils/supabase';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Fetch cart items when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCartItems();
    } else {
      // If user logs out, reset cart
      setCartItems([]);
    }
  }, [user, isAuthenticated]);

  // Fetch cart items from database
  const fetchCartItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: cartData, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems(cartData);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load your cart');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return false;
    }

    setLoading(true);
    try {
      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.product_id === product.id);

      if (existingItem) {
        // Update quantity instead of adding new item
        const newQuantity = existingItem.quantity + quantity;
        
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (error) throw error;

        // Update local state
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.id === existingItem.id
              ? { ...item, quantity: newQuantity }
              : item
          )
        );

        toast.success('Updated quantity in cart');
      } else {
        // Add new item to cart
        const { data, error } = await supabase
          .from('cart_items')
          .insert([
            {
              user_id: user.id,
              product_id: product.id,
              quantity,
            },
          ])
          .select('*, product:products(*)');

        if (error) throw error;

        // Update local state
        setCartItems(prev => [...prev, data[0]]);
        toast.success('Added to cart');
      }

      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(cartItemId);
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;

      // Update local state
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === cartItemId
            ? { ...item, quantity }
            : item
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      // Update local state
      setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
      toast.success('Item removed from cart');
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
      toast.success('Cart cleared');
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Calculate cart totals
  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + (item.product?.price || 0) * item.quantity,
      0
    );
  };

  const getItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getItemsCount,
    totalItems: getItemsCount(),
    totalPrice: getCartTotal(),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    // Return default cart context if not available
    return { 
      cartItems: [], 
      loading: false, 
      totalItems: 0, 
      totalPrice: 0,
      addToCart: async () => false,
      updateQuantity: async () => false,
      removeFromCart: async () => false,
      clearCart: async () => false
    };
  }
  return context;
};

export default CartContext; 