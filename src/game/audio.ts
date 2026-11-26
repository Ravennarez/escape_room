let audioContext: AudioContext | null = null;
let ambientGain: GainNode | null = null;
let ambientOscillators: OscillatorNode[] = [];
let isMuted = false;
let ambientRequested = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || !window.AudioContext) return null;

  if (!audioContext) {
    try {
      audioContext = new window.AudioContext();
    } catch (error) {
      console.error("Unable to initialize game audio.", error);
      return null;
    }
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume().catch((error: unknown) => {
      console.error("Unable to resume game audio.", error);
    });
  }

  return audioContext;
}

function startAmbient(context: AudioContext): void {
  if (ambientGain) return;

  const now = context.currentTime;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(220, now);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.025, now + 1.4);
  filter.connect(gain);
  gain.connect(context.destination);

  ambientOscillators = [82, 85.2].map((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.connect(filter);
    oscillator.start(now);
    return oscillator;
  });
  ambientGain = gain;
}

function fadeOutAmbient(): void {
  if (!audioContext || !ambientGain) return;

  const now = audioContext.currentTime;
  ambientGain.gain.cancelScheduledValues(now);
  ambientGain.gain.setTargetAtTime(0.0001, now, 0.2);
  ambientOscillators.forEach((oscillator) => oscillator.stop(now + 0.8));
  ambientGain = null;
  ambientOscillators = [];
}

function playTone(
  context: AudioContext,
  startFrequency: number,
  endFrequency: number,
  startAt: number,
  duration: number,
  volume: number,
  type: OscillatorType,
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(startFrequency, startAt);
  if (startFrequency !== endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startAt + duration);
  }
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

export function isAudioMuted(): boolean {
  return isMuted;
}

export function setAudioMuted(muted: boolean): void {
  if (isMuted === muted) return;

  isMuted = muted;
  if (muted) {
    fadeOutAmbient();
  } else if (ambientRequested) {
    const context = getAudioContext();
    if (context) startAmbient(context);
  }
}

export function startAmbientAudio(): void {
  ambientRequested = true;
  if (isMuted) return;

  const context = getAudioContext();
  if (context) startAmbient(context);
}

export function stopAmbientAudio(): void {
  ambientRequested = false;
  fadeOutAmbient();
}

export function playItemTapSound(): void {
  if (isMuted) return;

  const context = getAudioContext();
  if (!context) return;

  ambientRequested = true;
  startAmbient(context);
  playTone(context, 720, 430, context.currentTime, 0.055, 0.022, "triangle");
}

export function playTaskSuccessSound(): void {
  if (isMuted) return;

  const context = getAudioContext();
  if (!context) return;

  ambientRequested = true;
  startAmbient(context);
  const now = context.currentTime + 0.08;
  [587.33, 739.99, 880].forEach((frequency, index) => {
    const startAt = now + index * 0.12;
    playTone(context, frequency, frequency, startAt, 0.22, 0.03, "sine");
  });
}
