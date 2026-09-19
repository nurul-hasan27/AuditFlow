import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { FileCheck2, ShieldCheck, ArrowRight, Lock, Mail, Users } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toastSuccess('Signed in successfully.');
      navigate('/dashboard');
    } catch (err: any) {
      toastError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogins = [
    {
      firm: 'Firm A — ABC & Co.',
      badge: 'Tenant A',
      users: [
        { name: 'Rohit Sharma', role: 'STAFF', email: 'rohit@auditflow.demo' },
        { name: 'Aman Verma', role: 'REVIEWER', email: 'aman@auditflow.demo' },
      ],
    },
    {
      firm: 'Firm B — XYZ & Co.',
      badge: 'Tenant B',
      users: [
        { name: 'Raj Patel', role: 'STAFF', email: 'raj@auditflow.demo' },
        { name: 'Priya Nair', role: 'REVIEWER', email: 'priya@auditflow.demo' },
      ],
    },
  ];

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('AuditFlow@123');
    try {
      setLoading(true);
      await login(demoEmail, 'AuditFlow@123');
      toastSuccess(`Signed in as ${demoEmail}`);
      navigate('/dashboard');
    } catch (err: any) {
      toastError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20 mb-4">
          <FileCheck2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white">AuditFlow</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          "Audit document review, without the scattered workflow."
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@auditflow.demo"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Seeded Demo User Fast-Access */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Demo 1-Click Accounts
              </span>
              <span className="text-[11px] text-slate-400 font-mono">PWD: AuditFlow@123</span>
            </div>

            <div className="space-y-4">
              {demoLogins.map((group) => (
                <div key={group.firm} className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
                    <span>{group.firm}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                      {group.badge}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.users.map((u) => (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => handleQuickLogin(u.email)}
                        className="text-left px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs transition-colors flex flex-col group"
                      >
                        <span className="font-semibold text-slate-200 group-hover:text-white truncate">
                          {u.name.split(' ')[0]}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase mt-0.5 ${
                            u.role === 'REVIEWER' ? 'text-amber-400' : 'text-blue-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Multi-tenant isolation enforced at database query boundary</span>
        </div>
      </div>
    </div>
  );
};
