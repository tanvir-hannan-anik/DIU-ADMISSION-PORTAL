import React, { useState } from 'react';
import { Navigation } from '../common/Navigation';

/* ─── Waiver logic (from official waiver-policy2025.pdf) ─────── */
// "Golden GPA-5" = GPA 5.00 with A+ in ALL subjects (including 4th subject)
// "GPA-5"        = GPA 5.00 (may have A, not all A+)

const PROGRAM_CATEGORIES = [
  { id: 'sit', label: 'SIT / BE / AHS / Engineering', short: 'SIT/Engineering' },
  { id: 'hss', label: 'Humanities & Social Sciences', short: 'Humanities/BBA' },
  { id: 'cse', label: 'CSE / SWE',                    short: 'CSE / SWE' },
  { id: 'pharm', label: 'B.Pharm / LLB',              short: 'B.Pharm / LLB' },
];

// Returns { waiver: number, sgpa: number, label: string } | null
function getBangladeshiWaiver(category, sscGolden, sscGpa5, hscGolden, hscGpa) {
  const hsc5   = hscGpa >= 5.00;
  const hsc490 = hscGpa >= 4.90;

  if (category === 'sit' || category === 'hss') {
    const hsc450 = hscGpa >= 4.50;
    const hsc475 = hscGpa >= 4.75;
    if (hscGolden && sscGolden) return { waiver: 50, sgpa: 3.25, label: 'Golden GPA-5 both SSC & HSC' };
    if (hscGolden)              return { waiver: 30, sgpa: 3.00, label: 'Golden GPA-5 in HSC' };
    if (hsc5 && sscGpa5)        return { waiver: 25, sgpa: 3.00, label: 'GPA-5 both SSC & HSC' };
    if (hsc5)                   return { waiver: 20, sgpa: 3.00, label: 'GPA-5 in HSC' };
    if (hsc490)                 return { waiver: 15, sgpa: 3.00, label: 'HSC GPA 4.90–4.99' };
    if (category === 'sit' && hsc475) return { waiver: 10, sgpa: 3.00, label: 'HSC GPA 4.75–4.89' };
    if (category === 'hss' && hsc450) return { waiver: 10, sgpa: 3.00, label: 'HSC GPA 4.50–4.89' };
    return null;
  }
  if (category === 'cse') {
    if (hscGolden && sscGolden) return { waiver: 40, sgpa: 3.25, label: 'Golden GPA-5 both SSC & HSC' };
    if (hscGolden)              return { waiver: 20, sgpa: 3.00, label: 'Golden GPA-5 in HSC' };
    if (hsc5 && sscGpa5)        return { waiver: 15, sgpa: 3.00, label: 'GPA-5 both SSC & HSC' };
    if (hsc5)                   return { waiver: 10, sgpa: 3.00, label: 'GPA-5 in HSC' };
    return null;
  }
  if (category === 'pharm') {
    if (hscGolden && sscGolden) return { waiver: 20, sgpa: 3.00, label: 'Golden GPA-5 both SSC & HSC' };
    if (hscGolden)              return { waiver: 15, sgpa: 3.00, label: 'Golden GPA-5 in HSC' };
    if (hsc5)                   return { waiver: 10, sgpa: 3.00, label: 'GPA-5 in HSC' };
    return null;
  }
  return null;
}

// English Medium waiver (not applicable for LLB/B.Pharm/CSE/SWE)
const ENGLISH_MEDIUM_TIERS = [
  { label: '5 "A"s in O levels + 2 "A"s in A levels', waiver: 75, sgpa: 3.50 },
  { label: '1 "A" + 1 "B" in A levels',                waiver: 50, sgpa: 3.25 },
  { label: '2 "B"s in A levels',                       waiver: 40, sgpa: 3.25 },
  { label: '1 "A" + 1 "C" in A levels',                waiver: 30, sgpa: 3.00 },
  { label: '1 "B" + 1 "C" in A levels',                waiver: 20, sgpa: 3.00 },
];

