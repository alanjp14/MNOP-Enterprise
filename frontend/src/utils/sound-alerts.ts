// Web Audio API Synthesizer Sound Generator for NOC Alerts

export function playDownSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 3x "teeet teeet teeet" alert tone (3 beeps of 600Hz frequency)
    const playBeep = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(580, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.18);
    };

    const now = ctx.currentTime;
    playBeep(now);
    playBeep(now + 0.25);
    playBeep(now + 0.5);
  } catch (err) {
    console.warn("Audio Context error:", err);
  }
}

export function playUpSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 1x "tiiiing" chime sound (1 pleasant 1200Hz -> 1600Hz tone)
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  } catch (err) {
    console.warn("Audio Context error:", err);
  }
}
