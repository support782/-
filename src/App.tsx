import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import axios from 'axios';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Branches from './pages/Branches';
import Users from './pages/Users';
import Loans from './pages/Loans';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import Savings from './pages/Savings';
import LoanRequest from './pages/LoanRequest';
import GuarantorAccept from './pages/GuarantorAccept';
import KYC from './pages/KYC';
import Verifications from './pages/Verifications';
import NotificationSettings from './pages/NotificationSettings';
import AdminNotifications from './pages/AdminNotifications';
import Withdrawal from './pages/Withdrawal';
import Profile from './pages/Profile';

export default function App() {
  const [installed, setInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    axios.get('/api/install/status').then(res => {
      setInstalled(res.data.installed);
    }).catch(() => {
      setInstalled(false);
    });
  }, []);

  if (installed === null) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!installed) {
    return (
      <Router>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </Router>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/guarantor-accept/:id" element={<GuarantorAccept />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/withdrawals" element={
            <ProtectedRoute action="read" resource="withdrawals">
              <Withdrawal />
            </ProtectedRoute>
          } />

          <Route path="/branches" element={
            <ProtectedRoute action="read" resource="branches">
              <Branches />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Users />
            </ProtectedRoute>
          } />

          <Route path="/members" element={
            <ProtectedRoute action="read" resource="members">
              <Members />
            </ProtectedRoute>
          } />

          <Route path="/loans" element={
            <ProtectedRoute action="read" resource="loans">
              <Loans />
            </ProtectedRoute>
          } />

          <Route path="/loan-request" element={
            <ProtectedRoute>
              <LoanRequest />
            </ProtectedRoute>
          } />

          <Route path="/kyc" element={
            <ProtectedRoute>
              <KYC />
            </ProtectedRoute>
          } />

          <Route path="/verifications" element={
            <ProtectedRoute allowedRoles={['super_admin', 'branch_manager']}>
              <Verifications />
            </ProtectedRoute>
          } />

          <Route path="/notification-settings" element={
            <ProtectedRoute>
              <NotificationSettings />
            </ProtectedRoute>
          } />

          <Route path="/admin-notifications" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AdminNotifications />
            </ProtectedRoute>
          } />

          <Route path="/savings" element={
            <ProtectedRoute action="read" resource="savings">
              <Savings />
            </ProtectedRoute>
          } />

          <Route path="/transactions" element={
            <ProtectedRoute action="read" resource="transactions">
              <Transactions />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute action="read" resource="settings">
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
