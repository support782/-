import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, CheckCircle, XCircle, Clock, Search, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Verifications() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get('/api/kyc/all');
      setRecords(response.data.records);
    } catch (error) {
      toast.error('Failed to fetch verification records');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`/api/kyc/${id}/status`, { status });
      toast.success(`KYC status updated to ${status}`);
      fetchRecords();
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord({ ...selectedRecord, status });
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesFilter = filter === 'all' || record.status === filter;
    const matchesSearch = 
      (record.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.phone || '').includes(searchQuery) ||
      (record.memberId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: records.length,
    pending: records.filter(r => r.status === 'pending').length,
    verified: records.filter(r => r.status === 'verified').length,
    rejected: records.filter(r => r.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KYC Verifications</h1>
        <p className="text-slate-500">Manage and review member identity verifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Requests</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending</p>
            <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Verified</p>
            <p className="text-2xl font-bold text-slate-900">{stats.verified}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Rejected</p>
            <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex space-x-2">
            {['all', 'pending', 'verified', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  filter === f 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search name, phone, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-900">{record.displayName}</p>
                      <p className="text-sm text-slate-500">{record.memberId || 'No Member ID'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{record.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {format(new Date(record.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      record.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                      record.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {record.status === 'verified' && <CheckCircle size={12} className="mr-1" />}
                      {record.status === 'rejected' && <XCircle size={12} className="mr-1" />}
                      {record.status === 'pending' && <Clock size={12} className="mr-1" />}
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-900 font-medium text-sm bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No verification records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
            >
              <div className="sticky top-0 z-10 p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Review Verification</h2>
                  <p className="text-sm text-slate-500">{selectedRecord.displayName} ({selectedRecord.phone})</p>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                  <X size={24} className="text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* AI Result Section */}
                {selectedRecord.aiVerificationResult && (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                      <ShieldCheck className="mr-2 text-indigo-600" />
                      AI Verification Analysis
                    </h3>
                    {(() => {
                      try {
                        const aiData = JSON.parse(selectedRecord.aiVerificationResult);
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-medium text-slate-500 mb-1">AI Status</p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                aiData.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                                aiData.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {aiData.status}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-500 mb-1">Confidence Score</p>
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${aiData.confidence > 0.8 ? 'bg-emerald-500' : aiData.confidence > 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: `${aiData.confidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{Math.round(aiData.confidence * 100)}%</span>
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-slate-500 mb-1">Reasoning</p>
                              <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">{aiData.reason}</p>
                            </div>
                            {aiData.extractedInfo && (
                              <div className="md:col-span-2">
                                <p className="text-sm font-medium text-slate-500 mb-2">Extracted Information</p>
                                <div className="bg-white p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-4 text-sm">
                                  {Object.entries(aiData.extractedInfo).map(([key, value]) => (
                                    <div key={key}>
                                      <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                                      <span className="font-medium text-slate-900">{value as string}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } catch (e) {
                        return <p className="text-sm text-slate-500">Could not parse AI result data.</p>;
                      }
                    })()}
                  </div>
                )}

                {/* Documents Section */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Submitted Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-2">NID Front</p>
                      <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        {selectedRecord.nidFrontUrl ? (
                          <img src={selectedRecord.nidFrontUrl} alt="NID Front" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-2">NID Back</p>
                      <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        {selectedRecord.nidBackUrl ? (
                          <img src={selectedRecord.nidBackUrl} alt="NID Back" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-2">Live Selfie</p>
                      <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        {selectedRecord.selfieUrl ? (
                          <img src={selectedRecord.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedRecord.status === 'pending' && (
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-100">
                    <button
                      onClick={() => updateStatus(selectedRecord.id, 'rejected')}
                      className="px-6 py-2.5 rounded-xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      Reject KYC
                    </button>
                    <button
                      onClick={() => updateStatus(selectedRecord.id, 'verified')}
                      className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                    >
                      Approve KYC
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
