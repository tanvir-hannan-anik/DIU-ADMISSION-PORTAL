import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { navGroupsForRole, ROLE_LABELS } from './adminNav';
import { adminAuth } from './adminAuth';
import adminApi from './adminApi';
import { useTheme } from './themeContext';
import { T } from './theme';
import Dropdown, { MenuItem } from './components/Dropdown';
import CommandPalette from './components/CommandPalette';

const ago = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const handleLogout = () => { adminAuth.logout(); navigate('/admin', { replace: true }); };
  const role = (adminAuth.getUser()?.role || 'admin').toLowerCase();
  const groups = navGroupsForRole(role);

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: T.panel }}>
      <div className="h-16 flex items-center gap-3 px-5 border-b flex-shrink-0" style={{ borderColor: T.border }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'linear-gradient(135deg,#6366F1,#22D3EE)' }}>
          <span className="material-symbols-outlined text-white text-xl">bolt</span>
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-[15px] leading-none truncate" style={{ color: T.text }}>DIU Admin</p>
          <span className="text-[10px] font-semibold" style={{ color: T.accent }}>v2.0</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 min-h-0">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textFaint }}>{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.path} to={`/admin/${item.path}`} onClick={onNavigate}
                  className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors"
                  style={({ isActive }) => ({ backgroundColor: isActive ? T.accent : 'transparent', color: isActive ? '#fff' : T.textDim })}>
                  {({ isActive }) => (
                    <>
                      <span className="material-symbols-outlined text-[20px] flex-shrink-0" style={{ color: isActive ? '#fff' : T.textDim }}>{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.dot && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: T.up }} />}
                      {!item.live && !item.dot && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: T.track, color: T.textFaint }}>soon</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 flex-shrink-0">
        <button onClick={() => toast.success("You're on the Pro plan 🎉")}
          className="w-full text-left rounded-xl p-4 hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(34,211,238,0.12))', border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#FBBF24' }}>workspace_premium</span>
            <p className="text-[13px] font-bold" style={{ color: T.text }}>Upgrade Plan</p>
          </div>
          <p className="text-[11px]" style={{ color: T.textDim }}>Pro Plan · enterprise analytics</p>
        </button>
        <button onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors hover:bg-white/5"
          style={{ color: T.down }}>
          <span className="material-symbols-outlined text-[20px]">logout</span>Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ title, subtitle, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const { mode, toggle } = useTheme();
  const user = adminAuth.getUser();

  // Real notifications: most recent captured leads from the CRM.
  useEffect(() => {
    adminApi.get('/v1/admin/stats').then((r) => {
      const leads = r.data.data?.recentLeads || [];
      const items = leads.map((l) => ({
        id: l.id, icon: 'person_add', title: 'New lead captured',
        sub: `${l.email || 'unknown'}${l.interestedProgram ? ' · ' + l.interestedProgram : ''}`,
        time: ago(l.createdAt),
      }));
      setNotifications(items);
      setUnread(items.length);
    }).catch(() => {});
  }, []);

  // Global ⌘K / Ctrl+K to open the command palette.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const iconBtn = "w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors";

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: T.bg, fontFamily: 'Inter, sans-serif' }}>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 w-64 flex-shrink-0 z-50 border-r transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
             style={{ borderColor: T.border }}>
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 flex items-center gap-3 px-4 lg:px-6 border-b flex-shrink-0" style={{ borderColor: T.border, backgroundColor: T.bg }}>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-white/5" onClick={() => setMobileOpen(true)}>
            <span className="material-symbols-outlined" style={{ color: T.textDim }}>menu</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-[18px] font-extrabold leading-tight truncate" style={{ color: T.text }}>{title}</h1>
            {subtitle && <p className="text-[12px] truncate" style={{ color: T.textDim }}>{subtitle}</p>}
          </div>

          {/* Search (opens palette) */}
          <button onClick={() => setPaletteOpen(true)}
                  className="hidden md:flex items-center gap-2 ml-6 px-3 h-9 rounded-lg flex-1 max-w-md text-left"
                  style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: T.textFaint }}>search</span>
            <span className="text-[13px] flex-1" style={{ color: T.textFaint }}>Search anything...</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: T.textFaint, border: `1px solid ${T.border}` }}>⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button className={`md:hidden ${iconBtn}`} onClick={() => setPaletteOpen(true)}>
              <span className="material-symbols-outlined text-[20px]" style={{ color: T.textDim }}>search</span>
            </button>

            {/* Help */}
            <Dropdown width={230} trigger={() => (
              <button className={iconBtn}><span className="material-symbols-outlined text-[20px]" style={{ color: T.textDim }}>help</span></button>
            )}>
              {({ close }) => (
                <div className="py-1">
                  <MenuItem icon="keyboard" label="Keyboard shortcuts" sub="⌘K to search" onClick={() => { close(); toast.info('Press ⌘K / Ctrl+K to search'); }} />
                  <MenuItem icon="menu_book" label="Documentation" onClick={() => { close(); toast.info('Docs coming soon'); }} />
                  <MenuItem icon="support_agent" label="Contact support" onClick={() => { close(); window.location.href = 'mailto:support@diu.edu.bd'; }} />
                </div>
              )}
            </Dropdown>

            {/* Theme toggle */}
            <button className={iconBtn} onClick={toggle} title="Toggle theme">
              <span className="material-symbols-outlined text-[20px]" style={{ color: T.textDim }}>{mode === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>

            {/* Settings */}
            <button className={iconBtn} onClick={() => navigate('/admin/integrations')} title="Settings">
              <span className="material-symbols-outlined text-[20px]" style={{ color: T.textDim }}>settings</span>
            </button>

            {/* Notifications */}
            <Dropdown width={300} trigger={() => (
              <button className={`relative ${iconBtn}`}>
                <span className="material-symbols-outlined text-[20px]" style={{ color: T.textDim }}>notifications</span>
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: T.accent }}>{unread}</span>
                )}
              </button>
            )}>
              {({ close }) => (
                <div>
                  <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <span className="text-[13px] font-bold" style={{ color: T.text }}>Notifications</span>
                    <button className="text-[11px] font-semibold" style={{ color: T.accent }}
                            onClick={() => { setUnread(0); toast.success('All notifications marked as read'); }}>Mark all read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {notifications.length === 0 ? (
                      <p className="text-[12px] text-center py-6" style={{ color: T.textFaint }}>No new notifications.</p>
                    ) : notifications.map((n) => (
                      <div key={n.id} className="flex gap-2.5 px-3 py-2.5 hover:bg-white/5">
                        <span className="material-symbols-outlined text-[19px] flex-shrink-0" style={{ color: T.accent }}>{n.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium truncate" style={{ color: T.text }}>{n.title}</p>
                          <p className="text-[11px] truncate" style={{ color: T.textDim }}>{n.sub}</p>
                        </div>
                        <span className="text-[11px] flex-shrink-0" style={{ color: T.textFaint }}>{n.time}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { close(); navigate('/admin/leads'); }} className="w-full py-2.5 text-[12px] font-semibold" style={{ color: T.accent, borderTop: `1px solid ${T.border}` }}>View all leads</button>
                </div>
              )}
            </Dropdown>

            {/* Profile */}
            <Dropdown width={230} trigger={() => (
              <button className="flex items-center gap-2 ml-1 pl-2 sm:pl-3" style={{ borderLeft: `1px solid ${T.border}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                     style={{ background: 'linear-gradient(135deg,#6366F1,#A78BFA)' }}>
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[13px] font-bold leading-none truncate max-w-[120px]" style={{ color: T.text }}>{user?.name || 'Admin'}</p>
                  <p className="text-[11px]" style={{ color: T.textDim }}>{ROLE_LABELS[(user?.role || 'admin').toLowerCase()] || 'Staff'}</p>
                </div>
              </button>
            )}>
              {({ close }) => (
                <div>
                  <div className="px-3 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <p className="text-[13px] font-bold truncate" style={{ color: T.text }}>{user?.name || 'Administrator'}</p>
                    <p className="text-[11px] truncate" style={{ color: T.textDim }}>{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <MenuItem icon="person" label="Profile" onClick={() => { close(); toast.info('Profile settings coming soon'); }} />
                    <MenuItem icon="admin_panel_settings" label="Users & Roles" onClick={() => { close(); navigate('/admin/users'); }} />
                    <MenuItem icon="manage_history" label="Audit logs" onClick={() => { close(); navigate('/admin/audit'); }} />
                  </div>
                  <div className="py-1" style={{ borderTop: `1px solid ${T.border}` }}>
                    <MenuItem icon="logout" label="Sign out" danger onClick={() => { adminAuth.logout(); navigate('/admin', { replace: true }); }} />
                  </div>
                </div>
              )}
            </Dropdown>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
