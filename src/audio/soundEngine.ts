export type MusicEnvironment =
  | 'silent'
  | 'menu'
  | 'gameplay'
  | 'python'
  | 'sql'
  | 'boss'
  | 'victory'
  | 'failure';

export type SoundEffectType =
  | 'click'
  | 'correct'
  | 'incorrect'
  | 'xp'
  | 'unlock'
  | 'rankUp'
  | 'achievement'
  | 'terminal'
  | 'execute'
  | 'bossAlert'
  | 'victory';

interface EnvConfig {
  bpm: number;
  rootHz: number;
  scaleIntervals: number[]; // semitones
  padCutoff: number;
  arpGain: number;
  bassGain: number;
  pulseEnabled: boolean;
  intense: boolean;
}

const ENV_CONFIGS: Record<Exclude<MusicEnvironment, 'silent'>, EnvConfig> = {
  menu: {
    bpm: 72,
    rootHz: 110, // A2
    scaleIntervals: [0, 3, 7, 10, 14, 15],
    padCutoff: 520,
    arpGain: 0.045,
    bassGain: 0.08,
    pulseEnabled: false,
    intense: false,
  },
  gameplay: {
    bpm: 96,
    rootHz: 130.81, // C3
    scaleIntervals: [0, 3, 7, 10, 12, 15],
    padCutoff: 680,
    arpGain: 0.055,
    bassGain: 0.09,
    pulseEnabled: true,
    intense: false,
  },
  python: {
    bpm: 88,
    rootHz: 146.83, // D3
    scaleIntervals: [0, 2, 7, 9, 12, 14],
    padCutoff: 600,
    arpGain: 0.05,
    bassGain: 0.075,
    pulseEnabled: true,
    intense: false,
  },
  sql: {
    bpm: 82,
    rootHz: 98.0, // G2
    scaleIntervals: [0, 3, 7, 10, 12, 14],
    padCutoff: 480,
    arpGain: 0.04,
    bassGain: 0.085,
    pulseEnabled: true,
    intense: false,
  },
  boss: {
    bpm: 122,
    rootHz: 110, // A2
    scaleIntervals: [0, 1, 5, 7, 8, 12],
    padCutoff: 950,
    arpGain: 0.065,
    bassGain: 0.12,
    pulseEnabled: true,
    intense: true,
  },
  victory: {
    bpm: 100,
    rootHz: 130.81, // C3 major lift
    scaleIntervals: [0, 4, 7, 11, 14, 16],
    padCutoff: 1050,
    arpGain: 0.06,
    bassGain: 0.08,
    pulseEnabled: false,
    intense: false,
  },
  failure: {
    bpm: 64,
    rootHz: 92.5, // F#2
    scaleIntervals: [0, 1, 6, 7],
    padCutoff: 380,
    arpGain: 0.035,
    bassGain: 0.09,
    pulseEnabled: false,
    intense: false,
  },
};

