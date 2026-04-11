import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ── Full department name (removes abbreviation, formats nicely) ──────
function getFullDeptName(raw) {
  if (!raw) return '';
  // Strip anything in parentheses e.g. "(CIS)", "(CSE)"
  const clean = raw.replace(/\s*\([^)]*\)/g, '').trim();
  // Map common names to card-display format
  const map = {
    'Computing and Information System':          'B.Sc. in Computing & Information System',
    'Computer Science and Engineering':          'B.Sc. in Computer Science & Engineering',
    'Software Engineering':                      'B.Sc. in Software Engineering',
    'SWE — Major in Cyber Security':             'B.Sc. in SWE — Major in Cyber Security',
    'SWE — Major in Data Science':               'B.Sc. in SWE — Major in Data Science',
    'SWE — Major in Robotics':                   'B.Sc. in SWE — Major in Robotics',
    'Multimedia & Creative Technology':          'B.Sc. in Multimedia & Creative Technology',
    'Information Technology & Management':       'B.Sc. in Information Technology & Management',
    'Robotics and Mechatronics Engineering':     'B.Sc. in Robotics & Mechatronics Engineering',
    'Electrical and Electronic Engineering':     'B.Sc. in Electrical & Electronic Engineering',
    'Civil Engineering':                         'B.Sc. in Civil Engineering',
    'Information & Communication Engineering':   'B.Sc. in Information & Communication Engineering',
    'Textile Engineering':                       'B.Sc. in Textile Engineering',
    'Bachelor of Architecture':                  'Bachelor of Architecture',
    'Bachelor of Business Administration':       'Bachelor of Business Administration',
    'BBA in Management':                         'BBA in Management',
    'BBA in Finance & Banking':                  'BBA in Finance & Banking',
    'BBA in Marketing':                          'BBA in Marketing',
    'BBA in Accounting':                         'BBA in Accounting',
    'Financial Technology':                      'B.Sc. in Financial Technology (FinTech)',
    'Bachelor of Entrepreneurship':              'Bachelor of Entrepreneurship',
    'Bachelor of Tourism & Hospitality Management': 'Bachelor of Tourism & Hospitality Management',
    'Bachelor of Real Estate':                   'Bachelor of Real Estate',
    'Bachelor of Pharmacy':                      'Bachelor of Pharmacy',
    'Bachelor of Public Health':                 'Bachelor of Public Health',
    'Bachelor of Nutrition and Food Engineering':'B.Sc. in Nutrition & Food Engineering',
    'Environmental Science & Disaster Management':'B.Sc. in Environmental Science & Disaster Management',
    'Physical Education and Sports Science':     'B.Sc. in Physical Education & Sports Science',
    'Bachelor of Agricultural Science':          'Bachelor of Agricultural Science',
    'Genetic Engineering and Biotechnology':     'B.Sc. in Genetic Engineering & Biotechnology',
    'B.Sc. in Fisheries':                        'B.Sc. in Fisheries',
    'Bachelor of Laws':                          'Bachelor of Laws (LLB)',
    'Bachelor of Arts in English':               'Bachelor of Arts in English',
    'Bachelor of Journalism & Mass Communication':'Bachelor of Journalism & Mass Communication',
  };
  return map[clean] || clean;
}

// ── Colored squares decoration (matches the real DIU card) ──────────
const SQUARE_COLORS = [
  '#c0392b','#e67e22','#f39c12','#27ae60','#16a085','#2980b9','#8e44ad','#2c3e50',
  '#e74c3c','#d35400','#f1c40f','#1abc9c','#3498db','#9b59b6','#7f8c8d','#c0392b',
  '#e67e22','#f39c12','#27ae60','#16a085','#2980b9','#8e44ad','#2c3e50','#e74c3c',
  '#d35400','#f1c40f','#1abc9c','#3498db','#9b59b6','#7f8c8d','#c0392b','#e67e22',
];

// Top strip: one row of colored squares across full width
const TopStrip = () => (
  <div style={{ display: 'flex', height: 14, overflow: 'hidden' }}>
    {SQUARE_COLORS.map((c, i) => (
      <div key={i} style={{ flex: 1, backgroundColor: c, minWidth: 16 }} />
    ))}
  </div>
);

// Mosaic block for top-right corner of header
const MosaicBlock = () => {
  const grid = [
    ['#bdc3c7','#e74c3c','#c0392b','#e67e22','#f39c12','#bdc3c7'],
    ['#3498db','#2980b9','#e74c3c','#c0392b','#e67e22','#f39c12'],
    ['#2ecc71','#27ae60','#3498db','#2980b9','#e74c3c','#c0392b'],
    ['#9b59b6','#8e44ad','#2ecc71','#27ae60','#3498db','#2980b9'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 14px)', gridTemplateRows: 'repeat(4, 14px)', gap: 1.5 }}>
      {grid.flat().map((color, i) => (
        <div key={i} style={{ width: 14, height: 14, backgroundColor: color, borderRadius: 1 }} />
      ))}
    </div>
  );
};

