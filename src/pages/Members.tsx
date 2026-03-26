import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  HandCoins,
  Printer,
  Camera,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, Branch, Loan, Transaction } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { usePermissions } from '../hooks/usePermissions';
import MemberIdCard from '../components/MemberIdCard';

export default function Members() {
  const { hasPermission } = usePermissions();
  const [members, setMembers] = useState<Member[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberDetails, setMemberDetails] = useState<{
    loans: Loan[],
    savings: any[],
    transactions: Transaction[]
  } | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanFormData, setLoanFormData] = useState({
    amount: 0,
    installmentType: 'weekly' as 'daily' | 'weekly' | 'monthly',
    installments: 46,
    guarantorMobile: ''
  });

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    
    setLoading(true);
    try {
      const totalPayable = loanFormData.amount + (loanFormData.amount * 0.1); // Assuming 10% charge
      await axios.post('/api/loans', {
        memberId: selectedMember.memberId,
        amount: loanFormData.amount,
        serviceCharge: 10,
        totalPayable,
        installmentType: loanFormData.installmentType,
        installments: loanFormData.installments,
        applicationDate: new Date().toISOString().split('T')[0],
        guarantorMobile: loanFormData.guarantorMobile,
        branchId: selectedMember.branchId || 'DHK-01'
      });
      toast.success('Loan application submitted');
      setIsLoanModalOpen(false);
      setLoanFormData({ amount: 0, installmentType: 'weekly', installments: 46, guarantorMobile: '' });
    } catch (error) {
      toast.error('Failed to submit loan request');
    } finally {
      setLoading(false);
    }
  };
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nid: '',
    address: '',
    nomineeName: '',
    nomineeRelation: '',
    branchId: '',
    photoUrl: ''
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
      setFormData({ name: '', phone: '', nid: '', address: '', nomineeName: '', nomineeRelation: '', branchId: branches[0]?.id || '', photoUrl: '' });
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
      branchId: member.branchId,
      photoUrl: member.photoUrl || ''
    });
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast.error('Image size must be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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

  const handleStatusUpdate = async (memberId: string, newStatus: string) => {
    try {
      const memberToUpdate = members.find(m => m.id === memberId);
      if (!memberToUpdate) return;
      await axios.put(`/api/members/${memberId}`, { ...memberToUpdate, status: newStatus });
      toast.success(`Member status updated to ${newStatus}`);
      setSelectedMember(prev => prev ? { ...prev, status: newStatus as any } : null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);
    
    const matchesBranch = filterBranch ? m.branchId === filterBranch : true;
    const matchesStatus = filterStatus ? m.status === filterStatus : true;
    
    let matchesDate = true;
    if (filterStartDate && filterEndDate) {
      const memberDate = new Date(m.createdAt).getTime();
      const start = new Date(filterStartDate).getTime();
      const end = new Date(filterEndDate).getTime() + 86400000; // Include the end day
      matchesDate = memberDate >= start && memberDate <= end;
    } else if (filterStartDate) {
      matchesDate = new Date(m.createdAt).getTime() >= new Date(filterStartDate).getTime();
    } else if (filterEndDate) {
      matchesDate = new Date(m.createdAt).getTime() <= new Date(filterEndDate).getTime() + 86400000;
    }

    return matchesSearch && matchesBranch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Member Management</h1>
          <p className="text-slate-500">Manage your samity members and their profiles.</p>
        </div>
        {hasPermission('create', 'members') && (
          <button
            onClick={() => { setEditingMember(null); setIsModalOpen(true); }}
            className="inline-flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            <span>Register Member</span>
          </button>
        )}
        {hasPermission('create', 'loans') && (
          <Link
            to="/loan-request"
            className="inline-flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            <HandCoins size={20} />
            <span>Request Loan</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
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
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center space-x-2 px-4 py-2 border rounded-xl font-medium transition-all ${
                showFilters || filterBranch || filterStatus || filterStartDate || filterEndDate
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 overflow-hidden"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Branch</label>
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                      {member.photoUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                          {member.name[0]}
                        </div>
                      )}
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
                      member.status === 'inactive' ? 'bg-amber-100 text-amber-800' :
                      member.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {member.status === 'active' ? <CheckCircle size={12} className="mr-1" /> :
                       member.status === 'inactive' ? <Clock size={12} className="mr-1" /> :
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
                      {hasPermission('update', 'members') && (
                        <button onClick={() => handleEdit(member)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                          <Edit2 size={18} />
                        </button>
                      )}
                      {hasPermission('delete', 'members') && (
                        <button onClick={() => handleDelete(member.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Application Modal */}
      <AnimatePresence>
        {isLoanModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoanModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <h2 className="text-xl font-bold">Apply for Loan</h2>
                <button onClick={() => setIsLoanModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleApplyLoan} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Amount</label>
                  <input
                    type="number"
                    required
                    value={loanFormData.amount}
                    onChange={(e) => setLoanFormData({...loanFormData, amount: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Installment Type</label>
                  <select
                    value={loanFormData.installmentType}
                    onChange={(e) => setLoanFormData({...loanFormData, installmentType: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Installments</label>
                  <input
                    type="number"
                    required
                    value={loanFormData.installments}
                    onChange={(e) => setLoanFormData({...loanFormData, installments: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Guarantor Mobile</label>
                  <input
                    type="text"
                    required
                    value={loanFormData.guarantorMobile}
                    onChange={(e) => setLoanFormData({...loanFormData, guarantorMobile: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  Submit Application
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white print:hidden">
                <div className="flex items-center space-x-4">
                  {selectedMember.photoUrl ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                      <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                      {selectedMember.name[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{selectedMember.name}</h2>
                    <p className="text-sm text-white/80">{selectedMember.memberId} • {selectedMember.phone}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        selectedMember.kycStatus === 'verified' ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30' :
                        selectedMember.kycStatus === 'rejected' ? 'bg-rose-400/20 text-rose-100 border border-rose-400/30' :
                        'bg-amber-400/20 text-amber-100 border border-amber-400/30'
                      }`}>
                        {selectedMember.kycStatus || 'Pending'}
                      </span>
                      {(selectedMember.kycStatus === 'pending' || selectedMember.kycStatus === 'rejected') && (
                        <Link to="/kyc" className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full hover:bg-white/30 transition-all">
                          Verify KYC
                        </Link>
                      )}
                      {hasPermission('update', 'members') ? (
                        <select
                          value={selectedMember.status}
                          onChange={(e) => handleStatusUpdate(selectedMember.id, e.target.value)}
                          className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-white/50"
                        >
                          <option value="active" className="text-slate-900">Active</option>
                          <option value="inactive" className="text-slate-900">Inactive</option>
                          <option value="rejected" className="text-slate-900">Rejected</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          selectedMember.status === 'active' ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30' :
                          selectedMember.status === 'inactive' ? 'bg-amber-400/20 text-amber-100 border border-amber-400/30' :
                          'bg-rose-400/20 text-rose-100 border border-rose-400/30'
                        }`}>
                          {selectedMember.status}
                        </span>
                      )}
                    </div>
                    {selectedMember.aiVerificationResult && (
                      <div className="mt-4 p-3 bg-white/10 rounded-lg text-xs text-white/90">
                        <p className="font-bold mb-2">AI Verification Result:</p>
                        {(() => {
                          try {
                            const aiData = JSON.parse(selectedMember.aiVerificationResult);
                            return (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="opacity-75">Status:</span>
                                  <span className="font-bold capitalize">{aiData.status}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="opacity-75">Confidence:</span>
                                  <span className="font-bold">{Math.round(aiData.confidence * 100)}%</span>
                                </div>
                                <div>
                                  <span className="opacity-75 block mb-1">Reason:</span>
                                  <span className="block bg-black/20 p-2 rounded">{aiData.reason}</span>
                                </div>
                              </div>
                            );
                          } catch (e) {
                            return <p>{selectedMember.aiVerificationResult}</p>;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="bg-white p-2 rounded-xl hidden md:block">
                    <QRCodeSVG value={`member:${selectedMember.memberId}`} size={80} />
                  </div>
                  <button onClick={() => window.print()} className="p-2 hover:bg-white/10 rounded-lg transition-all self-start print:hidden" title="Print ID Card">
                    <Printer size={24} />
                  </button>
                  <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all self-start print:hidden">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <MemberIdCard member={selectedMember} />

              <div className="flex-1 overflow-y-auto p-6 space-y-8 print:hidden">
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
                      <button
                        onClick={() => setIsLoanModalOpen(true)}
                        className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all"
                      >
                        <Plus size={16} />
                        <span>Apply for Loan</span>
                      </button>
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
                        value={formData.phone || ''}
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
                      value={formData.nid || ''}
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
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Member Photo</label>
                    <div className="flex items-center space-x-4">
                      {formData.photoUrl ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                          <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                            className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-rose-600 hover:bg-white"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50">
                          <Users size={24} />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                        />
                        <p className="text-xs text-slate-500 mt-1">Max size: 1MB. Recommended format: JPG, PNG.</p>
                      </div>
                    </div>
                  </div>
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
