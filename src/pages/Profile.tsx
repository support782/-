import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Camera, Save, X } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';

export default function Profile() {
  const { user } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    photoUrl: '',
    paymentMethods: [] as { method: string; number: string }[],
    notificationSettings: { email: true, sms: true }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        photoUrl: user.photoUrl || '',
        paymentMethods: user.paymentMethods ? JSON.parse(user.paymentMethods) : [],
        notificationSettings: user.notificationSettings ? JSON.parse(user.notificationSettings) : { email: true, sms: true }
      });
    }
  }, [user]);

  const addPaymentMethod = () => {
    setFormData({
      ...formData,
      paymentMethods: [...formData.paymentMethods, { method: 'Bkash', number: '' }]
    });
  };

  const removePaymentMethod = (index: number) => {
    setFormData({
      ...formData,
      paymentMethods: formData.paymentMethods.filter((_, i) => i !== index)
    });
  };

  const updatePaymentMethod = (index: number, field: string, value: string) => {
    const updated = [...formData.paymentMethods];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, paymentMethods: updated });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Image size should be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put('/api/auth/profile', formData);
      toast.success('Profile updated successfully');
      // Dispatch auth-change event to update layout
      window.dispatchEvent(new CustomEvent('auth-change', { detail: response.data.user }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500">Manage your personal information and profile photo.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Loan Services</h2>
          {user.role === 'member' && (
            <button
              onClick={() => window.location.href = '/loans'}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Apply for Loan
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                <Camera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
            {formData.photoUrl && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, photoUrl: '' })}
                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
              >
                <X size={16} />
                <span>Remove Photo</span>
              </button>
            )}
            <p className="text-xs text-slate-500">Recommended: Square image, max 1MB</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Display Name</label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Payment Methods</label>
                <button type="button" onClick={addPaymentMethod} className="text-sm text-indigo-600 font-bold hover:text-indigo-700">+ Add Method</button>
              </div>
              {formData.paymentMethods.map((pm, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={pm.method}
                    onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Bkash">Bkash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={pm.number}
                    onChange={(e) => updatePaymentMethod(index, 'number', e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button type="button" onClick={() => removePaymentMethod(index)} className="text-red-500 hover:text-red-600"><X size={20} /></button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Notification Settings</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.notificationSettings.email}
                    onChange={(e) => setFormData({...formData, notificationSettings: {...formData.notificationSettings, email: e.target.checked}})}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-600">Email Notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.notificationSettings.sms}
                    onChange={(e) => setFormData({...formData, notificationSettings: {...formData.notificationSettings, sms: e.target.checked}})}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-600">SMS Notifications</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Phone Number</label>
              <input
                type="tel"
                disabled
                value={user.phone}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500">Phone number cannot be changed.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Role</label>
              <input
                type="text"
                disabled
                value={user.role.replace('_', ' ').toUpperCase()}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={20} />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
