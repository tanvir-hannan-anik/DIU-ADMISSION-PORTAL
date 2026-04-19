import { useState, useRef, useEffect } from 'react';
import { Navigation } from '../common/Navigation';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import API_CONFIG from '../../config/apiConfig';
import { readFileForChat, getFileIcon, analyzeImageWithVision } from '../../utils/fileReader';

const SYSTEM_PROMPT = `You are an AI-powered Smart Proctor Assistant for Daffodil International University (DIU).
Your goal is to act like a real university Proctor and help students with discipline-related issues, complaints and reporting, guidance and rules, and appointment booking with the Proctor.

CORE RESPONSIBILITIES:
1. Answer student queries related to:
   - University rules and regulations
   - Anti-ragging policies
   - Cyberbullying
   - Harassment issues
   - Campus safety
2. Help students file complaints by asking structured questions:
   - What happened?
   - When did it happen?
   - Location?
   - People involved?
   Then generate a complaint summary and provide a complaint ID (format: COMP-YYYY-XXXX)
3. Appointment Booking System:
   - Show available time slots (Mon-Thu: 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM)
   - Allow student to select date and time slot
   - Confirm booking with appointment ID (format: APT-YYYY-XXXX)
4. Emergency Assistance:
   - If student reports urgent danger, immediately suggest contacting campus security
   - Emergency contacts: Campus Security: +880-1234-567890, Proctor Office: +880-9696-023023, DIU Helpline: 09696-023023

STUDENT INTERACTION STYLE:
- Be polite, supportive, and neutral
- Never blame the student
- Maintain confidentiality tone
- Ask step-by-step questions
- Keep responses simple and clear

MEMORY HANDLING:
- Remember student name, student ID, and previous complaints mentioned in conversation
- Use this to personalize the conversation

RESTRICTIONS:
- Do NOT give legal advice
- Do NOT expose private data
- Do NOT make assumptions without asking
- Always verify before submitting complaint or booking

OUTPUT FORMAT RULES (CRITICAL):
- Do NOT use ## headings or ** bold markers in your responses
- Use plain text with UPPERCASE for section titles
- Use numbers (1. 2. 3.) and dashes (-) for lists
- Keep responses clear, structured, and easy to read`;

const QUICK_SUGGESTIONS = [
  { label: 'Book Appointment', icon: 'calendar_month' },
  { label: 'File a Complaint', icon: 'report' },
  { label: 'Cyberbullying', icon: 'no_accounts' },
  { label: 'Anti-Ragging', icon: 'shield' },
  { label: 'Emergency Help', icon: 'emergency' },
];

