import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Square, Sparkles, Loader } from 'lucide-react';

const ELEVENLABS_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
// Rachel — warm, clear, natural-sounding voice
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

function Waveform({ active }) {
  return (
    <div className="flex items-center gap-0.5 h-8">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full"
          style={{
            backgroundColor: active ? '#2DD4BF' : '#1E3A3A',
            animation: active ? `wave ${0.35 + (i % 6) * 0.07}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.04}s`,
            height: active ? undefined : '3px',
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { height: 3px; }
          to   { height: ${Math.floor(Math.random() * 8) + 18}px; }
        }
      `}</style>
    </div>
  );
}

function buildBriefing(tasks, userName) {
  const pending = (tasks || []).filter(t => !t.done);
  const done    = (tasks || []).filter(t => t.done);
  const school  = pending.filter(t => t.category === 'school');
  const fitness = pending.filter(t => t.category === 'fitness');
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  let s = `${greeting}, ${userName || 'champion'}. `;
  if (pending.length === 0) {
    s += `You've completed every task today — that's incredible. Take a moment to celebrate, and keep that streak alive!`;
  } else {
    s += `Here's your daily briefing. `;
    if (done.length > 0) s += `You've already crushed ${done.length} task${done.length > 1 ? 's' : ''} — great momentum! `;
    s += `You have ${pending.length} task${pending.length > 1 ? 's' : ''} remaining today. `;
    if (school.length > 0) s += `Top priority: ${school[0].title}${school[0].time ? ` at ${school[0].time}` : ''}. `;
    if (fitness.length > 0) s += `Don't skip your workout — your future self will thank you. `;
    s += `Stay locked in. Make every hour count. Let's go!`;
  }
  return s;
}

export default function VoiceCoach({ tasks, userName, theme }) {
  const [playing, setPlaying]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [script, setScript]     = useState('');
  const [muted, setMuted]       = useState(false);
  const [wordIdx, setWordIdx]   = useState(-1);
  const [error, setError]       = useState('');

  const audioRef    = useRef(null);
  const intervalRef = useRef(null);
  const wordsRef    = useRef([]);

  const accent  = theme?.accent  || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    clearInterval(intervalRef.current);
    setPlaying(false);
    setWordIdx(-1);
  };

  const play = async () => {
    if (playing) { stop(); return; }
    setError('');
    const text = buildBriefing(tasks, userName);
    setScript(text);
    wordsRef.current = text.split(' ');

    // ── Try ElevenLabs first ──────────────────────────────────────────────
    if (ELEVENLABS_KEY) {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVENLABS_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              model_id: 'eleven_turbo_v2',
              voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
            }),
          }
        );

        if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = muted ? 0 : 1;
        audioRef.current = audio;

        audio.onended = () => { setPlaying(false); setWordIdx(-1); clearInterval(intervalRef.current); URL.revokeObjectURL(url); };
        audio.onerror = () => { setPlaying(false); setError('Playback error.'); };

        await audio.play();
        setPlaying(true);
        setLoading(false);

        // Sync word highlights to estimated speech pace
        const estDuration = text.split(' ').length * 380; // ~380ms/word
        let wi = 0;
        intervalRef.current = setInterval(() => {
          setWordIdx(wi++);
          if (wi >= wordsRef.current.length) clearInterval(intervalRef.current);
        }, estDuration / wordsRef.current.length);

        return;
      } catch (e) {
        console.warn('ElevenLabs error, falling back to browser TTS:', e);
        setLoading(false);
        setError('ElevenLabs error — using browser voice instead.');
      }
    }

    // ── Fallback: Web Speech API ──────────────────────────────────────────
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95; utter.pitch = 1.05; utter.volume = muted ? 0 : 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Aria'));
    if (preferred) utter.voice = preferred;
    let wi = 0;
    utter.onboundary = e => { if (e.name === 'word') setWordIdx(wi++); };
    utter.onend = () => { setPlaying(false); setWordIdx(-1); clearInterval(intervalRef.current); };
    window.speechSynthesis.speak(utter);
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setWordIdx(wi++);
      if (wi >= wordsRef.current.length) clearInterval(intervalRef.current);
    }, 350);
  };

  useEffect(() => () => { stop(); window.speechSynthesis.cancel(); }, []);

  // Mute/unmute live audio
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : 1;
  }, [muted]);

  const words = script.split(' ');

  return (
    <div className="rounded-2xl p-5 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>

      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ backgroundColor: accent }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: accent + '30', border: `1px solid ${accent}50` }}>
            <Volume2 size={18} style={{ color: accent }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm text-white">Voice Coach</p>
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                <Sparkles size={10} style={{ color: accent }} />
                <span className="text-xs font-medium" style={{ color: accent }}>ElevenLabs</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {ELEVENLABS_KEY ? 'AI voice · Rachel' : 'Browser voice (no key set)'}
            </p>
          </div>
        </div>
        <button onClick={() => setMuted(!muted)}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          {muted ? <VolumeX size={16} className="text-gray-500" /> : <Volume2 size={16} className="text-gray-400" />}
        </button>
      </div>

      {/* Waveform */}
      <div className="flex justify-center mb-4">
        <Waveform active={playing} />
      </div>

      {/* Transcript */}
      {script ? (
        <div className="bg-white/5 rounded-xl p-3 mb-4 max-h-20 overflow-y-auto text-xs leading-relaxed">
          {words.map((w, i) => (
            <span key={i} className={`transition-colors duration-100 ${
              i === wordIdx ? 'text-white font-semibold' : i < wordIdx ? 'text-gray-600' : 'text-gray-400'
            }`}>{w}{' '}</span>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-3 mb-4 text-xs text-gray-500 text-center">
          Press "Play My Day" for your personalized morning briefing
        </div>
      )}

      {error && (
        <p className="text-xs text-yellow-400 mb-2 text-center">{error}</p>
      )}

      {/* Play button */}
      <button onClick={play} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
        style={{
          background: playing ? 'linear-gradient(135deg,#EF4444,#DC2626)' : `linear-gradient(135deg,${primary},${accent})`,
          color: '#0F172A',
        }}>
        {loading
          ? <><Loader size={15} className="animate-spin" /> Generating…</>
          : playing
          ? <><Square size={15} fill="currentColor" /> Stop</>
          : <><Play  size={15} fill="currentColor" /> Play My Day</>
        }
      </button>
    </div>
  );
}
