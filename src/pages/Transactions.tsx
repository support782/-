import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  DollarSign, 
  User,
  Calendar,
  X,
  CreditCard,
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, Member, Loan } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sendSMS } from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    memberId: '',
    type: 'deposit' as any,
    amount: 0,
    method: 'cash' as any,
    loanId: '',
    savingsAccountId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, membersRes, loansRes, savingsRes] = await Promise.all([
        axios.get('/api/transactions'),
        axios.get('/api/members'),
        axios.get('/api/loans'),
        axios.get('/api/savings')
      ]);
      setTransactions(txRes.data.transactions);
      setMembers(membersRes.data.members);
      setLoans(loansRes.data.loans);
      setSavingsAccounts(savingsRes.data.accounts);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || formData.amount <= 0) {
      toast.error('Please fill all fields correctly');
      return;
    }

    setLoading(true);
    try {
      const member = members.find(m => m.memberId === formData.memberId);
      
      await axios.post('/api/transactions', {
        ...formData,
        branchId: member?.branchId || 'DHK-01'
      });

      toast.success('Transaction recorded successfully');
      
      const message = `Payment Received: ৳${formData.amount} for ${formData.type}. New balance updated. eUddok Smart Samity.`;
      if (member?.phone) {
        await sendSMS(member.phone, message);
      }

      setIsModalOpen(false);
      setFormData({ memberId: '', type: 'deposit', amount: 0, method: 'cash', loanId: '', savingsAccountId: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-500">View and record all financial movements.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>New Collection</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by member ID or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${tx.type === 'deposit' || tx.type === 'installment' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {tx.type === 'deposit' || tx.type === 'installment' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                      <span className="text-sm font-bold text-slate-900 capitalize">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <User size={14} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{tx.memberId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${tx.type === 'deposit' || tx.type === 'installment' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'deposit' || tx.type === 'installment' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {tx.method === 'cash' ? <Banknote size={14} className="text-slate-400" /> : <CreditCard size={14} className="text-slate-400" />}
                      <span className="text-xs font-medium text-slate-600 capitalize">{tx.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <Calendar size={14} />
                      <span>{format(new Date(tx.timestamp), 'MMM dd, hh:mm a')}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No transactions found.
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
                <div className="flex items-center space-x-3">
                  <DollarSign size={24} />
                  <h2 className="text-xl font-bold">New Collection</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Select Member</label>
                  <select
                    required
                    value={formData.memberId}
                    onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="">Choose a member</option>
                    {members.map(m => (
                      <option key={m.id} value={m.memberId}>{m.name} ({m.memberId})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Transaction Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    >
                      <option value="deposit">Savings Deposit</option>
                      <option value="installment">Loan Installment</option>
                      <option value="withdrawal">Savings Withdrawal</option>
                      <option value="fee">Fee Collection</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Amount</label>
                    <input
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="৳0.00"
                    />
                  </div>
                </div>

                {(formData.type === 'deposit' || formData.type === 'withdrawal') && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Select Savings Account</label>
                    <select
                      required
                      value={formData.savingsAccountId}
                      onChange={(e) => setFormData({...formData, savingsAccountId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    >
                      <option value="">Choose an account</option>
                      {savingsAccounts.filter(a => a.memberId === formData.memberId).map(a => (
                        <option key={a.id} value={a.id}>{a.type.toUpperCase()} Account (Balance: ৳{a.balance})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.type === 'installment' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Select Loan</label>
                    <select
                      required
                      value={formData.loanId}
                      onChange={(e) => setFormData({...formData, loanId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    >
                      <option value="">Choose a loan</option>
                      {loans.filter(l => l.memberId === formData.memberId && l.status === 'active').map(l => (
                        <option key={l.id} value={l.id}>Loan ৳{l.amount} (Payable: ৳{l.totalPayable})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Payment Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, method: 'cash'})}
                      className={`flex items-center justify-center space-x-2 p-3 rounded-xl border transition-all ${
                        formData.method === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <Banknote size={20} />
                      <span className="font-bold">Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, method: 'online'})}
                      className={`flex items-center justify-center space-x-2 p-3 rounded-xl border transition-all ${
                        formData.method === 'online' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="font-bold">Online</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Record Transaction'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
