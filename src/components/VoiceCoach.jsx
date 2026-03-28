import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Square, Sparkles, Loader } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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
          to   { height: 26px; }
        }
      `}</style>
    </div>
  );
}

async function generateBriefing(tasks, userName) {
  const pending = (tasks || []).filter(t => !t.done);
  const done    = (tasks || []).filter(t => t.done);
  const hour    = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const taskSummary = pending.length
    ? pending.map(t => `- ${t.title}${t.time ? ` (${t.time})` : ''}${t.category ? ` [${t.category}]` : ''}`).join('\n')
    : 'No tasks remaining — all done!';

  const doneSummary = done.length
    ? done.map(t => `- ${t.title}`).join('\n')
    : 'None yet';

  const prompt = `You are an energetic, personal life coach AI inside a gamified life dashboard app called "Game of Life".

Generate a spoken daily briefing for ${userName || 'the user'} for this ${timeOfDay} on ${dayName}.

Tasks already completed today:
${doneSummary}

Tasks still to do today:
${taskSummary}

Rules:
- Keep it to 4–6 sentences, under 120 words — it will be read aloud
- Open with a warm ${timeOfDay} greeting using their name
- Acknowledge completed tasks with genuine praise if any
- Call out the 1–2 most important pending tasks by name with urgency or encouragement
- End with a short punchy motivational line that references the "Game of Life" or leveling up
- Sound natural and spoken, not written — no bullet points, no markdown
- Be warm, energetic, and direct. Think coach, not robot.`;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export default function VoiceCoach({ tasks, userName, theme }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [script, setScript]   = useState('');
  const [muted, setMuted]     = useState(false);
  const [wordIdx, setWordIdx] = useState(-1);
  const [error, setError]     = useState('');

  const intervalRef = useRef(null);
  const utterRef    = useRef(null);
  const wordsRef    = useRef([]);

  const accent  = theme?.accent  || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  const stop = () => {
    window.speechSynthesis.cancel();
    clearInterval(intervalRef.current);
    setPlaying(false);
    setWordIdx(-1);
  };

  const play = async () => {
    if (playing) { stop(); return; }

    setError('');
    setLoading(true);

    let text;
    try {
      text = await generateBriefing(tasks, userName);
    } catch (e) {
      console.error('Gemini error:', e);
      setError('Could not reach Gemini — check your API key.');
      setLoading(false);
      return;
    }

    setScript(text);
    wordsRef.current = text.split(' ');
    setLoading(false);

    // Speak with Web Speech API
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate   = 0.94;
    utter.pitch  = 1.05;
    utter.volume = muted ? 0 : 1;

    // Pick best available voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Google US English') ||
      v.name.includes('Microsoft Aria') ||
      v.name.includes('Karen') ||
      v.name.includes('Moira')
    );
    if (preferred) utter.voice = preferred;

    let wi = 0;
    utter.onboundary = e => { if (e.name === 'word') setWordIdx(wi++); };
    utter.onend = () => { setPlaying(false); setWordIdx(-1); clearInterval(intervalRef.current); };
    utter.onerror = () => { setPlaying(false); clearInterval(intervalRef.current); };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);

    // Fallback word-highlight sync
    let fwi = 0;
    intervalRef.current = setInterval(() => {
      setWordIdx(fwi++);
      if (fwi >= wordsRef.current.length) clearInterval(intervalRef.current);
    }, 370);
  };

  useEffect(() => () => { stop(); }, []);

  useEffect(() => {
    if (utterRef.current) utterRef.current.volume = muted ? 0 : 1;
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
                <span className="text-xs font-medium" style={{ color: accent }}>Gemini AI</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">Personalized daily briefing</p>
          </div>
        </div>
        <button onClick={() => setMuted(!muted)}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          {muted
            ? <VolumeX size={16} className="text-gray-500" />
            : <Volume2 size={16} className="text-gray-400" />}
        </button>
      </div>

      {/* Waveform */}
      <div className="flex justify-center mb-4">
        <Waveform active={playing} />
      </div>

      {/* Transcript */}
      {script ? (
        <div className="bg-white/5 rounded-xl p-3 mb-4 max-h-24 overflow-y-auto text-xs leading-relaxed">
          {words.map((w, i) => (
            <span key={i} className={`transition-colors duration-100 ${
              i === wordIdx ? 'text-white font-semibold' :
              i < wordIdx  ? 'text-gray-600' : 'text-gray-400'
            }`}>{w}{' '}</span>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-3 mb-4 text-xs text-gray-500 text-center">
          Gemini will read your tasks and write a personalized briefing
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
      )}

      {/* Play button */}
      <button onClick={play} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
        style={{
          background: playing
            ? 'linear-gradient(135deg, #EF4444, #DC2626)'
            : `linear-gradient(135deg, ${primary}, ${accent})`,
          color: '#0F172A',
        }}>
        {loading
          ? <><Loader size={15} className="animate-spin" /> Gemini is thinking…</>
          : playing
          ? <><Square size={15} fill="currentColor" /> Stop</>
          : <><Play size={15} fill="currentColor" /> Play My Day</>
        }
      </button>
    </div>
  );
}
