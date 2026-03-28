import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Play, Square, Coffee, SkipForward, Zap, Camera, CameraOff,
         Heart, Activity, Eye, EyeOff, BarChart2, X } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
         CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// rPPG helpers
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_RATE = 15;
const BUFFER_SIZE = 150;

function movingAvg(arr, w) {
  return arr.map((_, i) => {
    const sl = arr.slice(Math.max(0, i - w), i + 1);
    return sl.reduce((a, b) => a + b, 0) / sl.length;
  });
}
function detrend(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.map(v => v - mean);
}
function peakCount(sig) {
  let p = 0;
  for (let i = 1; i < sig.length - 1; i++)
    if (sig[i] > sig[i - 1] && sig[i] > sig[i + 1]) p++;
  return p;
}
function estimateBPM(buf, rate) {
  if (buf.length < 30) return null;
  const peaks = peakCount(movingAvg(detrend(buf), 5));
  const bpm = Math.round((peaks / (buf.length / rate)) * 60);
  return bpm >= 45 && bpm <= 180 ? bpm : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Motion detection
// ─────────────────────────────────────────────────────────────────────────────
function motionScore(prev, curr) {
  if (!prev || !curr) return 0;
  let diff = 0, n = 0;
  for (let i = 0; i < prev.length; i += 16) {
    diff += Math.abs(curr[i] - prev[i]) + Math.abs(curr[i+1] - prev[i+1]) + Math.abs(curr[i+2] - prev[i+2]);
    n++;
  }
  return diff / (n * 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// Eye Aspect Ratio helpers (MediaPipe landmark indices)
// Left eye:  [33,160,158,133,153,144]  Right eye: [362,385,387,263,373,380]
// EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
// ─────────────────────────────────────────────────────────────────────────────
const LEFT_EYE  = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function eyeAspectRatio(kps, indices) {
  const [p1, p2, p3, p4, p5, p6] = indices.map(i => kps[i]);
  if (!p1) return 1;
  return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4));
}
// Gaze: horizontal offset of iris center vs eye corners
const LEFT_IRIS  = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
function irisCenter(kps, ids) {
  const pts = ids.map(i => kps[i]).filter(Boolean);
  if (!pts.length) return null;
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Adaptive messages
// ─────────────────────────────────────────────────────────────────────────────
const MSGS = {
  high:     ["Locked in 🔥 Keep it up!", "Flow state detected — stay with it.", "Peak focus. You're unstoppable."],
  medium:   ["Good focus. Stay engaged.", "Solid work — keep pushing.", "Nice concentration."],
  low:      ["Drifting → try the 5-4-3-2-1 reset.", "Losing momentum — quick stretch?", "Switch subjects to re-engage."],
  critical: ["Take a 10-min break NOW. 🆘", "Brain overload — step away from screen.", "Rest = better retention."],
  blink:    ["Blinking a lot — eyes tired? Adjust lighting.", "High blink rate detected — consider a break."],
  gaze:     ["Your gaze is drifting → refocus on the screen.", "Distracted? Bring your eyes back."],
};
function getMsg(level, extraFlag) {
  if (extraFlag === 'blink') return MSGS.blink[Math.floor(Math.random() * MSGS.blink.length)];
  if (extraFlag === 'gaze')  return MSGS.gaze[Math.floor(Math.random() * MSGS.gaze.length)];
  const key = level >= 75 ? 'high' : level >= 50 ? 'medium' : level >= 30 ? 'low' : 'critical';
  return MSGS[key][Math.floor(Math.random() * MSGS[key].length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function FocusMeter({ level, theme }) {
  const accent = theme?.accent || '#2DD4BF';
  const color = level >= 75 ? '#10B981' : level >= 50 ? accent : level >= 30 ? '#F59E0B' : '#EF4444';
  const r = 52, circ = 2 * Math.PI * r, offset = circ - (level / 100) * circ;
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
      <div className="w-16 h-16 flex items-center justify-center">
        <Heart size={36} fill="currentColor" className="text-red-500"
          style={{ animation: bpm ? `hb ${(60 / bpm).toFixed(2)}s ease-in-out infinite` : 'none' }} />
        <style>{`@keyframes hb{0%,100%{transform:scale(1)}15%{transform:scale(1.3)}30%{transform:scale(1)}45%{transform:scale(1.15)}}`}</style>
      </div>
      <div className="text-xl font-bold text-dark leading-none">{bpm ?? '--'}</div>
      <div className="text-xs text-gray-500">BPM</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Post-session Analytics Modal
// ─────────────────────────────────────────────────────────────────────────────
function SessionReport({ report, theme, onClose }) {
  const accent = theme?.accent || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  const avgFocus   = Math.round(report.focusLog.reduce((s, d) => s + d.focus, 0) / (report.focusLog.length || 1));
  const avgBPM     = report.bpmLog.filter(d => d.bpm > 0).length
    ? Math.round(report.bpmLog.filter(d => d.bpm > 0).reduce((s, d) => s + d.bpm, 0) / report.bpmLog.filter(d => d.bpm > 0).length)
    : null;
  const peakFocus  = Math.max(...report.focusLog.map(d => d.focus), 0);
  const lowFocus   = Math.min(...report.focusLog.map(d => d.focus), 100);
  const efficiency = Math.round((avgFocus / 100) * 100);
  const totalBlinks = report.blinkCount;
  const blinkRate  = report.duration > 0 ? ((totalBlinks / report.duration) * 60).toFixed(1) : '0';
  const distractPct = report.focusLog.length
    ? Math.round((report.focusLog.filter(d => d.focus < 50).length / report.focusLog.length) * 100)
    : 0;

  const insights = [];
  if (avgFocus >= 75) insights.push({ icon: '🔥', text: 'Excellent focus throughout the session!', color: 'text-green-700 bg-green-50' });
  else if (avgFocus >= 50) insights.push({ icon: '⚡', text: 'Decent focus. Try eliminating distractions next time.', color: 'text-blue-700 bg-blue-50' });
  else insights.push({ icon: '⚠️', text: 'Focus was low. Consider shorter 25-min Pomodoro sessions.', color: 'text-yellow-700 bg-yellow-50' });

  if (avgBPM && avgBPM > 100) insights.push({ icon: '❤️', text: `Heart rate averaged ${avgBPM} BPM — slightly elevated. Try breathing exercises before studying.`, color: 'text-red-700 bg-red-50' });
  else if (avgBPM) insights.push({ icon: '💚', text: `Heart rate stable at ~${avgBPM} BPM. Good calm focus state.`, color: 'text-green-700 bg-green-50' });

  if (parseFloat(blinkRate) > 25) insights.push({ icon: '👁️', text: `High blink rate (${blinkRate}/min) — eye strain detected. Follow 20-20-20 rule.`, color: 'text-purple-700 bg-purple-50' });
  if (distractPct > 40) insights.push({ icon: '📱', text: `${distractPct}% of session below focus threshold. Remove phone from desk.`, color: 'text-orange-700 bg-orange-50' });
  if (report.motionSpikes > 5) insights.push({ icon: '🪑', text: `${report.motionSpikes} movement spikes detected. Check your posture setup.`, color: 'text-gray-700 bg-gray-50' });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="relative p-6 pb-4 rounded-t-3xl text-white overflow-hidden"
          style={{ background: `linear-gradient(135deg, #0F172A, #1E293B)` }}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: accent }} />
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={18} style={{ color: accent }} />
            <span className="font-bold">Session Report</span>
          </div>
          <p className="text-gray-400 text-xs">{report.subject} · {report.formattedDuration} · {report.endTime}</p>

          {/* Top stats */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Avg Focus', value: `${avgFocus}`, unit: '%' },
              { label: 'Peak Focus', value: `${peakFocus}`, unit: '' },
              { label: 'Heart Rate', value: avgBPM ? `${avgBPM}` : '--', unit: 'bpm' },
              { label: 'XP Earned', value: `+${report.xp}`, unit: '' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold" style={{ color: accent }}>{s.value}<span className="text-xs ml-0.5">{s.unit}</span></div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Efficiency bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-dark">Session Efficiency</span>
              <span className="font-bold" style={{ color: accent }}>{efficiency}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${efficiency}%`, background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
            </div>
          </div>

          {/* Focus timeline */}
          <div>
            <p className="font-semibold text-dark text-sm mb-3">Focus Timeline</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={report.focusLog}>
                <defs>
                  <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="t" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <ReferenceLine y={50} stroke="#FCD34D" strokeDasharray="4 2" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                  formatter={v => [`${v}`, 'Focus']} />
                <Area type="monotone" dataKey="focus" stroke={accent} strokeWidth={2} fill="url(#gf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* BPM timeline */}
          {report.bpmLog.some(d => d.bpm > 0) && (
            <div>
              <p className="font-semibold text-dark text-sm mb-3">Heart Rate Timeline</p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={report.bpmLog.filter(d => d.bpm > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="t" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 120]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                    formatter={v => [`${v} bpm`, 'Heart Rate']} />
                  <Line type="monotone" dataKey="bpm" stroke="#F87171" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-minute breakdown */}
          {report.minuteLog.length > 0 && (
            <div>
              <p className="font-semibold text-dark text-sm mb-3">Per-Minute Breakdown</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={report.minuteLog} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="min" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                    formatter={v => [`${v}%`, 'Avg Focus']} />
                  <Bar dataKey="avgFocus" fill={primary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Blink + motion stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Blink Rate', value: `${blinkRate}/min`, icon: '👁️', color: 'bg-purple-50 text-purple-700' },
              { label: 'Distracted', value: `${distractPct}%`, icon: '📊', color: 'bg-orange-50 text-orange-700' },
              { label: 'Motion Spikes', value: report.motionSpikes, icon: '📡', color: 'bg-gray-50 text-gray-700' },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="font-bold text-lg">{s.value}</div>
                <div className="text-xs opacity-70">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div>
            <p className="font-semibold text-dark text-sm mb-3">AI Insights</p>
            <div className="space-y-2">
              {insights.map((ins, i) => (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-xl text-sm ${ins.color}`}>
                  <span className="text-lg shrink-0">{ins.icon}</span>
                  <p>{ins.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Close */}
          <button onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-dark hover:opacity-90 transition-all"
            style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main StudyMode component
// ─────────────────────────────────────────────────────────────────────────────
export default function StudyMode({ theme }) {
  const [active, setActive]           = useState(false);
  const [focusLevel, setFocusLevel]   = useState(75);
  const [seconds, setSeconds]         = useState(0);
  const [message, setMessage]         = useState('');
  const [subject, setSubject]         = useState('CS131 - Inheritance Lab');
  const [sessionXP, setSessionXP]     = useState(0);
  const [breakMode, setBreakMode]     = useState(false);
  const [history, setHistory]         = useState([]);
  const [report, setReport]           = useState(null);

  // Camera
  const [cameraOn, setCameraOn]       = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [bpm, setBpm]                 = useState(null);
  const [motionLevel, setMotionLevel] = useState(0);
  const [facePresent, setFacePresent] = useState(false);
  const [showFeed, setShowFeed]       = useState(true);
  const [earValue, setEarValue]       = useState(null); // eye aspect ratio
  const [gazeOffset, setGazeOffset]   = useState(null); // horizontal gaze offset
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);

  // Refs
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const overlayRef   = useRef(null);
  const streamRef    = useRef(null);
  const rafRef       = useRef(null);
  const detectorRef  = useRef(null);
  const greenBuf     = useRef([]);
  const prevPixels   = useRef(null);
  const lastSample   = useRef(0);
  const timerRef     = useRef(null);
  const focusRef     = useRef(null);

  // Session data logs
  const focusLog    = useRef([]);
  const bpmLog      = useRef([]);
  const minuteLog   = useRef([]);
  const blinkCount  = useRef(0);
  const motionSpikes = useRef(0);
  const prevEAR     = useRef(1);
  const blinkCooldown = useRef(0);
  const minuteFocusAccum = useRef([]);

  const accent  = theme?.accent || '#2DD4BF';
  const primary = theme?.primary || '#6EE7B7';

  const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Load TF face detector ─────────────────────────────────────────────────
  const loadModel = useCallback(async () => {
    if (modelLoaded || loadingModel) return;
    setLoadingModel(true);
    try {
      const tf  = await import('@tensorflow/tfjs');
      const fld = await import('@tensorflow-models/face-landmarks-detection');
      await tf.ready();
      const detector = await fld.createDetector(
        fld.SupportedModels.MediaPipeFaceMesh,
        { runtime: 'tfjs', refineLandmarks: true, maxFaces: 1 }
      );
      detectorRef.current = detector;
      setModelLoaded(true);
    } catch (e) {
      console.warn('Face landmark model failed to load:', e);
    }
    setLoadingModel(false);
  }, [modelLoaded, loadingModel]);

  // ── Camera start ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }, audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
      setCameraOn(true);
      loadModel();
    } catch (e) {
      setCameraError(e.name === 'NotAllowedError'
        ? 'Camera permission denied — allow camera and try again.'
        : 'Camera not available on this device.');
    }
  }, [loadModel]);

  // ── Camera stop ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(rafRef.current);
    greenBuf.current  = [];
    prevPixels.current = null;
    setCameraOn(false);
    setCameraReady(false);
    setBpm(null);
    setMotionLevel(0);
    setFacePresent(false);
    setEarValue(null);
    setGazeOffset(null);
  }, []);

  // ── Frame processing ──────────────────────────────────────────────────────
  const processFrame = useCallback(async (now) => {
    rafRef.current = requestAnimationFrame(processFrame);
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const W = video.videoWidth || 320, H = video.videoHeight || 240;
    canvas.width = W; canvas.height = H;

    // Mirrored draw
    ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, -W, 0, W, H); ctx.restore();

    // Throttle rPPG to SAMPLE_RATE
    if (now - lastSample.current >= 1000 / SAMPLE_RATE) {
      lastSample.current = now;

      // Face region (center 40%)
      const fx = Math.floor(W * 0.3), fy = Math.floor(H * 0.15);
      const fw = Math.floor(W * 0.4), fh = Math.floor(H * 0.55);
      const fd = ctx.getImageData(fx, fy, fw, fh).data;
      let gSum = 0, bright = 0;
      for (let i = 0; i < fd.length; i += 4) { gSum += fd[i+1]; bright += (fd[i]+fd[i+1]+fd[i+2])/3; }
      const px = fd.length / 4;
      const present = (bright / px) > 30 && (bright / px) < 240;
      setFacePresent(present);

      if (present) {
        greenBuf.current.push(gSum / px);
        if (greenBuf.current.length > BUFFER_SIZE) greenBuf.current.shift();
        if (greenBuf.current.length % 30 === 0) {
          const est = estimateBPM(greenBuf.current, SAMPLE_RATE);
          if (est) setBpm(est);
        }
      }

      // Motion
      const full = ctx.getImageData(0, 0, W, H);
      const ms = motionScore(prevPixels.current, full.data);
      prevPixels.current = new Uint8ClampedArray(full.data);
      const motion = Math.min(100, Math.round(ms * 3));
      setMotionLevel(motion);
      if (motion > 30) motionSpikes.current++;

      // TF face mesh: EAR + gaze
      if (detectorRef.current && present) {
        try {
          const faces = await detectorRef.current.estimateFaces(canvas, { flipHorizontal: false });
          if (faces.length > 0) {
            const kps = faces[0].keypoints;

            // EAR
            const leftEAR  = eyeAspectRatio(kps, LEFT_EYE);
            const rightEAR = eyeAspectRatio(kps, RIGHT_EYE);
            const ear = (leftEAR + rightEAR) / 2;
            setEarValue(ear);

            // Blink detection: EAR drops below 0.2
            if (ear < 0.2 && prevEAR.current >= 0.2 && blinkCooldown.current <= 0) {
              blinkCount.current++;
              blinkCooldown.current = 5;
            }
            if (blinkCooldown.current > 0) blinkCooldown.current--;
            prevEAR.current = ear;

            // Gaze: iris horizontal offset from eye center
            const leftIris  = irisCenter(kps, LEFT_IRIS);
            const rightIris = irisCenter(kps, RIGHT_IRIS);
            if (leftIris && rightIris) {
              const noseX = kps[4]?.x || W / 2;
              const offset = Math.abs(((leftIris.x + rightIris.x) / 2) - noseX) / W;
              setGazeOffset(offset);
            }

            // Draw landmarks on overlay canvas
            const oc = overlayRef.current;
            if (oc) {
              oc.width = W; oc.height = H;
              const octx = oc.getContext('2d');
              octx.clearRect(0, 0, W, H);
              // Draw eye contours
              [LEFT_EYE, RIGHT_EYE].forEach(ids => {
                octx.beginPath();
                ids.forEach((id, i) => {
                  const p = kps[id];
                  if (!p) return;
                  i === 0 ? octx.moveTo(p.x, p.y) : octx.lineTo(p.x, p.y);
                });
                octx.closePath();
                octx.strokeStyle = ear < 0.2 ? '#EF4444' : '#6EE7B7';
                octx.lineWidth = 1.5;
                octx.stroke();
              });
              // Iris dots
              [LEFT_IRIS, RIGHT_IRIS].forEach(ids => {
                const c = irisCenter(kps, ids);
                if (c) {
                  octx.beginPath();
                  octx.arc(c.x, c.y, 3, 0, 2 * Math.PI);
                  octx.fillStyle = accent;
                  octx.fill();
                }
              });
            }

            // Focus influence from EAR + gaze
            if (active && !breakMode) {
              setFocusLevel(prev => {
                let delta = 0;
                if (ear < 0.15) delta -= 4;          // eyes closing
                else if (ear < 0.2) delta -= 1.5;
                if (gazeOffset > 0.15) delta -= 2;   // looking away
                if (motion > 25) delta -= 3;          // moving
                if (motion < 8 && ear > 0.25) delta += 0.4; // still + eyes open
                delta += (Math.random() - 0.5) * 1.2;
                return Math.round(Math.max(10, Math.min(100, prev + delta)));
              });
            }
          }
        } catch (_) { /* TF inference errors are non-fatal */ }
      } else if (active && !breakMode) {
        // No TF model: motion-only focus
        setFocusLevel(prev => {
          const d = motion > 25 ? -3 : motion > 12 ? -0.5 : 0.3;
          return Math.round(Math.max(10, Math.min(100, prev + d + (Math.random() - 0.5))));
        });
      }
    }
  }, [active, breakMode, accent]);

  useEffect(() => {
    if (cameraReady) rafRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cameraReady, processFrame]);

  // ── Log data every 5 seconds ──────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      const t = formatTime(seconds);
      focusLog.current.push({ t, focus: focusLevel });
      if (bpm) bpmLog.current.push({ t, bpm });
      minuteFocusAccum.current.push(focusLevel);

      // Minute buckets
      if (minuteFocusAccum.current.length >= 12) {
        const avg = Math.round(minuteFocusAccum.current.reduce((a, b) => a + b, 0) / minuteFocusAccum.current.length);
        minuteLog.current.push({ min: `${minuteLog.current.length + 1}m`, avgFocus: avg });
        minuteFocusAccum.current = [];
      }

      // Adaptive message flags
      if (earValue && earValue < 0.18) setMessage(getMsg(focusLevel, 'blink'));
      else if (gazeOffset && gazeOffset > 0.18) setMessage(getMsg(focusLevel, 'gaze'));
      else setMessage(getMsg(focusLevel));
    }, 5000);
    return () => clearInterval(interval);
  }, [active, seconds, focusLevel, bpm, earValue, gazeOffset]);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ── Session controls ──────────────────────────────────────────────────────
  const startSession = () => {
    focusLog.current = [];
    bpmLog.current   = [];
    minuteLog.current = [];
    blinkCount.current = 0;
    motionSpikes.current = 0;
    minuteFocusAccum.current = [];
    prevEAR.current = 1;

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

    const endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dur = seconds;

    if (dur > 10) {
      const r = {
        subject,
        duration: dur,
        formattedDuration: formatTime(dur),
        endTime,
        xp: sessionXP,
        focusLog: [...focusLog.current],
        bpmLog:   [...bpmLog.current],
        minuteLog: [...minuteLog.current],
        blinkCount: blinkCount.current,
        motionSpikes: motionSpikes.current,
      };
      setReport(r);
      setHistory(h => [{
        subject, duration: formatTime(dur), xp: sessionXP,
        bpm: bpm ?? '--', time: endTime,
      }, ...h.slice(0, 4)]);
    }
    setSeconds(0);
  };

  const takeBreak = () => {
    setBreakMode(true);
    setMessage("Break time! Step away. 🌿");
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
    const subs = ['Math 141','ENGL 202','STAT 200','CMPSC 311','CS131 - Inheritance Lab'];
    setSubject(s => subs[(subs.indexOf(s) + 1) % subs.length]);
    setFocusLevel(f => Math.min(100, f + 15));
    setMessage("Subject switched! Fresh energy ⚡");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {report && <SessionReport report={report} theme={theme} onClose={() => setReport(null)} />}

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
              <p className="text-xs text-gray-400">
                {modelLoaded ? 'Eye tracking · rPPG · motion' : loadingModel ? 'Loading face model…' : 'Focus · heart rate · motion'}
              </p>
            </div>
          </div>
          <button onClick={cameraOn ? stopCamera : startCamera}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              cameraOn ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
            }`}>
            {cameraOn ? <CameraOff size={13} /> : <Camera size={13} />}
            {cameraOn ? 'Camera Off' : 'Enable Camera'}
          </button>
        </div>

        {cameraError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex gap-2">
            <CameraOff size={14} className="shrink-0 mt-0.5" />{cameraError}
          </div>
        )}

        {/* Camera feed */}
        {cameraOn && (
          <div className="mb-4 bg-gray-900 rounded-xl overflow-hidden relative">
            <video ref={videoRef} className="hidden" playsInline muted />

            {showFeed ? (
              <div className="relative">
                {/* Base canvas (rPPG + motion) */}
                <canvas ref={canvasRef} className="w-full rounded-xl" style={{ maxHeight: 180 }} />
                {/* Overlay canvas (landmarks) */}
                <canvas ref={overlayRef} className="absolute inset-0 w-full rounded-xl pointer-events-none" style={{ maxHeight: 180 }} />

                {/* Face scan box */}
                {cameraReady && (
                  <div className="absolute pointer-events-none"
                    style={{ left: '30%', top: '15%', width: '40%', height: '55%',
                      border: `2px solid ${facePresent ? accent : '#EF4444'}`,
                      borderRadius: 8,
                      boxShadow: facePresent ? `0 0 12px ${accent}60` : 'none' }}>
                    <span style={{ position: 'absolute', top: -16, left: 0, fontSize: 9, color: facePresent ? accent : '#EF4444', fontWeight: 700 }}>
                      {facePresent ? 'FACE ✓' : 'NO FACE'}
                    </span>
                  </div>
                )}

                {/* Vitals strip */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/65 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Heart size={11} className="text-red-400" fill="currentColor" />
                    <span className="text-xs font-bold text-white">{bpm ?? '--'} BPM</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={11} className="text-blue-300" />
                    <span className="text-xs font-bold text-white">
                      EAR {earValue ? earValue.toFixed(2) : '--'}
                      {earValue && earValue < 0.2 ? ' 😴' : ''}
                    </span>
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

                {/* Gaze indicator */}
                {gazeOffset !== null && (
                  <div className="absolute top-2 left-2 bg-black/50 rounded-full px-2 py-1 flex items-center gap-1">
                    <Eye size={10} className="text-white" />
                    <span className="text-xs text-white font-medium">
                      {gazeOffset < 0.1 ? '👁️ On screen' : gazeOffset < 0.18 ? '👁️ Slight drift' : '👁️ Looking away'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex gap-4">
                  <span className="text-xs text-white font-semibold flex items-center gap-1">
                    <Heart size={11} className="text-red-400" fill="currentColor" />{bpm ?? '--'} BPM
                  </span>
                  <span className="text-xs text-white font-semibold">Focus {focusLevel}</span>
                </div>
                <div className={`w-2 h-2 rounded-full animate-pulse ${facePresent ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
            )}

            <button onClick={() => setShowFeed(f => !f)}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors">
              {showFeed ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        )}

        {/* ── Active session ── */}
        {active ? (
          <div>
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
                {cameraOn && blinkCount.current > 0 && (
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <Eye size={11} className="text-blue-400" />
                    <span className="text-xs text-blue-600">{blinkCount.current} blinks</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4 text-sm font-medium border"
              style={{
                backgroundColor: focusLevel < 30 ? '#FEF2F2' : focusLevel < 50 ? '#FFFBEB' : '#F0FDF4',
                borderColor:     focusLevel < 30 ? '#FECACA' : focusLevel < 50 ? '#FDE68A' : '#BBF7D0',
                color:           focusLevel < 30 ? '#DC2626' : focusLevel < 50 ? '#D97706' : '#166534',
              }}>
              {message}
            </div>

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
          /* ── Idle state ── */
          <div>
            <div className="mb-3">
              <label className="text-xs text-gray-500 mb-1 block">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option>CS131 - Inheritance Lab</option>
                <option>Math 141</option>
                <option>ENGL 202</option>
                <option>CMPSC 311</option>
                <option>STAT 200</option>
              </select>
            </div>

            {!cameraOn && (
              <div className="mb-3 flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Camera size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Enable camera for rPPG heart rate, eye blink detection, gaze tracking, and motion analysis. Analytics report generated after each session.
                </p>
              </div>
            )}

            <button onClick={startSession}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-dark font-semibold text-sm hover:opacity-90 transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
              <Brain size={16} /> Start Study Mode
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
    </>
  );
}
