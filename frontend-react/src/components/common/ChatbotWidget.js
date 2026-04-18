import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAI } from '../../hooks/useAI';
import { readFileForChat, getFileIcon, analyzeImageWithVision } from '../../utils/fileReader';

// ── Field definitions ──────────────────────────────────────────────
const BOARDS = ['Dhaka','Chittagong','Rajshahi','Sylhet','Barisal','Comilla','Jessore','Dinajpur','Mymensingh'];
const DIVISIONS = ['Dhaka','Chittagong','Rajshahi','Sylhet','Barisal','Khulna','Rangpur','Mymensingh'];

const normalizeGroup = v => {
  const l = v.toLowerCase();
  if (l.includes('science')) return 'Science';
  if (l.includes('business') || l.includes('commerce')) return 'Business / Commerce';
  return 'Humanities / Arts';
};
const normalizeBoard = v => BOARDS.find(b => v.toLowerCase().includes(b.toLowerCase())) || v.trim();
const normalizeDivision = v => DIVISIONS.find(d => v.toLowerCase().includes(d.toLowerCase())) || v.trim();
const validateBoard = v => BOARDS.some(b => v.toLowerCase().includes(b.toLowerCase()));
const validateGpa = v => !isNaN(parseFloat(v)) && parseFloat(v) >= 1.0 && parseFloat(v) <= 5.0;
const validateYear = v => /^20\d{2}$/.test(v.trim());
const validateGroup = v => ['science','business','commerce','humanities','arts'].some(k => v.toLowerCase().includes(k));