// ── Linear barcode SVG ───────────────────────────────────────────────
const Barcode = ({ value }) => {
  const bars = [];
  let x = 0;
  const str = value + '|DIU|' + value;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    for (let b = 6; b >= 0; b--) {
      const bit = (code >> b) & 1;
      const w = bit ? 2.5 : 1.5;
      if ((i + b) % 4 !== 3) {
        bars.push({ x, w });
      }
      x += w + 0.8;
    }
  }
  return (
    <svg width="100%" height="38" viewBox={`0 0 ${x} 38`} preserveAspectRatio="none">
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y={0} width={bar.w} height={38} fill="#000" />
      ))}
    </svg>
  );
};

// ── Cursive signature SVG ────────────────────────────────────────────
const Signature = () => (
  <svg width="80" height="30" viewBox="0 0 80 30">
    <path
      d="M4,22 C8,10 14,6 20,14 C26,22 28,8 34,10 C40,12 42,4 50,8 C56,12 58,18 64,14 C68,12 72,16 76,20"
      stroke="#1a1a1a" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      d="M10,26 C20,24 35,26 50,25"
      stroke="#1a1a1a" strokeWidth="0.8" fill="none" strokeLinecap="round"
    />
  </svg>
);

// ── Phone icon SVG ───────────────────────────────────────────────────
const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#c0392b">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
  </svg>
);

// ── Blood drop icon SVG ──────────────────────────────────────────────
const BloodIcon = () => (
  <svg width="13" height="15" viewBox="0 0 24 28" fill="#c0392b">
    <path d="M12 2 C12 2 4 12 4 18 C4 23 7.6 26 12 26 C16.4 26 20 23 20 18 C20 12 12 2 12 2Z"/>
  </svg>
);

