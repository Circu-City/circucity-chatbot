"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Sparkles, Zap,
  MessageSquare, ShieldCheck, RefreshCw, Bot, User, ArrowLeft,
  Settings, ChevronRight, Activity, Smartphone, Globe, CheckCircle2,
  AlertCircle, Copy, Check, MessageCircle, Headphones
} from "lucide-react";

interface TranscriptItem {
  id: string;
  role: "user" | "cira";
  text: string;
  time: string;
}

const SUPPORT_PHONE_NUMBER = "+2348153188306";
const SUPPORT_PHONE_DISPLAY = "+234 815 318 8306";
const WHATSAPP_LINK = "https://wa.me/2348153188306?text=Hello%20CircuCity%2C%20I%20need%20assistance";

const AVAILABLE_VOICES = [
  { id: "cira", name: "Cira (default, warm and measured)" },
  { id: "jenny", name: "Jenny (US, Warm & Friendly)" },
  { id: "sonia", name: "Sonia (British, Professional)" },
  { id: "guy", name: "Guy (US, Confident)" },
  { id: "ryan", name: "Ryan (British, Calm)" },
  { id: "emma", name: "Emma (Multilingual)" },
];

export default function VoiceCallPage() {
  const [activeTab, setActiveTab] = useState<"ai-voice" | "direct-call" | "callback">("ai-voice");
  const [copied, setCopied] = useState(false);

  // Callback form
  const [callbackNumber, setCallbackNumber] = useState("");
  const [callbackState, setCallbackState] = useState<"idle" | "dialing" | "success" | "error">("idle");
  const [callbackMsg, setCallbackMsg] = useState("");

  // In-Browser Call state
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("cira");
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Bumped on hang-up so a reply already mid-stream stops queueing clips.
  const speechTokenRef = useRef(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<any>(null);
  const isMutedRef = useRef(isMuted);
  const isSpeakerOnRef = useRef(isSpeakerOn);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isSpeakerOnRef.current = isSpeakerOn;
  }, [isSpeakerOn]);

  // Call timer
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callActive]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SUPPORT_PHONE_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const unlockAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        ctx.resume();
      }
    } catch (e) {}
  };

  // Start In-Browser Voice Call
  const startBrowserCall = async () => {
    unlockAudio();
    setErrorMessage("");
    setCallActive(true);
    setStatus("speaking");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
    }

    const greeting = "Hello! I am Cira, your personal shopping companion from CircuCity. How can I help you today?";
    addTranscript("cira", greeting);
    await speakResponse(greeting, () => {
      initSpeechRecognition();
    });
  };

  const endBrowserCall = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    speechTokenRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
    setCallActive(false);
    setStatus("idle");
    setCurrentSpeech("");
  };

  // --- on-prem speech to text -------------------------------------------------
  // Replaces webkitSpeechRecognition, which exists only in Chrome/Edge and ships
  // the caller audio to Google. We capture PCM, detect end-of-turn locally, and
  // post a 16kHz mono WAV to /api/stt (faster-whisper running on this box).
  //
  // The browser recogniser is kept strictly as a fallback for when the mic or the
  // STT service is unavailable, so a failure degrades instead of ending the call.

  const SILENCE_RMS = 0.008;      // below this counts as silence
  const SILENCE_MS = 900;         // trailing silence that ends a turn
  const MIN_SPEECH_MS = 300;      // ignore coughs and clicks
  const MAX_UTTERANCE_MS = 15000; // hard stop so one turn cannot run away

  const downsampleTo16k = (input: Float32Array, inRate: number): Float32Array => {
    if (inRate === 16000) return input;
    const ratio = inRate / 16000;
    const outLen = Math.floor(input.length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(Math.floor((i + 1) * ratio), input.length);
      let sum = 0;
      let n = 0;
      for (let j = start; j < end; j++) { sum += input[j]; n++; }
      out[i] = n ? sum / n : 0; // box filter: cheap anti-aliasing
    }
    return out;
  };

  const encodeWav = (samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const str = (off: number, text: string) => {
      for (let i = 0; i < text.length; i++) view.setUint8(off + i, text.charCodeAt(i));
    };
    str(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    str(8, "WAVE");
    str(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    str(36, "data");
    view.setUint32(40, samples.length * 2, true);
    let off = 44;
    for (let i = 0; i < samples.length; i++, off += 2) {
      const v = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    }
    return new Blob([view], { type: "audio/wav" });
  };

  const transcribe = async (wav: Blob): Promise<string | null> => {
    try {
      const res = await fetch("/api/stt", {
        method: "POST",
        headers: { "Content-Type": "audio/wav", "X-Language": "en" },
        body: wav,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data?.text === "string" ? data.text.trim() : null;
    } catch (e) {
      console.warn("[STT]", e);
      return null;
    }
  };

  const initSpeechRecognition = () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      initBrowserRecognitionFallback();
      return;
    }

    let stopped = false;
    let chunks: Float32Array[] = [];
    let speaking = false;
    let speechMs = 0;
    let silenceMs = 0;

    const controller = {
      abort: () => {
        stopped = true;
        try { audioCtxRef.current?.close(); } catch (e) {}
        audioCtxRef.current = null;
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      },
    };
    recognitionRef.current = controller;

    navigator.mediaDevices
      .getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        micStreamRef.current = stream;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const node = ctx.createScriptProcessor(4096, 1, 1);
        const frameMs = (4096 / ctx.sampleRate) * 1000;
        setStatus("listening");

        const finish = async () => {
          const captured = chunks;
          chunks = [];
          speaking = false;
          speechMs = 0;
          silenceMs = 0;
          if (!captured.length) return;

          const total = captured.reduce((n, c) => n + c.length, 0);
          const merged = new Float32Array(total);
          let off = 0;
          for (const c of captured) { merged.set(c, off); off += c.length; }

          setStatus("thinking");
          const wav = encodeWav(downsampleTo16k(merged, ctx.sampleRate), 16000);
          const text = await transcribe(wav);
          if (stopped) return;
          if (text) {
            setCurrentSpeech(text);
            if (!isMutedRef.current) handleUserSpeech(text);
          } else {
            setStatus("listening");
          }
        };

        node.onaudioprocess = (event) => {
          if (stopped || isMutedRef.current) return;
          const input = event.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
          const rms = Math.sqrt(sum / input.length);

          if (rms >= SILENCE_RMS) {
            if (!speaking) { speaking = true; chunks = []; }
            speechMs += frameMs;
            silenceMs = 0;
            chunks.push(new Float32Array(input));
          } else if (speaking) {
            silenceMs += frameMs;
            chunks.push(new Float32Array(input)); // keep trailing silence; whisper likes the context
            if (silenceMs >= SILENCE_MS) {
              if (speechMs >= MIN_SPEECH_MS) void finish();
              else { chunks = []; speaking = false; speechMs = 0; silenceMs = 0; }
            }
          }

          if (speaking && speechMs >= MAX_UTTERANCE_MS) void finish();
        };

        source.connect(node);
        node.connect(ctx.destination);
      })
      .catch((err) => {
        console.warn("[Mic] permission or device error:", err);
        setErrorMessage("Microphone unavailable. Please allow microphone access.");
        initBrowserRecognitionFallback();
      });
  };

  // Legacy path, used only when the mic pipeline cannot run.
  const initBrowserRecognitionFallback = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => setStatus("listening");
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setCurrentSpeech(final || interim);
      if (final && !isMutedRef.current) handleUserSpeech(final);
    };
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" && callActive) {
        try { recognition.start(); } catch (e) {}
      }
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) {}
  };

  const handleUserSpeech = async (userText: string) => {
    if (!userText.trim()) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    addTranscript("user", userText);
    setCurrentSpeech("");
    setStatus("thinking");

    try {
      const res = await fetch("/api/voice/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          voice: selectedVoice,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "I am here to help you shop for sustainable products and track your orders.";

      addTranscript("cira", reply);
      setStatus("speaking");

      await speakResponse(reply, () => {
        if (callActive) {
          initSpeechRecognition();
        }
      });
    } catch (err) {
      console.error("[Call error]", err);
      const fallback = "I'm having a little trouble connecting. Please ask again!";
      addTranscript("cira", fallback);
      setStatus("speaking");
      await speakResponse(fallback, () => {
        if (callActive) initSpeechRecognition();
      });
    }
  };

  // Synthesis costs roughly a second per sentence, so asking for the whole reply
  // as a single clip left several seconds of silence before Cira said anything.
  // The reply is split and pipelined instead: clip N plays while clip N+1 is
  // already being synthesised, so audio starts after the FIRST sentence.
  const splitIntoSentences = (text: string): string[] => {
    const parts = text.match(/[^.!?…]+[.!?…]+["')\]]*\s*|[^.!?…]+$/g) || [text];
    const out: string[] = [];
    for (const raw of parts) {
      const sentence = raw.trim();
      if (!sentence) continue;
      // Short fragments ("Sure." / "Yes!") are folded into the previous clip --
      // alone they sound clipped and cost a whole round trip.
      if (out.length && sentence.length < 30) out[out.length - 1] += " " + sentence;
      else out.push(sentence);
    }
    return out.length ? out : [text];
  };

  const fetchClip = async (sentence: string): Promise<Blob | null> => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sentence, voice: selectedVoice, lang: "en" }),
      });
      if (!res.ok) return null;
      const blob = await res.blob();
      return blob.size > 100 ? blob : null;
    } catch (e) {
      console.warn("[TTS clip]", e);
      return null;
    }
  };

  const playClip = (blob: Blob): Promise<void> =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      const finish = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch(finish);
    });

  const speakResponse = async (text: string, onDone: () => void) => {
    if (!isSpeakerOnRef.current) {
      setTimeout(onDone, 1200);
      return;
    }

    const token = ++speechTokenRef.current;
    const sentences = splitIntoSentences(text);
    let pending = fetchClip(sentences[0]);

    for (let i = 0; i < sentences.length; i++) {
      const clip = await pending;
      // Kick off the next synthesis BEFORE playing this clip, so the gap between
      // sentences is hidden behind playback instead of added to it.
      pending = i + 1 < sentences.length ? fetchClip(sentences[i + 1]) : Promise.resolve(null);

      if (token !== speechTokenRef.current) return; // hung up mid-reply
      if (!clip) {
        fallbackSpeech(sentences.slice(i).join(" "), onDone);
        return;
      }
      if (!isSpeakerOnRef.current) break;
      await playClip(clip);
      if (token !== speechTokenRef.current) return;
    }

    onDone();
  };

  const fallbackSpeech = (text: string, onDone: () => void) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = onDone;
      utterance.onerror = onDone;
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(onDone, 1500);
    }
  };

  const addTranscript = (role: "user" | "cira", text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setTranscripts((prev) => [...prev, { id: `t_${Date.now()}_${Math.random()}`, role, text, time }]);
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackNumber.trim()) {
      setCallbackState("error");
      setCallbackMsg("Please enter a valid phone number with country code.");
      return;
    }

    setCallbackState("dialing");
    setCallbackMsg("Requesting automated AI callback...");

    try {
      const res = await fetch("/api/telephony/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: callbackNumber.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCallbackState("success");
        setCallbackMsg(`Calling ${callbackNumber}! Expect a ring shortly.`);
      } else {
        setCallbackState("error");
        setCallbackMsg(
          data.error ||
          "Direct automated callback is currently in standby. Tap 'Direct Support Line' above to call our team immediately!"
        );
      }
    } catch (err) {
      setCallbackState("error");
      setCallbackMsg("Unable to dispatch callback. Please use the Direct Support Line or In-Browser Voice.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-emerald-500/20 bg-slate-950/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                CircuCity Call Concierge
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Live
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Tab Mode Pills */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab("ai-voice")}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
              activeTab === "ai-voice" ? "bg-emerald-500 text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            AI Voice (Cira)
          </button>
          <button
            onClick={() => setActiveTab("direct-call")}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
              activeTab === "direct-call" ? "bg-emerald-500 text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Direct Support Line
          </button>
          <button
            onClick={() => setActiveTab("callback")}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
              activeTab === "callback" ? "bg-emerald-500 text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Request Callback
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Interactive Hub */}
        <div className="lg:col-span-7 bg-slate-900/50 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden min-h-[520px] flex flex-col items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* TAB 1: AI VOICE (IN-BROWSER) */}
          {activeTab === "ai-voice" && (
            <div className="w-full flex flex-col items-center justify-center text-center z-10">
              {/* Voice Avatar Orb */}
              <div className="relative mb-6">
                <div
                  className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-700 ${
                    callActive
                      ? status === "speaking"
                        ? "bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-[0_0_50px_rgba(16,185,129,0.5)] scale-105"
                        : status === "listening"
                        ? "bg-gradient-to-tr from-cyan-500 to-emerald-400 shadow-[0_0_40px_rgba(6,182,212,0.4)] animate-pulse"
                        : "bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                      : "bg-slate-800 border border-white/10"
                  }`}
                >
                  <Bot className={`w-16 h-16 transition-colors duration-500 ${callActive ? "text-slate-950" : "text-slate-500"}`} />
                </div>

                {callActive && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-emerald-500/40 text-emerald-400 text-xs px-3 py-1 rounded-full font-mono flex items-center gap-1.5 shadow-lg">
                    <Activity className="w-3 h-3 animate-pulse" />
                    {formatTime(callDuration)}
                  </span>
                )}
              </div>

              {/* Status Header */}
              <h2 className="text-2xl font-bold text-white mb-2">
                {callActive
                  ? status === "speaking"
                    ? "Cira is speaking..."
                    : status === "listening"
                    ? "Listening to you..."
                    : status === "thinking"
                    ? "Cira is thinking..."
                    : "Connected"
                  : "Speak with Cira in Browser"}
              </h2>
              <p className="text-sm text-slate-400 max-w-sm mb-8">
                {callActive
                  ? currentSpeech || "Speak freely. Ask about eco items, order tracking, or personalized recommendations."
                  : "Free voice conversation in your browser. Speech recognition and speech synthesis both run on our own servers."}
              </p>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {!callActive ? (
                  <button
                    onClick={startBrowserCall}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-[0_0_30px_rgba(16,185,129,0.4)] transition transform hover:scale-105 active:scale-95 flex items-center gap-3"
                  >
                    <Phone className="w-5 h-5 fill-current" />
                    Start Free AI Voice Call
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-4 rounded-2xl border transition ${
                        isMuted ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                      }`}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button
                      onClick={endBrowserCall}
                      className="px-8 py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-base shadow-[0_0_25px_rgba(244,63,94,0.4)] transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <PhoneOff className="w-5 h-5" />
                      End Call
                    </button>

                    <button
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                      className={`p-4 rounded-2xl border transition ${
                        !isSpeakerOn ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                      }`}
                      title={isSpeakerOn ? "Mute Speaker" : "Unmute Speaker"}
                    >
                      {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT SUPPORT LINE (TEL: +2348153188306) */}
          {activeTab === "direct-call" && (
            <div className="w-full max-w-md flex flex-col items-center text-center z-10">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
                <Phone className="w-10 h-10 text-emerald-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-1.5">Direct Support & Operator</h2>
              <p className="text-xs text-slate-400 mb-6">
                One-tap direct dial from your smartphone or VoIP dialer to connect with our official support line.
              </p>

              {/* Number Card */}
              <div className="w-full bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-5 mb-6 shadow-inner">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest block mb-1">
                  Official Line
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-white tracking-wider">
                    {SUPPORT_PHONE_DISPLAY}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                    title="Copy phone number"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3">
                <a
                  href={`tel:${SUPPORT_PHONE_NUMBER}`}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-[0_0_30px_rgba(16,185,129,0.4)] transition transform hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5 fill-current" />
                  Call {SUPPORT_PHONE_DISPLAY} Now
                </a>

                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat / Call on WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: REQUEST CALLBACK */}
          {activeTab === "callback" && (
            <form onSubmit={handleCallbackSubmit} className="w-full max-w-md flex flex-col items-center text-center z-10">
              <div className="w-20 h-20 rounded-3xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mb-6">
                <Smartphone className="w-10 h-10 text-teal-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Request an AI Callback</h2>
              <p className="text-xs text-slate-400 mb-6">
                Enter your mobile number. Cira will dial your device directly via automated carrier dispatch.
              </p>

              <div className="w-full space-y-4 text-left mb-6">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Your Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+234... or +1..."
                    value={callbackNumber}
                    onChange={(e) => setCallbackNumber(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono text-sm"
                  />
                </div>

                {callbackMsg && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                      callbackState === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                        : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                    }`}
                  >
                    {callbackState === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <span>{callbackMsg}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={callbackState === "dialing"}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-[0_0_30px_rgba(16,185,129,0.4)] transition transform hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Phone className="w-5 h-5 fill-current" />
                {callbackState === "dialing" ? "Dispatching Call..." : "Call My Phone"}
              </button>
            </form>
          )}

          {errorMessage && (
            <p className="mt-4 text-xs text-rose-400 bg-rose-950/50 border border-rose-500/20 px-4 py-2 rounded-xl z-10">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Right Sidebar: Voice Persona + Live Feed */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900/50 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              Voice Engine Persona
            </h3>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition"
            >
              {AVAILABLE_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-900/50 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-md flex-1 min-h-[360px] flex flex-col">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Live Conversation Feed
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[320px] pr-2 text-sm">
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12">
                  <Activity className="w-8 h-8 mb-2 opacity-40 text-emerald-500" />
                  <p className="text-xs">Live transcripts and responses will stream here in real-time.</p>
                </div>
              ) : (
                transcripts.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      item.role === "cira"
                        ? "bg-emerald-950/40 border border-emerald-500/20 text-slate-200 ml-2"
                        : "bg-white/5 border border-white/10 text-white mr-2"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-[10px] text-slate-400 mb-1">
                      <span>{item.role === "cira" ? "Cira" : "You"}</span>
                      <span>{item.time}</span>
                    </div>
                    <p>{item.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
