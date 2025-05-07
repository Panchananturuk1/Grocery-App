'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import supabase from '../../utils/supabase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const router = useRouter();

  // Clear field-specific error when user types
  useEffect(() => {
    if (name && formErrors.name) {
      setFormErrors(prev => ({ ...prev, name: '' }));
    }
  }, [name]);

  useEffect(() => {
    if (email && formErrors.email) {
      setFormErrors(prev => ({ ...prev, email: '' }));
    }
  }, [email]);

  useEffect(() => {
    if (password && formErrors.password) {
      setFormErrors(prev => ({ ...prev, password: '' }));
    }
    if (password && confirmPassword && formErrors.confirmPassword) {
      validatePasswordMatch();
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword && formErrors.confirmPassword) {
      validatePasswordMatch();
    }
  }, [confirmPassword]);

  const validatePasswordMatch = () => {
    if (password !== confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    } else {
      setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
      return true;
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = { name: '', email: '', password: '', confirmPassword: '' };
    
    // Name validation
    if (!name) {
      errors.name = 'Full name is required';
      isValid = false;
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    // Email validation
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      // Try to register the user directly
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        // Provide more specific error messages based on the error
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.message.includes('already registered')) {
          errorMessage = 'This email is already registered. You may need to verify your email or reset your password.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password is too weak. Please use a stronger password with at least 6 characters.';
        } else if (error.message.toLowerCase().includes('network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        setRegisterError(errorMessage);
        toast.error(errorMessage);
        console.error('Registration error:', error);
      } else if (data && data.user) {
        console.log('User registered successfully:', data.user.id);
        
        // Create a profile entry - but don't block the registration flow if it fails
        try {
          // Wait a bit for the auth user to be fully created
          setTimeout(async () => {
            try {
              const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                email: email.trim().toLowerCase(),
                full_name: name,
                created_at: new Date().toISOString()
              });
              
              if (profileError) {
                console.error('Profile creation error (non-blocking):', profileError.message);
              } else {
                console.log('Profile created successfully');
              }
            } catch (err) {
              console.error('Error in delayed profile creation:', err);
            }
          }, 2000); // Wait 2 seconds before trying to create the profile
          
          console.log('Profile creation scheduled');
        } catch (profileErr) {
          console.error('Profile creation exception (non-blocking):', profileErr);
        }
        
        toast.success('Registration successful! Please check your email for verification and then log in.');
        router.push('/login');
      }
    } catch (err) {
      const errorMsg = err.message || 'Registration failed. Please try again.';
      setRegisterError(errorMsg);
      toast.error(errorMsg);
      console.error('Registration exception:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join OrderKaro today for the best grocery shopping experience
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {registerError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded flex items-start">
                  <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white text-gray-900`}
                    placeholder="Enter your full name"
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1" size={14} />
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white text-gray-900`}
                    placeholder="Enter your email"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1" size={14} />
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      formErrors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white text-gray-900`}
                    placeholder="Enter your password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                {formErrors.password ? (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1" size={14} />
                    {formErrors.password}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white text-gray-900`}
                    placeholder="Confirm your password"
                  />
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1" size={14} />
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
                      Sign in
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 