const PRE_REGISTER_FIELDS = [
  { key: 'fullName',      label: 'Full Name',       question: 'What is your full legal name? (as on your certificate)',                   validate: v => v.trim().length >= 3,                                           error: 'Please enter your full name (min 3 characters)',             normalize: v => v.trim() },
  { key: 'email',         label: 'Email',            question: 'What is your email address?',                                              validate: v => /\S+@\S+\.\S+/.test(v.trim()),                                  error: 'Please enter a valid email (e.g. name@gmail.com)',           normalize: v => v.trim().toLowerCase() },
  { key: 'dateOfBirth',   label: 'Date of Birth',    question: 'Date of birth? (format: YYYY-MM-DD, e.g. 2003-05-15)',                    validate: v => /^\d{4}-\d{2}-\d{2}$/.test(v.trim().replace(/\//g,'-')),       error: 'Use YYYY-MM-DD format (e.g. 2003-05-15)',                    normalize: v => v.trim().replace(/\//g,'-') },
  { key: 'contactNumber', label: 'Contact Number',   question: 'Your contact number? (e.g. 01712345678)',                                 validate: v => /^0[0-9]{9,10}$/.test(v.trim().replace(/[\s-]/g,'')),           error: 'Enter a valid BD number (11 digits, starts with 0)',         normalize: v => v.trim().replace(/[\s-]/g,'') },
  { key: 'sscResult',     label: 'SSC GPA',          question: 'Your SSC GPA? (e.g. 4.50)',                                               validate: validateGpa,                                                         error: 'Enter a valid GPA between 1.0 and 5.0',                      normalize: v => v.trim() },
  { key: 'sscGroup',      label: 'SSC Group',        question: 'SSC group?\n• Science\n• Business / Commerce\n• Humanities / Arts',       validate: validateGroup,                                                       error: 'Type: Science, Business, or Humanities',                     normalize: normalizeGroup },
  { key: 'sscBoard',      label: 'SSC Board',        question: 'SSC board? (Dhaka / Chittagong / Rajshahi / Sylhet / Barisal / Comilla / Jessore / Dinajpur / Mymensingh)', validate: validateBoard, error: 'Enter a valid board name',             normalize: normalizeBoard },
  { key: 'sscYear',       label: 'SSC Passing Year', question: 'Year you passed SSC? (e.g. 2021)',                                        validate: validateYear,                                                        error: 'Enter a valid year (e.g. 2021)',                              normalize: v => v.trim() },
  { key: 'hscResult',     label: 'HSC GPA',          question: 'Your HSC GPA? (e.g. 4.75)',                                               validate: validateGpa,                                                         error: 'Enter a valid GPA between 1.0 and 5.0',                      normalize: v => v.trim() },
  { key: 'hscGroup',      label: 'HSC Group',        question: 'HSC group?\n• Science\n• Business / Commerce\n• Humanities / Arts',       validate: validateGroup,                                                       error: 'Type: Science, Business, or Humanities',                     normalize: normalizeGroup },
  { key: 'hscBoard',      label: 'HSC Board',        question: 'HSC board?',                                                              validate: validateBoard,                                                       error: 'Enter a valid board name',                                   normalize: normalizeBoard },
  { key: 'hscYear',       label: 'HSC Passing Year', question: 'Year you passed HSC? (e.g. 2023)',                                        validate: validateYear,                                                        error: 'Enter a valid year (e.g. 2023)',                              normalize: v => v.trim() },
  { key: 'programHint',   label: 'Program Interest', question: 'Which program are you interested in?\n(e.g. CSE, BBA, EEE, Law, Pharmacy...)\n\nType "skip" to choose on the form.', validate: v => v.trim().length >= 2, error: 'Enter a program name or type "skip"', normalize: v => v.trim() },
];

const ONLINE_ADMIT_FIELDS = [
  { key: 'fullName',        label: 'Full Name',         question: 'Your full name?',                                                        validate: v => v.trim().length >= 3,                                           error: 'Please enter your full name',                                normalize: v => v.trim() },
  { key: 'fatherName',      label: "Father's Name",     question: "Your father's full name?",                                               validate: v => v.trim().length >= 3,                                           error: "Please enter your father's name",                            normalize: v => v.trim() },
  { key: 'motherName',      label: "Mother's Name",     question: "Your mother's full name?",                                               validate: v => v.trim().length >= 3,                                           error: "Please enter your mother's name",                            normalize: v => v.trim() },
  { key: 'dob',             label: 'Date of Birth',     question: 'Date of birth? (YYYY-MM-DD, e.g. 2003-05-15)',                          validate: v => /^\d{4}-\d{2}-\d{2}$/.test(v.trim().replace(/\//g,'-')),       error: 'Use YYYY-MM-DD format',                                      normalize: v => v.trim().replace(/\//g,'-') },
  { key: 'gender',          label: 'Gender',            question: 'Gender?\n• Male\n• Female\n• Other',                                    validate: v => ['male','female','other'].some(g => v.toLowerCase().includes(g)), error: 'Type: Male, Female, or Other',                             normalize: v => { const l=v.toLowerCase(); if(l.includes('female')) return 'Female'; if(l.includes('male')) return 'Male'; return 'Other'; } },
  { key: 'phone',           label: 'Phone',             question: 'Your phone number?',                                                     validate: v => /^0[0-9]{9,10}$/.test(v.trim().replace(/[\s-]/g,'')),           error: 'Enter a valid BD phone number',                              normalize: v => v.trim().replace(/[\s-]/g,'') },
  { key: 'email',           label: 'Email',             question: 'Your email address?',                                                    validate: v => /\S+@\S+\.\S+/.test(v.trim()),                                  error: 'Enter a valid email',                                        normalize: v => v.trim().toLowerCase() },
  { key: 'presentDistrict', label: 'Present District',  question: 'Your present district? (e.g. Dhaka, Chittagong)',                       validate: v => v.trim().length >= 2,                                           error: 'Please enter your district',                                 normalize: v => v.trim() },
  { key: 'presentDivision', label: 'Present Division',  question: 'Present division?\n(Dhaka / Chittagong / Rajshahi / Sylhet / Barisal / Khulna / Rangpur / Mymensingh)', validate: v => DIVISIONS.some(d => v.toLowerCase().includes(d.toLowerCase())), error: 'Enter a valid division name', normalize: normalizeDivision },
  { key: 'sscBoard',        label: 'SSC Board',         question: 'Which board did you pass SSC from?',                                    validate: validateBoard,                                                       error: 'Enter a valid board name',                                   normalize: normalizeBoard },
  { key: 'sscYear',         label: 'SSC Year',          question: 'Year you passed SSC?',                                                  validate: validateYear,                                                        error: 'Enter a valid year',                                         normalize: v => v.trim() },
  { key: 'sscGroup',        label: 'SSC Group',         question: 'SSC group? (Science / Business / Humanities)',                          validate: validateGroup,                                                       error: 'Type: Science, Business, or Humanities',                     normalize: normalizeGroup },
  { key: 'sscGpa',          label: 'SSC GPA',           question: 'SSC GPA?',                                                              validate: validateGpa,                                                         error: 'Enter a valid GPA (1.0 - 5.0)',                              normalize: v => v.trim() },
  { key: 'hscBoard',        label: 'HSC Board',         question: 'Which board did you pass HSC from?',                                    validate: validateBoard,                                                       error: 'Enter a valid board name',                                   normalize: normalizeBoard },
  { key: 'hscYear',         label: 'HSC Year',          question: 'Year you passed HSC?',                                                  validate: validateYear,                                                        error: 'Enter a valid year',                                         normalize: v => v.trim() },
  { key: 'hscGroup',        label: 'HSC Group',         question: 'HSC group? (Science / Business / Humanities)',                          validate: validateGroup,                                                       error: 'Type: Science, Business, or Humanities',                     normalize: normalizeGroup },
  { key: 'hscGpa',          label: 'HSC GPA',           question: 'HSC GPA?',                                                              validate: validateGpa,                                                         error: 'Enter a valid GPA (1.0 - 5.0)',                              normalize: v => v.trim() },
  { key: 'programName',     label: 'Program',           question: 'Which program do you want to apply for?\n(e.g. CSE, BBA, EEE, Law, Architecture, Pharmacy...)', validate: v => v.trim().length >= 2, error: 'Enter a program name', normalize: v => v.trim() },
];

// ── Welcome messages per page context ─────────────────────────────
const WELCOME_MESSAGES = {
  'pre-register':
    "👋 Hi! I'm your DIU Pre-Registration Assistant!\n\nI can see you're filling the Pre-Registration form. I can help you:\n\n• 📝 Guide you through each field step by step\n• ✅ Check your program eligibility\n• 💰 Estimate your tuition waiver\n• ❓ Answer any questions about the form\n\nStuck on a field? Just ask, or click **\"Fill Form with AI\"** and I'll walk you through everything!",
  'online-admit':
    "👋 Hi! I'm your DIU Admit Form Assistant!\n\nI can see you're on the Online Admit page. I can help you:\n\n• 📋 Guide you through every field step by step\n• 📎 Tell you which documents to upload\n• 🏷️ Explain what each section requires\n• ❓ Answer any questions about the process\n\nNeed help? Just ask, or click **\"Fill Form with AI\"** and I'll walk you through everything!",
  'career-jobs':
    "👋 Hi! I'm your AI Smart Advisor.\n\nI can see your career profile and I'm here to help you:\n\n• 💼 Find the right jobs for your skills\n• 📊 Analyze skill gaps for specific roles\n• 🗺️ Build a step-by-step career roadmap\n• 📄 Improve your CV and portfolio\n• 🎯 Prepare for job interviews\n• 💡 Suggest which skills to learn next\n\nJust ask me anything about your career!",
  general:
    "👋 Hi! I'm your DIU Admission Advisor. I can help you:\n\n• 🎓 Find the right department for you\n• 💰 Calculate tuition fees & waivers\n• ✅ Check your eligibility\n• 📝 Fill your Pre-Registration form\n• 📋 Fill your Online Admit form\n\nNeed help filling a form? Click one of the form buttons below, or ask me anything!",
};

// ── Inline text renderer ───────────────────────────────────────────
function renderInline(text, key) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <React.Fragment key={key}>
      {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
    </React.Fragment>
  );
}

function renderTable(lines, key) {
  const rows = lines
    .filter(l => !/^\s*\|?\s*[-:]+[-| :]*\s*\|?\s*$/.test(l))
    .map(l => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()));
  if (!rows.length) return null;
  const [head, ...body] = rows;
  return (
    <div key={key} className="overflow-x-auto my-2 rounded-lg border border-outline-variant/30">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            {head.map((cell, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold border-r border-white/20 last:border-r-0 whitespace-nowrap">{renderInline(cell, i)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-surface-container-low'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 border-t border-outline-variant/20 border-r border-outline-variant/20 last:border-r-0">{renderInline(cell, ci)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderMessageContent(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    if (/^\|.+\|/.test(lines[i].trim())) {
      const tableLines = [];
      while (i < lines.length && /\|/.test(lines[i])) { tableLines.push(lines[i]); i++; }
      blocks.push({ type: 'table', lines: tableLines });
    } else {
      blocks.push({ type: 'line', text: lines[i] });
      i++;
    }
  }
  return blocks.map((block, bi) => {
    if (block.type === 'table') return renderTable(block.lines, `table-${bi}`);
    return (
      <React.Fragment key={`line-${bi}`}>
        {renderInline(block.text, bi)}
        {bi < blocks.length - 1 && block.type === 'line' && <br />}
      </React.Fragment>
    );
  });
}

// ── Message list ───────────────────────────────────────────────────
const MessageList = ({ messages, isLoading, messagesEndRef }) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {messages.map((message) => (
      <div key={message.id} className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
        {message.type === 'bot' && (
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          </div>
        )}
        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          message.type === 'user'
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-surface-container-low text-on-surface rounded-bl-sm border border-outline-variant/20'
        }`}>
          {message.type === 'bot' ? renderMessageContent(message.text) : message.text}
        </div>
      </div>
    ))}
    {isLoading && (
      <div className="flex gap-2 justify-start">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )}
    <div ref={messagesEndRef} />
  </div>
);

// ── Chat input ─────────────────────────────────────────────────────
const ChatInput = ({ inputValue, setInputValue, isLoading, handleSubmitWithFile, autoFocus, placeholder }) => {
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileError, setFileError]       = useState('');
  const fileInputRef = useRef(null);

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

  const onSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() && !attachedFile) return;
    handleSubmitWithFile(e, attachedFile);
    setAttachedFile(null);
    setFileError('');
  };

  return (
    <div className="border-t border-outline-variant/20 bg-white">
      {/* File chip */}
      {attachedFile && (
        <div className="px-4 pt-3 pb-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#e0e0ff', color: '#000155' }}>
            {attachedFile.type === 'image' ? (
              <img src={attachedFile.dataUrl} alt="preview" className="w-6 h-6 rounded object-cover" />
            ) : (
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", color: '#0c1282' }}>
                {getFileIcon(attachedFile.name)}
              </span>
            )}
            <span className="max-w-[120px] truncate">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)}
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10"
              title="Remove">
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close</span>
            </button>
          </div>
        </div>
      )}
      {fileError && <p className="px-4 pt-1 text-[11px] font-semibold" style={{ color: '#ba1a1a' }}>{fileError}</p>}

      <form onSubmit={onSubmit} className="p-4 flex gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.html,.css,.xml,.log,.java,.c,.cpp,.pdf,.yaml,.yml,.sql"
          className="hidden"
          onChange={handleFileSelect}
        />
        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
          style={{ backgroundColor: attachedFile ? '#e0e0ff' : '#f2f4f6', color: attachedFile ? '#0c1282' : '#767684' }}
          title="Attach file">
          <span className="material-symbols-outlined text-base"
            style={{ fontVariationSettings: attachedFile ? "'FILL' 1" : "'FILL' 0" }}>attach_file</span>
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={attachedFile ? 'Add a message (optional)…' : (placeholder || 'Ask about admissions, programs, fees...')}
          disabled={isLoading}
          autoFocus={autoFocus}
          className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
        <button
          type="submit"
          disabled={isLoading || (!inputValue.trim() && !attachedFile)}
          className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all flex-shrink-0"
        >
          <span className="material-symbols-outlined text-base">send</span>
        </button>
      </form>
    </div>
  );
};

// ── Fullscreen chat ────────────────────────────────────────────────
const FullscreenChat = ({ onMinimize, onClose, messages, inputValue, setInputValue, isLoading, handleSubmit, handleSubmitWithFile, sendMessage, formMode, formProgress, formFieldIndex, totalFormFields, startFormMode }) => {
  const messagesEndRef = React.useRef(null);
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestions = [
    { icon: 'school', text: 'What programs are available?' },
    { icon: 'payments', text: 'How do I apply for a scholarship?' },
    { icon: 'event', text: 'What are the admission deadlines?' },
    { icon: 'description', text: 'What documents do I need?' },
    { icon: 'quiz', text: 'Is there an entrance test?' },
    { icon: 'location_on', text: 'Where is the campus located?' },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-surface flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-primary text-white px-6 py-4 flex items-center gap-4 shadow-lg flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
        <div className="flex-1">
          <div className="font-bold text-base leading-tight">DIU Admission Assistant</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-white/70">Online — Powered by AI</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMinimize} title="Minimize" className="p-2 rounded-lg hover:bg-white/20 transition-all text-white">
            <span className="material-symbols-outlined">remove</span>
          </button>
          <button onClick={onClose} title="Close" className="p-2 rounded-lg hover:bg-white/20 transition-all text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="hidden lg:flex flex-col w-72 xl:w-80 bg-surface-container-low border-r border-outline-variant/20 flex-shrink-0">
          <div className="p-6 border-b border-outline-variant/20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div className="font-bold text-on-surface text-lg font-headline">DIU Admission Bot</div>
            <div className="text-sm text-outline mt-1 leading-relaxed">
              Your 24/7 AI guide for everything about Daffodil International University admissions.
            </div>
          </div>

          <div className="p-4 border-b border-outline-variant/20">
            <div className="text-xs font-semibold text-outline uppercase tracking-wider mb-3">Form Assistant</div>
            <div className="space-y-2">
              <button onClick={() => startFormMode('pre-register')} disabled={isLoading || !!formMode}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all group disabled:opacity-50">
                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
                <div className="min-w-0">
                  <div className="text-sm text-primary font-bold">Fill Pre-Registration</div>
                  <div className="text-[10px] text-outline">AI guides you step by step</div>
                </div>
              </button>
              <button onClick={() => startFormMode('online-admit')} disabled={isLoading || !!formMode}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 transition-all group disabled:opacity-50">
                <span className="material-symbols-outlined text-indigo-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
                <div className="min-w-0">
                  <div className="text-sm text-indigo-700 font-bold">Fill Online Admit Form</div>
                  <div className="text-[10px] text-outline">Full registration with pre-fill</div>
                </div>
              </button>
            </div>
            {formMode && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-green-700">
                    {formMode === 'pre-register' ? 'Pre-Registration' : 'Online Admit'} in progress
                  </span>
                  <span className="text-xs text-green-600 font-semibold">{formFieldIndex}/{totalFormFields}</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${formProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-outline uppercase tracking-wider mb-3">Quick Questions</div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.text)} disabled={isLoading || !!formMode}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white hover:bg-primary/5 border border-outline-variant/20 hover:border-primary/30 transition-all group disabled:opacity-50">
                  <span className="material-symbols-outlined text-primary text-base group-hover:scale-110 transition-transform">{s.icon}</span>
                  <span className="text-sm text-on-surface font-medium">{s.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-outline-variant/20">
            <div className="flex items-start gap-2 text-xs text-outline">
              <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">info</span>
              <span>Responses are AI-generated. For official decisions, contact the admissions office.</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 min-w-0 bg-white">
          {formMode && (
            <div className="px-4 py-3 bg-green-50 border-b border-green-200 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-green-600 text-sm flex-shrink-0">edit_note</span>
                <span className="text-xs font-bold text-green-700 truncate">
                  Filling {formMode === 'pre-register' ? 'Pre-Registration' : 'Online Admit'} — Step {formFieldIndex + 1} of {totalFormFields}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-24 bg-green-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${formProgress}%` }} />
                </div>
                <button onClick={() => sendMessage('cancel')} className="text-[10px] text-red-500 font-bold hover:underline">Cancel</button>
              </div>
            </div>
          )}
          {messages.length === 1 && !formMode && (
            <div className="px-6 pt-6 pb-2">
              <div className="max-w-2xl mx-auto text-center">
                <div className="text-2xl font-bold font-headline text-on-surface mb-1">How can I help you today?</div>
                <div className="text-sm text-outline">Ask anything, or let me fill a form for you.</div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <button onClick={() => startFormMode('pre-register')} disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary font-bold hover:bg-primary/20 transition-all disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
                  Fill Pre-Registration
                </button>
                <button onClick={() => startFormMode('online-admit')} disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-bold hover:bg-indigo-100 transition-all disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
                  Fill Online Admit Form
                </button>
              </div>
            </div>
          )}
          <MessageList messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} />
          <ChatInput inputValue={inputValue} setInputValue={setInputValue} isLoading={isLoading} handleSubmitWithFile={handleSubmitWithFile}
            autoFocus placeholder={formMode ? 'Type your answer... (or "cancel" to stop)' : undefined} />
        </div>
      </div>
    </div>
  );
};

// ── Chat logic hook ────────────────────────────────────────────────
const useChatMessages = (pageContext, studentProfile) => {
  const navigate = useNavigate();
  const welcomeText = WELCOME_MESSAGES[pageContext] || WELCOME_MESSAGES.general;
  const [messages, setMessages] = useState([{ id: 1, type: 'bot', text: welcomeText, timestamp: new Date() }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [formFieldIndex, setFormFieldIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const { processPrompt } = useAI();

  // Build career-aware context string when studentProfile is provided
  const careerContext = studentProfile
    ? `You are an AI Smart Advisor for a DIU student. Their profile:
- Name: ${studentProfile.profile?.name || 'Student'}
- Career Goal: ${studentProfile.career?.careerGoal || 'Not set'}
- Technical Skills: ${studentProfile.career?.techSkills?.join(', ') || 'None listed'}
- Soft Skills: ${studentProfile.career?.softSkills?.join(', ') || 'None'}
- Experience: ${studentProfile.career?.experience?.filter(e=>e.role).map(e=>`${e.role} at ${e.company}`).join(', ') || 'None'}
- Projects: ${studentProfile.career?.projects?.filter(p=>p.name).map(p=>p.name).join(', ') || 'None'}
- Certificates: ${studentProfile.career?.certificates?.filter(c=>c.name).map(c=>c.name).join(', ') || 'None'}
- GitHub: ${studentProfile.career?.github || 'Not provided'}
Give personalized, practical career advice based on this profile. If the student asks about skills to learn, CV improvement, job applications, interview prep, or career paths — tailor your answer to their specific profile. If key information is missing (like skills or goal), ask for it before giving advice.`
    : 'DIU University admission advising. Help students fill the Pre-Registration and Online Admit forms.';

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), type: 'bot', text, timestamp: new Date() }]);
  };

  const startFormMode = (type) => {
    const fields = type === 'pre-register' ? PRE_REGISTER_FIELDS : ONLINE_ADMIT_FIELDS;
    setFormMode(type);
    setFormFieldIndex(0);
    setFormData({});
    const label = type === 'pre-register' ? 'Pre-Registration' : 'Online Admit';
    addBotMessage(
      `📋 Let's fill your ${label} form together!\n\nI'll ask you ${fields.length} questions one by one and then automatically open the form with everything pre-filled. You can type "cancel" at any time to stop.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\nQuestion 1 of ${fields.length}\n\n${fields[0].question}`
    );
  };

  const handleFormInput = (text, currentFormMode, currentFieldIndex, currentFormData) => {
    if (text.trim().toLowerCase() === 'cancel' || text.trim().toLowerCase() === 'quit') {
      setFormMode(null);
      setFormFieldIndex(0);
      setFormData({});
      addBotMessage('❌ Form filling cancelled. You can restart anytime by clicking the form buttons. How else can I help?');
      return;
    }

    const fields = currentFormMode === 'pre-register' ? PRE_REGISTER_FIELDS : ONLINE_ADMIT_FIELDS;
    const field = fields[currentFieldIndex];

    if (!field.validate(text)) {
      addBotMessage(`⚠️ ${field.error}\n\nPlease try again:\n${field.question}`);
      return;
    }

    const normalized = field.normalize(text);
    const newFormData = { ...currentFormData, [field.key]: normalized };
    setFormData(newFormData);
    const nextIndex = currentFieldIndex + 1;

    if (nextIndex >= fields.length) {
      setFormMode(null);
      setFormFieldIndex(0);
      if (currentFormMode === 'pre-register') {
        localStorage.setItem('chatbot_preregister_data', JSON.stringify(newFormData));
        // Dispatch event so the form page updates even if already mounted
        window.dispatchEvent(new CustomEvent('chatbot-form-fill', {
          detail: { form: 'pre-register', data: newFormData }
        }));
        addBotMessage(
          `✅ All done! Here's a summary:\n\n• Name: ${newFormData.fullName}\n• Email: ${newFormData.email}\n• Contact: ${newFormData.contactNumber}\n• SSC: ${newFormData.sscResult} GPA — ${newFormData.sscGroup} (${newFormData.sscBoard}, ${newFormData.sscYear})\n• HSC: ${newFormData.hscResult} GPA — ${newFormData.hscGroup} (${newFormData.hscBoard}, ${newFormData.hscYear})\n• Program: ${newFormData.programHint}\n\n✅ Your form has been automatically filled! Click the form to review and select your program.`
        );
        // Navigate only if not already on the page
        if (!window.location.pathname.includes('/pre-register')) {
          setTimeout(() => navigate('/pre-register'), 1800);
        }
      } else {
        localStorage.setItem('chatbot_admit_data', JSON.stringify(newFormData));
        window.dispatchEvent(new CustomEvent('chatbot-form-fill', {
          detail: { form: 'online-admit', data: newFormData }
        }));
        addBotMessage(
          `✅ All done! Here's a summary:\n\n• Name: ${newFormData.fullName}\n• Father: ${newFormData.fatherName}\n• Mother: ${newFormData.motherName}\n• Gender: ${newFormData.gender}\n• SSC: ${newFormData.sscGpa} GPA (${newFormData.sscBoard}, ${newFormData.sscYear})\n• HSC: ${newFormData.hscGpa} GPA (${newFormData.hscBoard}, ${newFormData.hscYear})\n• Program: ${newFormData.programName}\n\n✅ Your form has been automatically filled! Review each step and upload your documents.`
        );
        if (!window.location.pathname.includes('/admit-card')) {
          setTimeout(() => navigate('/admit-card'), 1800);
        }
      }
      return;
    }

    setFormFieldIndex(nextIndex);
    addBotMessage(`✓ ${field.label}: ${normalized}\n\n━━━━━━━━━━━━━━━━━━━━\nQuestion ${nextIndex + 1} of ${fields.length}\n\n${fields[nextIndex].question}`);
  };

  const sendMessage = async (text, currentMessages, fileData) => {
    let finalText = text.trim();
    if (!finalText && !fileData) return;

    // Inject text file content into message
    if (fileData?.type === 'text') {
      finalText = (finalText ? finalText + '\n\n' : '') +
        `Attached document "${fileData.name}":\n\n${fileData.content}`;
    } else if (fileData?.type === 'image') {
      // Image: call vision endpoint, return analysis as bot message
      const userMsg = { id: Date.now(), type: 'user', text: finalText || `Analyze: ${fileData.name}`, timestamp: new Date(), fileAttachment: { name: fileData.name, type: 'image' } };
      setMessages(prev => [...prev, userMsg]);
      setInputValue('');
      setIsLoading(true);
      try {
        const GENERAL_SYS = 'You are a helpful AI assistant for Daffodil International University. Analyze the attached image and answer student questions about it in the context of university admissions, academics, or career.';
        const reply = await analyzeImageWithVision(
          [{ role: 'user', content: finalText || `Please analyze this image: ${fileData.name}` }],
          GENERAL_SYS,
          fileData.dataUrl
        );
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: reply, timestamp: new Date() }]);
      } catch {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: 'Could not analyze the image. Please try again.', timestamp: new Date() }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!finalText) return;
    const updatedMessages = [...(currentMessages || messages), { id: Date.now(), type: 'user', text: finalText, timestamp: new Date(), fileAttachment: fileData ? { name: fileData.name, type: fileData.type } : null }];
    setMessages(updatedMessages);
    setInputValue('');

    if (formMode) {
      handleFormInput(text, formMode, formFieldIndex, formData);
      return;
    }

    const lower = text.toLowerCase();
    const wantsFill = lower.includes('fill') || lower.includes('help me') || lower.includes('form') || lower.includes('register') || lower.includes('admission form');
    const wantsPreReg = wantsFill && (lower.includes('pre') || lower.includes('pre-reg') || lower.includes('preregist'));
    const wantsAdmit = wantsFill && (lower.includes('admit') || lower.includes('online admit') || lower.includes('full form') || lower.includes('online form'));

    if (wantsPreReg) {
      addBotMessage("I can fill that form for you! Starting the Pre-Registration form assistant now...");
      setTimeout(() => startFormMode('pre-register'), 600);
      return;
    }
    if (wantsAdmit) {
      addBotMessage("I can fill that form for you! Starting the Online Admit form assistant now...");
      setTimeout(() => startFormMode('online-admit'), 600);
      return;
    }

    setIsLoading(true);
    const historyForApi = updatedMessages.slice(0, -1).map(m => ({ type: m.type, text: m.text }));
    try {
      const result = await processPrompt({
        prompt: text,
        context: careerContext,
        moduleType: studentProfile ? 'career' : 'admission',
        history: historyForApi,
      });
      if (result && result.success && result.data) {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: result.data.response || 'Sorry, I could not generate a response.', timestamp: new Date() }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: `Sorry, I encountered an issue: ${result?.error || 'Failed to get response'}`, timestamp: new Date() }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: 'Sorry, something went wrong. Please try again.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue, messages);
  };

  const handleSubmitWithFile = (e, fileData) => {
    e.preventDefault();
    sendMessage(inputValue, messages, fileData);
  };

  const currentFormFields = formMode === 'pre-register' ? PRE_REGISTER_FIELDS : formMode === 'online-admit' ? ONLINE_ADMIT_FIELDS : [];
  const formProgress = currentFormFields.length > 0 ? Math.round((formFieldIndex / currentFormFields.length) * 100) : 0;

  return { messages, inputValue, setInputValue, isLoading, sendMessage: (text) => sendMessage(text, messages), handleSubmit, handleSubmitWithFile: (e, f) => handleSubmitWithFile(e, f), formMode, formProgress, formFieldIndex, totalFormFields: currentFormFields.length, startFormMode };
};

