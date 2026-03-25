import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Withdrawal() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: 0,
    method: 'bkash' as 'bkash' | 'nagad' | 'rocket',
    accountNumber: ''
  });

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/withdrawals');
      setWithdrawals(res.data.withdrawals);
    } catch (error) {
      toast.error('Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/withdrawals', formData);
      toast.success('Withdrawal request submitted');
      setIsModalOpen(false);
      setFormData({ amount: 0, method: 'bkash', accountNumber: '' });
      fetchWithdrawals();
    } catch (error) {
      toast.error('Failed to submit withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Withdrawal</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Method</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Account</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {withdrawals.map((w) => (
              <tr key={w.id}>
                <td className="px-6 py-4 font-bold text-indigo-600">৳{w.amount.toLocaleString()}</td>
                <td className="px-6 py-4 capitalize">{w.method}</td>
                <td className="px-6 py-4">{w.accountNumber}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    w.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    w.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {w.status === 'pending' ? <Clock size={12} className="mr-1" /> : 
                     w.status === 'approved' ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                    {w.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(w.createdAt), 'MMM dd, yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6">New Withdrawal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Amount</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Method</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="bkash">Bkash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Account Number</label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
