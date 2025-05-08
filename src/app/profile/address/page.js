'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiPlus, FiEdit, FiTrash2, FiHome, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import supabase from '../../../utils/supabase';
import MainLayout from '../../../components/layout/MainLayout';
import toast from 'react-hot-toast';
import ClientWrapper from '../../../components/ClientWrapper';
import DatabaseErrorPage from '../../../components/DatabaseErrorPage';
import { useData } from '../../../context/DataContext';
import { FiLoader } from 'react-icons/fi';
import Link from 'next/link';

function AddressPageContent() {
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  
  // Form fields
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressType, setAddressType] = useState('home');
  const [isDefault, setIsDefault] = useState(false);
  
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { isInitializing, isInitialized, hasError } = useData();

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
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
      fetchAddresses();
    }
  }, [user, isAuthenticated, loading, router]);

  const resetForm = () => {
    setAddressLine('');
    setCity('');
    setState('');
    setPincode('');
    setAddressType('home');
    setIsDefault(false);
    setIsAddingAddress(false);
    setEditingAddressId(null);
  };

  const handleEditAddress = (address) => {
    setAddressLine(address.address_line);
    setCity(address.city);
    setState(address.state);
    setPincode(address.pincode);
    setAddressType(address.address_type);
    setIsDefault(address.is_default);
    setEditingAddressId(address.id);
    setIsAddingAddress(true);
  };

  const handleAddOrUpdateAddress = async () => {
    try {
      setLoading(true);
      
      if (!addressLine || !city || !state || !pincode) {
        toast.error('Please fill all the required fields');
        setLoading(false);
        return;
      }
      
      const addressData = {
        user_id: user.id,
        address_line: addressLine,
        city: city,
        state: state,
        pincode: pincode,
        address_type: addressType,
        is_default: isDefault
      };
      
      let error;
      
      // If default address is being set, update all other addresses to non-default
      if (isDefault) {
        const { error: updateError } = await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
          
        if (updateError) throw updateError;
      }
      
      if (editingAddressId) {
        // Update existing address
        const { error: updateError } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', editingAddressId);
          
        error = updateError;
      } else {
        // Add new address
        const { error: insertError } = await supabase
          .from('user_addresses')
          .insert(addressData);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      toast.success(editingAddressId ? 'Address updated successfully' : 'Address added successfully');
      resetForm();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      setLoading(true);
      
      // First set all addresses to non-default
      const { error: updateAllError } = await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
        
      if (updateAllError) throw updateAllError;
      
      // Then set the selected address as default
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Default address updated');
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    } finally {
      setLoading(false);
    }
  };

  if (hasError) {
    return <DatabaseErrorPage />;
  }

  if (isInitializing) {
    return (
      <MainLayout>
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FiLoader className="animate-spin h-10 w-10 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Setting up your profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated && !loading) {
    return null; // Will be redirected
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">My Addresses</h1>
            {!isAddingAddress && (
              <button 
                onClick={() => setIsAddingAddress(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <FiPlus className="mr-2" /> Add New Address
              </button>
            )}
          </div>
          
          {isAddingAddress ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line*</label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="House/Flat No., Street, Landmark"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="City"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State*</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="State"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code*</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="PIN Code"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-green-600"
                        name="addressType"
                        value="home"
                        checked={addressType === 'home'}
                        onChange={() => setAddressType('home')}
                      />
                      <span className="ml-2">Home</span>
                    </label>
                    
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-green-600"
                        name="addressType"
                        value="work"
                        checked={addressType === 'work'}
                        onChange={() => setAddressType('work')}
                      />
                      <span className="ml-2">Work</span>
                    </label>
                    
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-green-600"
                        name="addressType"
                        value="other"
                        checked={addressType === 'other'}
                        onChange={() => setAddressType('other')}
                      />
                      <span className="ml-2">Other</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox text-green-600"
                      checked={isDefault}
                      onChange={() => setIsDefault(!isDefault)}
                    />
                    <span className="ml-2">Set as default address</span>
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddOrUpdateAddress}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingAddressId ? 'Update Address' : 'Save Address')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Address List */}
          {loading && addresses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading addresses...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FiMapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h3>
              <p className="text-gray-500 mb-4">You haven't added any delivery addresses yet.</p>
              <button
                onClick={() => setIsAddingAddress(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address.id} className={`bg-white rounded-lg shadow-md p-5 ${address.is_default ? 'border-2 border-green-500' : ''}`}>
                  <div className="flex justify-between">
                    <div className="flex items-start">
                      {address.address_type === 'home' && <FiHome className="text-gray-500 mt-1 mr-2" />}
                      {address.address_type === 'work' && <FiMapPin className="text-gray-500 mt-1 mr-2" />}
                      {address.address_type === 'other' && <FiMapPin className="text-gray-500 mt-1 mr-2" />}
                      
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 capitalize">{address.address_type}</span>
                          {address.is_default && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                              <FiCheckCircle className="mr-1" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mt-1">{address.address_line}</p>
                        <p className="text-gray-700">{address.city}, {address.state} - {address.pincode}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit address"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete address"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefaultAddress(address.id)}
                      className="mt-3 text-sm text-green-600 hover:text-green-800"
                    >
                      Set as default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default function AddressPage() {
  return (
    <ClientWrapper>
      <AddressPageContent />
    </ClientWrapper>
  );
} 