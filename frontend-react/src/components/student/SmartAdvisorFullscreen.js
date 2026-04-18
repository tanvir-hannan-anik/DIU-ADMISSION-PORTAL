import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { readFileForChat, getFileIcon, analyzeImageWithVision } from '../../utils/fileReader';

/**
 * SmartAdvisorFullscreen — Full-page Smart Advisor overlay.
 * Props:
 *   onClose, onClearChat, chatMsgs, chatInput, setChatInput,
 *   chatLoading, sendChat, sendMessage (optional direct-text fn), quickChips
 */
export const SmartAdvisorFullscreen = ({
  onClose,
  onClearChat,
  chatMsgs,
  chatInput,
  setChatInput,
  chatLoading,
  sendChat,
  sendMessage,
  quickChips = [],
}) => {
  const navigate  = useNavigate();
  const user      = authService.getUser();
  const photo     = user ? localStorage.getItem(`diu_photo_${user.email}`) : null;
  const initials  = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST';
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileError, setFileError]       = useState('');
  const [fileLoading, setFileLoading]   = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');
    try {
      const result = await readFileForChat(file);
      setAttachedFile({ ...result, originalFile: file });
    } catch (err) {
      setFileError(err.message);
    }
    e.target.value = '';
  };

  const handleSend = async () => {
    const baseText = chatInput.trim();
    if (!attachedFile) { sendChat(); return; }

    if (attachedFile.type === 'text') {
      const fullText = (baseText ? baseText + '\n\n' : '') +
        `Attached document "${attachedFile.name}":\n\n${attachedFile.content}`;
      setAttachedFile(null);
      if (sendMessage) {
        setChatInput('');
        sendMessage(fullText);
      } else {
        setChatInput(fullText);
        setTimeout(() => sendChat(), 50);
      }
    } else if (attachedFile.type === 'image') {
      const msgText = baseText || `Please analyze this image: ${attachedFile.name}`;
      const dataUrl = attachedFile.dataUrl;
      setAttachedFile(null);
      setChatInput('');
      setFileLoading(true);
      try {
        const ADVISOR_SYS = 'You are a helpful AI academic advisor for DIU. Analyze the attached image and answer any student questions in the context of academics or career guidance.';
        const reply = await analyzeImageWithVision(
          [{ role: 'user', content: msgText }], ADVISOR_SYS, dataUrl
        );
        if (sendMessage) sendMessage(`[Image: ${attachedFile.name}]\n\n${reply}`);
        else if (sendChat) { setChatInput(`[Image analyzed]: ${reply.slice(0, 200)}...`); setTimeout(() => sendChat(), 50); }
      } catch {
        if (sendMessage) sendMessage('Could not analyze the image. Please try again.');
      } finally {
        setFileLoading(false);
      }
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    if (onClearChat) onClearChat();
  };

  const SUGGESTION_CARDS = [
    { icon: 'auto_stories', title: 'Course Planning',   desc: 'Analyze degree requirements and optimize your semester schedule.', border: '#0c1282' },
    { icon: 'trending_up',  title: 'Career Guidance',   desc: 'Match your academic performance with upcoming market opportunities.', border: '#b9c7df' },
    { icon: 'account_balance', title: 'Financial Audit', desc: 'Review scholarship status, grants, and upcoming tuition deadlines.', border: '#bec2ff' },
  ];

  const SIDEBAR_NAV = [
    { icon: 'dashboard',  label: 'Dashboard',            onClick: () => { onClose(); navigate('/'); } },
    { icon: 'smart_toy',  label: 'Smart Advisor',         active: true },
    { icon: 'school',     label: 'Course Registration',   onClick: () => { onClose(); navigate('/course-registration'); } },
  ];

  const SAVED_TOPICS = [
    { icon: 'calendar_today', label: 'Course Planning' },
    { icon: 'work',           label: 'Career Advice'   },
    { icon: 'payments',       label: 'Financial Aid'   },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex"
      style={{ fontFamily: 'Manrope, sans-serif', backgroundColor: '#f7f9fb', color: '#191c1e' }}>

      {/* ── Left Sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col h-full p-4 space-y-2 w-64 shrink-0"
        style={{ backgroundColor: '#f7f9fb', borderRight: '1px solid rgba(198,197,212,0.2)' }}>

        {/* Brand */}
        <div className="mb-8 px-2">
          <h1 className="text-lg font-black" style={{ color: '#0c1282' }}>Academic Affairs</h1>
          <p className="text-xs" style={{ color: '#767684' }}>Official Student Portal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {SIDEBAR_NAV.map(item => (
            <div key={item.label}
              onClick={item.onClick}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:translate-x-1 duration-300 ${item.active ? 'font-bold shadow-sm' : ''}`}
              style={item.active
                ? { color: '#0c1282', backgroundColor: 'white' }
                : { color: '#515f74' }}>
              <span className="material-symbols-outlined"
                style={{ fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
          ))}

          {/* Saved Topics */}
          <div className="mt-8 mb-4 px-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: 'rgba(70,70,82,0.5)' }}>Saved Topics</div>
          {SAVED_TOPICS.map(item => (
            <div key={item.label}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:translate-x-1 duration-300"
              style={{ color: '#515f74' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(226,232,240,0.5)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="pt-4 space-y-1" style={{ borderTop: '1px solid rgba(226,232,240,0.5)' }}>
          {[{ icon: 'history', label: 'History' }, { icon: 'settings', label: 'Settings' }].map(item => (
            <div key={item.label}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:translate-x-1 duration-300"
              style={{ color: '#515f74' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(226,232,240,0.5)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
          <button className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: '#0c1282' }}>
            Get Support
          </button>
        </div>
      </aside>

      {/* ── Main Area ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <header className="flex justify-between items-center w-full px-6 py-4 shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(226,232,240,0.5)' }}>
          <div className="flex items-center gap-4">
            {/* Mobile menu icon */}
            <div className="lg:hidden p-2" style={{ color: '#0c1282' }}>
              <span className="material-symbols-outlined">menu</span>
            </div>
            <div>
              <img src="/diulogo.png" alt="Daffodil International University"
                   className="h-8 w-auto cursor-pointer mb-1" onClick={() => navigate('/')} />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#3b82f6' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#767684' }}>
                  AI Assistant Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Desktop nav links */}
            <div className="hidden md:flex gap-8">
              <button onClick={() => { onClose(); navigate('/'); }}
                className="text-sm font-semibold tracking-tight transition-colors"
                style={{ color: '#767684' }}
                onMouseEnter={e => e.currentTarget.style.color = '#0c1282'}
                onMouseLeave={e => e.currentTarget.style.color = '#767684'}>
                Dashboard
              </button>
              <span className="text-sm font-semibold tracking-tight pb-1"
                style={{ color: '#0c1282', borderBottom: '2px solid #0c1282' }}>
                Smart Advisor
              </span>
              <button className="text-sm font-semibold tracking-tight transition-colors"
                style={{ color: '#767684' }}
                onMouseEnter={e => e.currentTarget.style.color = '#0c1282'}
                onMouseLeave={e => e.currentTarget.style.color = '#767684'}>
                History
              </button>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full transition-colors"
                style={{ color: '#767684' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f2f4f6'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                <span className="material-symbols-outlined">notifications</span>
              </button>

              {/* Minimize to floating */}
              <button onClick={onClose}
                className="p-2 rounded-full transition-colors"
                style={{ color: '#767684' }}
                title="Exit fullscreen"
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f2f4f6'; e.currentTarget.style.color = '#0c1282'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#767684'; }}>
                <span className="material-symbols-outlined">close_fullscreen</span>
              </button>

              {/* User avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0"
                style={{ borderColor: 'rgba(12,18,130,0.2)' }}>
                {photo
                  ? <img src={photo} alt="User" className="w-full h-full object-cover rounded-full" />
                  : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: '#0c1282' }}>
                      {initials}
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </header>

        {/* Messages / Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 min-h-0"
          style={{ scrollbarWidth: 'none' }}>
          <div className="max-w-4xl mx-auto space-y-12">

            {/* Welcome hero (always shown at top) */}
            <section className="text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-xl mb-6"
                style={{ backgroundColor: '#0c1282' }}>
                <span className="material-symbols-outlined text-white"
                  style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <h3 className="text-5xl font-black tracking-tight leading-tight" style={{ color: '#000155' }}>
                Hello, {user?.name?.split(' ')[0] || 'Student'}.<br />
                <span style={{ color: '#0c1282', opacity: 0.6 }}>How can I assist you today?</span>
              </h3>
            </section>

            {/* Suggestion cards (shown when no messages or first message is greeting) */}
            {chatMsgs.length <= 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUGGESTION_CARDS.map(card => (
                  <div key={card.title}
                    onClick={() => setChatInput(card.title)}
                    className="p-6 rounded-xl cursor-pointer group transition-all"
                    style={{
                      backgroundColor: 'white',
                      borderLeft: `4px solid ${card.border}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f2f4f6'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                    <span className="material-symbols-outlined mb-3 block transition-transform group-hover:scale-110"
                      style={{ color: '#000155' }}>{card.icon}</span>
                    <h4 className="font-bold mb-1" style={{ color: '#000155' }}>{card.title}</h4>
                    <p className="text-xs leading-relaxed" style={{ color: '#767684' }}>{card.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick chips */}
            {quickChips.length > 0 && chatMsgs.length <= 1 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {quickChips.map(chip => (
                  <button key={chip}
                    onClick={() => setChatInput(chip)}
                    className="text-xs font-bold px-4 py-2 rounded-full transition-colors"
                    style={{ backgroundColor: '#e6e8ea', color: '#464652' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d8dadc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#e6e8ea'}>
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {chatMsgs.length > 0 && (
              <div className="space-y-8">
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`flex items-start gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
                    {m.role === 'assistant' && (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                        style={{ backgroundColor: '#0c1282' }}>
                        <span className="material-symbols-outlined text-white text-xl"
                          style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : ''}`}
                      style={{ maxWidth: '80%' }}>
                      <div className={`p-5 ${m.role === 'user' ? 'rounded-l-2xl rounded-br-2xl shadow-lg' : 'rounded-r-2xl rounded-bl-2xl shadow-sm'}`}
                        style={m.role === 'user'
                          ? { backgroundColor: '#0c1282', color: 'white' }
                          : { backgroundColor: 'white', color: '#191c1e', border: '1px solid rgba(198,197,212,0.1)' }}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: 'rgba(70,70,82,0.5)' }}>
                        {m.role === 'user' ? 'You' : 'AI Advisor'}
                      </span>
                    </div>
                    {m.role === 'user' && (
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2"
                        style={{ borderColor: 'rgba(12,18,130,0.1)' }}>
                        {photo
                          ? <img src={photo} alt="User" className="w-full h-full object-cover" />
                          : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: '#0c1282' }}>
                              {initials}
                            </div>
                          )
                        }
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {chatLoading && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                      style={{ backgroundColor: '#0c1282' }}>
                      <span className="material-symbols-outlined text-white text-xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    </div>
                    <div className="p-5 rounded-r-2xl rounded-bl-2xl shadow-sm"
                      style={{ backgroundColor: 'white', border: '1px solid rgba(198,197,212,0.1)' }}>
                      <div className="flex gap-1.5">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="w-2 h-2 rounded-full animate-bounce"
                            style={{ backgroundColor: '#0c1282', animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Footer — input */}
        <footer className="px-6 pt-4 pb-6 shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(226,232,240,0.5)' }}>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.html,.css,.xml,.log,.java,.c,.cpp,.pdf,.yaml,.yml,.sql"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* File chip */}
          {attachedFile && (
            <div className="max-w-4xl mx-auto mb-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold w-fit"
              style={{ backgroundColor: '#e0e0ff', color: '#000155', border: '1px solid #bec2ff' }}>
              {attachedFile.type === 'image' ? (
                <img src={attachedFile.dataUrl} alt="preview" className="w-8 h-8 rounded object-cover flex-shrink-0" />
              ) : (
                <span className="material-symbols-outlined text-base flex-shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1", color: '#0c1282' }}>
                  {getFileIcon(attachedFile.name)}
                </span>
              )}
              <span className="max-w-[200px] truncate">{attachedFile.name}</span>
              <button
                onClick={() => setAttachedFile(null)}
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors ml-1"
                title="Remove file"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
              </button>
            </div>
          )}

          {/* Error */}
          {fileError && (
            <p className="max-w-4xl mx-auto mb-2 text-xs font-semibold" style={{ color: '#ba1a1a' }}>{fileError}</p>
          )}

          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="flex-1 relative flex items-center">
              {/* Attach */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-4 p-2 transition-colors"
                style={{ color: attachedFile ? '#0c1282' : '#9ca3af' }}
                onMouseEnter={e => e.currentTarget.style.color = '#0c1282'}
                onMouseLeave={e => e.currentTarget.style.color = attachedFile ? '#0c1282' : '#9ca3af'}
                title="Attach file">
                <span className="material-symbols-outlined"
                  style={{ fontVariationSettings: attachedFile ? "'FILL' 1" : "'FILL' 0" }}>attach_file</span>
              </button>

              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={attachedFile ? 'Add a message (optional)…' : 'Inquire about course planning, career advice, or grants...'}
                className="w-full py-4 pl-14 pr-20 rounded-full text-sm outline-none font-medium transition-all"
                style={{ backgroundColor: '#e6e8ea', border: 'none', color: '#191c1e' }}
                onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(12,18,130,0.2)'}
                onBlur={e => e.currentTarget.style.boxShadow = 'none'}
              />

              {/* Mic + Send */}
              <div className="absolute right-2 flex gap-1">
                <button className="p-2 transition-colors"
                  style={{ color: '#9ca3af' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0c1282'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <button
                  onClick={handleSend}
                  disabled={(chatLoading || fileLoading) || (!chatInput.trim() && !attachedFile)}
                  className="p-2 rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                  style={{ backgroundColor: '#0c1282' }}>
                  <span className="material-symbols-outlined text-lg">
                    {fileLoading ? 'hourglass_empty' : 'send'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom action links */}
          <div className="max-w-4xl mx-auto mt-3 flex justify-center gap-6">
            {[
              { label: 'Clear Chat',       onClick: clearChat },
              { label: 'Save Transcript',  onClick: () => {
                const text = chatMsgs.map(m => `[${m.role === 'user' ? 'You' : 'AI Advisor'}] ${m.content}`).join('\n\n');
                const blob = new Blob([text], { type: 'text/plain' });
                const url  = URL.createObjectURL(blob);
                const a    = Object.assign(document.createElement('a'), { href: url, download: 'smart-advisor-transcript.txt' });
                a.click(); URL.revokeObjectURL(url);
              }},
              { label: 'Voice Mode',       onClick: () => {} },
            ].map(({ label, onClick }) => (
              <button key={label} onClick={onClick}
                className="text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ color: 'rgba(70,70,82,0.4)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#0c1282'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(70,70,82,0.4)'}>
                {label}
              </button>
            ))}
          </div>
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 z-50"
        style={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(226,232,240,0.5)' }}>
        {[
          { icon: 'home', label: 'Dashboard', onClick: () => { onClose(); navigate('/'); } },
          { icon: 'smart_toy', label: 'Advisor', active: true },
          { icon: 'chat', label: 'Messages' },
          { icon: 'menu', label: 'More' },
        ].map(item => (
          <div key={item.label}
            onClick={item.onClick}
            className={`flex flex-col items-center justify-center p-2 cursor-pointer ${item.active ? 'rounded-xl' : ''}`}
            style={item.active ? { color: '#0c1282', backgroundColor: 'rgba(59,130,246,0.05)' } : { color: '#9ca3af' }}>
            <span className="material-symbols-outlined"
              style={{ fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0" }}>
              {item.icon}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};
