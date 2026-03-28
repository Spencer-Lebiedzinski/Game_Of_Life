import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Play, Square, Coffee, SkipForward, Zap, Camera, CameraOff, Heart, Activity, Eye, EyeOff } from 'lucide-react';

// ── rPPG helpers ──────────────────────────────────────────────────────────────
// Samples the average green-channel value in a face-region of the canvas,
// collects a rolling buffer, then estimates BPM via peak counting.

const SAMPLE_RATE = 15;          // frames per second to process
const BUFFER_SIZE = 150;         // ~10 seconds of data
const BPM_LO = 45, BPM_HI = 180;// valid heart-rate range

function peakCount(signal) {
  let peaks = 0;
  for (let i = 1; i < signal.length - 1; i++) {
    if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) peaks++;
  }
  return peaks;
}

function movingAvg(arr, w) {
  return arr.map((_, i) => {
    const start = Math.max(0, i - w);
    const slice = arr.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

function detrend(arr) {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  return arr.map(v => v - mean);
}

function estimateBPM(greenBuffer, sampleRate) {
  if (greenBuffer.length < 30) return null;
  const detrended = detrend(greenBuffer);
  const smoothed = movingAvg(detrended, 5);
  const peaks = peakCount(smoothed);
  const durationSec = greenBuffer.length / sampleRate;
  const bpm = Math.round((peaks / durationSec) * 60);
  return bpm >= BPM_LO && bpm <= BPM_HI ? bpm : null;
}

// ── Motion detection ──────────────────────────────────────────────────────────
function motionScore(prev, curr, width, height) {
  if (!prev || !curr) return 0;
  const step = 4; // skip pixels for speed
  let diff = 0, count = 0;
  for (let i = 0; i < prev.length; i += step * 4) {
    diff += Math.abs(curr[i] - prev[i])       // R
           + Math.abs(curr[i+1] - prev[i+1])  // G
           + Math.abs(curr[i+2] - prev[i+2]); // B
    count++;
  }
  return diff / (count * 3); // 0–255 avg pixel diff
}

// ── Focus messages ────────────────────────────────────────────────────────────
const FOCUS_MESSAGES = {
  high:     ["You're locked in 🔥", "Peak focus detected!", "Flow state active — keep going."],
  medium:   ["Good concentration. Stay with it.", "Solid focus. Keep pushing.", "You're engaged — nice."],
  low:      ["Focus slipping → try the 5-4-3-2-1 reset.", "Losing momentum — take a quick breath.", "Switch subjects to re-engage."],
  critical: ["Take a 10-min break NOW. 🆘", "Brain overload detected — step away.", "Rest = better memory retention."],
};

function getMsg(level) {
  const key = level >= 75 ? 'high' : level >= 50 ? 'medium' : level >= 30 ? 'low' : 'critical';
  const arr = FOCUS_MESSAGES[key];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FocusMeter({ level, theme }) {
  const accent = theme?.accent || '#2DD4BF';
  const color = level >= 75 ? '#10B981' : level >= 50 ? accent : level >= 30 ? '#F59E0B' : '#EF4444';
  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ - (level / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="130" height="130">
          <circle cx="65" cy="65" r={r} stroke="#E5E7EB" strokeWidth="10" fill="none" />
          <circle cx="65" cy="65" r={r} stroke={color} strokeWidth="10" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 65 65)"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.5s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-dark">{level}</span>
          <span className="text-xs text-gray-500">Focus</span>
        </div>
      </div>
      <div className="mt-1 text-xs font-semibold px-3 py-1 rounded-full"
        style={{ backgroundColor: color + '20', color }}>
        {level >= 75 ? '🔥 High' : level >= 50 ? '⚡ Medium' : level >= 30 ? '⚠️ Drifting' : '🆘 Critical'}
      </div>
    </div>
  );
}

function HeartBeat({ bpm }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <Heart
          size={36}
          className="text-red-500 transition-transform"
          fill="currentColor"
          style={{ animation: bpm ? `heartbeat ${(60 / bpm).toFixed(2)}s ease-in-out infinite` : 'none' }}
        />
        <style>{`
          @keyframes heartbeat {
            0%,100% { transform: scale(1); }
            15% { transform: scale(1.25); }
            30% { transform: scale(1); }
            45% { transform: scale(1.15); }
          }
        `}</style>
      </div>
      <div className="text-xl font-bold text-dark leading-none">
        {bpm ?? '--'}
      </div>
      <div className="text-xs text-gray-500">BPM</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StudyMode({ theme }) {
  const [active, setActive]           = useState(false);
  const [focusLevel, setFocusLevel]   = useState(75);
  const [seconds, setSeconds]         = useState(0);
  const [message, setMessage]         = useState('');
  const [subject, setSubject]         = useState('CS131 - Inheritance Lab');
  const [sessionXP, setSessionXP]     = useState(0);
  const [breakMode, setBreakMode]     = useState(false);
  const [history, setHistory]         = useState([]);

  // Camera state
  const [cameraOn, setCameraOn]       = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [bpm, setBpm]                 = useState(null);
  const [motionLevel, setMotionLevel] = useState(0);
  const [facePresent, setFacePresent] = useState(false);
  const [showFeed, setShowFeed]       = useState(true);

  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const greenBuf   = useRef([]);
  const prevPixels = useRef(null);
  const lastSample = useRef(0);
  const timerRef   = useRef(null);
  const focusRef   = useRef(null);

  const accent  = theme?.accent || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  const formatTime = s => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  // ── Camera: start ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraReady(true);
        setCameraOn(true);
      }
    } catch (e) {
      setCameraError(e.name === 'NotAllowedError'
        ? 'Camera permission denied. Allow camera access and try again.'
        : 'Camera not available on this device.');
    }
  }, []);

  // ── Camera: stop ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    cancelAnimationFrame(rafRef.current);
    greenBuf.current  = [];
    prevPixels.current = null;
    setCameraOn(false);
    setCameraReady(false);
    setBpm(null);
    setMotionLevel(0);
    setFacePresent(false);
  }, []);

  // ── Frame processing loop ───────────────────────────────────────────────────
  const processFrame = useCallback((now) => {
    rafRef.current = requestAnimationFrame(processFrame);

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width  = video.videoWidth  || 320;
    canvas.height = video.videoHeight || 240;

    // Flip horizontally (mirror mode)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Sample at SAMPLE_RATE fps
    if (now - lastSample.current < 1000 / SAMPLE_RATE) return;
    lastSample.current = now;

    const W = canvas.width, H = canvas.height;

    // Face region: center 40% of frame
    const fx = Math.floor(W * 0.3), fy = Math.floor(H * 0.15);
    const fw = Math.floor(W * 0.4), fh = Math.floor(H * 0.55);
    const faceData = ctx.getImageData(fx, fy, fw, fh);
    const fpx = faceData.data;

    // Green channel mean (rPPG signal)
    let gSum = 0, bright = 0;
    for (let i = 0; i < fpx.length; i += 4) {
      gSum += fpx[i + 1]; // G
      bright += (fpx[i] + fpx[i+1] + fpx[i+2]) / 3;
    }
    const pixCount = fpx.length / 4;
    const gMean = gSum / pixCount;
    const avgBright = bright / pixCount;

    // Face present if average brightness is reasonable (not pitch black)
    const present = avgBright > 30 && avgBright < 240;
    setFacePresent(present);

    if (present) {
      // rPPG buffer
      greenBuf.current.push(gMean);
      if (greenBuf.current.length > BUFFER_SIZE) greenBuf.current.shift();

      // Estimate BPM every 30 samples
      if (greenBuf.current.length % 30 === 0) {
        const estimated = estimateBPM(greenBuf.current, SAMPLE_RATE);
        if (estimated) setBpm(estimated);
      }
    }

    // Motion detection: full frame diff
    const fullData = ctx.getImageData(0, 0, W, H);
    const score = motionScore(prevPixels.current, fullData.data, W, H);
    prevPixels.current = new Uint8ClampedArray(fullData.data);
    const motion = Math.min(100, Math.round(score * 3));
    setMotionLevel(motion);

    // Feed motion into focus (high motion = less focus)
    if (active && !breakMode && present) {
      setFocusLevel(prev => {
        const base = motion > 25 ? -3 : motion > 12 ? -0.5 : 0.3;
        const noise = (Math.random() - 0.5) * 1.5;
        const next = Math.max(10, Math.min(100, prev + base + noise));
        return Math.round(next);
      });
    }
  }, [active, breakMode]);

  // Start/stop frame loop when camera is ready
  useEffect(() => {
    if (cameraReady) {
      rafRef.current = requestAnimationFrame(processFrame);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [cameraReady, processFrame]);

  // ── Study session controls ──────────────────────────────────────────────────
  const startSession = () => {
    setActive(true);
    setBreakMode(false);
    setSeconds(0);
    setSessionXP(0);
    setFocusLevel(80);
    setMessage(getMsg(80));
    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1);
      setSessionXP(x => x + 1);
    }, 1000);
    // Fallback drift when no camera
    if (!cameraOn) {
      focusRef.current = setInterval(() => {
        setFocusLevel(prev => {
          const next = Math.max(10, Math.min(100, prev + (Math.random() * 2 - 1)));
          setMessage(getMsg(next));
          return Math.round(next);
        });
      }, 4000);
    }
  };

  const stopSession = () => {
    clearInterval(timerRef.current);
    clearInterval(focusRef.current);
    setActive(false);
    if (seconds > 10) {
      setHistory(h => [{
        subject, duration: formatTime(seconds), xp: sessionXP,
        bpm: bpm ?? '--',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }, ...h.slice(0, 4)]);
    }
    setSeconds(0);
  };

  const takeBreak = () => {
    setBreakMode(true);
    setMessage("Break time! Step away. Back in 5 min. 🌿");
    clearInterval(focusRef.current);
    let t = 0;
    const rec = setInterval(() => {
      t++;
      setFocusLevel(f => Math.min(100, f + 4));
      if (t >= 20) clearInterval(rec);
    }, 1500);
  };

  const resumeSession = () => {
    setBreakMode(false);
    setMessage(getMsg(focusLevel));
    if (!cameraOn) {
      focusRef.current = setInterval(() => {
        setFocusLevel(prev => {
          const next = Math.max(10, Math.min(100, prev + (Math.random() * 2 - 1)));
          setMessage(getMsg(next));
          return Math.round(next);
        });
      }, 4000);
    }
  };

  const switchSubject = () => {
    const subs = ['Math 141', 'ENGL 202', 'STAT 200', 'CMPSC 311', 'CS131 - Inheritance Lab'];
    const idx = subs.indexOf(subject);
    setSubject(subs[(idx + 1) % subs.length]);
    setFocusLevel(f => Math.min(100, f + 15));
    setMessage("Subject switched! Fresh energy unlocked ⚡");
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(focusRef.current);
    stopCamera();
  }, [stopCamera]);

  // Update message when focus changes significantly (camera mode)
  useEffect(() => {
    if (active && cameraOn) {
      setMessage(getMsg(focusLevel));
    }
  }, [Math.floor(focusLevel / 10)]); // eslint-disable-line

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent + '20' }}>
            <Brain size={18} style={{ color: accent }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-dark text-sm">Study Mode</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: accent + '20', color: accent }}>
                PRESAGE AI
              </span>
            </div>
            <p className="text-xs text-gray-400">Real-time focus · heart rate · motion</p>
          </div>
        </div>

        {/* Camera toggle */}
        <button
          onClick={cameraOn ? stopCamera : startCamera}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            cameraOn
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          {cameraOn ? <CameraOff size={13} /> : <Camera size={13} />}
          {cameraOn ? 'Camera Off' : 'Enable Camera'}
        </button>
      </div>

      {/* Camera error */}
      {cameraError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start gap-2">
          <CameraOff size={14} className="shrink-0 mt-0.5" />
          {cameraError}
        </div>
      )}

      {/* Camera feed + vitals */}
      {cameraOn && (
        <div className="mb-4 rounded-xl overflow-hidden bg-gray-900 relative">
          {/* Hidden video + canvas */}
          <video ref={videoRef} className="hidden" playsInline muted />

          {/* Visible canvas (processed, mirrored) */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              className={`w-full rounded-xl transition-all ${showFeed ? 'block' : 'hidden'}`}
              style={{ maxHeight: '180px', objectFit: 'cover' }}
            />

            {/* Face detect overlay */}
            {showFeed && cameraReady && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Face scan box */}
                <div
                  className="absolute border-2 rounded-lg transition-colors"
                  style={{
                    left: '30%', top: '15%', width: '40%', height: '55%',
                    borderColor: facePresent ? accent : '#EF4444',
                    boxShadow: facePresent ? `0 0 12px ${accent}60` : 'none',
                  }}
                >
                  <span
                    className="absolute -top-5 left-0 text-xs font-bold px-1 rounded"
                    style={{ color: facePresent ? accent : '#EF4444', fontSize: '10px' }}
                  >
                    {facePresent ? 'FACE ✓' : 'NO FACE'}
                  </span>
                </div>

                {/* Vitals overlay strip */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Heart size={11} className="text-red-400" fill="currentColor" />
                    <span className="text-xs font-bold text-white">{bpm ?? '--'} BPM</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity size={11} className="text-yellow-400" />
                    <span className="text-xs font-bold text-white">Motion {motionLevel}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Brain size={11} style={{ color: accent }} />
                    <span className="text-xs font-bold text-white">Focus {focusLevel}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Minimize toggle */}
            <button
              onClick={() => setShowFeed(f => !f)}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
            >
              {showFeed ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>

          {/* Collapsed state */}
          {!showFeed && (
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Heart size={12} className="text-red-400" fill="currentColor" />
                  <span className="text-xs font-semibold text-white">{bpm ?? '--'} BPM</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity size={12} className="text-yellow-400" />
                  <span className="text-xs font-semibold text-white">Motion {motionLevel}%</span>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full animate-pulse ${facePresent ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
          )}
        </div>
      )}

      {active ? (
        <div>
          {/* Metrics row */}
          <div className={`flex items-center gap-4 mb-4 ${cameraOn ? 'justify-between' : 'justify-center'}`}>
            <FocusMeter level={focusLevel} theme={theme} />

            {cameraOn && <HeartBeat bpm={bpm} />}

            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-dark">{formatTime(seconds)}</div>
              <div className="text-xs text-gray-400 mt-0.5 max-w-[100px] truncate">{subject}</div>
              <div className="flex items-center gap-1 justify-end mt-2">
                <Zap size={12} className="text-yellow-400" />
                <span className="text-sm font-bold text-yellow-500">+{sessionXP} XP</span>
              </div>
              {cameraOn && (
                <div className="flex items-center gap-1 justify-end mt-1">
                  <Activity size={11} className={motionLevel > 20 ? 'text-red-400' : 'text-green-400'} />
                  <span className={`text-xs font-medium ${motionLevel > 20 ? 'text-red-500' : 'text-green-600'}`}>
                    {motionLevel > 20 ? 'Moving' : 'Still'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Adaptive message */}
          <div
            className="rounded-xl p-3 mb-4 text-sm font-medium border"
            style={{
              backgroundColor: focusLevel < 30 ? '#FEF2F2' : focusLevel < 50 ? '#FFFBEB' : '#F0FDF4',
              borderColor:     focusLevel < 30 ? '#FECACA' : focusLevel < 50 ? '#FDE68A' : '#BBF7D0',
              color:           focusLevel < 30 ? '#DC2626' : focusLevel < 50 ? '#D97706' : '#166534',
            }}
          >
            {message}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button onClick={stopSession}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors">
              <Square size={14} fill="currentColor" /> End
            </button>
            {!breakMode ? (
              <button onClick={takeBreak}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-yellow-50 text-yellow-700 text-sm font-medium hover:bg-yellow-100 transition-colors">
                <Coffee size={14} /> Break
              </button>
            ) : (
              <button onClick={resumeSession}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90"
                style={{ backgroundColor: accent }}>
                <Play size={14} fill="currentColor" /> Resume
              </button>
            )}
            <button onClick={switchSubject}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
              <SkipForward size={14} /> Switch
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent">
              <option>CS131 - Inheritance Lab</option>
              <option>Math 141</option>
              <option>ENGL 202</option>
              <option>CMPSC 311</option>
              <option>STAT 200</option>
            </select>
          </div>

          {!cameraOn && (
            <div className="mb-3 flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Camera size={14} className="text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700">
                Enable camera for real-time heart rate (rPPG) + focus tracking via motion detection.
              </p>
            </div>
          )}

          {cameraOn && !cameraReady && (
            <div className="mb-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
              Initializing camera...
            </div>
          )}

          <button onClick={startSession}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-dark font-semibold text-sm hover:opacity-90 transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
            <Brain size={16} />
            Start Study Mode
          </button>

          {history.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Recent Sessions</p>
              <div className="space-y-1.5">
                {history.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-xl px-3 py-2">
                    <div>
                      <span className="font-medium text-dark">{s.subject}</span>
                      <span className="text-gray-400 ml-2">{s.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.bpm !== '--' && (
                        <span className="flex items-center gap-1 text-red-500">
                          <Heart size={10} fill="currentColor" />{s.bpm}
                        </span>
                      )}
                      <span className="text-gray-500">{s.duration}</span>
                      <span className="text-yellow-500 font-semibold">+{s.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
