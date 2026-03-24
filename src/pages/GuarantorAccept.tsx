import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

export default function GuarantorAccept() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleAccept = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/loan-requests/${id}/accept-guarantor`);
      setStatus('success');
      toast.success('Guarantor accepted successfully');
    } catch (error) {
      setStatus('error');
      toast.error('Failed to accept guarantor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Guarantor Acceptance</h1>
      
      {status === 'idle' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <p className="text-slate-700">You have been requested to be a guarantor for a loan request (ID: {id}). By accepting, you agree to be responsible for the loan repayment if the borrower fails to pay.</p>
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Accept Responsibility'}
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <CheckCircle className="mx-auto text-emerald-500" size={48} />
          <h2 className="text-xl font-bold text-emerald-900">Accepted!</h2>
          <p className="text-slate-700">You have successfully accepted the guarantor responsibility.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <XCircle className="mx-auto text-rose-500" size={48} />
          <h2 className="text-xl font-bold text-rose-900">Error</h2>
          <p className="text-slate-700">Failed to accept the guarantor responsibility. Please try again.</p>
        </div>
      )}
    </div>
  );
}