// ── Main widget export ─────────────────────────────────────────────
// pageContext: 'pre-register' | 'online-admit' | 'career-jobs' | 'general'
// studentProfile: { profile, career } — from JobsPage for personalized AI advice
export const ChatbotWidget = ({ pageContext = 'general', studentProfile = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = React.useRef(null);
  const chat = useChatMessages(pageContext, studentProfile);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.isLoading]);

  // Context-aware label for form buttons
  const contextFormMode = pageContext === 'pre-register' ? 'pre-register' : pageContext === 'online-admit' ? 'online-admit' : null;

  if (isFullscreen) {
    return (
      <FullscreenChat
        onMinimize={() => setIsFullscreen(false)}
        onClose={() => { setIsFullscreen(false); setIsOpen(false); }}
        messages={chat.messages}
        inputValue={chat.inputValue}
        setInputValue={chat.setInputValue}
        isLoading={chat.isLoading}
        handleSubmit={chat.handleSubmit}
        handleSubmitWithFile={chat.handleSubmitWithFile}
        sendMessage={chat.sendMessage}
        formMode={chat.formMode}
        formProgress={chat.formProgress}
        formFieldIndex={chat.formFieldIndex}
        totalFormFields={chat.totalFormFields}
        startFormMode={chat.startFormMode}
      />
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[60] flex flex-col items-end gap-4">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 border border-outline-variant/20 flex flex-col h-[480px] sm:h-[520px]">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 rounded-t-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight">{pageContext === 'career-jobs' ? 'AI Smart Advisor' : 'DIU Admission Assistant'}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-[11px] text-white/70">Online — here to help</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setIsFullscreen(true)} title="Full screen" className="p-1.5 rounded-lg hover:bg-white/20 transition-all">
                <span className="material-symbols-outlined text-base">open_in_full</span>
              </button>
              <button onClick={() => setIsOpen(false)} title="Minimize" className="p-1.5 rounded-lg hover:bg-white/20 transition-all">
                <span className="material-symbols-outlined text-base">remove</span>
              </button>
              <button onClick={() => setIsOpen(false)} title="Close" className="p-1.5 rounded-lg hover:bg-white/20 transition-all">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {/* Form progress bar */}
          {chat.formMode && (
            <div className="px-3 py-2 bg-green-50 border-b border-green-200 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-green-700 truncate">
                {chat.formMode === 'pre-register' ? 'Pre-Reg' : 'Online Admit'} — {chat.formFieldIndex + 1}/{chat.totalFormFields}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-20 bg-green-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${chat.formProgress}%` }} />
                </div>
                <button onClick={() => chat.sendMessage('cancel')} className="text-[10px] text-red-500 font-bold hover:underline">Cancel</button>
              </div>
            </div>
          )}

          {/* Context-aware quick buttons shown when no form is active */}
          {!chat.formMode && chat.messages.length === 1 && (
            <div className="px-3 py-2 border-b border-outline-variant/20 flex gap-2">
              {contextFormMode === 'pre-register' ? (
                <button onClick={() => chat.startFormMode('pre-register')} disabled={chat.isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-primary/10 border border-primary/20 rounded-lg text-[11px] text-primary font-bold hover:bg-primary/20 transition-all disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
                  Fill Form with AI
                </button>
              ) : contextFormMode === 'online-admit' ? (
                <button onClick={() => chat.startFormMode('online-admit')} disabled={chat.isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-700 font-bold hover:bg-indigo-100 transition-all disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
                  Fill Admit Form with AI
                </button>
              ) : (
                <>
                  <button onClick={() => chat.startFormMode('pre-register')} disabled={chat.isLoading}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-[11px] text-primary font-bold hover:bg-primary/20 transition-all disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
                    Pre-Registration
                  </button>
                  <button onClick={() => chat.startFormMode('online-admit')} disabled={chat.isLoading}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-700 font-bold hover:bg-indigo-100 transition-all disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
                    Online Admit
                  </button>
                </>
              )}
            </div>
          )}

          <MessageList messages={chat.messages} isLoading={chat.isLoading} messagesEndRef={messagesEndRef} />
          <ChatInput
            inputValue={chat.inputValue}
            setInputValue={chat.setInputValue}
            isLoading={chat.isLoading}
            handleSubmitWithFile={chat.handleSubmitWithFile}
            placeholder={chat.formMode ? 'Type your answer... (or "cancel" to stop)' : undefined}
          />
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative"
        title="Need help? Chat with DIU Assistant"
      >
        <span className="material-symbols-outlined text-3xl">
          {isOpen ? 'close' : 'chat'}
        </span>
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#0c1282] rounded-full border-2 border-surface flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          </div>
        )}
      </button>

      {/* Tooltip hint when closed */}
      {!isOpen && (
        <div className="absolute bottom-20 right-0 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none opacity-0 hover:opacity-100 transition-opacity shadow-lg">
          Need help? Ask me!
        </div>
      )}
    </div>
  );
};
