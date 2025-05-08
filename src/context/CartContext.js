import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useDbContext } from './DatabaseContext';
import supabase from '../utils/supabase';
import toastManager from '../utils/toast-manager';
import logger from '../utils/logger';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Track initial load
  const { user, isAuthenticated } = useAuth();
  const { initialized: dbInitialized } = useDbContext();

  // Fetch cart items when user changes and database is initialized
  useEffect(() => {
    if (isAuthenticated && user && dbInitialized) {
      logger.logInfo('Database initialized, loading cart', 'cart');
      fetchCartItems(true); // Pass silent=true for initial load
    } else {
      // If user logs out, reset cart
      setCartItems([]);
    }
  }, [user, isAuthenticated, dbInitialized]);

  // Fetch cart items from database
  const fetchCartItems = async (silent = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      logger.logDebug('Fetching cart items for user', 'cart');
      
      // First fetch cart items without the relationship
      const { data: cartData, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        // Log error but only show toast if not silent
        logger.logError('Error fetching cart:', 'cart', error);
        if (!silent) {
          toastManager.error('Failed to load your cart');
        }
        return;
      }

      // If there are cart items, fetch the related products
      if (cartData && cartData.length > 0) {
        // Get unique product IDs
        const productIds = [...new Set(cartData.map(item => item.product_id))];
        
        // Fetch related products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
          
        if (productsError) {
          logger.logError('Error fetching product details:', 'cart', productsError);
          if (!silent) {
            toastManager.error('Failed to load product details');
          }
        }
        
        // Join the products to cart items in memory
        if (productsData) {
          // Create a map for quick lookup
          const productsMap = productsData.reduce((map, product) => {
            map[product.id] = product;
            return map;
          }, {});
          
          // Add product data to each cart item
          const cartItemsWithProducts = cartData.map(item => ({
            ...item,
            product: productsMap[item.product_id] || null
          }));
          
          setCartItems(cartItemsWithProducts);
        } else {
          // If we couldn't get products, just set the cart items
          setCartItems(cartData);
        }
      } else {
        // Empty cart
        setCartItems([]);
      }
      
      setInitialLoadComplete(true);
      logger.logDebug(`Cart loaded: ${cartData?.length || 0} items`, 'cart');
    } catch (error) {
      logger.logError('Error fetching cart:', 'cart', error);
      if (!silent) {
        toastManager.error('Failed to load your cart');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      toastManager.error('Please login to add items to cart');
      return false;
    }

    // Prevent operations if initial load isn't complete
    if (!initialLoadComplete) {
      logger.logDebug('Skipping add to cart - initial load not complete', 'cart');
      return false;
    }

    setLoading(true);
    try {
      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.product_id === product.id);

      if (existingItem) {
        // Update quantity instead of adding new item
        const newQuantity = existingItem.quantity + quantity;
        
        logger.logDebug(`Updating cart item quantity: ${existingItem.product_id}, new quantity: ${newQuantity}`, 'cart');
        
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

        toastManager.success('Updated quantity in cart');
      } else {
        // Add new item to cart
        logger.logDebug(`Adding new item to cart: ${product.id}`, 'cart');
        
        const { data, error } = await supabase
          .from('cart_items')
          .insert([
            {
              user_id: user.id,
              product_id: product.id,
              quantity,
            },
          ])
          .select('*');

        if (error) throw error;

        // Add product info to the new cart item manually
        const newCartItem = {
          ...data[0],
          product: product // Use the product that was passed in
        };

        // Update local state
        setCartItems(prev => [...prev, newCartItem]);
        toastManager.success('Added to cart');
      }

      return true;
    } catch (error) {
      logger.logError('Error adding to cart:', 'cart', error);
      toastManager.error('Failed to add item to cart');
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

    // Prevent operations if initial load isn't complete
    if (!initialLoadComplete) {
      logger.logDebug('Skipping update quantity - initial load not complete', 'cart');
      return false;
    }

    setLoading(true);
    try {
      logger.logDebug(`Updating cart item quantity: ${cartItemId}, quantity: ${quantity}`, 'cart');
      
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
      logger.logError('Error updating quantity:', 'cart', error);
      toastManager.error('Failed to update quantity');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId) => {
    // Prevent operations if initial load isn't complete
    if (!initialLoadComplete) {
      logger.logDebug('Skipping remove from cart - initial load not complete', 'cart');
      return false;
    }

    setLoading(true);
    try {
      logger.logDebug(`Removing item from cart: ${cartItemId}`, 'cart');
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      // Update local state
      setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
      toastManager.success('Item removed from cart');
      return true;
    } catch (error) {
      logger.logError('Error removing from cart:', 'cart', error);
      toastManager.error('Failed to remove item from cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isAuthenticated) return;

    // Prevent operations if initial load isn't complete
    if (!initialLoadComplete) {
      logger.logDebug('Skipping clear cart - initial load not complete', 'cart');
      return false;
    }

    setLoading(true);
    try {
      logger.logDebug('Clearing entire cart', 'cart');
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
      toastManager.success('Cart cleared');
      return true;
    } catch (error) {
      logger.logError('Error clearing cart:', error);
      toastManager.error('Failed to clear cart');
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
    refetch: () => fetchCartItems(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    // Return default cart context if not available
    logger.logDebug('useCart called outside CartProvider, returning default context', 'cart');
    return { 
      cartItems: [], 
      loading: false, 
      totalItems: 0, 
      totalPrice: 0,
      addToCart: async () => false,
      updateQuantity: async () => false,
      removeFromCart: async () => false,
      clearCart: async () => false,
      refetch: () => {}
    };
  }
  return context;
};

export default CartContext; 