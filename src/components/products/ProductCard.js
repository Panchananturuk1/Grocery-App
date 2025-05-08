'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingCart, FiAlertCircle } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-hot-toast';

export default function ProductCard({ product }) {
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    
    if (product.stock < 1) {
      toast.error('This product is out of stock');
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await addToCart(product, 1);
      if (success) {
        toast.success(`${product.name} added to cart!`);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback image - using a reliable placeholder service
  const fallbackImage = 'https://via.placeholder.com/300x200/f3f4f6/000000?text=Product+Image';

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col h-full transition-shadow hover:shadow-md">
      <Link href={`/products/${product.id}`} className="block flex-grow">
        <div className="relative h-40 mb-4">
          <Image
            src={product.image_url || fallbackImage}
            alt={product.name}
            fill
            className="object-cover rounded-md"
            unoptimized={!product.image_url || product.image_url.startsWith('http')}
          />
          {product.stock < 1 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
              <div className="bg-red-500 text-white py-1 px-3 rounded-full text-sm font-semibold flex items-center">
                <FiAlertCircle className="mr-1" /> Out of Stock
              </div>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-black mb-1 line-clamp-2">{product.name}</h3>
      </Link>
      
      <div className="mt-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700">{product.categories?.name}</span>
          <span className="font-bold text-green-600">₹{product.price}</span>
        </div>
        
        <button
          onClick={handleAddToCart}
          className={`w-full py-2 rounded-md flex items-center justify-center transition-colors ${
            product.stock < 1
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          disabled={isLoading || product.stock < 1}
        >
          {isLoading ? (
            <span className="animate-pulse">Adding...</span>
          ) : product.stock < 1 ? (
            'Out of Stock'
          ) : (
            <>
              <FiShoppingCart className="mr-2" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
} 