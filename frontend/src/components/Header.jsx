import React from 'react';
import { Menu, PlusCircle, ShieldAlert, Sparkles, Printer, FileText } from 'lucide-react';

export default function Header({
  activeTab,
  onNavigate,
  systemConfig,
  setIsMobileOpen,
  onPrint,
  hasActiveInspection,
}) {
  const titles = {
    dashboard: { title: 'LexScan Dashboard', subtitle: 'Automated QA inspection and compliance screening' },
    'new-inspection': { title: 'New Audit Scan', subtitle: 'Upload a clear image of the packaged commodity label for automated compliance screening' },
    analysis: { title: 'Automated Extraction Pipeline', subtitle: 'Multi-stage data extraction and rule evaluation pipeline' },
    results: { title: 'Audit Assessment', subtitle: 'Deterministic rule verification and evidence audit' },
    history: { title: 'Audit History', subtitle: 'Chronological audit log of evaluated packaged commodities' },
    reports: { title: 'Compliance Report', subtitle: 'Official QA inspection summary and notice' },
    settings: { title: 'System Settings & Rule Definitions', subtitle: 'Enterprise quality statutory rules (QA-001 to QA-010)' },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
      {/* Left Title & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg"
          title="Open Menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {current.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Print Button (active on results/reports) */}
        {(activeTab === 'results' || activeTab === 'reports') && onPrint && (
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-white rounded-lg shadow-2xs transition-colors"
          >
            <Printer size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Print / Save as PDF</span>
          </button>
        )}

        {/* View Full Report Button if on Results tab */}
        {activeTab === 'results' && hasActiveInspection && (
          <button
            onClick={() => onNavigate('reports')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg transition-colors"
          >
            <FileText size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">View Report</span>
          </button>
        )}

        {/* Prominent + New Inspection Button */}
        {activeTab !== 'new-inspection' && activeTab !== 'analysis' && (
          <button
            onClick={() => onNavigate('new-inspection')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg shadow-xs transition-all duration-150 hover:shadow-md"
          >
            <PlusCircle size={14} className="text-white" />
            <span>+ New Audit</span>
          </button>
        )}
      </div>
    </header>
  );
}
