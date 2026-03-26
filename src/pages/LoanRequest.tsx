import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { User, Phone, HandCoins, ArrowRight } from 'lucide-react';

export default function LoanRequest() {
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState('');
  const [member, setMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: 0,
    serviceCharge: 10,
    installmentType: 'weekly' as 'daily' | 'weekly' | 'monthly',
    installments: 46,
    applicationDate: new Date().toISOString().split('T')[0],
    guarantorMobile: ''
  });

  const handleMobileLookup = async () => {
    if (!mobile) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/members/by-phone/${mobile}`);
      setMember(response.data.member);
      toast.success('Member found');
    } catch (error) {
      toast.error('Member not found');
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) {
      toast.error('Please lookup a member first');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/loan-requests', {
        memberId: member.memberId,
        ...formData
      });
      toast.success('Loan request submitted successfully. Guarantor notified.');
      setFormData({
        amount: 0,
        serviceCharge: 10,
        installmentType: 'weekly',
        installments: 46,
        applicationDate: new Date().toISOString().split('T')[0],
        guarantorMobile: ''
      });
      setMember(null);
      setMobile('');
    } catch (error) {
      toast.error('Failed to submit loan request');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const principal = Number(formData.amount);
    const charge = (principal * formData.serviceCharge) / 100;
    return principal + charge;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Request Loan</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Member Mobile Number</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Enter mobile number"
            />
            <button
              onClick={handleMobileLookup}
              disabled={loading}
              className="px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
            >
              Lookup
            </button>
          </div>
        </div>

        {member && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2"
          >
            <div className="flex items-center space-x-3">
              <User className="text-indigo-600" />
              <span className="font-bold text-indigo-900">{member.name}</span>
            </div>
            <div className="text-sm text-indigo-700">Member ID: {member.memberId}</div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Application Date</label>
              <input
                type="date"
                required
                value={formData.applicationDate}
                onChange={(e) => setFormData({...formData, applicationDate: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Principal Amount</label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="৳0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Service Charge (%)</label>
              <input
                type="number"
                required
                value={formData.serviceCharge}
                onChange={(e) => setFormData({...formData, serviceCharge: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Installment Type</label>
              <select
                value={formData.installmentType}
                onChange={(e) => setFormData({...formData, installmentType: e.target.value as any})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">No. of Installments</label>
              <input
                type="number"
                required
                value={formData.installments}
                onChange={(e) => setFormData({...formData, installments: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Guarantor Mobile</label>
              <input
                type="text"
                required
                value={formData.guarantorMobile}
                onChange={(e) => setFormData({...formData, guarantorMobile: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Enter guarantor mobile number"
              />
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-indigo-600">Total Payable</span>
              <span className="text-lg font-bold text-indigo-700">৳{calculateTotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-indigo-500">Per Installment</span>
              <span className="text-sm font-bold text-indigo-600">৳{(calculateTotal() / formData.installments).toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !member}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>Submit Request</span>
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