// Waiver table per category for display
const WAIVER_TABLES = {
  sit: [
    { result: 'Golden GPA-5 both in SSC and HSC', waiver: 50, sgpa: 3.25 },
    { result: 'Golden GPA-5 in HSC',              waiver: 30, sgpa: 3.00 },
    { result: 'GPA-5 both in SSC and HSC',        waiver: 25, sgpa: 3.00 },
    { result: 'GPA-5 in HSC',                     waiver: 20, sgpa: 3.00 },
    { result: 'HSC GPA 4.90–4.99',                waiver: 15, sgpa: 3.00 },
    { result: 'HSC GPA 4.75–4.89',                waiver: 10, sgpa: 3.00 },
  ],
  hss: [
    { result: 'Golden GPA-5 both in SSC and HSC', waiver: 50, sgpa: 3.25 },
    { result: 'Golden GPA-5 in HSC',              waiver: 30, sgpa: 3.00 },
    { result: 'GPA-5 both in SSC and HSC',        waiver: 25, sgpa: 3.00 },
    { result: 'GPA-5 in HSC',                     waiver: 20, sgpa: 3.00 },
    { result: 'HSC GPA 4.90–4.99',                waiver: 15, sgpa: 3.00 },
    { result: 'HSC GPA 4.50–4.89',                waiver: 10, sgpa: 3.00 },
  ],
  cse: [
    { result: 'Golden GPA-5 both in SSC and HSC', waiver: 40, sgpa: 3.25 },
    { result: 'Golden GPA-5 in HSC',              waiver: 20, sgpa: 3.00 },
    { result: 'GPA-5 both in SSC and HSC',        waiver: 15, sgpa: 3.00 },
    { result: 'GPA-5 in HSC',                     waiver: 10, sgpa: 3.00 },
  ],
  pharm: [
    { result: 'Golden GPA-5 both in SSC and HSC', waiver: 20, sgpa: 3.00 },
    { result: 'Golden GPA-5 in HSC',              waiver: 15, sgpa: 3.00 },
    { result: 'GPA-5 in HSC',                     waiver: 10, sgpa: 3.00 },
  ],
};

const OTHER_SCHOLARSHIPS = [
  { title: 'Need-Based Waiver',              icon: 'volunteer_activism', desc: 'For students facing financial hardship who maintain SGPA ≥ 3.00. Apply via online Financial Aid Form (Tk 102). Must appear before Viva-Board.' },
  { title: "Freedom Fighter Quota",          icon: 'military_tech',      desc: '100% tuition fee waiver for children of freedom fighters. Submit original Freedom Fighter certificate at the admission office.' },
  { title: 'Chairman Endowment Fund',        icon: 'account_balance',    desc: 'For students in financial crisis (loss/illness of guardian) with SGPA ≥ 3.00 and currently receiving less than 30% waiver.' },
  { title: 'Prof. Dr. M. Lutfar Rahman Scholarship', icon: 'workspace_premium', desc: 'BDT 10,000/year for top CGPA student of FSIT who has completed ≥ 36 credits in the calendar year.' },
  { title: 'Razia Begum Scholarship',        icon: 'stars',              desc: 'BDT 10,000/year for highest CGPA student of FBE and FSIT each, completing ≥ 36 credits in the year.' },
  { title: 'Mofiz Uddin Majumder Fund',      icon: 'favorite',           desc: 'One-time scholarship for undergraduate students in financial crisis who have lost their father before admission. CGPA ≥ 3.00.' },
  { title: 'Delwar Hussain Chowdhury Scholarship', icon: 'emoji_events', desc: 'One-time scholarship for undergraduate students who have lost their father and are not already receiving > 30% waiver.' },
  { title: 'Waiver regarding CSR',           icon: 'corporate_fare',     desc: "Up to 100% tuition fee waiver for meritorious/poor students, orphans, and street children under DIU's CSR programme." },
];

const SEMESTER_FEE = 30000; // BDT per semester (tuition only, ~11 credits)
const TOTAL_SEMESTERS = 8;

