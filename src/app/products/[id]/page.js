'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import supabase from '@/utils/supabase';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-hot-toast';
import {
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiArrowLeft,
  FiLoader,
  FiAlertCircle,
} from 'react-icons/fi';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        if (!params.id) return;

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*, categories(*)')
          .eq('id', params.id)
          .single();

        if (productError) throw productError;
        if (!productData) {
          toast.error('Product not found');
          return router.push('/products');
        }

        setProduct(productData);

        // Fetch related products from the same category
        if (productData.category_id) {
          const { data: relatedData, error: relatedError } = await supabase
            .from('products')
            .select('*, categories(name)')
            .eq('category_id', productData.category_id)
            .neq('id', productData.id)
            .limit(4);

          if (!relatedError) {
            setRelatedProducts(relatedData || []);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params.id, router]);

  const handleQuantityChange = (value) => {
    const newQuantity = Math.max(1, Math.min(product?.stock || 10, value));
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    if (!product || product.stock < 1) {
      toast.error('This product is out of stock');
      return;
    }

    setAddingToCart(true);
    try {
      const success = await addToCart(product, quantity);
      if (success) {
        toast.success(`${product.name} added to cart!`);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/2 h-96 bg-gray-200 rounded"></div>
              <div className="lg:w-1/2">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
                <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
                <div className="h-12 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you are looking for doesn&apos;t exist.</p>
          <Link
            href="/products"
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Back to Products
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center text-sm text-gray-500">
              <Link href="/" className="hover:text-green-600">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/products" className="hover:text-green-600">
                Products
              </Link>
              <span className="mx-2">/</span>
              <Link
                href={`/categories/${product.category_id}`}
                className="hover:text-green-600"
              >
                {product.categories?.name}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-700">{product.name}</span>
            </nav>
          </div>

          {/* Back Button */}
          <Link
            href="/products"
            className="flex items-center text-green-600 hover:text-green-700 mb-6"
          >
            <FiArrowLeft className="mr-2" /> Back to Products
          </Link>

          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Product Image */}
              <div className="lg:w-1/2">
                <div className="relative h-80 md:h-96">
                  <Image
                    src={product.image_url || '/images/product-placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-contain rounded-md"
                  />
                  {product.stock < 1 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white py-1 px-3 rounded-full text-sm font-semibold">
                      Out of Stock
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="lg:w-1/2">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
                <div className="flex items-center mb-4">
                  <Link
                    href={`/categories/${product.category_id}`}
                    className="text-green-600 hover:text-green-700"
                  >
                    {product.categories?.name}
                  </Link>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-6">₹{product.price}</div>
                
                <div className="mb-6">
                  <p className="text-gray-700">
                    {product.description || 'No description available for this product.'}
                  </p>
                </div>

                {product.stock > 0 ? (
                  <div className="text-green-600 mb-6 flex items-center">
                    <span className="inline-block w-3 h-3 bg-green-600 rounded-full mr-2"></span>
                    In Stock ({product.stock} available)
                  </div>
                ) : (
                  <div className="text-red-500 mb-6 flex items-center">
                    <FiAlertCircle className="mr-2" />
                    Out of Stock
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label htmlFor="quantity" className="block text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="bg-gray-200 text-gray-700 hover:bg-gray-300 p-2 rounded-l-md"
                      disabled={quantity <= 1 || product.stock < 1}
                    >
                      <FiMinus />
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-16 border-t border-b border-gray-300 text-center py-2"
                      disabled={product.stock < 1}
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="bg-gray-200 text-gray-700 hover:bg-gray-300 p-2 rounded-r-md"
                      disabled={quantity >= product.stock || product.stock < 1}
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className={`w-full ${
                    product.stock < 1
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white py-3 px-4 rounded-md flex items-center justify-center`}
                  disabled={addingToCart || product.stock < 1}
                >
                  {addingToCart ? (
                    <>
                      <FiLoader className="animate-spin mr-2" /> Adding to Cart...
                    </>
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
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Related Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                  >
                    <Link href={`/products/${relatedProduct.id}`}>
                      <div className="relative h-40 mb-4">
                        <Image
                          src={relatedProduct.image_url || '/images/product-placeholder.jpg'}
                          alt={relatedProduct.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">{relatedProduct.categories?.name}</span>
                        <span className="font-bold text-green-600">₹{relatedProduct.price}</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 