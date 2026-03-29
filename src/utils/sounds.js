// Web Audio API sound engine — no external files needed

let ctx = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function note(freq, start, duration, gain = 0.3, type = 'sine', ac) {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.connect(env);
  env.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(gain, start + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export const SOUND_OPTIONS = [
  { id: 'chime',  label: 'Chime',   icon: '🔔', desc: 'Soft ascending bell' },
  { id: 'pop',    label: 'Pop',     icon: '✨', desc: 'Quick satisfying pop' },
  { id: 'retro',  label: 'Retro',   icon: '🕹️', desc: '8-bit game sound' },
  { id: 'gentle', label: 'Gentle',  icon: '🌊', desc: 'Calm soft tone' },
  { id: 'none',   label: 'No Sound',icon: '🔇', desc: 'Silent mode' },
];

export function playComplete(soundId = 'chime') {
  if (soundId === 'none') return;
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    if (soundId === 'chime') {
      note(523, now,       0.3, 0.25, 'sine', ac);
      note(659, now + 0.1, 0.3, 0.25, 'sine', ac);
      note(784, now + 0.2, 0.5, 0.3,  'sine', ac);
    } else if (soundId === 'pop') {
      note(800, now,       0.05, 0.4, 'sine', ac);
      note(1200, now + 0.05, 0.15, 0.3, 'sine', ac);
    } else if (soundId === 'retro') {
      note(440, now,       0.08, 0.3, 'square', ac);
      note(660, now + 0.1, 0.08, 0.3, 'square', ac);
      note(880, now + 0.2, 0.15, 0.3, 'square', ac);
    } else if (soundId === 'gentle') {
      note(440, now,       0.6, 0.2, 'triangle', ac);
      note(550, now + 0.15, 0.5, 0.15, 'triangle', ac);
    }
  } catch { /* ignore audio errors */ }
}

export function playUncomplete(soundId = 'chime') {
  if (soundId === 'none') return;
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    if (soundId === 'chime') {
      note(523, now,       0.3, 0.2, 'sine', ac);
      note(440, now + 0.12, 0.4, 0.2, 'sine', ac);
    } else if (soundId === 'pop') {
      note(400, now, 0.15, 0.3, 'sine', ac);
    } else if (soundId === 'retro') {
      note(300, now,       0.1, 0.25, 'square', ac);
      note(200, now + 0.12, 0.2, 0.25, 'square', ac);
    } else if (soundId === 'gentle') {
      note(330, now, 0.5, 0.15, 'triangle', ac);
    }
  } catch { /* ignore */ }
}

export function playEndOfDay(soundId = 'chime', incompleteCount = 0) {
  if (soundId === 'none' || incompleteCount === 0) return;
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    // A gentle but notable "reminder" sound
    note(440, now,        0.3, 0.2, 'sine', ac);
    note(370, now + 0.15, 0.3, 0.2, 'sine', ac);
    note(330, now + 0.30, 0.5, 0.25, 'sine', ac);
  } catch { /* ignore */ }
}
