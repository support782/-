import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
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
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/guarantor-accept/:id" element={<GuarantorAccept />} />
          
          <Route path="/" element={
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