export const ScholarshipPage = () => {
  const [activeCategory, setActiveCategory] = useState('sit');

  /* ── Calculator state ── */
  const [background, setBackground] = useState('bd'); // 'bd' | 'em'
  const [calcCategory, setCalcCategory] = useState('sit');

  // Bangladeshi board inputs
  const [sscGolden, setSscGolden] = useState(false);
  const [sscGpa,    setSscGpa]    = useState('');
  const [hscGolden, setHscGolden] = useState(false);
  const [hscGpa,    setHscGpa]    = useState('');

  // English Medium input
  const [emTier, setEmTier] = useState('');

  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');

  const calculate = () => {
    setResult(null);
    setError('');

    if (background === 'em') {
      if (calcCategory === 'pharm' || calcCategory === 'cse') {
        setError('English Medium waiver is not applicable for CSE, SWE, B.Pharm, or LLB programs.');
        return;
      }
      if (!emTier) { setError('Please select your O/A level result.'); return; }
      const tier = ENGLISH_MEDIUM_TIERS[parseInt(emTier)];
      buildResult(tier.waiver, tier.sgpa, tier.label);
      return;
    }

    // Bangladeshi board
    const gpa = parseFloat(hscGpa);
    if (isNaN(gpa) || gpa < 0 || gpa > 5) {
      setError('Please enter a valid HSC GPA between 0.00 and 5.00.');
      return;
    }
    // Golden GPA forces GPA to 5.0 automatically
    const effectiveHscGpa = hscGolden ? 5.0 : gpa;
    const effectiveSscGpa5 = sscGolden ? true : parseFloat(sscGpa) >= 5.0;

    const tier = getBangladeshiWaiver(calcCategory, sscGolden, effectiveSscGpa5, hscGolden, effectiveHscGpa);
    if (!tier) {
      setResult({ waiver: 0, sgpa: null, label: 'No result-based waiver', payable: SEMESTER_FEE, totalTuition: SEMESTER_FEE * TOTAL_SEMESTERS });
      return;
    }
    buildResult(tier.waiver, tier.sgpa, tier.label);
  };

  const buildResult = (waiver, sgpa, label) => {
    const waivedAmt = Math.round(SEMESTER_FEE * waiver / 100);
    const payable   = SEMESTER_FEE - waivedAmt;
    setResult({ waiver, sgpa, label, waivedAmt, payable, totalTuition: payable * TOTAL_SEMESTERS });
  };

  const waiverColour = (w) => {
    if (w >= 50) return 'text-green-600';
    if (w >= 25) return 'text-blue-600';
    if (w > 0)   return 'text-yellow-600';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Manrope']">
      <Navigation />

      {/* ── Hero ── */}
      <div className="pt-16 md:pt-20 bg-gradient-to-br from-[#0c1282] to-[#1a237e] text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <span className="material-symbols-outlined text-5xl mb-3 opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Scholarships & Waivers</h1>
          <p className="text-white/70 text-sm max-w-xl mx-auto">
            Official waiver policy (Spring 2026). 24,972 students received financial support in 2024.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">

        {/* ── Waiver Policy Table ── */}
        <section>
          <h2 className="text-xl font-bold text-[#0c1282] mb-1">Result-Based Waiver Policy</h2>
          <p className="text-sm text-gray-500 mb-4">
            Based on HSC/SSC result (including 4th subject). Select your program type:
          </p>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PROGRAM_CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeCategory === c.id
                    ? 'bg-[#0c1282] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0c1282]/40'
                }`}
              >
                {c.short}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0c1282] text-white text-left">
                  <th className="px-5 py-3 font-semibold">Result (SSC/HSC including 4th subject)</th>
                  <th className="px-5 py-3 font-semibold text-center">Waiver</th>
                  <th className="px-5 py-3 font-semibold text-center hidden sm:table-cell">SGPA Required</th>
                </tr>
              </thead>
              <tbody>
                {WAIVER_TABLES[activeCategory].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 text-gray-800">{row.result}</td>
                    <td className={`px-5 py-3 text-center font-bold text-base ${waiverColour(row.waiver)}`}>{row.waiver}%</td>
                    <td className="px-5 py-3 text-center text-gray-600 hidden sm:table-cell">{row.sgpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activeCategory === 'sit' && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Note: This table does not apply to B.Pharm, CSE, and SWE. Use their respective tabs above.
            </p>
          )}
          {activeCategory === 'hss' && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Note: Not applicable for LLB. Only GPA-5.00 in HSC and other quotas will be considered for LLB.
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            * <strong>Golden GPA-5</strong> = GPA 5.00 with A+ in ALL subjects (including 4th subject). &nbsp;
            <strong>GPA-5</strong> = GPA 5.00 (may include A grade). &nbsp;
            Waiver applies to tuition fee only — not admission fee, semester fee, lab fee, library fee, etc.
          </p>
        </section>

        {/* ── Unified Fee & Waiver Calculator ── */}
        <section>
          <h2 className="text-xl font-bold text-[#0c1282] mb-1">Tuition Fee & Waiver Calculator</h2>
          <p className="text-sm text-gray-500 mb-5">
            Enter your academic results to instantly see your waiver percentage and estimated fee breakdown.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">

              {/* LEFT — Inputs */}
              <div className="space-y-5">

                {/* Program category */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Program Category *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROGRAM_CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setCalcCategory(c.id); setResult(null); setError(''); }}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                          calcCategory === c.id
                            ? 'bg-[#0c1282] text-white'
                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#0c1282]/40'
                        }`}
                      >
                        {c.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Education background */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Education Background *</label>
                  <div className="flex gap-3">
                    {[{ id: 'bd', label: 'Bangladeshi Board (SSC/HSC)' }, { id: 'em', label: 'English Medium (O/A Level)' }].map(b => (
                      <button
                        key={b.id}
                        onClick={() => { setBackground(b.id); setResult(null); setError(''); }}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          background === b.id
                            ? 'bg-[#0c1282] text-white'
                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#0c1282]/40'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bangladeshi board fields */}
                {background === 'bd' && (
                  <>
                    {/* SSC */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">SSC Result</label>
                      <div className="flex gap-3 items-center mb-2">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input type="checkbox" checked={sscGolden} onChange={e => { setSscGolden(e.target.checked); if (e.target.checked) setSscGpa('5.00'); }}
                            className="w-4 h-4 accent-[#0c1282]" />
                          <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">Golden GPA-5</span>
                        </label>
                      </div>
                      <input
                        type="number" min="0" max="5" step="0.01"
                        value={sscGpa}
                        onChange={e => { setSscGpa(e.target.value); setSscGolden(false); }}
                        placeholder="Enter SSC GPA (e.g. 5.00)"
                        disabled={sscGolden}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1282]/30 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>

                    {/* HSC */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">HSC Result *</label>
                      <div className="flex gap-3 items-center mb-2">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input type="checkbox" checked={hscGolden} onChange={e => { setHscGolden(e.target.checked); if (e.target.checked) setHscGpa('5.00'); }}
                            className="w-4 h-4 accent-[#0c1282]" />
                          <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">Golden GPA-5</span>
                        </label>
                      </div>
                      <input
                        type="number" min="0" max="5" step="0.01"
                        value={hscGpa}
                        onChange={e => { setHscGpa(e.target.value); setHscGolden(false); }}
                        placeholder="Enter HSC GPA (e.g. 4.92)"
                        disabled={hscGolden}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1282]/30 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                  </>
                )}

                {/* English Medium fields */}
                {background === 'em' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">O/A Level Result *</label>
                    {(calcCategory === 'pharm' || calcCategory === 'cse') ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                        English Medium waiver is not applicable for CSE, SWE, B.Pharm, or LLB programs.
                        Separate waiver tables apply — please switch to Bangladeshi Board.
                      </div>
                    ) : (
                      <select
                        value={emTier}
                        onChange={e => setEmTier(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1282]/30"
                      >
                        <option value="">Select your result…</option>
                        {ENGLISH_MEDIUM_TIERS.map((t, i) => (
                          <option key={i} value={i}>{t.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

                <button
                  onClick={calculate}
                  className="w-full bg-[#0c1282] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0c1282]/85 active:scale-95 transition-all"
                >
                  Calculate My Fees
                </button>
              </div>

              {/* RIGHT — Result */}
              <div className="flex flex-col">
                {!result && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>calculate</span>
                    <p className="text-xs text-gray-400">Fill in your details and click<br /><strong>Calculate My Fees</strong> to see your results.</p>
                  </div>
                )}

                {result && (
                  <div className="flex-1 bg-gradient-to-br from-[#0c1282]/5 to-white rounded-xl border border-[#0c1282]/15 p-5 space-y-4">
                    {/* Waiver badge */}
                    <div className="text-center pb-3 border-b border-[#0c1282]/10">
                      <p className={`text-5xl font-extrabold ${waiverColour(result.waiver)}`}>{result.waiver}%</p>
                      <p className="text-xs text-gray-500 mt-1">Tuition Fee Waiver</p>
                      <p className="text-xs font-semibold text-gray-700 mt-1.5 bg-white/70 rounded-full px-3 py-0.5 inline-block">{result.label}</p>
                    </div>

                    {/* Fee breakdown */}
                    <div className="space-y-2 text-sm">
                      <FeeRow label="Standard Tuition / Semester" value={`BDT ${SEMESTER_FEE.toLocaleString()}`} />
                      {result.waiver > 0 && (
                        <FeeRow label={`Waiver (${result.waiver}%)`} value={`– BDT ${result.waivedAmt?.toLocaleString()}`} colour="text-green-600" />
                      )}
                      <FeeRow label="Payable / Semester" value={`BDT ${result.payable?.toLocaleString() ?? SEMESTER_FEE.toLocaleString()}`} bold />
                      <div className="border-t border-[#0c1282]/10 pt-2">
                        <FeeRow label={`Total Tuition (${TOTAL_SEMESTERS} semesters)`} value={`BDT ${result.totalTuition?.toLocaleString()}`} bold large />
                      </div>
                    </div>

                    {result.sgpa && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                        <strong>Maintain SGPA ≥ {result.sgpa}</strong> each semester to retain this waiver.
                      </div>
                    )}
                    {result.waiver === 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
                        No result-based waiver for this combination. You may still qualify for Need-based, Female Quota, or other special waivers.
                      </div>
                    )}
                    <p className="text-xs text-gray-400">* Waiver on tuition fee only. Admission fee, lab fee, library fee, semester fee etc. are excluded.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Other Scholarships ── */}
        <section>
          <h2 className="text-xl font-bold text-[#0c1282] mb-1">Other Scholarships & Waivers</h2>
          <p className="text-sm text-gray-500 mb-5">Beyond result-based waivers, DIU offers additional financial support.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OTHER_SCHOLARSHIPS.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#0c1282]/8 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#0c1282] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800 mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Video Guide ── */}
        <section>
          <h2 className="text-xl font-bold text-[#0c1282] mb-1">Scholarship Video Guide</h2>
          <p className="text-sm text-gray-500 mb-5">Official DIU scholarship guide — understand the application process.</p>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/UWMbkSjnTYU"
                title="DIU Scholarship Guide"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-gray-800 text-sm">DIU Scholarship — Official Guide</p>
                <p className="text-xs text-gray-400 mt-0.5">Daffodil International University</p>
              </div>
              <a
                href="https://youtu.be/UWMbkSjnTYU?si=Kfe5Q7KYreNNbxGh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                <span className="material-symbols-outlined text-base">play_circle</span>
                Watch on YouTube
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-gradient-to-r from-[#0c1282] to-[#1a237e] rounded-2xl p-8 text-center text-white">
          <span className="material-symbols-outlined text-4xl mb-3 block opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          <h2 className="text-xl font-bold mb-2">Ready to Apply?</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Submit your admission application today and secure your merit waiver.
          </p>
          <a
            href="/pre-register"
            className="inline-block bg-white text-[#0c1282] font-bold text-sm px-7 py-3 rounded-xl hover:bg-white/90 transition-colors"
          >
            Apply Now
          </a>
        </section>

      </div>
      <div className="h-12" />
    </div>
  );
};

function FeeRow({ label, value, bold, large, colour }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`text-xs ${bold ? 'font-bold text-gray-800' : 'text-gray-600'} ${large ? 'text-sm' : ''} ${colour || ''}`}>
        {value}
      </span>
    </div>
  );
}
