'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiArrowRight } from 'react-icons/fi';
import MainLayout from '@/components/layout/MainLayout';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const { cartItems, loading, updateQuantity, removeFromCart, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    setUpdatingItem(cartItemId);
    try {
      await updateQuantity(cartItemId, newQuantity);
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    setRemovingItem(cartItemId);
    try {
      await removeFromCart(cartItemId);
    } finally {
      setRemovingItem(null);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      router.push('/login?redirect=cart');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    router.push('/checkout');
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Shopping Cart</h1>

          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b">
                    <div className="h-24 w-24 bg-gray-200 rounded"></div>
                    <div className="flex-grow">
                      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
              <div className="flex justify-center mb-4">
                <FiShoppingCart className="text-gray-400 text-6xl" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Looks like you haven&apos;t added any products to your cart yet.
              </p>
              <Link
                href="/products"
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 inline-block"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Cart Items */}
              <div className="lg:w-2/3">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="border-b pb-4 mb-4 hidden md:flex">
                    <div className="w-2/5 font-semibold text-gray-600">Product</div>
                    <div className="w-1/5 font-semibold text-gray-600">Price</div>
                    <div className="w-1/5 font-semibold text-gray-600">Quantity</div>
                    <div className="w-1/5 font-semibold text-gray-600 text-right">Total</div>
                  </div>

                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row md:items-center py-4 border-b"
                    >
                      <div className="md:w-2/5 mb-4 md:mb-0">
                        <div className="flex items-center">
                          <div className="relative w-16 h-16 mr-4">
                            <Image
                              src={item.product?.image_url || '/images/product-placeholder.jpg'}
                              alt={item.product?.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/products/${item.product_id}`}
                              className="text-gray-800 font-medium hover:text-green-600"
                            >
                              {item.product?.name}
                            </Link>
                            {item.product?.stock < 1 && (
                              <p className="text-red-500 text-xs mt-1">Out of stock</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="md:w-1/5 mb-4 md:mb-0">
                        <span className="md:hidden text-gray-600 mr-2">Price:</span>
                        <span className="text-gray-800">₹{item.product?.price}</span>
                      </div>
                      <div className="md:w-1/5 mb-4 md:mb-0">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            disabled={item.quantity <= 1 || updatingItem === item.id}
                          >
                            <FiMinus size={16} />
                          </button>
                          <span className="mx-2 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            disabled={
                              item.quantity >= item.product?.stock || updatingItem === item.id
                            }
                          >
                            <FiPlus size={16} />
                          </button>
                        </div>
                        {updatingItem === item.id && (
                          <span className="text-xs text-gray-500">Updating...</span>
                        )}
                      </div>
                      <div className="md:w-1/5 flex justify-between md:justify-end items-center">
                        <div className="text-right">
                          <span className="md:hidden text-gray-600 mr-2">Total:</span>
                          <span className="text-gray-800 font-medium">
                            ₹{(item.product?.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 ml-4"
                          disabled={removingItem === item.id}
                        >
                          {removingItem === item.id ? (
                            <span className="text-xs">Removing...</span>
                          ) : (
                            <FiTrash2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-6">
                  <Link
                    href="/products"
                    className="text-green-600 hover:text-green-700 flex items-center"
                  >
                    <FiArrowRight className="mr-2 rotate-180" /> Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h2>
                  
                  <div className="mb-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-800">₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    {totalPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-800">₹{(totalPrice * 0.05).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-800">Total</span>
                        <span className="text-gray-800">
                          ₹{(totalPrice + (totalPrice > 0 ? totalPrice * 0.05 : 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 flex items-center justify-center"
                    disabled={cartItems.length === 0 || loading}
                  >
                    Proceed to Checkout <FiArrowRight className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 