import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';
import { toast } from 'react-toastify';

// Abbreviated department name for card
function getDeptShort(program) {
  if (!program) return 'Dept.';
  if (program.includes('Computer Science')) return 'Dept. of CSE';
  if (program.includes('Software Engineering')) return 'Dept. of SWE';
  if (program.includes('Computing and Information')) return 'Dept. of CIS';
  if (program.includes('Multimedia')) return 'Dept. of MCT';
  if (program.includes('Information Technology & Management')) return 'Dept. of ITM';
  if (program.includes('Robotics')) return 'Dept. of Robotics & ME';
  if (program.includes('Business Administration')) return 'Dept. of BBA';
  if (program.includes('Finance & Banking')) return 'Dept. of Finance';
  if (program.includes('FinTech')) return 'Dept. of FinTech';
  if (program.includes('Electrical')) return 'Dept. of EEE';
  if (program.includes('Civil')) return 'Dept. of Civil Eng.';
  if (program.includes('Communication Engineering')) return 'Dept. of ICE';
  if (program.includes('Textile')) return 'Dept. of Textile Eng.';
  if (program.includes('Architecture')) return 'Dept. of Architecture';
  if (program.includes('Pharmacy')) return 'Dept. of Pharmacy';
  if (program.includes('Public Health')) return 'Dept. of Public Health';
  if (program.includes('English')) return 'Dept. of English';
  if (program.includes('Law')) return 'Dept. of Law';
  if (program.includes('Journalism')) return 'Dept. of JMC';
  return program.split('(')[0].trim().slice(0, 28);
}

const QRPlaceholder = ({ value }) => (
  <div className="w-16 h-16 bg-white p-1 rounded flex-shrink-0">
    <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-px">
      {Array.from({ length: 25 }, (_, i) => {
        const hash = (value.charCodeAt(i % value.length) + i * 7) % 3;
        return <div key={i} className={`rounded-[1px] ${hash < 2 ? 'bg-gray-900' : 'bg-white'}`} />;
      })}
    </div>
  </div>
);

