'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { FiMail, FiLock, FiLoader } from 'react-icons/fi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { login, loading } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await login(email, password);
    if (result.success) {
      router.push('/');
    }
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 text-white py-4 px-6">
              <h2 className="text-2xl font-bold">Login to Your Account</h2>
              <p className="text-green-100">Welcome back to OrderKaro!</p>
            </div>

            <form onSubmit={handleSubmit} className="py-6 px-8">
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className={`w-full pl-10 pr-3 py-2 border ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    className={`w-full pl-10 pr-3 py-2 border ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 border-gray-300 rounded text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-green-600 hover:text-green-500"
                >
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" /> Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-green-600 hover:text-green-500">
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 