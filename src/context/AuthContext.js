import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabase';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for active session on load
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session?.user) {
          // Get additional user data from our custom users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userError) throw userError;

          setUser({
            ...session.user,
            name: userData.name,
            isAdmin: userData.is_admin,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session check error:', error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth change listener
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Get additional user data from our custom users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (!userError) {
          setUser({
            ...session.user,
            name: userData.name,
            isAdmin: userData.is_admin,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Register a new user
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      // Custom API endpoint for registration
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        name,
        email,
        password,
      });

      const { token } = response.data;
      
      // Login after successful registration
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get additional user data from our API
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
        email,
        password,
      });

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error(error.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      toast.success('Password reset link sent to your email');
      return { success: true };
    } catch (error) {
      toast.error(error.message || 'Password reset failed');
      return { success: false, error: error.message || 'Password reset failed' };
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      return { success: true };
    } catch (error) {
      toast.error(error.message || 'Password update failed');
      return { success: false, error: error.message || 'Password update failed' };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    try {
      if (!user) throw new Error('You must be logged in to update your profile');

      // Update user info through our custom API
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      setUser(prev => ({
        ...prev,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
      }));

      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile update failed');
      return { success: false, error: error.response?.data?.message || 'Profile update failed' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 