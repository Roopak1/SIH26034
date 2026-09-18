import React from 'react';
import {
  Shield,
  BookOpen,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';

export default function Settings({ systemConfig }) {
  const rules = [
    {
      id: 'QA-001',
      title: 'Manufacturer / Packer / Importer Details',
      section: 'Guideline 6(1)(a) — LexScan Quality Assurance Standards',
      desc: 'Mandatory declaration of complete name and registered/operational address of the manufacturer, packer, or importer.',
      applicability: 'All packaged commodities',
    },
    {
      id: 'QA-002',
      title: 'Country of Origin Declaration',
      section: 'Guideline 6(1)(aa) — Mandatory Country of Origin / Import Declarations',
      desc: 'Mandatory declaration of country of origin for imported goods or clear domestic manufacturing indication.',
      applicability: 'Mandatory for imports; conditional for domestic goods',
    },
    {
      id: 'QA-003',
      title: 'Generic / Common Commodity Name',
      section: 'Guideline 6(1)(b) — Generic Identity Requirement',
      desc: 'Common or generic name of the commodity must be declared distinctly on the principal display panel (separate from brand name).',
      applicability: 'All packaged commodities',
    },
    {
      id: 'QA-004',
      title: 'Net Quantity Declaration in SI Units',
      section: 'Guideline 6(1)(c) — Standard Units of Weight/Measure',
      desc: 'Net quantity in standard SI units (g, kg, ml, L, N). Must not use non-standard units.',
      applicability: 'All packaged commodities',
    },
    {
      id: 'QA-005',
      title: 'Date of Manufacture or Pre-Packing',
      section: 'Guideline 6(1)(d) — Manufacturing / Packing Timeline',
      desc: 'Month and year of manufacture or pre-packing must be explicitly declared.',
      applicability: 'All packaged commodities',
    },
    {
      id: 'QA-006',
      title: 'Best Before / Use By / Expiry Date',
      section: 'Guideline 6(1)(e) — Perishable Commodity Expiry Regulation',
      desc: 'Standard expiry period or best before date for food, cosmetics, pharmaceuticals, and perishable items.',
      applicability: 'Perishable & ingestible commodities (Food, Pharma, Cosmetics)',
    },
    {
      id: 'QA-007',
      title: 'Maximum Retail Price (MRP in INR)',
      section: 'Guideline 6(1)(f) — Maximum Retail Price Regulation',
      desc: 'Conspicuous declaration of Maximum Retail Price (MRP) in Indian Rupees (₹).',
      applicability: 'All retail packaged commodities',
    },
    {
      id: 'QA-008',
      title: 'MRP Tax-Inclusive Indication',
      section: 'Guideline 6(1)(f) — Tax Inclusivity Requirement',
      desc: "Requirement that MRP is accompanied by 'Inclusive of all taxes' or equivalent wording.",
      applicability: 'All commodities where MRP is declared',
    },
    {
      id: 'QA-009',
      title: 'Consumer Care Helpline & Redressal',
      section: 'Guideline 6(1)(g) — Grievance Redressal Mechanism',
      desc: 'Name, address, telephone number, and email address of the consumer redressal cell / officer.',
      applicability: 'All packaged commodities',
    },
    {
      id: 'QA-010',
      title: 'Public Product Identity Cross-Check',
      section: 'Evidence Control — Grounded Reference Screening',
      desc: 'Compares visible product identity, package design, company, and address claims with public references. A match is not proof of authenticity; a mismatch is escalated for manual review.',
      applicability: 'When a usable public reference can be found',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Architectural Core Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Cpu size={18} />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            System Architecture Principle
          </h2>
        </div>
        <div className="p-4 bg-slate-50 text-slate-800 rounded-xl font-mono text-xs leading-relaxed border border-slate-200">
          <span className="text-emerald-400 font-bold">PRINCIPLE:</span> AI EXTRACTS AND INTERPRETS. DETERMINISTIC RULES MAKE COMPLIANCE DECISIONS.
          <br /><br />
          Image &rarr; Gemini Vision Extraction &rarr; Grounded Public Reference Cross-Check &rarr; Structured Pydantic Model &rarr; Deterministic Rule Engine (QA-001..QA-010) &rarr; QA Determination &amp; Audit Score
        </div>
      </div>

      {/* Statutory Rules Catalog */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Configured QA Compliance Rules
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Rules derived from LexScan Quality Assurance Standards and amendments.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {rules.map((r) => (
            <div key={r.id} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300">
                    {r.id}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{r.title}</h4>
                </div>
                <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {r.applicability}
                </span>
              </div>
              <div className="text-[11px] font-mono text-emerald-500/80 mt-1">{r.section}</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Runtime Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">System Diagnostic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">AI Service Status</span>
            <strong className={`block mt-1 ${systemConfig?.ai_service_configured ? 'text-emerald-500' : 'text-amber-500'}`}>
              {systemConfig?.ai_service_configured ? 'Key configured (connectivity untested)' : 'Not configured (demo only)'}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Active Model</span>
            <strong className="text-slate-800 block mt-1 font-mono">
              {systemConfig?.model || 'gemini-3.1-flash-lite'}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Active Storage Engine</span>
            <strong className="text-slate-800 block mt-1">
              Local JSON / Memory Abstraction
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
