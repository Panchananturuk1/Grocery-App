'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSettings, FiShield, FiKey, FiSave, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import supabase from '../../../utils/supabase';
import MainLayout from '../../../components/layout/MainLayout';
import toast from 'react-hot-toast';
import ClientWrapper from '../../../components/ClientWrapper';

function SettingsPageContent() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
      return;
    }

    if (user) {
      setEmail(user.email || '');
      setLoading(false);
      
      // Fetch user preferences
      const fetchPreferences = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('email_notifications')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setEmailNotifications(data.email_notifications !== false); // Default to true if not set
          }
        } catch (err) {
          console.error('Error fetching preferences:', err);
        }
      };
      
      fetchPreferences();
    }
  }, [user, isAuthenticated, loading, router]);

  const updatePassword = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      // Validate passwords
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      
      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  const updateNotificationPreferences = async () => {
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_notifications: emailNotifications
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update notification preferences');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
    );
    
    if (!confirmed) return;
    
    setUpdating(true);
    
    try {
      // Delete profile data first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;
      
      toast.success('Account deleted successfully');
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setUpdating(false);
    }
  };

  if (!isAuthenticated && !loading) {
    return null; // Will be redirected
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h1>
          
          {/* Account Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiSettings className="mr-2 text-green-600" />
              Account Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  To change your email address, please contact customer support.
                </p>
              </div>
            </div>
          </div>
          
          {/* Password Change */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiKey className="mr-2 text-green-600" />
              Change Password
            </h2>
            
            <form onSubmit={updatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  disabled={updating}
                >
                  <FiSave className="mr-2" />
                  {updating ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Notification Preferences */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiShield className="mr-2 text-green-600" />
              Notification Preferences
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox text-green-600"
                    checked={emailNotifications}
                    onChange={() => setEmailNotifications(!emailNotifications)}
                  />
                  <span className="ml-2">Receive email notifications about orders and promotions</span>
                </label>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={updateNotificationPreferences}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  disabled={updating}
                >
                  <FiSave className="mr-2" />
                  {updating ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Delete Account */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-red-200">
            <h2 className="text-xl font-semibold mb-4 text-red-600 flex items-center">
              <FiAlertTriangle className="mr-2" />
              Delete Account
            </h2>
            
            <p className="text-gray-700 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              disabled={updating}
            >
              {updating ? 'Processing...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function SettingsPage() {
  return (
    <ClientWrapper>
      <SettingsPageContent />
    </ClientWrapper>
  );
} 