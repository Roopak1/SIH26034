import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, Sparkles, CheckCircle2, FileCheck2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [officerId, setOfficerId] = useState('QA-AUDIT-901');
  const [password, setPassword] = useState('••••••••');
  const [department, setDepartment] = useState('Quality Assurance Wing');

  const handleSignIn = (e) => {
    e.preventDefault();
    onLogin({
      officer_id: officerId.trim() || 'QA-AUDIT-901',
      name: 'Lead Auditor',
      department: department,
    });
  };

  const handleDemoLogin = () => {
    onLogin({
      officer_id: 'QA-DEMO-2026',
      name: 'Demo QA Analyst',
      department: 'Corporate QA (Demo Session)',
      is_demo: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative Header Accent */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] mb-4">
          <Shield size={34} className="stroke-[2.2]" />
        </div>
        <div className="text-xs font-black tracking-widest text-emerald-600 uppercase">
          Enterprise Compliance • QA Division
        </div>
        <h2 className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">
          LexScan Quality Assurance
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
          Automated labeling standard verification engine.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-slate-200">
          <form className="space-y-4" onSubmit={handleSignIn}>
            {/* Officer ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Auditor ID
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  placeholder="e.g. QA-AUDIT-901"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-slate-900 bg-slate-50 placeholder-zinc-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Security Passcode
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 bg-slate-50 placeholder-zinc-500"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Designated Wing
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="block w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 bg-slate-50"
              >
                <option>Quality Assurance Wing</option>
                <option>Packaging Compliance Directorate</option>
                <option>Brand Standards Cell</option>
              </select>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-zinc-900"
              >
                <span>Sign In as Auditor</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-500 font-semibold">or instant access</span>
            </div>
          </div>

          {/* Demo Login Button */}
          <div>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-200 hover:border-slate-300 shadow-2xs transition-all duration-150"
            >
              <Sparkles size={15} className="text-emerald-400" />
              <span>Demo Login (Instant Evaluation)</span>
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-3">
              1-click access with pre-loaded mock data and rule engine scenarios.
            </p>
          </div>
        </div>

        {/* QA Disclaimer Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-500">LexScan Quality Assurance System</p>
          <p>
            Prototype screening result. Final QA determination should be verified by an authorized QA officer and applicable current regulations.
          </p>
        </div>
      </div>
    </div>
  );
}