function semitoneToHz(root: number, semi: number): number {
  return root * Math.pow(2, semi / 12);
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicMasterGain: GainNode | null = null;
  private sfxMasterGain: GainNode | null = null;

  private musicEnabled = true;
  private sfxEnabled = true;
  private musicVolume = 0.45;
  private sfxVolume = 0.65;
  private unlocked = false;

  private currentEnv: MusicEnvironment = 'silent';
  private schedulerTimer: number | null = null;
  private stepIndex = 0;

  // Persistent ambient pad oscillators for current environment
  private padOscs: OscillatorNode[] = [];
  private padGain: GainNode | null = null;

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.musicMasterGain = this.ctx.createGain();
      this.sfxMasterGain = this.ctx.createGain();

      this.musicMasterGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
      this.sfxMasterGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;

      this.musicMasterGain.connect(this.ctx.destination);
      this.sfxMasterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;

    // If an environment was requested before user gesture, start it cleanly now
    if (this.currentEnv !== 'silent' && this.musicEnabled && !this.schedulerTimer) {
      this.startEnvironmentLoop(this.currentEnv);
    }
  }

  public configure(opts: {
    musicEnabled: boolean;
    sfxEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
  }): void {
    this.musicEnabled = opts.musicEnabled;
    this.sfxEnabled = opts.sfxEnabled;
    this.musicVolume = Math.max(0, Math.min(1, opts.musicVolume));
    this.sfxVolume = Math.max(0, Math.min(1, opts.sfxVolume));

    if (this.ctx && this.musicMasterGain && this.sfxMasterGain) {
      const now = this.ctx.currentTime;
      this.musicMasterGain.gain.setTargetAtTime(
        this.musicEnabled ? this.musicVolume : 0,
        now,
        0.08
      );
      this.sfxMasterGain.gain.setTargetAtTime(
        this.sfxEnabled ? this.sfxVolume : 0,
        now,
        0.04
      );
    }

    if (!this.musicEnabled) {
      this.stopLoop();
    } else if (this.unlocked && this.currentEnv !== 'silent' && !this.schedulerTimer) {
      this.startEnvironmentLoop(this.currentEnv);
    }
  }

  public setEnvironment(env: MusicEnvironment): void {
    if (this.currentEnv === env) return;
    this.currentEnv = env;
    this.stopLoop();
    if (env === 'silent' || !this.musicEnabled || !this.unlocked) return;
    this.startEnvironmentLoop(env);
  }

  private stopLoop(): void {
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.ctx && this.padGain) {
      const now = this.ctx.currentTime;
      try {
        this.padGain.gain.setTargetAtTime(0, now, 0.12);
      } catch {
        // ignore
      }
    }
    const oscsToStop = this.padOscs;
    this.padOscs = [];
    this.padGain = null;
    if (oscsToStop.length > 0 && this.ctx) {
      const stopAt = this.ctx.currentTime + 0.35;
      for (const osc of oscsToStop) {
        try {
          osc.stop(stopAt);
        } catch {
          // ignore
        }
      }
    }
  }

  private startEnvironmentLoop(env: Exclude<MusicEnvironment, 'silent'>): void {
    if (!this.ctx || !this.musicMasterGain) return;
    const cfg = ENV_CONFIGS[env];
    const now = this.ctx.currentTime;

    // Warm dual-detuned ambient pad
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cfg.padCutoff, now);
    filter.Q.value = 1.4;

    const pGain = this.ctx.createGain();
    pGain.gain.setValueAtTime(0.0001, now);
    pGain.gain.linearRampToValueAtTime(0.09, now + 0.8);

    filter.connect(pGain);
    pGain.connect(this.musicMasterGain);
    this.padGain = pGain;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(cfg.rootHz, now);
    osc1.detune.setValueAtTime(-6, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(cfg.rootHz * 1.5, now); // fifth
    osc2.detune.setValueAtTime(5, now);

    osc1.connect(filter);
    osc2.connect(filter);
    osc1.start(now);
    osc2.start(now);
    this.padOscs = [osc1, osc2];

    this.stepIndex = 0;
    const stepMs = Math.round((60 / cfg.bpm / 2) * 1000); // 8th notes

    this.schedulerTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicMasterGain || !this.musicEnabled) return;
      if (document.visibilityState === 'hidden') return;
      if (this.ctx.state === 'suspended') return;

      const t = this.ctx.currentTime;
      const step = this.stepIndex++;

      // Soft bass pulse on downbeats
      if (step % 4 === 0 || (cfg.intense && step % 2 === 0)) {
        this.triggerNote(
          cfg.rootHz * (step % 16 >= 12 ? 0.8909 : 1),
          'triangle',
          0.28,
          cfg.bassGain,
          320,
          t
        );
      }

      // Digital arpeggio plucks
      if (step % 2 === 0 || cfg.intense) {
        const idx = (step + Math.floor(step / 8)) % cfg.scaleIntervals.length;
        const noteHz = semitoneToHz(cfg.rootHz * 2, cfg.scaleIntervals[idx]);
        this.triggerNote(noteHz, 'sine', 0.22, cfg.arpGain, 1400, t);
      }

      // Minimal soft electronic tick
      if (cfg.pulseEnabled && (step % 2 === 1 || (cfg.intense && step % 4 === 2))) {
        this.triggerClickPerc(cfg.intense ? 0.045 : 0.022, t);
      }
    }, stepMs);
  }

  private triggerNote(
    hz: number,
    wave: OscillatorType,
    duration: number,
    gainLevel: number,
    cutoff: number,
    startTime: number
  ): void {
    if (!this.ctx || !this.musicMasterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(hz, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicMasterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  }

  private triggerClickPerc(gainLevel: number, startTime: number): void {
    if (!this.ctx || !this.musicMasterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.025);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(4200, startTime);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainLevel, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.025);

    src.connect(hp);
    hp.connect(g);
    g.connect(this.musicMasterGain);
    src.start(startTime);
  }

  public playSfx(type: SoundEffectType): void {
    this.unlock();
    if (!this.sfxEnabled || !this.ctx || !this.sfxMasterGain) return;
    if (this.ctx.state === 'suspended') return;

    const now = this.ctx.currentTime;

    const playTone = (
      freq: number,
      endFreq: number,
      dur: number,
      wave: OscillatorType,
      vol: number,
      delay = 0
    ) => {
      if (!this.ctx || !this.sfxMasterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + delay);
      if (endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + delay + dur);
      }
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

      osc.connect(gain);
      gain.connect(this.sfxMasterGain);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    };

    switch (type) {
      case 'click':
        playTone(680, 420, 0.045, 'sine', 0.12);
        break;
      case 'terminal':
        playTone(920, 1080, 0.035, 'triangle', 0.09);
        break;
      case 'execute':
        playTone(340, 520, 0.08, 'triangle', 0.12, 0);
        playTone(520, 780, 0.1, 'sine', 0.12, 0.08);
        break;
      case 'correct':
        playTone(523.25, 523.25, 0.12, 'triangle', 0.18, 0);
        playTone(659.25, 659.25, 0.14, 'triangle', 0.18, 0.07);
        playTone(783.99, 783.99, 0.22, 'sine', 0.2, 0.14);
        break;
      case 'incorrect':
        playTone(220, 175, 0.16, 'sawtooth', 0.1, 0);
        playTone(175, 130, 0.22, 'triangle', 0.12, 0.11);
        break;
      case 'xp':
        playTone(740, 987.77, 0.14, 'sine', 0.14);
        break;
      case 'unlock':
        playTone(440, 440, 0.1, 'triangle', 0.16, 0);
        playTone(554.37, 554.37, 0.12, 'triangle', 0.16, 0.08);
        playTone(659.25, 880, 0.28, 'sine', 0.18, 0.16);
        break;
      case 'rankUp':
        [392, 493.88, 587.33, 783.99].forEach((f, idx) =>
          playTone(f, f, 0.22, 'triangle', 0.18, idx * 0.09)
        );
        break;
      case 'achievement':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) =>
          playTone(f, f, 0.24, 'sine', 0.17, idx * 0.08)
        );
        break;
      case 'bossAlert':
        playTone(146.83, 110, 0.35, 'sawtooth', 0.14, 0);
        playTone(146.83, 110, 0.35, 'sawtooth', 0.14, 0.38);
        break;
      case 'victory':
        [261.63, 329.63, 392.0, 523.25, 659.25].forEach((f, idx) =>
          playTone(f, f, 0.32, 'triangle', 0.16, idx * 0.1)
        );
        break;
    }
  }
}

export const soundEngine = new SoundEngine();
