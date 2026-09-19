import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  Building2,
  Inbox,
  History,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export const AppLayout: React.FC = () => {
  const { user, logout, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Subtle scroll listener to enhance glass opacity & shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: location.pathname === '/dashboard',
    },
    {
      to: '/clients',
      label: 'Clients',
      icon: Building2,
      isActive: location.pathname.startsWith('/clients'),
    },
    {
      to: '/review-queue',
      label: 'Review Queue',
      icon: Inbox,
      isActive: location.pathname.startsWith('/review-queue') || location.pathname.startsWith('/documents'),
    },
    {
      to: '/activity',
      label: 'Activity',
      icon: History,
      isActive: location.pathname.startsWith('/activity'),
    },
  ];

  const demoAccounts = [
    { name: 'Rohit Sharma', role: 'STAFF', email: 'rohit@auditflow.demo', firm: 'ABC & Co. (Firm A)' },
    { name: 'Aman Verma', role: 'REVIEWER', email: 'aman@auditflow.demo', firm: 'ABC & Co. (Firm A)' },
    { name: 'Raj Patel', role: 'STAFF', email: 'raj@auditflow.demo', firm: 'XYZ & Co. (Firm B)' },
    { name: 'Priya Nair', role: 'REVIEWER', email: 'priya@auditflow.demo', firm: 'XYZ & Co. (Firm B)' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased relative selection:bg-slate-200">
      {/* Subtle Apple-style Ambient Gradient behind Navigation */}
      <div
        className="absolute top-0 inset-x-0 h-48 bg-[radial-gradient(ellipse_60%_40%_at_50%_-20%,rgba(203,213,225,0.45),transparent_80%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating Liquid-Glass Top Navigation Bar */}
      <div className="sticky top-3.5 sm:top-4 z-40 px-3 sm:px-6 w-full pointer-events-none">
        <header
          className={cn(
            'pointer-events-auto mx-auto max-w-4xl lg:max-w-5xl h-12 rounded-full px-3.5 sm:px-4 py-1 sm:py-1.5 flex items-center justify-between transition-all duration-200',
            isScrolled ? 'glass-surface-scrolled' : 'glass-surface'
          )}
        >
          {/* Left: Geometric Mark + Brand (Clean link to Home /, no active tab highlight) */}
          <Link
            to="/"
            className="flex items-center gap-2 group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 rounded-full py-1 px-2 hover:opacity-80 transition-opacity"
            title="AuditFlow Home"
          >
            <div className="w-6 h-6 rounded-[7px] bg-slate-950 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors shrink-0">
              <div className="w-2 h-2 rounded-[2px] bg-white transform rotate-45" />
            </div>
            <span className="font-semibold text-slate-900 text-xs sm:text-sm tracking-tight">
              AuditFlow
            </span>
          </Link>

          {/* Center: Desktop Navigation Items (Highlighted only for active app routes) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-150',
                    item.isActive
                      ? 'bg-white text-slate-950 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.04)] border border-slate-900/[0.08]'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-900/[0.04] font-medium border border-transparent'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={item.isActive ? 2 : 1.75} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Firm Indicator & User Profile Trigger */}
          <div className="flex items-center gap-2">
            {/* Subtle Contextual Firm Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/[0.03] border border-slate-900/[0.05] text-[11px] font-medium text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate max-w-[120px]">{user?.firm?.name || 'Firm Tenant'}</span>
            </div>

            {/* User Profile Trigger & Floating Popover */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  'flex items-center gap-1.5 pl-1 pr-2 sm:pr-2.5 py-1 rounded-full hover:bg-slate-900/[0.04] transition-colors focus:outline-none border border-transparent',
                  userMenuOpen && 'bg-slate-900/[0.06] border-slate-900/[0.06]'
                )}
                aria-label="User profile and settings"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium text-[10px] shadow-xs shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-medium text-slate-800 hidden sm:inline-block max-w-[90px] truncate">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 text-slate-400 transition-transform duration-150',
                    userMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Floating Liquid-Glass Popover */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 glass-popover rounded-2xl p-2.5 shadow-popover z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* Current User Info Card */}
                  <div className="p-2 bg-slate-900/[0.03] rounded-xl border border-slate-900/[0.04] mb-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-900 truncate">
                        {user?.name}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0.2 rounded border leading-none',
                          user?.role === 'REVIEWER'
                            ? 'bg-amber-50 text-amber-800 border-amber-200/80 font-medium'
                            : 'bg-blue-50 text-blue-800 border-blue-200/80 font-medium'
                        )}
                      >
                        {user?.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                    <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-600">
                      <span className="text-slate-400">Firm Tenant</span>
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">
                        {user?.firm?.name} ({user?.firm?.code})
                      </span>
                    </div>
                  </div>

                  {/* Switch Demo Role Menu (crucial for evaluation) */}
                  <div className="py-1">
                    <div className="px-2 py-1 text-[10px] uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3 h-3 text-slate-500" />
                      <span>Switch Demo Account</span>
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.email}
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await switchDemoUser(acc.email);
                            navigate('/dashboard');
                          }}
                          className={cn(
                            'w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between',
                            user?.email === acc.email
                              ? 'bg-slate-900 text-white font-medium shadow-xs'
                              : 'text-slate-700 hover:bg-slate-900/[0.04]'
                          )}
                        >
                          <div className="truncate pr-2">
                            <div className="font-medium truncate">{acc.name}</div>
                            <div
                              className={cn(
                                'text-[10px] truncate',
                                user?.email === acc.email ? 'text-slate-300' : 'text-slate-400'
                              )}
                            >
                              {acc.firm}
                            </div>
                          </div>
                          <span
                            className={cn(
                              'text-[9px] px-1 py-0.2 rounded font-mono shrink-0',
                              user?.email === acc.email
                                ? 'bg-slate-800 text-slate-200'
                                : acc.role === 'REVIEWER'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            )}
                          >
                            {acc.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200/50 my-1.5" />

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50/80 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-950 rounded-full hover:bg-slate-900/[0.04] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown (Liquid Glass Card) */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 pointer-events-auto mx-auto max-w-sm glass-popover rounded-2xl p-3 shadow-popover space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Mobile Navigation Links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors',
                      item.isActive
                        ? 'bg-slate-900 text-white font-medium shadow-xs'
                        : 'text-slate-700 hover:bg-slate-900/[0.04]'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={item.isActive ? 2 : 1.75} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Firm & User Context */}
            <div className="pt-2 border-t border-slate-200/50 text-xs">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-600">
                <span>Firm: <strong className="text-slate-900 font-medium">{user?.firm?.name}</strong></span>
                <span className="font-mono text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                  {user?.firm?.code}
                </span>
              </div>
            </div>

            {/* Mobile Demo Role Switcher */}
            <div className="pt-2 border-t border-slate-200/50">
              <div className="px-2 py-1 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Switch Demo Account
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await switchDemoUser(acc.email);
                      navigate('/dashboard');
                    }}
                    className={cn(
                      'text-left p-2 rounded-lg text-[11px] border transition-colors',
                      user?.email === acc.email
                        ? 'bg-slate-900 text-white border-slate-900 font-medium'
                        : 'bg-white/60 text-slate-700 border-slate-200/60 hover:bg-white'
                    )}
                  >
                    <div className="font-medium truncate">{acc.name}</div>
                    <div
                      className={cn(
                        'text-[9px] font-mono',
                        user?.email === acc.email ? 'text-slate-300' : 'text-slate-500'
                      )}
                    >
                      {acc.role} • {acc.firm.includes('Firm A') ? 'Firm A' : 'Firm B'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Sign Out */}
            <div className="pt-2 border-t border-slate-200/50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50/80 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out ({user?.name})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area - Wide & Centered with No Left Sidebar Offset */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full pt-4 sm:pt-6 pb-20 relative z-10">
        <Outlet />
      </main>
    </div>
  );
};
