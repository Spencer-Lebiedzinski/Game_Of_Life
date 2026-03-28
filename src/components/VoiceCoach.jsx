import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Square, Mic, Sparkles } from 'lucide-react';

function Waveform({ active }) {
  return (
    <div className="flex items-center gap-0.5 h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all"
          style={{
            backgroundColor: active ? '#2DD4BF' : '#D1FAE5',
            height: active
              ? `${8 + Math.sin((Date.now() / 150 + i * 0.8)) * 14 + 14}px`
              : '4px',
            animation: active ? `wave ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { height: 4px; }
          to { height: 28px; }
        }
      `}</style>
    </div>
  );
}

function buildBriefing(tasks, userName) {
  const todayTasks = tasks || [];
  const pending = todayTasks.filter(t => !t.done);
  const done = todayTasks.filter(t => t.done);
  const schoolTasks = pending.filter(t => t.category === 'school');
  const fitnessTasks = pending.filter(t => t.category === 'fitness');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  let script = `${greeting}, ${userName || 'champion'}. `;

  if (pending.length === 0) {
    script += `Amazing — you've completed all your tasks for today! Take a moment to celebrate. Keep that streak alive!`;
  } else {
    script += `Here's your daily briefing. `;

    if (done.length > 0) {
      script += `You've already crushed ${done.length} task${done.length > 1 ? 's' : ''} — great momentum! `;
    }

    script += `You have ${pending.length} task${pending.length > 1 ? 's' : ''} remaining today. `;

    if (schoolTasks.length > 0) {
      const first = schoolTasks[0];
      script += `Focus priority: ${first.title}${first.time ? ` at ${first.time}` : ''}. `;
    }

    if (fitnessTasks.length > 0) {
      script += `Don't skip your workout — your body will thank you. `;
    }

    const hasFinance = pending.some(t => t.category === 'finance');
    if (hasFinance) {
      script += `Watch your spending today. `;
    }

    script += `You're on a mission. Make every hour count. Let's go!`;
  }

  return script;
}

export default function VoiceCoach({ tasks, userName, theme }) {
  const [playing, setPlaying] = useState(false);
  const [script, setScript] = useState('');
  const [muted, setMuted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [wordIdx, setWordIdx] = useState(-1);
  const utterRef = useRef(null);
  const wordsRef = useRef([]);
  const intervalRef = useRef(null);

  const accent = theme?.accent || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  const play = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      clearInterval(intervalRef.current);
      setPlaying(false);
      setWordIdx(-1);
      return;
    }

    const text = buildBriefing(tasks, userName);
    setScript(text);
    wordsRef.current = text.split(' ');

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1.05;
    utter.volume = muted ? 0 : 1;

    // Pick a pleasant voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Google US English') ||
      v.name.includes('Microsoft Aria') ||
      v.name.includes('Karen')
    );
    if (preferred) utter.voice = preferred;

    let idx = 0;
    utter.onboundary = (e) => {
      if (e.name === 'word') {
        setWordIdx(idx++);
      }
    };
    utter.onend = () => {
      setPlaying(false);
      setWordIdx(-1);
      clearInterval(intervalRef.current);
    };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);

    // fallback word highlight animation
    let wi = 0;
    intervalRef.current = setInterval(() => {
      wi++;
      setWordIdx(wi);
      if (wi >= wordsRef.current.length) {
        clearInterval(intervalRef.current);
      }
    }, 320);
  };

  useEffect(() => {
    // Load voices async
    window.speechSynthesis.onvoiceschanged = () => {};
    return () => {
      window.speechSynthesis.cancel();
      clearInterval(intervalRef.current);
    };
  }, []);

  const words = script.split(' ');

  return (
    <div
      className="rounded-2xl p-5 text-white relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)` }}
    >
      {/* Glow */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ backgroundColor: accent }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: accent + '30', border: `1px solid ${accent}50` }}
          >
            <Volume2 size={18} style={{ color: accent }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm text-white">Voice Coach</p>
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                <Sparkles size={10} style={{ color: accent }} />
                <span className="text-xs" style={{ color: accent }}>ElevenLabs</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">AI-powered morning briefing</p>
          </div>
        </div>
        <button
          onClick={() => setMuted(!muted)}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          {muted ? <VolumeX size={16} className="text-gray-500" /> : <Volume2 size={16} className="text-gray-400" />}
        </button>
      </div>

      {/* Waveform */}
      <div className="flex justify-center mb-4">
        <Waveform active={playing} />
      </div>

      {/* Scrolling transcript */}
      {script ? (
        <div className="bg-white/5 rounded-xl p-3 mb-4 max-h-20 overflow-y-auto text-xs leading-relaxed text-gray-300">
          {words.map((w, i) => (
            <span
              key={i}
              className={`transition-colors duration-150 ${
                i === wordIdx ? 'text-white font-semibold' : i < wordIdx ? 'text-gray-500' : 'text-gray-300'
              }`}
            >
              {w}{' '}
            </span>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-3 mb-4 text-xs text-gray-500 text-center">
          Press "Play My Day" for your 20-second morning briefing
        </div>
      )}

      {/* Play button */}
      <button
        onClick={play}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-98"
        style={{
          background: playing
            ? 'linear-gradient(135deg, #EF4444, #DC2626)'
            : `linear-gradient(135deg, ${primary}, ${accent})`,
          color: '#0F172A',
        }}
      >
        {playing ? (
          <><Square size={15} fill="currentColor" /> Stop</>
        ) : (
          <><Play size={15} fill="currentColor" /> Play My Day</>
        )}
      </button>

      {/* ElevenLabs key (optional) */}
      <div className="mt-3">
        <button
          onClick={() => setShowKey(!showKey)}
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          {showKey ? '▲ Hide' : '▼ Use ElevenLabs API key (optional)'}
        </button>
        {showKey && (
          <div className="mt-2 flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent"
            />
            <button
              className="px-3 py-2 rounded-xl text-xs font-medium text-dark"
              style={{ backgroundColor: accent }}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
