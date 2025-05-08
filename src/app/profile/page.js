'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiCalendar, FiEdit, FiSave, FiPhone, FiHome, FiMapPin, FiLoader, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import supabase from '../../utils/supabase';
import MainLayout from '../../components/layout/MainLayout';
import toastManager from '../../utils/toast-manager';
import ClientWrapper from '../../components/ClientWrapper';
import DatabaseErrorPage from '../../components/DatabaseErrorPage';
import Link from 'next/link';

// This is the actual component that uses useAuth
function ProfileContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [editingField, setEditingField] = useState(null);
  const { user, isAuthenticated, authInitialized } = useAuth();
  const { isInitializing, isInitialized, hasError } = useData();
  const router = useRouter();

  const fetchProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get profile data from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If the error is that no rows were returned, create a profile
        if (error.code === 'PGRST116') {
          console.log("No profile found, creating new profile");
          try {
            // Create a basic profile with available user data
            const newProfile = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              created_at: new Date().toISOString()
            };
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(newProfile);
              
            if (insertError) {
              throw insertError;
            }
            
            // Use the newly created profile data
            setUserData(newProfile);
            setFullName(newProfile.full_name);
            setPhoneNumber('');
            setAddress('');
            setCity('');
            setState('');
            setPincode('');
          } catch (insertErr) {
            console.error("Error creating profile:", insertErr);
            setError("Failed to create user profile");
            // Use metadata as fallback
            setFullName(user?.user_metadata?.full_name || '');
          }
        } else {
          console.error("Error fetching profile:", error);
          setError("Failed to load profile information");
          // Use metadata as fallback
          setFullName(user?.user_metadata?.full_name || '');
        }
      } else {
        // Successfully loaded profile data
        setUserData(data);
        setFullName(data?.full_name || user?.user_metadata?.full_name || '');
        setPhoneNumber(data?.phone_number || '');
        setAddress(data?.address || '');
        setCity(data?.city || '');
        setState(data?.state || '');
        setPincode(data?.pincode || '');
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setError("Failed to load profile information");
      // Use metadata as fallback
      setFullName(user?.user_metadata?.full_name || '');
    } finally {
      setLoading(false);
    }
  };

  // Check authentication and fetch profile when needed
  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !loading && authInitialized) {
      toastManager.error("Please log in to view your profile");
      router.push('/login');
      return;
    }

    // Wait for authentication to be initialized
    if (!user?.id) {
      return;
    }

    // Fetch profile data when user is authenticated and initialized
    fetchProfile();
  }, [user?.id, isAuthenticated]);

  // Show retry button if there was an error
  const handleRetry = () => {
    fetchProfile();
  };

  const handleUpdateProfile = async (field) => {
    if (!user?.id) {
      toastManager.error("You must be logged in to update your profile");
      return;
    }
    
    setLoading(true);
    try {
      let updateData = {};
      
      // Set the appropriate field based on what's being updated
      switch(field) {
        case 'fullName':
          updateData = { full_name: fullName };
          break;
        case 'phoneNumber':
          updateData = { phone_number: phoneNumber };
          break;
        case 'address':
          updateData = { 
            address: address,
            city: city,
            state: state,
            pincode: pincode
          };
          break;
        default:
          throw new Error('Invalid field to update');
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      
      // Also update user metadata for name
      if (field === 'fullName') {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { full_name: fullName }
        });
        
        if (metadataError) {
          console.warn("Could not update auth metadata:", metadataError);
        }
      }
      
      toastManager.success('Profile updated successfully');
      setEditingField(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toastManager.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading && !userData) {
    return (
      <MainLayout>
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FiLoader className="animate-spin h-10 w-10 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error && !loading) {
    return (
      <MainLayout>
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="text-red-500 mb-4 text-5xl">
              <FiAlertCircle className="inline-block" />
            </div>
            <h2 className="text-xl font-semibold mb-4">Error Loading Profile</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center mx-auto"
            >
              <FiRefreshCw className="mr-2" /> Try Again
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Profile Information Card */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="bg-green-600 py-6 px-8">
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
            </div>
            
            <div className="p-8">
              {loading ? (
                <div className="text-center py-8">
                  <FiLoader className="animate-spin h-8 w-8 text-green-600 mx-auto mb-4" />
                  <p className="text-gray-500">Updating profile...</p>
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
                      <div className="space-y-6">
                        {/* Full Name Field */}
                        <div>
                          <h2 className="text-sm text-gray-500 mb-1">Full Name</h2>
                          {editingField === 'fullName' ? (
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                              <button
                                onClick={() => handleUpdateProfile('fullName')}
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
                                onClick={() => setEditingField('fullName')}
                                className="ml-2 text-gray-500 hover:text-green-600"
                              >
                                <FiEdit />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Email Address Field */}
                        <div>
                          <h2 className="text-sm text-gray-500 mb-1">Email Address</h2>
                          <div className="flex items-center">
                            <FiMail className="text-gray-400 mr-2" />
                            <p className="text-gray-800">{user?.email || 'Not available'}</p>
                          </div>
                        </div>
                        
                        {/* Phone Number Field */}
                        <div>
                          <h2 className="text-sm text-gray-500 mb-1">Phone Number</h2>
                          {editingField === 'phoneNumber' ? (
                            <div className="flex space-x-2">
                              <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Enter your phone number"
                              />
                              <button
                                onClick={() => handleUpdateProfile('phoneNumber')}
                                className="bg-green-600 text-white p-2 rounded-md"
                                disabled={loading}
                              >
                                <FiSave />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <FiPhone className="text-gray-400 mr-2" />
                              <p className="text-gray-800">{phoneNumber || 'Not set'}</p>
                              <button
                                onClick={() => setEditingField('phoneNumber')}
                                className="ml-2 text-gray-500 hover:text-green-600"
                              >
                                <FiEdit />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Member Since Field */}
                        <div>
                          <h2 className="text-sm text-gray-500 mb-1">Member Since</h2>
                          <div className="flex items-center">
                            <FiCalendar className="text-gray-400 mr-2" />
                            <p className="text-gray-800">
                              {user?.created_at 
                                ? new Date(user.created_at).toLocaleDateString() 
                                : userData?.created_at
                                  ? new Date(userData.created_at).toLocaleDateString()
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

          {/* Address Card */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-600 py-4 px-8">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FiMapPin className="mr-2" /> 
                Delivery Address
              </h2>
            </div>
            
            <div className="p-8">
              {loading ? (
                <div className="text-center py-4">
                  <FiLoader className="animate-spin h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-500">Loading address...</p>
                </div>
              ) : (
                <>
                  {editingField === 'address' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Street Address</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Enter your street address"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">City</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="City"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">State</label>
                          <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="State"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">PIN Code</label>
                          <input
                            type="text"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="PIN Code"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => setEditingField(null)}
                          className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateProfile('address')}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          disabled={loading}
                        >
                          Save Address
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {address ? (
                        <div className="mb-4">
                          <div className="flex items-start mb-1">
                            <FiHome className="text-gray-400 mr-2 mt-1" />
                            <div>
                              <p className="text-gray-800">{address}</p>
                              <p className="text-gray-800">{city}, {state} - {pincode}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingField('address')}
                            className="mt-3 px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 flex items-center w-auto"
                          >
                            <FiEdit className="mr-2" /> Edit Address
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-gray-500 mb-4">No address has been added yet</p>
                          <button
                            onClick={() => setEditingField('address')}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            + Add New Address
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/profile/address" className="text-green-600 hover:underline flex items-center justify-center">
              <FiMapPin className="mr-2" /> Manage multiple delivery addresses
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Export the wrapped component
export default function ProfilePage() {
  return (
    <ClientWrapper>
      <ProfileContent />
    </ClientWrapper>
  );
} 