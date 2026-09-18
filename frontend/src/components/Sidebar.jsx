import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  Settings,
  UserCheck,
  LogOut,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onNavigate,
  officer,
  onLogout,
  systemConfig,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'new-inspection',
      label: 'New Inspection',
      icon: PlusCircle,
      badge: 'Primary',
    },
    {
      id: 'history',
      label: 'Inspection History',
      icon: History,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Compliance Reports',
      icon: FileText,
      badge: null,
    },
  ];

  const bottomItems = [
    {
      id: 'settings',
      label: 'Settings & Rules',
      icon: Settings,
    },
  ];

  const handleNav = (tabId) => {
    onNavigate(tabId);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-50 text-slate-900 flex flex-col justify-between border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Emblem Header */}
        <div>
          <div className="p-5 border-b border-slate-200/80 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm shrink-0">
                <Shield size={22} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold tracking-widest text-emerald-500 uppercase leading-none">
                  Quality Assurance
                </div>
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight mt-1 truncate">
                  LexScan Audit
                </h1>
                <div className="text-[10px] text-slate-500 font-medium">
                  Enterprise Engine V1
                </div>
              </div>
            </div>
          </div>

          {/* System Mode Indicator */}
          <div className="px-5 py-2.5 bg-white/40 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Engine Mode</span>
            {systemConfig?.ai_service_configured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                AI Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Rule Engine
              </span>
            )}
          </div>

          {/* Main Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Audit Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20'
                      : 'text-slate-500 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={17}
                      className={isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-800'}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && !isActive && (
                    <span className="text-[10px] font-bold bg-white text-slate-500 border border-slate-300 px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="text-emerald-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Area: Settings & Officer Profile */}
        <div>
          {/* Bottom Settings Link */}
          <div className="p-3 border-t border-slate-200/80">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-emerald-400'
                      : 'text-slate-500 hover:bg-white hover:text-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Officer Session Profile Card */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/80 border border-slate-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                  <UserCheck size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {officer?.name || 'QA Auditor'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {officer?.officer_id || 'QA-AUDIT-901'}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white rounded-lg transition-colors shrink-0"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
