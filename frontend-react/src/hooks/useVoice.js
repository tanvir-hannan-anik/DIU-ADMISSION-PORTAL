import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [voiceOn, setVoiceOn]         = useState(false);
  const [transcript, setTranscript]   = useState('');   // interim only (live preview)
  const [voiceError, setVoiceError]   = useState('');
  const [supported, setSupported]     = useState(false);
  const [lang, setLang]               = useState('en-US'); // 'en-US' | 'bn-BD'
  const recognitionRef = useRef(null);
  const onFinalRef     = useRef(null);
  const langRef        = useRef('en-US');

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const r = new SR();
    r.continuous     = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    // CRITICAL FIX: use e.resultIndex so we only process NEW results each event.
    // The old code did Array.from(e.results) which re-joined everything from
    // the beginning every tick — causing duplicated / snowballing transcript.
    r.onresult = (e) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final   += text;
        else                       interim += text;
      }
      if (interim) setTranscript(interim);
      if (final) {
        onFinalRef.current?.(final.trim());
        setTranscript('');
      }
    };

    r.onend = () => setIsListening(false);

    r.onerror = (e) => {
      setIsListening(false);
      setTranscript('');
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed')
        setVoiceError('Microphone permission denied. Allow mic access and try again.');
      else if (e.error === 'no-speech')
        setVoiceError('No speech detected. Please speak clearly and try again.');
      else if (e.error === 'network')
        setVoiceError('Network error. Check your connection.');
      else if (e.error === 'audio-capture')
        setVoiceError('No microphone found. Please connect a mic.');
      else
        setVoiceError('Voice recognition failed. Please try again.');
    };

    recognitionRef.current = r;
  }, []);

  const startListening = useCallback((onFinal) => {
    if (!recognitionRef.current || isListening) return;
    setVoiceError('');
    setTranscript('');
    // Apply current language right before starting
    recognitionRef.current.lang = langRef.current;
    onFinalRef.current = onFinal || null;
    setIsListening(true);
    try { recognitionRef.current.start(); } catch (_) { setIsListening(false); }
  }, [isListening]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (_) {}
  }, []);

  const toggleLang = useCallback(() => {
    const next = langRef.current === 'en-US' ? 'bn-BD' : 'en-US';
    langRef.current = next;
    setLang(next);
  }, []);

  // TTS: strip markdown so it sounds natural
  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text
      .replace(/[*_`#|]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 500);
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.rate    = 1.0;
    u.pitch   = 1.0;
    u.onstart = () => setIsSpeaking(true);
    u.onend   = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceOn(v => {
      if (v) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
      return !v;
    });
  }, []);

  const clearVoiceError = useCallback(() => setVoiceError(''), []);

  return {
    isListening, isSpeaking, voiceOn, transcript, voiceError, supported, lang,
    startListening, stopListening, speak, stopSpeaking, toggleVoice, toggleLang, clearVoiceError,
  };
}