// ── Main component ───────────────────────────────────────────────────
export const StudentIDCardPage = () => {
  const navigate = useNavigate();
  const cardRef  = useRef(null);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ── Data from localStorage ──
  const fullFormData = JSON.parse(localStorage.getItem('fullFormData') || '{}');
  const personal     = fullFormData.personal || {};
  const program      = fullFormData.program  || {};
  const savedDraft   = JSON.parse(localStorage.getItem('preregisterDraft') || '{}');

  const studentId    = localStorage.getItem('studentId')       || 'DIU-000-000';
  const bloodGroup   = personal.bloodGroup || localStorage.getItem('bloodGroup') || 'A+';
  const profilePhoto = localStorage.getItem('profilePhoto')    || '';
  const issuedOn     = localStorage.getItem('idCardIssuedOn')  || new Date().toISOString().split('T')[0];
  const expiresOn    = localStorage.getItem('idCardExpiresOn') || '';
  const userName     = personal.fullName   || savedDraft.fullName      || 'Student Name';
  const userPhone    = personal.phone      || savedDraft.contactNumber || '';
  const programName  = getFullDeptName(program.programName || savedDraft.selectedProgram || '');

  // Redirect if payment not done
  useEffect(() => {
    if (localStorage.getItem('paymentStatus') !== 'completed') {
      navigate('/admission/payment');
    }
  }, [navigate]);

  // ── Capture card as canvas ──
  const captureCard = async () => {
    const el = cardRef.current;
    if (!el) throw new Error('Card not found');
    return await html2canvas(el, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  };

  const downloadPNG = async () => {
    setDownloading(true);
    try {
      const canvas = await captureCard();
      const a = document.createElement('a');
      a.download = `DIU-ID-${studentId}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast.success('Downloaded as PNG!');
    } catch { toast.error('Download failed.'); }
    setDownloading(false);
  };

  const downloadJPEG = async () => {
    setDownloading(true);
    try {
      const canvas = await captureCard();
      const a = document.createElement('a');
      a.download = `DIU-ID-${studentId}.jpg`;
      a.href = canvas.toDataURL('image/jpeg', 0.95);
      a.click();
      toast.success('Downloaded as JPEG!');
    } catch { toast.error('Download failed.'); }
    setDownloading(false);
  };

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const canvas = await captureCard();
      const img   = canvas.toDataURL('image/png');
      const el    = cardRef.current;
      const mmW   = el.offsetWidth  * 0.264583;
      const mmH   = el.offsetHeight * 0.264583;
      const pdf   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [mmW + 10, mmH + 10] });
      pdf.addImage(img, 'PNG', 5, 5, mmW, mmH);
      pdf.save(`DIU-ID-${studentId}.pdf`);
      toast.success('Downloaded as PDF!');
    } catch { toast.error('Download failed.'); }
    setDownloading(false);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>DIU ID ${studentId}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}
      @media print{@page{margin:0}body{background:white}}</style>
    </head><body>${cardRef.current.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
    toast.success('Print dialog opened!');
  };

  // ── Card styles (all inline — required for html2canvas) ──
  const card = {
    width: 520,
    background: '#ffffff',
    border: '1.5px solid #d1d5db',
    borderRadius: 6,
    overflow: 'hidden',
    fontFamily: 'Arial, Helvetica, sans-serif',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />

      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <button onClick={() => navigate('/admission/confirmation')}
            className="flex items-center gap-1 text-gray-500 hover:text-[#0c1282] transition-colors text-sm font-medium mb-4">
            <span className="material-symbols-outlined text-base">arrow_back</span>Back to Confirmation
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Student ID Card</h1>
          <p className="text-gray-500 mt-1 text-sm">Official Daffodil International University student identity card.</p>
        </div>

        {/* ════════════════════════════════════════
            THE ID CARD — pixel-perfect DIU design
        ════════════════════════════════════════ */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div ref={cardRef} style={card}>

            {/* ── 1. Top colored strip ── */}
            <TopStrip />

            {/* ── 2. Header: logo + university name + mosaic ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px 12px', borderBottom: '1px solid #e5e7eb' }}>
              {/* Logo */}
              <img
                src="/diulogo.png"
                alt="DIU"
                style={{ height: 56, width: 'auto', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              {/* Mosaic block */}
              <div style={{ marginLeft: 'auto' }}>
                <MosaicBlock />
              </div>
            </div>

            {/* ── 3. Main body: info (left) + photo+contact (right) ── */}
            <div style={{ display: 'flex', padding: '12px 14px 8px 14px', gap: 12, alignItems: 'flex-start' }}>

              {/* Left: student details */}
              <div style={{ flex: 1 }}>
                {/* Name */}
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4, lineHeight: 1.2 }}>
                  {userName}
                </div>
                {/* Program */}
                <div style={{ fontSize: 14, color: '#1f2937', marginBottom: 12, lineHeight: 1.4 }}>
                  {programName}
                </div>
                {/* Student ID */}
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                  {studentId}
                </div>
                {/* Issue / Expire */}
                <div style={{ fontSize: 14, color: '#1f2937', marginBottom: 4 }}>
                  Issue On: {issuedOn}
                </div>
                <div style={{ fontSize: 14, color: '#1f2937' }}>
                  Expire On: {expiresOn}
                </div>
              </div>

              {/* Right: photo + contact info */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                {/* Student photo */}
                <div style={{ width: 96, height: 118, border: '1px solid #d1d5db', overflow: 'hidden', background: '#f3f4f6' }}>
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={userName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb', fontSize: 36, color: '#9ca3af' }}>
                      👤
                    </div>
                  )}
                </div>

                {/* Colored bar below photo */}
                <div style={{ width: 96, height: 5, background: 'linear-gradient(90deg, #e74c3c, #e67e22, #f1c40f)', marginBottom: 6 }} />

                {/* Phone */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, width: '100%' }}>
                  <PhoneIcon />
                  <span style={{ fontSize: 13, color: '#1f2937', fontWeight: 600 }}>{userPhone || '—'}</span>
                </div>

                {/* Blood group */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, width: '100%' }}>
                  <BloodIcon />
                  <span style={{ fontSize: 13, color: '#1f2937', fontWeight: 700 }}>{bloodGroup}</span>
                </div>

                {/* Signature */}
                <Signature />
                <div style={{ fontSize: 10, color: '#374151', marginTop: 1, textAlign: 'center' }}>Register</div>
              </div>
            </div>

            {/* ── 4. Barcode ── */}
            <div style={{ padding: '4px 14px 10px 14px', background: '#ffffff' }}>
              <Barcode value={studentId} />
            </div>

          </div>
        </div>

        {/* ── Download buttons ── */}
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <p className="text-center text-sm font-semibold text-gray-500 mb-3">Download your ID Card</p>

          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'PNG',  icon: 'image',          sub: 'High quality', fn: downloadPNG },
              { label: 'JPEG', icon: 'photo',           sub: 'Compressed',  fn: downloadJPEG },
              { label: 'PDF',  icon: 'picture_as_pdf',  sub: 'Print ready', fn: downloadPDF },
            ].map(btn => (
              <button key={btn.label} onClick={btn.fn} disabled={downloading}
                className="flex flex-col items-center justify-center gap-1.5 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-[#0c1282] hover:bg-[#0c1282]/5 transition-all disabled:opacity-50">
                <span className="material-symbols-outlined text-[#0c1282] text-2xl">{btn.icon}</span>
                <span className="text-xs font-bold text-gray-800">{btn.label}</span>
                <span className="text-[10px] text-gray-400">{btn.sub}</span>
              </button>
            ))}
          </div>

          <button onClick={handlePrint} disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0c1282] text-white font-bold rounded-xl hover:bg-[#0c1282]/90 transition-all shadow-lg shadow-[#0c1282]/20 disabled:opacity-50 mb-3">
            <span className="material-symbols-outlined">print</span>Print ID Card
          </button>

          {downloading && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
              <span className="material-symbols-outlined animate-spin text-[#0c1282] text-base">progress_activity</span>
              Generating file…
            </div>
          )}

          <button onClick={() => navigate('/admission/confirmation')}
            className="w-full border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:border-[#0c1282]/30 transition-all flex items-center justify-center gap-2 text-sm">
            <span className="material-symbols-outlined text-base">arrow_back</span>Back to Registration
          </button>

          <div className="mt-4 bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs text-blue-700 text-center">
              <span className="material-symbols-outlined text-blue-500 text-sm align-middle mr-1">info</span>
              Physical ID cards are collected from the Admission Office with original documents.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
