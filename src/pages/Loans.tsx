import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  HandCoins, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle,
  Clock,
  Calculator,
  User,
  X,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Loan, Member } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sendSMS } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

export default function Loans() {
  const { hasPermission } = usePermissions();
  const [searchParams] = useSearchParams();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanDetails, setLoanDetails] = useState<any>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [formData, setFormData] = useState({
    memberId: '',
    amount: 0,
    serviceCharge: 10, // 10% default
    installmentType: 'weekly' as 'daily' | 'weekly' | 'monthly',
    installments: 46, // Standard 46 weeks
    applicationDate: new Date().toISOString().split('T')[0],
    guarantorMobile: ''
  });

  const [myMember, setMyMember] = useState<Member | null>(null);

  useEffect(() => {
    fetchData();
    fetchMyMember();
    
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Online payment successful!');
      // Remove the query param
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'failed') {
      toast.error('Online payment failed or was cancelled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'error') {
      toast.error('An error occurred during payment verification.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    amount: 0,
    serviceCharge: 10,
    installmentType: 'weekly' as 'daily' | 'weekly' | 'monthly',
    installments: 46,
    applicationDate: new Date().toISOString().split('T')[0],
    guarantorMobile: ''
  });

  const fetchMyMember = async () => {
    try {
      const userRes = await axios.get('/api/auth/me');
      const membersRes = await axios.get('/api/members');
      const found = membersRes.data.members.find((m: any) => m.phone === userRes.data.user.phone);
      setMyMember(found || null);
    } catch (error) {
      console.error('Failed to fetch my member info');
    }
  };

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myMember) return;
    if (requestFormData.amount <= 0 || !requestFormData.guarantorMobile) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/loan-requests', {
        memberId: myMember.memberId,
        ...requestFormData
      });
      toast.success('Loan request submitted successfully');
      setIsRequestModalOpen(false);
      setRequestFormData({
        amount: 0,
        serviceCharge: 10,
        installmentType: 'weekly',
        installments: 46,
        applicationDate: new Date().toISOString().split('T')[0],
        guarantorMobile: ''
      });
    } catch (error) {
      toast.error('Failed to submit loan request');
    } finally {
      setLoading(false);
    }
  };

  const calculateRequestTotal = () => {
    const principal = Number(requestFormData.amount);
    const charge = (principal * requestFormData.serviceCharge) / 100;
    return principal + charge;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, membersRes] = await Promise.all([
        axios.get('/api/loans'),
        axios.get('/api/members')
      ]);
      setLoans(loansRes.data.loans);
      setMembers(membersRes.data.members);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const principal = Number(formData.amount);
    const charge = (principal * formData.serviceCharge) / 100;
    return principal + charge;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || formData.amount <= 0) {
      toast.error('Please fill all fields correctly');
      return;
    }

    setLoading(true);
    try {
      const totalPayable = calculateTotal();
      const member = members.find(m => m.memberId === formData.memberId);
      
      await axios.post('/api/loans', {
        ...formData,
        totalPayable,
        branchId: member?.branchId || 'DHK-01'
      });

      toast.success('Loan application submitted');
      setIsModalOpen(false);
      setFormData({ memberId: '', amount: 0, serviceCharge: 10, installmentType: 'weekly', installments: 46, applicationDate: new Date().toISOString().split('T')[0], guarantorMobile: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (loan: Loan) => {
    setSelectedLoan(loan);
    setIsDetailsModalOpen(true);
    setLoading(true);
    try {
      const response = await axios.get(`/api/loans/${loan.id}/details`);
      setLoanDetails(response.data);
    } catch (error) {
      toast.error('Failed to fetch loan details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (loanId: string, newStatus: 'active' | 'rejected') => {
    try {
      await axios.put(`/api/loans/${loanId}/status`, { status: newStatus });
      toast.success(`Loan ${newStatus} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handlePayInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || payAmount <= 0) return;

    setLoading(true);
    try {
      if (paymentMethod === 'online') {
        const response = await axios.post('/api/pay/create', {
          amount: payAmount,
          memberId: selectedLoan.memberId,
          loanId: selectedLoan.id,
          branchId: selectedLoan.branchId,
          type: 'installment'
        });
        
        if (response.data.payment_url) {
          window.location.href = response.data.payment_url;
        } else {
          toast.error('Failed to initiate payment');
        }
      } else {
        await axios.post('/api/transactions', {
          memberId: selectedLoan.memberId,
          type: 'installment',
          amount: payAmount,
          method: paymentMethod,
          loanId: selectedLoan.id,
          branchId: selectedLoan.branchId
        });
        toast.success('Installment payment recorded');
        setIsPayModalOpen(false);
        setSelectedLoan(null);
        setPayAmount(0);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loan Management</h1>
          <p className="text-slate-500">Manage loan applications, approvals and repayments.</p>
        </div>
        {hasPermission('create', 'loans') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            <span>New Application</span>
          </button>
        )}
        {myMember && myMember.kycStatus === 'verified' && (
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            <HandCoins size={20} />
            <span>Request Loan</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loans.map((loan) => {
          const member = members.find(m => m.memberId === loan.memberId);
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={loan.id}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{member?.name || 'Unknown Member'}</h3>
                  <p className="text-sm text-slate-500">{loan.memberId} • {loan.installmentType} • {format(new Date(loan.createdAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 md:px-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Amount</p>
                  <p className="text-base font-bold text-slate-900">৳{loan.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">Total: ৳{loan.totalPayable.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Paid</p>
                  <p className="text-base font-bold text-emerald-600">৳{loan.paidAmount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">{loan.installments} installments</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Remaining</p>
                  <p className="text-base font-bold text-rose-600">৳{(loan.totalPayable - loan.paidAmount).toLocaleString()}</p>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Progress</span>
                    <span className="text-[10px] font-bold text-indigo-600">{Math.round((loan.paidAmount / loan.totalPayable) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(loan.paidAmount / loan.totalPayable) * 100}%` }}
                      className="bg-indigo-600 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  loan.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  loan.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {loan.status.toUpperCase()}
                </span>
                
                {loan.status === 'active' && (
                  <>
                    <button 
                      onClick={() => handleViewDetails(loan)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                      title="View Details"
                    >
                      <User size={20} />
                    </button>
                    {hasPermission('update', 'loans') && (
                      <button 
                        onClick={() => { setSelectedLoan(loan); setPayAmount(loan.totalPayable / loan.installments); setIsPayModalOpen(true); }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Pay Installment"
                      >
                        <HandCoins size={20} />
                      </button>
                    )}
                  </>
                )}
                
                {loan.status === 'pending' && hasPermission('approve', 'loans') && (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleStatusUpdate(loan.id, 'active')}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Approve"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(loan.id, 'rejected')}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Reject"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {loans.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
            No loan applications found.
          </div>
        )}
      </div>

      {/* Loan Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedLoan && (
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
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <div className="flex items-center space-x-3">
                  <Calculator size={24} />
                  <h2 className="text-xl font-bold">Loan Details</h2>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
                  </div>
                ) : loanDetails ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase">Principal</p>
                        <p className="text-lg font-bold text-slate-900">৳{loanDetails.loan.amount.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase">Total Payable</p>
                        <p className="text-lg font-bold text-slate-900">৳{loanDetails.loan.totalPayable.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <p className="text-xs font-bold text-emerald-600 uppercase">Paid</p>
                        <p className="text-lg font-bold text-emerald-700">৳{loanDetails.loan.paidAmount.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                        <p className="text-xs font-bold text-rose-600 uppercase">Remaining</p>
                        <p className="text-lg font-bold text-rose-700">৳{(loanDetails.loan.totalPayable - loanDetails.loan.paidAmount).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase">Application Date</p>
                          <p className="font-bold text-slate-900">{format(new Date(loanDetails.loan.applicationDate || loanDetails.loan.createdAt), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      {loanDetails.loan.approvalDate && (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase">Approval Date</p>
                            <p className="font-bold text-emerald-700">{format(new Date(loanDetails.loan.approvalDate), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 mb-4">Repayment Schedule</h3>
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Installment Type</p>
                          <p className="font-bold text-slate-900 capitalize">{loanDetails.loan.installmentType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Total Installments</p>
                          <p className="font-bold text-slate-900">{loanDetails.loan.installments}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Amount per Installment</p>
                          <p className="font-bold text-slate-900">৳{(loanDetails.loan.totalPayable / loanDetails.loan.installments).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 mb-4">Transaction History</h3>
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 font-bold text-slate-600">Date</th>
                              <th className="px-4 py-3 font-bold text-slate-600">Amount</th>
                              <th className="px-4 py-3 font-bold text-slate-600">Method</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {loanDetails.transactions.map((tx: any) => (
                              <tr key={tx.id}>
                                <td className="px-4 py-3 text-slate-600">{format(new Date(tx.timestamp), 'MMM dd, yyyy HH:mm')}</td>
                                <td className="px-4 py-3 font-bold text-emerald-600">৳{tx.amount.toLocaleString()}</td>
                                <td className="px-4 py-3 capitalize text-slate-600">{tx.method}</td>
                              </tr>
                            ))}
                            {loanDetails.transactions.length === 0 && (
                              <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">No transactions yet.</td>
                              </tr>
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

      {/* Pay Installment Modal */}
      <AnimatePresence>
        {isPayModalOpen && selectedLoan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
                <div className="flex items-center space-x-3">
                  <HandCoins size={24} />
                  <h2 className="text-xl font-bold">Pay Installment</h2>
                </div>
                <button onClick={() => setIsPayModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handlePayInstallment} className="p-6 space-y-6">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Total Loan</span>
                    <span className="font-bold text-emerald-700">৳{selectedLoan.totalPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Remaining</span>
                    <span className="font-bold text-emerald-700">৳{(selectedLoan.totalPayable - selectedLoan.paidAmount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Payment Amount</label>
                    <input
                      type="number"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="৳0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online Payment (eUddok Pay)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loan Request Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
                <div className="flex items-center space-x-3">
                  <HandCoins size={24} />
                  <h2 className="text-xl font-bold">Request a Loan</h2>
                </div>
                <button onClick={() => setIsRequestModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleRequestLoan} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Application Date</label>
                    <input
                      type="date"
                      required
                      value={requestFormData.applicationDate}
                      onChange={(e) => setRequestFormData({...requestFormData, applicationDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Principal Amount</label>
                    <input
                      type="number"
                      required
                      value={requestFormData.amount}
                      onChange={(e) => setRequestFormData({...requestFormData, amount: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="৳0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Service Charge (%)</label>
                    <input
                      type="number"
                      required
                      value={requestFormData.serviceCharge}
                      onChange={(e) => setRequestFormData({...requestFormData, serviceCharge: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Installment Type</label>
                    <select
                      value={requestFormData.installmentType}
                      onChange={(e) => setRequestFormData({...requestFormData, installmentType: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">No. of Installments</label>
                    <input
                      type="number"
                      required
                      value={requestFormData.installments}
                      onChange={(e) => setRequestFormData({...requestFormData, installments: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Guarantor Mobile</label>
                    <input
                      type="text"
                      required
                      value={requestFormData.guarantorMobile}
                      onChange={(e) => setRequestFormData({...requestFormData, guarantorMobile: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="Enter guarantor mobile number"
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-emerald-600">Total Payable</span>
                    <span className="text-lg font-bold text-emerald-700">৳{calculateRequestTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-emerald-500">Per Installment</span>
                    <span className="text-sm font-bold text-emerald-600">৳{(calculateRequestTotal() / requestFormData.installments).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Application Modal */}
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
                  <Calculator size={24} />
                  <h2 className="text-xl font-bold">Loan Application</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Loan Amount</label>
                    <input
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="৳0.00"
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Guarantor Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantorMobile}
                    onChange={(e) => setFormData({...formData, guarantorMobile: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Enter guarantor mobile number"
                  />
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
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <span>Submit Application</span>
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
