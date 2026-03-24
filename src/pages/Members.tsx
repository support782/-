import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Phone,
  CreditCard,
  MapPin,
  X,
  Clock,
  Eye,
  History,
  PiggyBank,
  HandCoins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, Branch, Loan, Transaction } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberDetails, setMemberDetails] = useState<{
    loans: Loan[],
    savings: any[],
    transactions: Transaction[]
  } | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nid: '',
    address: '',
    nomineeName: '',
    nomineeRelation: '',
    branchId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, branchesRes] = await Promise.all([
        axios.get('/api/members'),
        axios.get('/api/branches')
      ]);
      setMembers(membersRes.data.members);
      setBranches(branchesRes.data.branches);
      if (branchesRes.data.branches.length > 0 && !formData.branchId) {
        setFormData(prev => ({ ...prev, branchId: branchesRes.data.branches[0].id }));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingMember) {
        await axios.put(`/api/members/${editingMember.id}`, formData);
        toast.success('Member updated successfully');
      } else {
        await axios.post('/api/members', formData);
        toast.success('Member registered successfully');
      }
      setIsModalOpen(false);
      setEditingMember(null);
      setFormData({ name: '', phone: '', nid: '', address: '', nomineeName: '', nomineeRelation: '', branchId: branches[0]?.id || '' });
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to save member');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      phone: member.phone,
      nid: member.nid,
      address: member.address,
      nomineeName: member.nomineeName || '',
      nomineeRelation: member.nomineeRelation || '',
      branchId: member.branchId
    });
    setIsModalOpen(true);
  };

  const handleViewDetails = async (member: Member) => {
    setSelectedMember(member);
    setIsDetailsModalOpen(true);
    setLoading(true);
    try {
      const response = await axios.get(`/api/members/${member.memberId}/details`);
      setMemberDetails(response.data);
    } catch (error) {
      toast.error('Failed to fetch member details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await axios.delete(`/api/members/${id}`);
        toast.success('Member deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete member');
      }
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Member Management</h1>
          <p className="text-slate-500">Manage your samity members and their profiles.</p>
        </div>
        <button
          onClick={() => { setEditingMember(null); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Register Member</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-all">
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.memberId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-slate-600">
                        <Phone size={12} className="mr-1" /> {member.phone}
                      </div>
                      <div className="flex items-center text-xs text-slate-600">
                        <CreditCard size={12} className="mr-1" /> {member.nid}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {member.branchId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                      member.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {member.status === 'active' ? <CheckCircle size={12} className="mr-1" /> :
                       member.status === 'pending' ? <Clock size={12} className="mr-1" /> :
                       <XCircle size={12} className="mr-1" />}
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => handleViewDetails(member)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Details">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleEdit(member)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(member.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                    {selectedMember.name[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedMember.name}</h2>
                    <p className="text-sm text-white/80">{selectedMember.memberId} • {selectedMember.phone}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div>
                    <p className="text-slate-500 font-medium">Loading member history...</p>
                  </div>
                ) : memberDetails ? (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center space-x-3 mb-2 text-emerald-700">
                          <HandCoins size={20} />
                          <span className="font-bold">Active Loans</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-900">
                          ৳{memberDetails.loans.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.totalPayable - l.paidAmount), 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">Total Outstanding</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="flex items-center space-x-3 mb-2 text-blue-700">
                          <PiggyBank size={20} />
                          <span className="font-bold">Total Savings</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          ৳{memberDetails.savings.reduce((sum, s) => sum + s.balance, 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">Across {memberDetails.savings.length} accounts</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <div className="flex items-center space-x-3 mb-2 text-indigo-700">
                          <History size={20} />
                          <span className="font-bold">Total Transactions</span>
                        </div>
                        <p className="text-2xl font-bold text-indigo-900">{memberDetails.transactions.length}</p>
                        <p className="text-xs text-indigo-600 mt-1">Recent activities</p>
                      </div>
                    </div>

                    {/* Active Loans Table */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                        <HandCoins size={18} className="text-indigo-600" />
                        <span>Active Loans</span>
                      </h3>
                      <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-4 py-3 font-bold text-slate-600">Amount</th>
                              <th className="px-4 py-3 font-bold text-slate-600">Paid</th>
                              <th className="px-4 py-3 font-bold text-slate-600">Remaining</th>
                              <th className="px-4 py-3 font-bold text-slate-600">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {memberDetails.loans.map(loan => (
                              <tr key={loan.id}>
                                <td className="px-4 py-3 font-medium">৳{loan.amount.toLocaleString()}</td>
                                <td className="px-4 py-3 text-emerald-600 font-bold">৳{loan.paidAmount.toLocaleString()}</td>
                                <td className="px-4 py-3 text-rose-600 font-bold">৳{(loan.totalPayable - loan.paidAmount).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    loan.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                    loan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {loan.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {memberDetails.loans.length === 0 && (
                              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No loan history</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                        <History size={18} className="text-indigo-600" />
                        <span>Recent Transactions</span>
                      </h3>
                      <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-4 py-3 font-bold text-slate-600">Type</th>
                              <th className="px-4 py-3 font-bold text-slate-600">Amount</th>
                              <th className="px-4 py-3 font-bold text-slate-600">Method</th>
                              <th className="px-4 py-3 font-bold text-slate-600">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {memberDetails.transactions.map(tx => (
                              <tr key={tx.id}>
                                <td className="px-4 py-3 font-medium capitalize">{tx.type}</td>
                                <td className="px-4 py-3 font-bold text-indigo-600">৳{tx.amount.toLocaleString()}</td>
                                <td className="px-4 py-3 capitalize">{tx.method}</td>
                                <td className="px-4 py-3 text-slate-500">{format(new Date(tx.timestamp), 'MMM dd, yyyy')}</td>
                              </tr>
                            ))}
                            {memberDetails.transactions.length === 0 && (
                              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No transactions yet</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">{editingMember ? 'Edit Member' : 'Register New Member'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="017XXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">NID Number</label>
                    <input
                      type="text"
                      required
                      value={formData.nid}
                      onChange={(e) => setFormData({...formData, nid: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="National ID number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Branch</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select a branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Address</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
                    placeholder="Full residential address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nominee Name</label>
                    <input
                      type="text"
                      required
                      value={formData.nomineeName}
                      onChange={(e) => setFormData({...formData, nomineeName: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Nominee full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Relation with Nominee</label>
                    <input
                      type="text"
                      required
                      value={formData.nomineeRelation}
                      onChange={(e) => setFormData({...formData, nomineeRelation: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. Spouse, Parent, Child"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingMember ? 'Update Member' : 'Register Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
