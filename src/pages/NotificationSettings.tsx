import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Bell, ShieldCheck, Wallet } from 'lucide-react';

export default function NotificationSettings() {
  const [settings, setSettings] = useState({ depositEnabled: true, loanEnabled: true, kycEnabled: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/notification-settings').then(res => setSettings(res.data.settings));
  }, []);

  const handleUpdate = async (key: string, value: boolean) => {
    setLoading(true);
    try {
      const newSettings = { ...settings, [key]: value };
      await axios.put('/api/notification-settings', newSettings);
      setSettings(newSettings);
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Notification Settings</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        {[
          { key: 'depositEnabled', label: 'Deposit Notifications', icon: Wallet },
          { key: 'loanEnabled', label: 'Loan Notifications', icon: ShieldCheck },
          { key: 'kycEnabled', label: 'KYC Notifications', icon: Bell },
        ].map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <Icon className="text-indigo-600" />
              <span className="font-bold text-slate-700">{label}</span>
            </div>
            <input
              type="checkbox"
              checked={settings[key as keyof typeof settings]}
              onChange={(e) => handleUpdate(key, e.target.checked)}
              disabled={loading}
              className="w-6 h-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
