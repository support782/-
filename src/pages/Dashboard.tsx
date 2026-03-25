import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  Building2, 
  HandCoins, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  PiggyBank
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import { UserProfile } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeLoans: 0,
    totalSavings: 0,
    todayCollection: 0
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          axios.get('/api/stats'),
          axios.get('/api/auth/me')
        ]);
        setStats(statsRes.data);
        setUser(userRes.data.user);
        // Transactions are not implemented yet, so we'll keep it empty
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = [
    { name: 'Jan', collection: 4000, savings: 2400 },
    { name: 'Feb', collection: 3000, savings: 1398 },
    { name: 'Mar', collection: 2000, savings: 9800 },
    { name: 'Apr', collection: 2780, savings: 3908 },
    { name: 'May', collection: 1890, savings: 4800 },
    { name: 'Jun', collection: 2390, savings: 3800 },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mt-1">
        {typeof value === 'number' && title.includes('Savings') ? `৳${value.toLocaleString()}` : value}
      </p>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          Dashboard Overview
          {user?.kycStatus === 'verified' && (
            <span className="inline-flex items-center ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <CheckCircle2 size={12} className="mr-1" /> Verified
            </span>
          )}
        </h1>
        <p className="text-slate-500">Welcome back, {user?.displayName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={stats.totalMembers} icon={Users} color="bg-blue-500" trend={12} />
        <StatCard title="Active Loans" value={stats.activeLoans} icon={HandCoins} color="bg-amber-500" trend={-5} />
        <StatCard title="Total Savings" value={stats.totalSavings} icon={PiggyBank} color="bg-emerald-500" trend={8} />
        <StatCard title="Today's Collection" value={`৳${stats.todayCollection}`} icon={TrendingUp} color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Collection vs Savings</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="collection" stroke="#4f46e5" fillOpacity={1} fill="url(#colorColl)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {tx.type === 'deposit' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 capitalize">{tx.type}</p>
                      <p className="text-xs text-slate-500">{tx.timestamp ? format(new Date(tx.timestamp), 'MMM dd, hh:mm a') : 'Just now'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 uppercase font-medium">{tx.method}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-500 text-sm">No recent transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