export const StudentIDCardPage = () => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const studentId = localStorage.getItem('studentId') || 'DIU-000-000';
  const registrationEmail = localStorage.getItem('registrationEmail') || '';
  const bloodGroup = localStorage.getItem('bloodGroup') || 'A+';
  const profilePhoto = localStorage.getItem('profilePhoto') || '';
  const issuedOn = localStorage.getItem('idCardIssuedOn') || '';
  const expiresOn = localStorage.getItem('idCardExpiresOn') || '';
  const savedDraft = JSON.parse(localStorage.getItem('preregisterDraft') || '{}');
  const userName = savedDraft.fullName || 'Student Name';
  const userPhone = savedDraft.contactNumber || '';
  const selectedProgram = savedDraft.selectedProgram || '';
  const department = getDeptShort(selectedProgram);

  // Redirect if not registered
  useEffect(() => {
    if (!studentId || localStorage.getItem('paymentStatus') !== 'completed') {
      navigate('/admission/payment');
    }
  }, [navigate, studentId]);

  const handlePrint = () => {
    const printContent = cardRef.current?.innerHTML;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student ID Card - ${studentId}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; font-family: 'Inter', sans-serif; }
            @media print {
              body { background: white; }
              @page { margin: 0; size: 86mm 54mm; }
            }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    toast.success('Print dialog opened!');
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-28 pb-20 px-4 md:px-8 max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/admission/confirmation')}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium mb-4">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Confirmation
          </button>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface">Student ID Card</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Your official Daffodil International University student identity card.</p>
        </div>

        {/* ── ID Card ── */}
        <div ref={cardRef} className="w-full max-w-md mx-auto">
          {/* Card Wrapper — credit card proportions */}
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 select-none"
            style={{ background: 'linear-gradient(135deg, #0C1282 0%, #1a237e 40%, #0d1b8a 70%, #0C1282 100%)' }}>

            {/* Top stripe */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF6B00, #FFA500, #FFD700)' }} />

            {/* Card Content */}
            <div className="px-5 pt-4 pb-5">

              {/* University header */}
              <div className="flex items-center gap-3 mb-4">
                {/* DIU Logo placeholder */}
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow">
                  <div className="text-center">
                    <div className="text-[6px] font-black text-primary leading-none">DIU</div>
                    <div className="w-5 h-px bg-primary mx-auto my-px" />
                    <div className="text-[4px] font-bold text-primary leading-none">BD</div>
                  </div>
                </div>
                <div>
                  <p className="text-white font-black text-[11px] leading-tight tracking-wide">DAFFODIL INTERNATIONAL</p>
                  <p className="text-white font-black text-[11px] leading-tight tracking-wide">UNIVERSITY</p>
                  <p className="text-yellow-300 text-[8px] font-semibold tracking-wider">Ashulia, Savar, Dhaka-1341</p>
                </div>
                <div className="ml-auto">
                  <div className="bg-yellow-400 text-primary text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wider">STUDENT</div>
                </div>
              </div>

              {/* Main content: photo + info */}
              <div className="flex gap-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-yellow-400 bg-white/10">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/10">
                        <span className="material-symbols-outlined text-white/50 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                      </div>
                    )}
                  </div>
                  {/* Blood group badge */}
                  <div className="mt-1.5 bg-red-600 text-white text-center text-[9px] font-extrabold py-0.5 rounded tracking-wider">
                    {bloodGroup}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Name */}
                  <p className="text-yellow-300 text-[9px] font-bold uppercase tracking-widest mb-0.5">Name</p>
                  <p className="text-white font-extrabold text-sm leading-tight mb-3 truncate">{userName}</p>

                  {/* Department */}
                  <p className="text-yellow-300 text-[9px] font-bold uppercase tracking-widest mb-0.5">Department</p>
                  <p className="text-white font-semibold text-[10px] leading-tight mb-3" style={{ maxWidth: '160px', wordBreak: 'break-word' }}>{department}</p>

                  {/* Student ID */}
                  <p className="text-yellow-300 text-[9px] font-bold uppercase tracking-widest mb-0.5">Student ID</p>
                  <p className="text-white font-black text-base tracking-widest mb-2">{studentId}</p>

                  {/* Phone */}
                  <p className="text-white/70 text-[9px] font-semibold">{userPhone}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-3 border-t border-white/20" />

              {/* Bottom info row */}
              <div className="flex items-end justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-yellow-300 text-[8px] font-bold uppercase tracking-widest">Issued On</p>
                      <p className="text-white text-[10px] font-bold">{issuedOn}</p>
                    </div>
                    <div>
                      <p className="text-yellow-300 text-[8px] font-bold uppercase tracking-widest">Expires On</p>
                      <p className="text-white text-[10px] font-bold">{expiresOn}</p>
                    </div>
                  </div>
                  <p className="text-white/50 text-[8px] font-medium truncate max-w-[170px]">{registrationEmail}</p>
                </div>

                {/* QR */}
                <QRPlaceholder value={studentId} />
              </div>

              {/* Holographic strip */}
              <div className="mt-3 h-px w-full opacity-40"
                style={{ background: 'linear-gradient(90deg, transparent, #FFD700, #00FFFF, #FF00FF, #FFD700, transparent)' }} />
            </div>

            {/* Bottom magnetic stripe */}
            <div className="h-3 bg-black/60" />
          </div>
        </div>

        {/* ID Card Back side preview */}
        <div className="w-full max-w-md mx-auto mt-4">
          <div className="rounded-2xl overflow-hidden shadow-xl shadow-gray-400/20"
            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
            <div className="h-3 bg-black/60" />
            <div className="px-5 py-4">
              <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest mb-3 text-center">— Back —</p>
              <div className="space-y-2 text-[9px]">
                <p className="text-yellow-300 font-bold">TERMS & CONDITIONS</p>
                <p className="text-white/70">This card is property of Daffodil International University. If found, please return to the Admission Office.</p>
                <p className="text-white/70">This card is non-transferable. Misuse will result in disciplinary action.</p>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <div>
                  <p className="text-[8px] text-white/50">Registrar's Signature</p>
                  <div className="w-20 border-b border-white/30 mt-2" />
                </div>
                <div className="text-right">
                  <p className="text-[7px] text-white/40">admission@diu.edu.bd</p>
                  <p className="text-[7px] text-white/40">09617-000340</p>
                  <p className="text-[7px] text-white/40">www.diu.edu.bd</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3 max-w-md mx-auto">
          <button onClick={handlePrint}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">print</span>
            Print / Download ID Card
          </button>
          <button onClick={() => navigate('/admission/confirmation')}
            className="w-full border-2 border-primary text-primary font-bold py-3.5 rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Registration Details
          </button>
          <button onClick={() => navigate('/admit-card')}
            className="w-full border border-outline-variant/40 text-on-surface-variant font-medium py-3 rounded-xl hover:bg-surface-container transition-all flex items-center justify-center gap-2 text-sm">
            <span className="material-symbols-outlined text-base">home</span>
            Go to Dashboard
          </button>
        </div>

        {/* Info note */}
        <div className="mt-6 max-w-md mx-auto bg-primary/5 rounded-xl p-4 border border-primary/20">
          <p className="text-xs text-on-surface-variant text-center">
            <span className="material-symbols-outlined text-primary text-sm align-middle">info</span>
            {' '}Use <strong>Print</strong> and save as PDF to get a digital copy of your ID card. Physical cards are issued at the Admission Office.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