const proctor_api = axios.create({
  baseURL: API_CONFIG.AI_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(date) {
  const today = new Date();
  const d = new Date(date);
  if (d.toDateString() === today.toDateString()) return 'Today';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function renderText(text) {
  const lines = text.split('\n');
  const out = [];
  let k = 0;

  const parseBold = (str) => {
    const parts = str.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, i) => (i % 2 === 1 ? <strong key={i} className="font-bold">{p}</strong> : p));
  };

  for (const line of lines) {
    if (!line.trim()) { out.push(<div key={k++} className="h-1.5" />); continue; }
    if (/^#{1,3}\s/.test(line)) {
      out.push(<p key={k++} className="font-bold text-[#000155] mt-1">{parseBold(line.replace(/^#{1,3}\s+/, ''))}</p>);
    } else if (/^[-*]\s/.test(line)) {
      out.push(
        <div key={k++} className="flex gap-2 ml-2 my-0.5">
          <span style={{ color: '#0c1282' }} className="font-bold mt-0.5 text-xs">•</span>
          <span>{parseBold(line.replace(/^[-*]\s+/, ''))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const m = line.match(/^(\d+)\.\s+(.*)/);
      if (m) out.push(
        <div key={k++} className="flex gap-2 ml-2 my-0.5">
          <span style={{ color: '#0c1282' }} className="font-semibold min-w-[18px] text-xs">{m[1]}.</span>
          <span>{parseBold(m[2])}</span>
        </div>
      );
    } else {
      out.push(<p key={k++} className="my-0.5 leading-relaxed">{parseBold(line)}</p>);
    }
  }
  return out;
}

export function SmartProctorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Good day${user?.name ? ', ' + user.name : ''}. I am your Smart Proctor Assistant at DIU.\n\nI am here to help you with university rules, filing complaints, booking proctor appointments, and emergency assistance.\n\nHow can I assist you today?`,
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmergency, setShowEmergency] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  const send = async (text) => {
    const msg = (text || input).trim();
    if ((!msg && !attachedFile) || loading) return;

    let userContent = msg;
    let isImageSend = false;
    let imageDataUrl = null;

    if (attachedFile?.type === 'text') {
      userContent = `${msg ? msg + '\n\n' : ''}Attached document "${attachedFile.name}":\n\n${attachedFile.content}`;
    } else if (attachedFile?.type === 'image') {
      userContent = msg || `Please analyze this image: ${attachedFile.name}`;
      isImageSend = true;
      imageDataUrl = attachedFile.dataUrl;
    }

    const userMsg = {
      role: 'user',
      content: userContent,
      time: new Date(),
      fileAttachment: attachedFile ? { name: attachedFile.name, type: attachedFile.type } : null,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setAttachedFile(null);
    setLoading(true);

    try {
      let reply;
      if (isImageSend) {
        reply = await analyzeImageWithVision(
          next.map((m) => ({ role: m.role, content: m.content })),
          SYSTEM_PROMPT,
          imageDataUrl
        );
      } else {
        const res = await proctor_api.post('/api/v1/ai/smart-proctor', {
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: SYSTEM_PROMPT,
          maxTokens: 1024,
        });
        reply = res.data?.success ? res.data.reply : 'Sorry, I encountered an issue. Please try again.';
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, time: new Date() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please check your network and try again.', time: new Date() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#f7f9fb', fontFamily: 'Manrope, sans-serif' }}>
      <Navigation />

      <main className="flex-grow flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-4 overflow-hidden" style={{ paddingTop: '100px' }}>

        {/* Emergency Banner */}
        {showEmergency && (
          <div className="mb-6 flex items-center justify-between p-4 rounded-xl shadow-sm border-l-4"
            style={{ backgroundColor: '#ffdad6', borderColor: '#ba1a1a' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: '#ba1a1a', fontVariationSettings: "'FILL' 1" }}>report</span>
              <div>
                <p className="font-bold text-sm" style={{ color: '#93000a' }}>Emergency Support Available</p>
                <p className="text-xs" style={{ color: '#93000a', opacity: 0.8 }}>
                  Immediate assistance is one click away. Campus Security: +880-1234-567890
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => send('I need emergency help')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-all text-white"
                style={{ backgroundColor: '#ba1a1a' }}
              >
                Contact Now
              </button>
              <button onClick={() => setShowEmergency(false)} className="p-1 rounded-full hover:bg-black/10 transition-colors">
                <span className="material-symbols-outlined text-sm" style={{ color: '#93000a' }}>close</span>
              </button>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="flex-grow flex flex-col rounded-xl overflow-hidden shadow-lg border"
          style={{ backgroundColor: '#ffffff', borderColor: '#c6c5d4' }}>

          {/* Chat Header */}
          <div className="p-5 flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: '#f2f4f6', borderBottom: '1px solid #e0e3e5' }}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                  style={{ backgroundColor: '#0c1282', borderColor: '#0c1282' }}>
                  <span className="material-symbols-outlined text-white text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight" style={{ color: '#000155' }}>Smart Proctor</h2>
                <p className="text-xs flex items-center gap-1" style={{ color: '#464652' }}>
                  DIU Discipline & Support Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#d5e3fc', color: '#0d1c2e' }}>
                Online
              </span>
              <button className="p-2 rounded-full transition-colors hover:bg-gray-100">
                <span className="material-symbols-outlined" style={{ color: '#464652' }}>more_vert</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-5"
            style={{ backgroundColor: '#f7f9fb', scrollbarWidth: 'thin', scrollbarColor: '#e0e3e5 transparent' }}>

            {/* Date label */}
            <div className="text-center">
              <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                style={{ color: '#767684', backgroundColor: '#e6e8ea' }}>
                {formatDateLabel(messages[0]?.time || new Date())}
              </span>
            </div>

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end self-end' : 'items-start'} max-w-[80%]`}>
                {/* File attachment badge on user messages */}
                {msg.fileAttachment && (
                  <div className="mb-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: 'rgba(12,18,130,0.12)', color: '#0c1282' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>
                      {msg.fileAttachment.type === 'image' ? 'image' : 'description'}
                    </span>
                    {msg.fileAttachment.name}
                  </div>
                )}
                <div className={`p-4 shadow-sm text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : ''}`}
                  style={{
                    backgroundColor: msg.role === 'user' ? '#0c1282' : '#f2f4f6',
                    color: msg.role === 'user' ? '#ffffff' : '#191c1e',
                    borderRadius: msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                  }}>
                  {msg.role === 'assistant' ? renderText(msg.content) : <p>{msg.content}</p>}
                </div>
                <span className="text-[10px] mt-1 mx-1" style={{ color: '#767684' }}>
                  {formatTime(msg.time)}
                </span>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex flex-col items-start max-w-[80%]">
                <div className="p-4 shadow-sm flex items-center gap-2"
                  style={{ backgroundColor: '#f2f4f6', borderRadius: '1rem 1rem 1rem 0.25rem' }}>
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#464652', animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#464652', animationDelay: '200ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#464652', animationDelay: '400ms' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#767684' }}>Proctor is typing...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-6 py-3 flex flex-wrap gap-2 flex-shrink-0"
            style={{ backgroundColor: '#f7f9fb', borderTop: '1px solid #eceef0' }}>
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => send(s.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80 active:scale-95"
                style={{ backgroundColor: '#d5e3fc', color: '#0d1c2e' }}
              >
                <span className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1", fontSize: '14px' }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="px-5 pt-3 pb-4 flex-shrink-0" style={{ backgroundColor: '#f2f4f6', borderTop: '1px solid #e0e3e5' }}>
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
              <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: '#d5e3fc', color: '#0d1c2e', maxWidth: '100%' }}>
                {attachedFile.type === 'image' ? (
                  <img src={attachedFile.dataUrl} alt="preview" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                ) : (
                  <span className="material-symbols-outlined text-base flex-shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1", color: '#0c1282' }}>
                    {getFileIcon(attachedFile.name)}
                  </span>
                )}
                <span className="truncate flex-1">{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                  title="Remove file"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              </div>
            )}

            {/* Error */}
            {fileError && (
              <p className="mb-2 text-xs font-semibold px-1" style={{ color: '#ba1a1a' }}>{fileError}</p>
            )}

            <div className="flex items-center rounded-full px-3 py-1.5 shadow-sm border focus-within:ring-2 transition-all"
              style={{ backgroundColor: '#ffffff', borderColor: '#c6c5d4' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 transition-colors hover:text-[#0c1282]"
                style={{ color: attachedFile ? '#0c1282' : '#464652' }}
                title="Attach file"
              >
                <span className="material-symbols-outlined"
                  style={{ fontVariationSettings: attachedFile ? "'FILL' 1" : "'FILL' 0" }}>attach_file</span>
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={attachedFile ? 'Add a message (optional)…' : 'Type your message here...'}
                className="flex-grow bg-transparent border-none focus:ring-0 text-sm px-3"
                style={{ color: '#191c1e', outline: 'none' }}
              />
              <div className="flex items-center gap-1 pr-1">
                <button className="p-2 transition-colors hover:text-[#0c1282]" style={{ color: '#464652' }}>
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <button
                  onClick={() => send()}
                  disabled={(!input.trim() && !attachedFile) || loading}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#0c1282' }}
                >
                  <span className="material-symbols-outlined text-white"
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>send</span>
                </button>
              </div>
            </div>
            <p className="mt-2.5 text-center text-[10px]" style={{ color: '#767684' }}>
              Conversations are confidential · DIU Smart Proctor AI · Available 24/7
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
