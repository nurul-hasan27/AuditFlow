import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { ShieldCheck, ArrowRight, Lock, Mail, Users } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Apple-style minimalist brand glyph */}
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-950 shadow-xs mb-3">
          <div className="w-3 h-3 rounded-[3px] bg-white transform rotate-45" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">AuditFlow</h1>
        <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
          Audit document review, without the scattered workflow.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white border border-slate-200/80 py-7 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl sm:px-8 text-xs">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@auditflow.demo"
                  className="block w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2 px-4 rounded-lg text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 transition-colors shadow-xs"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span>Sign in</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              )}
            </button>
          </form>

          {/* Seeded Demo 1-Click Fast Access */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-slate-400" />
                1-Click Demo Accounts
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Password: AuditFlow@123</span>
            </div>

            <div className="space-y-3">
              {demoLogins.map((group) => (
                <div key={group.firm} className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-200/60">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 mb-1.5">
                    <span>{group.firm}</span>
                    <span className="text-[9px] bg-white text-slate-500 px-1 py-0.2 rounded border border-slate-200 font-mono">
                      {group.badge}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.users.map((u) => (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => handleQuickLogin(u.email)}
                        className="text-left px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100/80 border border-slate-200/70 text-xs transition-colors flex flex-col group shadow-2xs"
                      >
                        <span className="font-medium text-slate-800 text-[11px] truncate">
                          {u.name.split(' ')[0]}
                        </span>
                        <span
                          className={`text-[9px] font-mono uppercase mt-0.5 ${
                            u.role === 'REVIEWER' ? 'text-amber-800 font-medium' : 'text-blue-700'
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
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multi-tenant isolation enforced at database query boundary</span>
        </div>
      </div>
    </div>
  );
};
