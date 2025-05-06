import Image from 'next/image';

export default function Home() {
  // Sample products data - in a real app this would come from your API
  const featuredProducts = [
    {
      id: 1,
      name: 'Fresh Organic Apples',
      price: 120,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6',
      category: 'Fruits',
    },
    {
      id: 2,
      name: 'Fresh Carrots',
      price: 50,
      image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37',
      category: 'Vegetables',
    },
    {
      id: 3,
      name: 'Whole Wheat Bread',
      price: 35,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
      category: 'Bakery',
    },
    {
      id: 4,
      name: 'Organic Milk',
      price: 60,
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b',
      category: 'Dairy',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">OrderKaro</h1>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-green-600 font-medium">Home</a>
            <a href="#" className="text-gray-600 hover:text-green-600 font-medium">Products</a>
            <a href="#" className="text-gray-600 hover:text-green-600 font-medium">Categories</a>
            <a href="#" className="text-gray-600 hover:text-green-600 font-medium">About</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button className="text-gray-600 hover:text-green-600 relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="bg-gradient-to-r from-green-600 to-green-400 text-white rounded-lg p-8 shadow-md">
            <h1 className="text-4xl font-bold mb-4">Fresh Groceries Delivered to Your Doorstep</h1>
            <p className="text-xl mb-6">Order your daily essentials from OrderKaro and get them delivered within hours!</p>
            <button className="bg-white text-green-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition">
              Shop Now
            </button>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                <div className="relative h-40 mb-4">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{product.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{product.category}</span>
                  <span className="font-bold text-green-600">₹{product.price}</span>
                </div>
                <button className="w-full py-2 mt-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-yellow-100 p-6 rounded-lg text-center hover:shadow-md transition cursor-pointer">
              <h3 className="font-semibold text-lg">Fruits</h3>
            </div>
            <div className="bg-green-100 p-6 rounded-lg text-center hover:shadow-md transition cursor-pointer">
              <h3 className="font-semibold text-lg">Vegetables</h3>
            </div>
            <div className="bg-blue-100 p-6 rounded-lg text-center hover:shadow-md transition cursor-pointer">
              <h3 className="font-semibold text-lg">Dairy</h3>
            </div>
            <div className="bg-red-100 p-6 rounded-lg text-center hover:shadow-md transition cursor-pointer">
              <h3 className="font-semibold text-lg">Bakery</h3>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white p-8 mt-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">OrderKaro</h3>
              <p className="text-gray-300">Fresh groceries delivered to your doorstep with ease and convenience.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Home</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Products</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Help</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">FAQs</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Shipping</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Returns</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Payment Methods</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <address className="text-gray-300 not-italic">
                <p>123 Shopping Street</p>
                <p>Mumbai, Maharashtra</p>
                <p>India - 400001</p>
                <p className="mt-2">Email: support@orderkaro.com</p>
                <p>Phone: +91 9876543210</p>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p>&copy; {new Date().getFullYear()} OrderKaro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
