import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings as SettingsIcon, 
  MessageSquare, 
  CreditCard, 
  ShieldCheck, 
  Save,
  AlertTriangle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { GlobalSettings } from '../types';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState<GlobalSettings>({
    smsAppKey: '',
    smsAuthKey: '',
    paymentApiKey: '',
    paymentSecretKey: '',
    paymentBrandKey: '',
    lateFeeRate: 10,
    sandboxMode: true,
    autoSmsReminders: false,
    reminderDays: 3,
    otpEnabled: false,
    aiVerificationEnabled: false,
    aiModel: 'google/gemini-2.5-flash',
    aiApiKey: '',
    welcomeSmsEnabled: false,
    welcomeSmsText: 'Welcome to our Samity! Your account has been created successfully.',
    websiteName: 'eUddok Smart'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/settings', settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500">Configure global parameters and third-party integrations.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
            <SettingsIcon className="text-indigo-600" size={20} />
            <h2 className="font-bold text-slate-900">General Settings</h2>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Website Name</label>
              <input
                type="text"
                value={settings.websiteName}
                onChange={(e) => setSettings({...settings, websiteName: e.target.value})}
                className="w-full max-w-md px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* SMS Gateway */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
            <MessageSquare className="text-indigo-600" size={20} />
            <h2 className="font-bold text-slate-900">eUddok SMS Gateway</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">App Key</label>
                <input
                  type="text"
                  value={settings.smsAppKey}
                  onChange={(e) => setSettings({...settings, smsAppKey: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Auth Key</label>
                <input
                  type="password"
                  value={settings.smsAuthKey}
                  onChange={(e) => setSettings({...settings, smsAuthKey: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Gateway */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
            <CreditCard className="text-indigo-600" size={20} />
            <h2 className="font-bold text-slate-900">eUddok Payment Gateway</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">API Key</label>
                <input
                  type="text"
                  value={settings.paymentApiKey}
                  onChange={(e) => setSettings({...settings, paymentApiKey: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Enter API Key"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Secret Key</label>
                <input
                  type="password"
                  value={settings.paymentSecretKey}
                  onChange={(e) => setSettings({...settings, paymentSecretKey: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Enter Secret Key"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Brand Key</label>
                <input
                  type="text"
                  value={settings.paymentBrandKey}
                  onChange={(e) => setSettings({...settings, paymentBrandKey: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Enter Brand Key"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Business Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
            <ShieldCheck className="text-indigo-600" size={20} />
            <h2 className="font-bold text-slate-900">Business Rules & Security</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">OTP System</p>
                <p className="text-sm text-slate-500">Enable OTP for login and registration.</p>
              </div>
              <button
                onClick={() => setSettings({...settings, otpEnabled: !settings.otpEnabled})}
                className={`p-2 rounded-full transition-all ${settings.otpEnabled ? 'text-indigo-600' : 'text-slate-300'}`}
              >
                {settings.otpEnabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
              </button>
            </div>

            {settings.otpEnabled && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">OTP Resend Timer (Seconds)</label>
                <input
                  type="number"
                  value={settings.otpResendTimer || 60}
                  onChange={(e) => setSettings({...settings, otpResendTimer: Number(e.target.value)})}
                  className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Sandbox Mode</p>
                <p className="text-sm text-slate-500">Enable for testing SMS and Payment integrations.</p>
              </div>
              <button
                onClick={() => setSettings({...settings, sandboxMode: !settings.sandboxMode})}
                className={`p-2 rounded-full transition-all ${settings.sandboxMode ? 'text-indigo-600' : 'text-slate-300'}`}
              >
                {settings.sandboxMode ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Late Fee Rate (৳ per day)</label>
              <input
                type="number"
                value={settings.lateFeeRate}
                onChange={(e) => setSettings({...settings, lateFeeRate: Number(e.target.value)})}
                className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* AI Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
            <ShieldCheck className="text-indigo-600" size={20} />
            <h2 className="font-bold text-slate-900">Instant AI Verification</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Enable AI Verification</p>
                <p className="text-sm text-slate-500">Automatically verify member KYC using AI.</p>
              </div>
              <button
                onClick={() => setSettings({...settings, aiVerificationEnabled: !settings.aiVerificationEnabled})}
                className={`p-2 rounded-full transition-all ${settings.aiVerificationEnabled ? 'text-indigo-600' : 'text-slate-300'}`}
              >
                {settings.aiVerificationEnabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
              </button>
            </div>

            {settings.aiVerificationEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">OpenRouter AI Model</label>
                  <input
                    type="text"
                    value={settings.aiModel}
                    onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g., google/gemini-2.5-flash"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">OpenRouter API Key</label>
                  <input
                    type="password"
                    value={settings.aiApiKey}
                    onChange={(e) => setSettings({...settings, aiApiKey: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="sk-or-v1-..."
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex items-center justify-between p-6 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="flex items-center space-x-3 text-amber-700">
            <AlertTriangle size={24} />
            <p className="text-sm font-medium">Be careful when modifying gateway credentials. Incorrect values will stop SMS and Payment services.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            <Save size={20} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
