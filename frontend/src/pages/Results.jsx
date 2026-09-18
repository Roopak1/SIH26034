import React, { useState } from 'react';
import {
  FileText,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Printer,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowLeft,
  Calendar,
  Building2,
  Package,
  SearchCheck,
  ExternalLink,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import CheckCard from '../components/CheckCard';
import CheckDetailModal from '../components/CheckDetailModal';
import ScoreMeter from '../components/ScoreMeter';
import ExtractedInfoTable from '../components/ExtractedInfoTable';
import ImagePreviewCard from '../components/ImagePreviewCard';
import { runConsistencyCheck } from '../services/api';

export default function Results({
  inspection,
  imageFile,
  onNewInspection,
  onViewReport,
  onPrint,
}) {
  const [activeView, setActiveView] = useState('checks'); // 'checks' | 'extracted'
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConsistencyChecking, setIsConsistencyChecking] = useState(false);
  const [consistencyResult, setConsistencyResult] = useState(null);
  const [consistencyError, setConsistencyError] = useState(null);

  if (!inspection) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <div className="text-slate-500 mb-2">No active audit selected.</div>
        <button
          onClick={onNewInspection}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg"
        >
          Start New Audit
        </button>
      </div>
    );
  }

  const {
    inspection_id,
    status,
    score = 0,
    category = 'Food',
    product = {},
    checks = [],
    summary = {},
    image_metadata,
    created_at,
    is_demo,
    ai_model,
  } = inspection;

  const webVerification = product.web_verification || {};
  const identityStatus = (webVerification.identity_status || 'NOT_RUN').toUpperCase();
  const rawConfidence = Number(webVerification.confidence);
  const confidencePercent = Number.isFinite(rawConfidence)
    ? Math.round(rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence)
    : 0;
  const identityTone = identityStatus === 'MISMATCH'
    ? 'border-rose-300 bg-rose-50 text-rose-900'
    : identityStatus === 'MATCH'
    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
    : identityStatus === 'NOT_APPLICABLE'
    ? 'border-slate-200 bg-slate-50 text-slate-700'
    : 'border-amber-300 bg-amber-50 text-amber-900';

  const handleOpenCheckModal = (chk) => {
    setSelectedCheck(chk);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedCheck(null);
    setIsModalOpen(false);
  };

  const handleConsistencyCheck = async () => {
    if (!imageFile || isConsistencyChecking) return;
    setIsConsistencyChecking(true);
    setConsistencyError(null);
    try {
      const result = await runConsistencyCheck(imageFile, category);
      setConsistencyResult(result);
    } catch (error) {
      setConsistencyResult(null);
      setConsistencyError(error.message || 'AI consistency check failed.');
    } finally {
      setIsConsistencyChecking(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner: Product ID & Overall Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-300 px-2.5 py-1 rounded-md">
                {inspection_id}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-md">
                {category || product.category || 'General Commodity'}
              </span>
              {is_demo && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  DEMO MODE
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
              {product.product_name || product.generic_name || 'Packaged Commodity'}
            </h1>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Manufacturer: <strong className="text-slate-800">{product.manufacturer?.name || 'Unverified'}</strong></span>
              <span>•</span>
              <span className="font-mono">
                {new Date(created_at || Date.now()).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Overall Status Badge & Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-2">
                Overall Determination:
              </span>
              <StatusBadge status={status} size="lg" />
            </div>

            <button
              onClick={onViewReport}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-200 rounded-xl shadow-2xs transition-colors"
            >
              <FileText size={15} />
              <span>Full Report</span>
            </button>

            <button
              onClick={onNewInspection}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle size={15} className="text-white" />
              <span>+ New Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Public identity cross-check. A match is deliberately not labelled as proof of authenticity. */}
      <div className={`rounded-2xl border shadow-xs p-5 ${identityTone}`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <SearchCheck size={20} className="shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold">Public product identity cross-check</h2>
                <span className="text-[10px] font-black tracking-wider px-2 py-1 rounded border border-current/20">
                  {identityStatus}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed max-w-3xl">
                {webVerification.summary || (
                  identityStatus === 'MATCH'
                    ? 'Visible identity is consistent with a public reference; this is not proof that the physical item is genuine.'
                    : 'No defensible public identity result was recorded. The item must not be treated as authentic.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[11px] shrink-0">
            <span><strong>Image surface:</strong> {webVerification.image_view || 'UNKNOWN'}</span>
            <span><strong>Confidence:</strong> {confidencePercent}%</span>
            <span><strong>Web search:</strong> {webVerification.search_performed ? 'Used' : 'Not used'}</span>
            <span><strong>More images:</strong> {webVerification.needs_more_images ? 'Needed' : 'Not indicated'}</span>
            {ai_model && <span className="col-span-2"><strong>AI model:</strong> {ai_model}</span>}
          </div>
        </div>

        {imageFile && !is_demo && (
          <div className="mt-4 pt-3 border-t border-current/15 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={handleConsistencyCheck}
              disabled={isConsistencyChecking}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-current/25 text-[11px] font-bold hover:opacity-75 disabled:opacity-50"
            >
              {isConsistencyChecking ? 'Running two extractions…' : 'Check model consistency'}
            </button>
            <span className="text-[11px] opacity-80">Repeats this image through the same model and compares core fields.</span>
          </div>
        )}

        {consistencyResult && (
          <div className="mt-3 rounded-xl border border-current/20 bg-white/50 p-3 text-[11px]">
            <strong>Repeatability: {consistencyResult.consistency?.status || 'UNKNOWN'}</strong>
            <span className="ml-2">{consistencyResult.consistency?.agreement_score ?? 0}% agreement</span>
            {consistencyResult.consistency?.differing_fields?.length > 0 && (
              <div className="mt-1">Differences: {consistencyResult.consistency.differing_fields.join(', ')}</div>
            )}
            <div className="mt-1 opacity-80">
              Models: {consistencyResult.model}
              {consistencyResult.second_model && consistencyResult.second_model !== consistencyResult.model
                ? ` → ${consistencyResult.second_model}`
                : ' (same model)'}
            </div>
          </div>
        )}

        {consistencyError && (
          <div className="mt-3 rounded-xl border border-rose-300 bg-rose-50/70 p-3 text-[11px] text-rose-900">
            Consistency check unavailable: {consistencyError}
          </div>
        )}

        {webVerification.sources?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-current/15">
            <div className="text-[10px] font-black uppercase tracking-wider mb-2">Public references used</div>
            <div className="flex flex-wrap gap-2">
              {webVerification.sources.slice(0, 5).map((source, index) => (
                source.url ? (
                  <a
                    key={`${source.url}-${index}`}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] underline underline-offset-2 hover:opacity-70"
                  >
                    {source.title || source.url}
                    <ExternalLink size={11} />
                  </a>
                ) : null
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Score Meter and Summary Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prototype Compliance Score Meter */}
        <div className="lg:col-span-1">
          <ScoreMeter score={score} status={status} />
        </div>

        {/* Summary Count Breakdown Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">PASS</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
              {summary.pass_count ?? summary.pass ?? 0}
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-1 font-medium">
              Rules Verified
            </div>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">FAIL</span>
              <XCircle size={16} className="text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">
              {summary.fail_count ?? summary.fail ?? 0}
            </div>
            <div className="text-[10px] text-rose-500/80 mt-1 font-medium">
              Definite Violations
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/20 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">REVIEW</span>
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
              {summary.review_count ?? summary.review ?? 0}
            </div>
            <div className="text-[10px] text-amber-500/80 mt-1 font-medium">
              Needs Officer Check
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-300 bg-white/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">N/A</span>
              <Layers size={16} className="text-slate-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
              {summary.na_count ?? summary.na ?? 0}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-medium">
              Not Applicable
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs: Compliance Checks vs Extracted Information */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveView('checks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeView === 'checks'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
              : 'text-slate-500 hover:bg-white'
          }`}
        >
          Compliance Checks ({checks.length})
        </button>

        <button
          onClick={() => setActiveView('extracted')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeView === 'extracted'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
              : 'text-slate-500 hover:bg-white'
          }`}
        >
          Extracted Product Information
        </button>
      </div>

      {/* Tab 1: Compliance Checks (Two-column layout) */}
      {activeView === 'checks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Preview & Details */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Inspected Label Image</span>
                {is_demo && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                    DEMO MOCK
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col items-center">
                <div className="w-full h-56 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                  <img
                    src={
                      product.image_url ||
                      (is_demo ? (product.product_name?.includes('Butter') ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="%230F2942"/><text x="50" y="80" fill="%23FFF" font-size="28">ROYAL TREATS</text><text x="50" y="130" fill="%23FFF" font-size="20">Butter Delight Biscuits</text><text x="50" y="200" fill="%23FCD34D" font-size="16">Net Wt: 200g | MRP: Rs. 80.00 (Incl taxes)</text><text x="50" y="250" fill="%23FFF" font-size="14">Mfg: 07/2026 | Best Before: 6 mos</text><text x="50" y="300" fill="%23CBD5E1" font-size="12">ABC Foods, Hyderabad - 500076</text></svg>' : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="%237F1D1D"/><text x="50" y="80" fill="%23FFF" font-size="28">CRUNCHY BITES</text><text x="50" y="130" fill="%23FECACA" font-size="18">Price: Rs. 120 | Net: 500g</text><text x="50" y="200" fill="%23FCA5A5" font-size="14">[MISSING ADDRESS, MFG DATE &amp; CARE]</text></svg>') : null) ||
                      '/package_placeholder.png'
                    }
                    alt="Package Label"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="w-full mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Image Quality</span>
                    <span className="font-semibold text-emerald-400">
                      {image_metadata?.quality_label || 'GOOD'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Text Visibility</span>
                    <span className="font-semibold text-blue-400">
                      {image_metadata?.text_visibility || 'CLEAR'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Dimensions</span>
                    <span className="font-mono text-slate-800">
                      {image_metadata?.width ? `${image_metadata.width} × ${image_metadata.height} px` : '1024 × 768 px'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Compliance Checks List */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Statutory Quality Checks (QA-001 — QA-010)
              </h3>
              <span className="text-xs text-slate-500">
                Click any check for verbatim evidence & rationale
              </span>
            </div>

            <div className="space-y-3">
              {checks.map((chk) => (
                <CheckCard
                  key={chk.rule_id}
                  check={chk}
                  onClick={() => handleOpenCheckModal(chk)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Extracted Product Information Table */}
      {activeView === 'extracted' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Extracted Package Declarations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured representation of declarations identified by AI on visible label surfaces. Missing fields are preserved as 'Not detected'.
            </p>
          </div>
          <ExtractedInfoTable product={product} />
        </div>
      )}

      {/* Statutory Legal Disclaimer Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
        <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>QA Disclaimer:</strong> Prototype screening result. Final quality determination should be verified by an authorized QA officer and applicable current regulations.
        </p>
      </div>

      {/* Interactive Check Details Modal */}
      <CheckDetailModal
        check={selectedCheck}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
