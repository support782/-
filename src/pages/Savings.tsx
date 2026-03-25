import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PiggyBank, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  X,
  ArrowRight,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Savings() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    type: 'general' as 'general' | 'dps' | 'fdr',
    initialDeposit: 0
  });

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      if (res.data.user.role === 'member') {
        const memberRes = await axios.get('/api/members');
        const myMember = memberRes.data.members.find((m: any) => m.phone === res.data.user.phone);
        if (myMember) {
          setFormData(prev => ({ ...prev, memberId: myMember.memberId }));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsRes, membersRes] = await Promise.all([
        axios.get('/api/savings'),
        axios.get('/api/members')
      ]);
      setAccounts(accountsRes.data.accounts);
      setMembers(membersRes.data.members);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'member' && !formData.memberId) {
      toast.error('Please select a member');
      return;
    }

    setLoading(true);
    try {
      const member = members.find(m => m.memberId === formData.memberId);
      const response = await axios.post('/api/savings', {
        ...formData,
        branchId: member?.branchId || 'DHK-01'
      });

      if (formData.initialDeposit > 0) {
        // Initiate online payment if initial deposit is provided
        const payRes = await axios.post('/api/pay/create', {
          amount: formData.initialDeposit,
          memberId: formData.memberId,
          savingsAccountId: response.data.id,
          branchId: member?.branchId || 'DHK-01',
          type: 'savings_deposit'
        });

        if (payRes.data.payment_url) {
          window.location.href = payRes.data.payment_url;
          return;
        }
      }

      toast.success('Savings account opened successfully');
      setIsModalOpen(false);
      setFormData({ memberId: '', type: 'general', initialDeposit: 0 });
      fetchData();
    } catch (error) {
      toast.error('Failed to open account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Savings Management</h1>
          <p className="text-slate-500">Manage member savings, DPS, and FDR accounts.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Open Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Wallet size={20} />
            </div>
            <h3 className="font-bold text-slate-900">General Savings</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ৳{accounts.filter(a => a.type === 'general').reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">{accounts.filter(a => a.type === 'general').length} Active Accounts</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-slate-900">DPS Balance</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ৳{accounts.filter(a => a.type === 'dps').reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">{accounts.filter(a => a.type === 'dps').length} Active Accounts</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <PiggyBank size={20} />
            </div>
            <h3 className="font-bold text-slate-900">FDR Total</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ৳{accounts.filter(a => a.type === 'fdr').reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">{accounts.filter(a => a.type === 'fdr').length} Active Accounts</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by member ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Opened On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((account) => {
                const member = members.find(m => m.memberId === account.memberId);
                return (
                  <tr key={account.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          account.type === 'general' ? 'bg-blue-100 text-blue-600' :
                          account.type === 'dps' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          <PiggyBank size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-900 uppercase">{account.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <User size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{member?.name || account.memberId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-indigo-600">৳{account.balance.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      {account.status === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle size={12} className="mr-1" /> Active
                        </span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock size={12} className="mr-1" /> Pending
                          </span>
                          <button
                            onClick={async () => {
                              // Re-initiate payment
                              const payRes = await axios.post('/api/pay/create', {
                                amount: account.balance,
                                memberId: account.memberId,
                                savingsAccountId: account.id,
                                type: 'savings_deposit'
                              });
                              if (payRes.data.payment_url) {
                                window.location.href = payRes.data.payment_url;
                              }
                            }}
                            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                          >
                            Pay Now
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(account.createdAt), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                );
              })}
              {accounts.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No savings accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <div className="flex items-center space-x-3">
                  <Plus size={24} />
                  <h2 className="text-xl font-bold">Open Savings Account</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {user?.role !== 'member' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Select Member</label>
                    <select
                      required
                      value={formData.memberId}
                      onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Choose a member</option>
                      {members.map(m => (
                        <option key={m.id} value={m.memberId}>{m.name} ({m.memberId})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Account Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="general">General Savings</option>
                      <option value="dps">DPS (Monthly)</option>
                      <option value="fdr">FDR (Fixed)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Initial Deposit</label>
                    <input
                      type="number"
                      required
                      value={formData.initialDeposit}
                      onChange={(e) => setFormData({...formData, initialDeposit: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="৳0.00"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <span>Open Account</span>
                  <ArrowRight size={20} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
