// Audio Utility for Wrong Keyboard

let audioCtx = null;
let faahAudio = null;
let aahAudio = null;

if (typeof window !== 'undefined') {
  faahAudio = new Audio('/faah.mp3');
  faahAudio.preload = 'auto';

  aahAudio = new Audio('/aah.mp3');
  aahAudio.preload = 'auto';
}

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Play subtle key press sound for normal keys
export const playKeyClick = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Random subtle pitch for tactile feedback
    osc.frequency.setValueAtTime(300 + Math.random() * 80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.error('Audio play error:', e);
  }
};

// Play "Faah sound effect.mp3" when clicking 'F'
export const playFRespectSound = () => {
  try {
    if (faahAudio) {
      faahAudio.currentTime = 0;
      const playPromise = faahAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Audio playback failed, falling back to synth:', error);
          playSynthF();
        });
      }
    } else {
      playSynthF();
    }
  } catch (e) {
    console.error('Faah audio play error:', e);
    playSynthF();
  }
};

// Play "aah.mp3" when clicking 'A'
export const playAahSound = () => {
  try {
    if (aahAudio) {
      aahAudio.currentTime = 0;
      const playPromise = aahAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Audio playback failed, falling back to synth:', error);
          playSynthF();
        });
      }
    } else {
      playSynthF();
    }
  } catch (e) {
    console.error('Aah audio play error:', e);
    playSynthF();
  }
};

// Play Glass Shatter Sound Effect when word length matches but word is wrong
export const playShatterSound = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. High Pass Noise for Glass Crunch
    const bufferSize = Math.floor(ctx.sampleRate * 0.4);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(3000, now);
    highpass.frequency.exponentialRampToValueAtTime(8000, now + 0.3);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    whiteNoise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.35);

    // 2. High Metallic Tones for Glass Shards Burst
    const shardFreqs = [4200, 5800, 7400, 9100];
    shardFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.02);

      gain.gain.setValueAtTime(0.2, now + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.02 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.02);
      osc.stop(now + idx * 0.02 + 0.2);
    });

    // 3. Sub Bass Thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(160, now);
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    thudGain.gain.setValueAtTime(0.6, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);

    thud.start(now);
    thud.stop(now + 0.25);
  } catch (e) {
    console.error('Shatter audio error:', e);
  }
};

// Play Repair Magnetic Snap Sound
export const playRepairSound = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Upward metallic snap chime (magnetic repair feel)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.001, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.18);
    });
  } catch (e) {
    console.error('Repair sound error:', e);
  }
};

// Fallback synthesizer
function playSynthF() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(87.31, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 1.8);

    bassGain.gain.setValueAtTime(0.001, now);
    bassGain.gain.linearRampToValueAtTime(0.35, now + 0.08);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    bassOsc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(ctx.destination);

    bassOsc.start(now);
    bassOsc.stop(now + 2.0);
  } catch (e) {
    console.error('Synth play error:', e);
  }
}
