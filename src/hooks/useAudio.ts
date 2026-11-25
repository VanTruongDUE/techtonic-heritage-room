import { useCallback, useEffect, useState } from 'react';
import { useHeritageStore } from '../store/useHeritageStore';
import { emitPlayerEvent, subscribePlayerEvent } from '../utils/playerEvents';
import { PLAYER_EVENTS } from '../types/playerEvents';

class MuseumAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];
  private lfoOsc: OscillatorNode | null = null;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      this.ctx = ctx;

      const { isMuted, audioVolume } = useHeritageStore.getState();
      const masterGain = ctx.createGain();
      const targetGain = isMuted ? 0 : audioVolume * 0.036;
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, targetGain), ctx.currentTime + 1.1);
      masterGain.connect(ctx.destination);
      this.masterGain = masterGain;

      // Warm breathing museum pad (A2 + E3 + B3) with gentle LFO low-pass sweep
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);
      filter.connect(masterGain);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.11, ctx.currentTime);
      lfoGain.gain.setValueAtTime(55, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.lfoOsc = lfo;

      const voices: Array<{ freq: number; type: OscillatorType; gain: number }> = [
        { freq: 110, type: 'sine', gain: 0.55 },
        { freq: 164.81, type: 'sine', gain: 0.32 },
        { freq: 246.94, type: 'triangle', gain: 0.14 },
      ];

      this.ambientOscs = voices.map((v) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = v.type;
        osc.frequency.setValueAtTime(v.freq, ctx.currentTime);
        g.gain.setValueAtTime(v.gain, ctx.currentTime);
        osc.connect(g);
        g.connect(filter);
        osc.start();
        return osc;
      });
    } catch {
      // Web Audio unavailable in headless / restricted environment
    }
  }

  syncVolume(isMuted: boolean, audioVolume: number) {
    if (!this.ctx || !this.masterGain) return;
    if (!isMuted && audioVolume > 0 && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    const target = isMuted ? 0 : audioVolume * 0.036;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.14);
  }

  private getSfxScale(): number {
    const { isMuted, audioVolume } = useHeritageStore.getState();
    if (isMuted || audioVolume <= 0) return 0;
    return audioVolume;
  }

  playChime(freq = 660) {
    const scale = this.getSfxScale();
    if (!this.ctx || scale <= 0) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.09);

      gain.gain.setValueAtTime(0.032 * scale, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Ignore transient audio issues
    }
  }

  playHoverTick() {
    const scale = this.getSfxScale();
    if (!this.ctx || scale <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.035);
      gain.gain.setValueAtTime(0.012 * scale, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  playGlideWhoosh() {
    const scale = this.getSfxScale();
    if (!this.ctx || scale <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.24);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.55);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(340, now);
      filter.Q.setValueAtTime(1.4, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.022 * scale, now + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Ignore
    }
  }

  playSuccessChord() {
    const scale = this.getSfxScale();
    if (!this.ctx || scale <= 0) return;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime + idx * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.024 * scale, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } catch {
        // Ignore
      }
    });
  }

  playLikePop() {
    const scale = this.getSfxScale();
    if (!this.ctx || scale <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.028 * scale, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  /** Stadium floodlight relay thump + ascending harmonic shimmer as each tunnel arch ignites */
  playLightIgnite(stepIndex = 0) {
    const scale = this.getSfxScale();
    if (!this.ctx || scale <= 0) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const now = this.ctx.currentTime;
      const pentatonic = [261.63, 293.66, 329.63, 392.0, 523.25];
      const baseFreq = pentatonic[Math.min(stepIndex, pentatonic.length - 1)];

      // Low stadium relay thump
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(92, now);
      sub.frequency.exponentialRampToValueAtTime(44, now + 0.16);
      subGain.gain.setValueAtTime(0.055 * scale, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.22);

      // Rising shimmer chord
      const shimmer = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(baseFreq, now);
      shimmer.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.18);
      shimmerGain.gain.setValueAtTime(0.024 * scale, now);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(this.ctx.destination);
      shimmer.start(now);
      shimmer.stop(now + 0.36);
    } catch {
      // Ignore
    }
  }

  /** Grand arena reveal swell when stepping through the threshold portal into the Main Hall */
  playHallReveal() {
    const scale = this.getSfxScale();
    if (!this.ctx || scale <= 0) return;
    const notes = [220.0, 329.63, 440.0, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime + idx * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx < 2 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.024 * scale, now + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.0);
      } catch {
        // Ignore
      }
    });
  }
}

export const soundFx = new MuseumAudioEngine();

export const useAudio = () => {
  const isMuted = useHeritageStore((s) => s.isMuted);
  const audioVolume = useHeritageStore((s) => s.audioVolume);
  const isCenterWallCinemaActive = useHeritageStore((s) => s.isCenterWallCinemaActive);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribePlayerEvent(PLAYER_EVENTS.STATE, ({ detail }) => {
      setIsMusicPlaying(detail.isPlaying);
    });
    emitPlayerEvent(PLAYER_EVENTS.REQUEST_STATE);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Duck synthetic ambient hum while real TechTonic playlist or Giant 3D Cinema TV is playing
    soundFx.syncVolume(isMuted || isCenterWallCinemaActive || isMusicPlaying, audioVolume);
  }, [isMuted, audioVolume, isCenterWallCinemaActive, isMusicPlaying]);

  const initAudio = useCallback(() => soundFx.init(), []);
  const playChime = useCallback((freq = 660) => soundFx.playChime(freq), []);
  const playHoverTick = useCallback(() => soundFx.playHoverTick(), []);
  const playGlideWhoosh = useCallback(() => soundFx.playGlideWhoosh(), []);
  const playSuccessChord = useCallback(() => soundFx.playSuccessChord(), []);
  const playLikePop = useCallback(() => soundFx.playLikePop(), []);

  return {
    initAudio,
    playChime,
    playHoverTick,
    playGlideWhoosh,
    playSuccessChord,
    playLikePop,
  };
};
