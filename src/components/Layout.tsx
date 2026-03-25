import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  HandCoins, 
  PiggyBank, 
  History, 
  Settings, 
  LogOut,
  Menu,
  X,
  UserCircle,
  ShieldCheck,
  Bell,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data.user);
      } catch (err) {
        setUser(null);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const handleAuthChange = (e: any) => {
      setUser(e.detail);
      setLoading(false);
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['super_admin', 'branch_manager', 'field_officer', 'member'] },
    { name: 'Branches', path: '/branches', icon: Building2, roles: ['super_admin'] },
    { name: 'Users', path: '/users', icon: UserCircle, roles: ['super_admin'] },
    { name: 'Members', path: '/members', icon: Users, roles: ['super_admin', 'branch_manager', 'field_officer'] },
    { name: 'Loans', path: '/loans', icon: HandCoins, roles: ['super_admin', 'branch_manager', 'field_officer', 'member'] },
    { name: 'Savings', path: '/savings', icon: PiggyBank, roles: ['super_admin', 'branch_manager', 'field_officer', 'member'] },
    { name: 'Withdrawals', path: '/withdrawals', icon: Wallet, roles: ['super_admin', 'branch_manager', 'field_officer', 'member'] },
    { name: 'Transactions', path: '/transactions', icon: History, roles: ['super_admin', 'branch_manager', 'field_officer', 'member'] },
    { name: 'KYC Verification', path: '/kyc', icon: ShieldCheck, roles: ['super_admin', 'branch_manager', 'field_officer', 'member'] },
    { name: 'KYC Management', path: '/verifications', icon: ShieldCheck, roles: ['super_admin'] },
    { name: 'Notifications', path: '/notification-settings', icon: Bell, roles: ['super_admin', 'branch_manager', 'field_officer', 'member'] },
    { name: 'Notification Panel', path: '/admin-notifications', icon: Bell, roles: ['super_admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['super_admin'] },
  ];

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user && location.pathname !== '/login') {
    return null;
  }

  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-indigo-600">eUddok Smart</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Samity Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <Link to="/profile" className="flex items-center space-x-3 p-3 mb-2 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.[0] || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.displayName}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <h1 className="text-lg font-bold text-indigo-600">eUddok</h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[70] md:hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h1 className="text-xl font-bold text-indigo-600">eUddok Smart</h1>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filteredMenu.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-slate-100">
                <Link to="/profile" onClick={() => setIsSidebarOpen(false)} className="flex items-center space-x-3 p-3 mb-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      user?.displayName?.[0] || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.displayName}</p>
                    <p className="text-xs text-slate-500 truncate capitalize">{user?.role.replace('_', ' ')}</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
