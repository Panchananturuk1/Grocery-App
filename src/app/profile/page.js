'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiCalendar, FiEdit, FiSave } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabase';
import MainLayout from '../../components/layout/MainLayout';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [fullName, setFullName] = useState('');
  const [editing, setEditing] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Get profile data from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setUserData(data);
      setFullName(data?.full_name || user?.user_metadata?.full_name || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use user metadata as fallback
      setFullName(user?.user_metadata?.full_name || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, isAuthenticated, loading, router, fetchProfile]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated && !loading) {
    return null; // Will be redirected
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-600 py-6 px-8">
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
            </div>
            
            <div className="p-8">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading profile...</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 mb-6 md:mb-0 flex justify-center">
                      <div className="bg-gray-200 rounded-full h-32 w-32 flex items-center justify-center">
                        <FiUser className="h-16 w-16 text-gray-500" />
                      </div>
                    </div>
                    
                    <div className="w-full md:w-2/3">
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-sm text-gray-500 mb-1">Full Name</h2>
                          {editing ? (
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                              <button
                                onClick={handleUpdateProfile}
                                className="bg-green-600 text-white p-2 rounded-md"
                                disabled={loading}
                              >
                                <FiSave />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <p className="text-lg font-medium">{fullName || 'Not set'}</p>
                              <button
                                onClick={() => setEditing(true)}
                                className="ml-2 text-gray-500 hover:text-green-600"
                              >
                                <FiEdit />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h2 className="text-sm text-gray-500 mb-1">Email Address</h2>
                          <div className="flex items-center">
                            <FiMail className="text-gray-400 mr-2" />
                            <p className="text-gray-800">{user?.email || 'Not available'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h2 className="text-sm text-gray-500 mb-1">Member Since</h2>
                          <div className="flex items-center">
                            <FiCalendar className="text-gray-400 mr-2" />
                            <p className="text-gray-800">
                              {user?.created_at 
                                ? new Date(user.created_at).toLocaleDateString() 
                                : 'Not available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 