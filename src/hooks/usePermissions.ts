import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserProfile, UserRole } from '../types';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'reject';
export type Resource = 'members' | 'loans' | 'savings' | 'transactions' | 'branches' | 'settings';

const rolePermissions: Record<UserRole, Record<Resource, Action[]>> = {
  super_admin: {
    members: ['create', 'read', 'update', 'delete', 'approve', 'reject'],
    loans: ['create', 'read', 'update', 'delete', 'approve', 'reject'],
    savings: ['create', 'read', 'update', 'delete', 'approve', 'reject'],
    transactions: ['create', 'read', 'update', 'delete'],
    branches: ['create', 'read', 'update', 'delete'],
    settings: ['create', 'read', 'update', 'delete'],
  },
  branch_manager: {
    members: ['create', 'read', 'update', 'approve', 'reject'],
    loans: ['create', 'read', 'update', 'approve', 'reject'],
    savings: ['create', 'read', 'update', 'approve', 'reject'],
    transactions: ['create', 'read', 'update'],
    branches: ['read'],
    settings: ['read'],
  },
  field_officer: {
    members: ['create', 'read', 'update'],
    loans: ['create', 'read'],
    savings: ['create', 'read'],
    transactions: ['create', 'read'],
    branches: ['read'],
    settings: [],
  },
  member: {
    members: ['read'],
    loans: ['read'],
    savings: ['read'],
    transactions: ['read'],
    branches: ['read'],
    settings: [],
  }
};

export function usePermissions() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const handleAuthChange = (e: any) => {
      setUser(e.detail);
      setLoading(false);
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const hasPermission = (action: Action, resource: Resource): boolean => {
    if (!user) return false;
    const permissions = rolePermissions[user.role];
    if (!permissions || !permissions[resource]) return false;
    return permissions[resource].includes(action);
  };

  return { hasPermission, user, loading };
}
