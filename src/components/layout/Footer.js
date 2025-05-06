'use client';

import Link from 'next/link';
import { FiInstagram, FiTwitter, FiFacebook, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-green-800 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">OrderKaro</h3>
            <p className="mb-4 text-gray-300">
              Your one-stop destination for fresh groceries delivered right to your doorstep.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-green-300">
                <FiInstagram size={20} />
              </a>
              <a href="#" className="text-white hover:text-green-300">
                <FiTwitter size={20} />
              </a>
              <a href="#" className="text-white hover:text-green-300">
                <FiFacebook size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/" className="hover:text-green-300">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-green-300">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-green-300">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-green-300">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-green-300">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-xl font-bold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/contact" className="hover:text-green-300">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-green-300">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-green-300">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-green-300">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-green-300">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <FiMapPin className="mr-2 mt-1" />
                <span>123 Grocery St, Food City, India</span>
              </li>
              <li className="flex items-center">
                <FiPhone className="mr-2" />
                <span>+91 1234567890</span>
              </li>
              <li className="flex items-center">
                <FiMail className="mr-2" />
                <span>hello@orderkaro.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 border-t border-green-700 text-center text-gray-300 text-sm">
          <p>&copy; {currentYear} OrderKaro. All rights reserved.</p>
          <p className="mt-2">
            Designed and developed with ❤️ for fresh grocery delivery.
          </p>
        </div>
      </div>
    </footer>
  );
} 