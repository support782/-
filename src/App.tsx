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

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/branches" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Branches />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Users />
            </ProtectedRoute>
          } />

          <Route path="/members" element={
            <ProtectedRoute allowedRoles={['super_admin', 'branch_manager', 'field_officer']}>
              <Members />
            </ProtectedRoute>
          } />

          <Route path="/loans" element={
            <ProtectedRoute>
              <Loans />
            </ProtectedRoute>
          } />

          <Route path="/savings" element={
            <ProtectedRoute>
              <Savings />
            </ProtectedRoute>
          } />

          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
