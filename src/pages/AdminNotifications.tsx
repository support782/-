import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { MessageSquare, Save, ToggleLeft, ToggleRight, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { GlobalSettings } from '../types';

export default function AdminNotifications() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
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
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await axios.post('/api/settings', settings);
      toast.success('Notification settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notification Panel</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
        >
          <Save size={20} />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Welcome SMS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
            <MessageSquare className="text-indigo-600" size={20} />
            <h2 className="font-bold text-slate-900">Welcome SMS</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Enable Welcome SMS</p>
                <p className="text-sm text-slate-500">Send an SMS to members after registration.</p>
              </div>
              <button
                onClick={() => setSettings({...settings, welcomeSmsEnabled: !settings.welcomeSmsEnabled})}
                className={`p-2 rounded-full transition-all ${settings.welcomeSmsEnabled ? 'text-indigo-600' : 'text-slate-300'}`}
              >
                {settings.welcomeSmsEnabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
              </button>
            </div>

            {settings.welcomeSmsEnabled && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Welcome Message</label>
                <textarea
                  value={settings.welcomeSmsText}
                  onChange={(e) => setSettings({...settings, welcomeSmsText: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  rows={3}
                  placeholder="Welcome to our Samity!"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Automated SMS Reminders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
            <Bell className="text-indigo-600" size={20} />
            <h2 className="font-bold text-slate-900">Automated SMS Reminders</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Enable Reminders</p>
                <p className="text-sm text-slate-500">Send reminders for upcoming loan installments.</p>
              </div>
              <button
                onClick={() => setSettings({...settings, autoSmsReminders: !settings.autoSmsReminders})}
                className={`p-2 rounded-full transition-all ${settings.autoSmsReminders ? 'text-indigo-600' : 'text-slate-300'}`}
              >
                {settings.autoSmsReminders ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
              </button>
            </div>

            {settings.autoSmsReminders && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Reminder Days (Before Due Date)</label>
                <input
                  type="number"
                  value={settings.reminderDays}
                  onChange={(e) => setSettings({...settings, reminderDays: Number(e.target.value)})}
                  className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
