import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function getAdminConfig() {
  try {
    const s = localStorage.getItem('diu_admin_config');
    if (s) return JSON.parse(s);
  } catch {}
  return { lateFee: 5000, currentSemester: 'Spring 2026' };
}

export const AccountsPanel = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [lateFeeOverrides, setLateFeeOverrides] = useState({});
  const [showAddFee, setShowAddFee] = useState(null); // request id
  const [newFee, setNewFee] = useState('');
  const config = getAdminConfig();

  useEffect(() => { loadData(); }, []);

  function loadData() {
    try { setRequests(JSON.parse(localStorage.getItem('diu_late_requests') || '[]')); } catch {}
    try { setPayments(JSON.parse(localStorage.getItem('diu_late_payments') || '[]')); } catch {}
  }

  const pendingPayment = requests.filter(r => r.status === 'payment_enabled' || r.status === 'dept_pending' || r.status === 'registrar_pending');

  const confirmPayment = (requestId) => {
    const updated = requests.map(r =>
      r.id === requestId ? { ...r, status: 'paid', updatedAt: new Date().toISOString() } : r
    );
    localStorage.setItem('diu_late_requests', JSON.stringify(updated));

    // Create payment record if not exists
    const existing = JSON.parse(localStorage.getItem('diu_late_payments') || '[]');
    const req = requests.find(r => r.id === requestId);
    if (req && !existing.find(p => p.requestId === requestId)) {
      const lateFee = lateFeeOverrides[requestId] || config.lateFee || 5000;
      const payment = {
        id: `LP-${Date.now().toString(36).toUpperCase()}`,
        requestId,
        studentEmail: req.studentEmail,
        studentName: req.studentName,
        tuition: req.fees?.tuition || 0,
        lateFee,
        total: (req.fees?.tuition || 0) + lateFee + (req.fees?.retakeFee || 0) + (req.fees?.dropFee || 0),
        paidAt: new Date().toISOString(),
        status: 'confirmed',
        confirmedBy: 'accounts',
      };
      localStorage.setItem('diu_late_payments', JSON.stringify([...existing, payment]));
    } else if (existing.find(p => p.requestId === requestId)) {
      const updatedPayments = existing.map(p =>
        p.requestId === requestId ? { ...p, status: 'confirmed', confirmedBy: 'accounts' } : p
      );
      localStorage.setItem('diu_late_payments', JSON.stringify(updatedPayments));
    }

    setRequests(updated);
    loadData();
    toast.success(`Payment confirmed for request ${requestId}`);
  };

  const applyLateFeeOverride = (requestId) => {
    const amt = parseInt(newFee);
    if (!amt || amt < 0) { toast.error('Enter a valid fee amount'); return; }
    setLateFeeOverrides(p => ({ ...p, [requestId]: amt }));

    // Update the request's fee
    const updated = requests.map(r => {
      if (r.id !== requestId) return r;
      const newFees = {
        ...r.fees,
        lateFee: amt,
        total: (r.fees?.tuition || 0) + amt + (r.fees?.retakeFee || 0) + (r.fees?.dropFee || 0),
      };
      return { ...r, fees: newFees };
    });
    localStorage.setItem('diu_late_requests', JSON.stringify(updated));
    setRequests(updated);
    toast.success(`Late fee updated to ৳${amt.toLocaleString()} for ${requestId}`);
    setShowAddFee(null);
    setNewFee('');
  };

  const TABS = [
    { id: 'pending',  label: 'Payment Pending', icon: 'hourglass_empty', count: pendingPayment.length },
    { id: 'history',  label: 'Payment History',  icon: 'receipt_long',   count: payments.length       },
    { id: 'all',      label: 'All Requests',     icon: 'list_alt',       count: requests.length       },
  ];

  const statusBadge = (status) => {
    const map = {
      dept_pending:      { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Dept Pending' },
      registrar_pending: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Registrar Pending' },
      payment_enabled:   { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Payment Enabled' },
      paid:              { bg: 'bg-green-100',   text: 'text-green-700',  label: 'Paid' },
      completed:         { bg: 'bg-green-100',   text: 'text-green-700',  label: 'Completed' },
    };
    const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  const FeeModal = ({ requestId }) => {
    const req = requests.find(r => r.id === requestId);
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-800">Set Late Fee Override</h3>
          <p className="text-sm text-gray-500">Request: <strong>{requestId}</strong> · Student: <strong>{req?.studentName}</strong></p>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Late Fee Amount (৳)</label>
            <input type="number" value={newFee} onChange={e => setNewFee(e.target.value)}
              placeholder={`Default: ${config.lateFee || 5000}`}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowAddFee(null); setNewFee(''); }}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
              Cancel
            </button>
            <button onClick={() => applyLateFeeOverride(requestId)}
              className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600">
              Apply
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f7f9fb', fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-5 gap-3 border-b border-gray-100">
          <span className="material-symbols-outlined text-2xl text-green-600">account_balance</span>
          <div>
            <p className="font-black text-sm text-gray-800">Accounts</p>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">DIU Portal</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${tab === t.id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              <span className="flex-1 text-left">{t.label}</span>
              {t.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                  ${tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <button onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            Admin Panel
          </button>
          <button onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
            <span className="material-symbols-outlined text-base">home</span>
            Portal Home
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <h1 className="font-extrabold text-gray-800 text-lg">
            {TABS.find(t => t.id === tab)?.label}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={loadData} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">refresh</span> Refresh
            </button>
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-xl">
              <span className="material-symbols-outlined text-green-600 text-base">account_balance</span>
              <span className="text-sm font-bold text-gray-700">Accounts Office</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* ── PENDING PAYMENTS ──────────────────────────────────────────── */}
          {tab === 'pending' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Awaiting Payment', value: pendingPayment.filter(r => r.status === 'payment_enabled').length, color: 'blue'   },
                  { label: 'In Approval',       value: pendingPayment.filter(r => ['dept_pending','registrar_pending'].includes(r.status)).length, color: 'orange' },
                  { label: 'Total Pending',      value: pendingPayment.length, color: 'gray' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 font-semibold uppercase">{s.label}</p>
                    <p className={`text-2xl font-extrabold text-${s.color}-600 mt-1`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {pendingPayment.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2 block">check_circle</span>
                  No pending payments
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayment.map(r => {
                    const lateFee = lateFeeOverrides[r.id] || r.fees?.lateFee || config.lateFee || 5000;
                    const total   = (r.fees?.tuition || 0) + lateFee + (r.fees?.retakeFee || 0) + (r.fees?.dropFee || 0);
                    return (
                      <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-bold text-gray-800 text-base">{r.studentName}</p>
                            <p className="text-xs text-gray-500">{r.studentEmail}</p>
                            <p className="text-xs font-mono text-gray-400 mt-0.5">{r.id}</p>
                          </div>
                          <div className="text-right">
                            {statusBadge(r.status)}
                            <p className="text-xs text-gray-400 mt-1">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Semester</p>
                            <p className="font-semibold text-gray-700">{r.semester}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Courses</p>
                            <p className="font-semibold text-gray-700">{r.courses?.length}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Tuition</p>
                            <p className="font-semibold text-gray-700">৳{r.fees?.tuition?.toLocaleString()}</p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-xs text-red-500">Late Fee</p>
                            <p className="font-bold text-red-600">৳{lateFee.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3 mb-4">
                          <span className="font-bold text-orange-800">Total Amount</span>
                          <span className="font-extrabold text-orange-700 text-lg">৳{total.toLocaleString()}</span>
                        </div>

                        <div className="flex gap-3">
                          <button onClick={() => { setShowAddFee(r.id); setNewFee(lateFee.toString()); }}
                            className="flex items-center gap-2 px-4 py-2.5 border border-orange-300 text-orange-700 rounded-xl text-sm font-semibold hover:bg-orange-50">
                            <span className="material-symbols-outlined text-base">edit</span>
                            Adjust Late Fee
                          </button>
                          {r.status === 'payment_enabled' && (
                            <button onClick={() => confirmPayment(r.id)}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700">
                              <span className="material-symbols-outlined text-base">check_circle</span>
                              Confirm Payment Received
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENT HISTORY ───────────────────────────────────────────── */}
          {tab === 'history' && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Payments',   value: payments.length,                                                         color: 'blue'   },
                  { label: 'Total Revenue',     value: `৳${payments.reduce((s, p) => s + (p.total || 0), 0).toLocaleString()}`, color: 'green'  },
                  { label: 'Total Late Fees',   value: `৳${payments.reduce((s, p) => s + (p.lateFee || 0), 0).toLocaleString()}`, color: 'orange' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 font-semibold uppercase">{s.label}</p>
                    <p className={`text-xl font-extrabold text-${s.color}-600 mt-1`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {payments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2 block">receipt_long</span>
                  No payment records yet
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Payment ID', 'Student', 'Semester', 'Tuition', 'Late Fee', 'Retake', 'Total', 'Date', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map(p => {
                        const req = requests.find(r => r.id === p.requestId);
                        return (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.id}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-800">{p.studentName}</p>
                              <p className="text-xs text-gray-400">{p.studentEmail}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{req?.semester || '-'}</td>
                            <td className="px-4 py-3">৳{p.tuition?.toLocaleString() || '-'}</td>
                            <td className="px-4 py-3 text-red-600 font-semibold">৳{p.lateFee?.toLocaleString() || '-'}</td>
                            <td className="px-4 py-3">৳{(p.retakeFee || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 font-bold text-green-700">৳{p.total?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                                ${p.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── ALL REQUESTS ──────────────────────────────────────────────── */}
          {tab === 'all' && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2 block">list_alt</span>
                  No late registration requests
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['#', 'Request ID', 'Student', 'Semester', 'Credits', 'Total Fee', 'Status', 'Date'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {requests.map((r, i) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold">{r.studentName}</p>
                            <p className="text-xs text-gray-400">{r.studentEmail}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{r.semester}</td>
                          <td className="px-4 py-3 font-semibold">{r.fees?.totalCr}</td>
                          <td className="px-4 py-3 font-bold">৳{r.fees?.total?.toLocaleString()}</td>
                          <td className="px-4 py-3">{statusBadge(r.status)}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Fee override modal */}
      {showAddFee && <FeeModal requestId={showAddFee} />}
    </div>
  );
};
