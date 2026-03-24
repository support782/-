import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole, UserProfile } from '../types';
import axios from 'axios';
import { Action, Resource, usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  action?: Action;
  resource?: Resource;
}

export default function ProtectedRoute({ children, allowedRoles, action, resource }: ProtectedRouteProps) {
  const { hasPermission, user, loading } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (action && resource && !hasPermission(action, resource)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
