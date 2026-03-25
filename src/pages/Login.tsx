import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Phone, Lock, AlertCircle, UserPlus, KeyRound, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import axios from 'axios';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerDuration, setTimerDuration] = useState(60);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch settings to get OTP timer duration
    axios.get('/api/settings').then(res => {
      if (res.data?.settings?.otpResendTimer) {
        setTimerDuration(res.data.settings.otpResendTimer);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && requiresOtp) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, requiresOtp]);

  const handleResendOtp = async () => {
    if (timeLeft > 0) return;
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/resend-otp', { phone });
      toast.success('OTP resent successfully');
      setTimeLeft(timerDuration);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to resend OTP';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (requiresOtp) {
      const endpoint = isRegistering ? '/api/auth/verify-register' : '/api/auth/verify-login';
      try {
        const response = await axios.post(endpoint, { phone, otp });
        if (response.data.user) {
          toast.success(isRegistering ? 'Account created successfully!' : 'Successfully logged in!');
          window.dispatchEvent(new CustomEvent('auth-change', { detail: response.data.user }));
          navigate('/');
        }
      } catch (err: any) {
        console.error(err);
        const errorMessage = err.response?.data?.error || 'OTP verification failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegistering 
      ? { phone, password, displayName } 
      : { phone, password };

    try {
      const response = await axios.post(endpoint, payload);
      if (response.data.requiresOtp) {
        setRequiresOtp(true);
        setTimeLeft(timerDuration);
        toast.success(response.data.message);
      } else if (response.data.user) {
        toast.success(isRegistering ? 'Account created successfully!' : 'Successfully logged in!');
        // We'll use a custom event to notify App.tsx about the login
        window.dispatchEvent(new CustomEvent('auth-change', { detail: response.data.user }));
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.error || 'Authentication failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-200">
            {requiresOtp ? <KeyRound size={32} /> : (isRegistering ? <UserPlus size={32} /> : <LogIn size={32} />)}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {requiresOtp ? 'Enter OTP' : (isRegistering ? 'Create an Account' : 'Welcome to eUddok')}
          </h1>
          <p className="text-slate-500 mt-2">
            {requiresOtp ? 'We sent a verification code to your phone' : 'Smart Samity & Microfinance Management'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-600">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!requiresOtp ? (
            <>
              {isRegistering && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                <PhoneInput
                  country={'bd'}
                  value={phone}
                  onChange={setPhone}
                  inputClass="w-full !py-3 !bg-slate-50 !border !border-slate-200 !rounded-xl !focus:ring-2 !focus:ring-indigo-500 !outline-none !transition-all"
                  containerClass="!w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">One-Time Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-center tracking-widest font-mono text-lg"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (requiresOtp ? 'Verify OTP' : (isRegistering ? 'Register' : 'Sign In'))}
          </button>
        </form>

        {requiresOtp && (
          <div className="mt-6 text-center">
            <button
              onClick={handleResendOtp}
              disabled={timeLeft > 0 || loading}
              className="inline-flex items-center justify-center space-x-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>
                {timeLeft > 0 ? `Resend OTP in ${timeLeft}s` : 'Resend OTP'}
              </span>
            </button>
          </div>
        )}

        {!requiresOtp && (
          <p className="text-center text-slate-500 text-sm mt-8">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-indigo-600 font-bold cursor-pointer hover:underline"
            >
              {isRegistering ? 'Sign In' : 'Register Now'}
            </span>
          </p>
        )}
      </motion.div>
    </div>
  );
}
