import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  Building2,
  Inbox,
  History,
  LogOut,
  Menu,
  X,
  FileCheck2,
  Users,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export const AppLayout: React.FC = () => {
  const { user, logout, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Building2 },
    { to: '/review-queue', label: 'Review Queue', icon: Inbox },
    { to: '/activity', label: 'Audit Trail', icon: History },
  ];

  const demoAccounts = [
    { name: 'Rohit (Firm A)', role: 'STAFF', email: 'rohit@auditflow.demo', firm: 'ABC & Co.' },
    { name: 'Aman (Firm A)', role: 'REVIEWER', email: 'aman@auditflow.demo', firm: 'ABC & Co.' },
    { name: 'Raj (Firm B)', role: 'STAFF', email: 'raj@auditflow.demo', firm: 'XYZ & Co.' },
    { name: 'Priya (Firm B)', role: 'REVIEWER', email: 'priya@auditflow.demo', firm: 'XYZ & Co.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight">AuditFlow</div>
            <div className="text-[10px] text-slate-400 font-mono leading-none">{user?.firm?.name}</div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation (Desktop & Mobile drawer) */}
      <aside
        className={cn(
          'bg-slate-900 text-slate-300 w-full md:w-64 shrink-0 flex flex-col border-r border-slate-800 z-40 transition-all duration-200',
          mobileMenuOpen ? 'block' : 'hidden md:flex'
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <FileCheck2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
              AuditFlow
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-mono px-1.5 py-0.5 rounded border border-blue-400/30">
                MVP
              </span>
            </h1>
            <p className="text-xs text-slate-400 truncate max-w-[150px] font-medium">
              {user?.firm?.name || 'Audit Workspace'}
            </p>
          </div>
        </div>

        {/* Firm Tenant Isolation Badge */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Isolated Tenant:</span>
          </div>
          <span className="font-mono text-emerald-400 font-medium text-[11px] bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
            {user?.firm?.code || 'TENANT'}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Demo Switcher Menu */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 transition-colors border border-slate-700/50"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Switch Demo User
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {demoMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-700">
                  Select Role & Firm
                </div>
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={async () => {
                      setDemoMenuOpen(false);
                      await switchDemoUser(acc.email);
                      navigate('/dashboard');
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-700 transition-colors',
                      user?.email === acc.email && 'bg-blue-900/40 text-blue-300 font-medium'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{acc.name}</span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.2 rounded font-mono',
                          acc.role === 'REVIEWER'
                            ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                            : 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                        )}
                      >
                        {acc.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">{acc.firm}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wide uppercase flex items-center gap-1">
                <span
                  className={cn(
                    'inline-block w-1.5 h-1.5 rounded-full',
                    user?.role === 'REVIEWER' ? 'bg-amber-400' : 'bg-blue-400'
                  )}
                />
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operational Status Bar */}
        <header className="hidden md:flex h-14 border-b border-slate-200 bg-white items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Firm Context:</span>
            <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {user?.firm?.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Active Role:</span>
            <span
              className={cn(
                'text-xs font-bold px-2.5 py-1 rounded-md tracking-wide uppercase font-mono border',
                user?.role === 'REVIEWER'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              )}
            >
              {user?.role}
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-medium text-slate-600">{user?.name}</span>
          </div>
        </header>

        {/* Page View Body */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
