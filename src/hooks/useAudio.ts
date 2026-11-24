import { useCallback, useEffect, useRef } from 'react';
import { useHeritageStore } from '../store/useHeritageStore';

export const useAudio = () => {
  const isMuted = useHeritageStore((s) => s.isMuted);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientOsc1Ref = useRef<OscillatorNode | null>(null);
  const ambientOsc2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      const targetVolume = useHeritageStore.getState().isMuted ? 0 : 0.035;
      masterGain.gain.setValueAtTime(targetVolume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Low harmonic ambient drone (Tech museum atmosphere)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(164.81, ctx.currentTime); // E3

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);

      osc1.start();
      osc2.start();

      ambientOsc1Ref.current = osc1;
      ambientOsc2Ref.current = osc2;
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }, []);

  const playChime = useCallback((freq = 660) => {
    const ctx = audioCtxRef.current;
    if (!ctx || useHeritageStore.getState().isMuted) return;
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, ctx.currentTime + 0.09);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
    } catch {
      // Ignore transient audio scheduling issues
    }
  }, []);

  // Mute / Unmute smoothly
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const gainNode = gainNodeRef.current;
    if (!ctx || !gainNode) return;

    if (!isMuted && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    gainNode.gain.setTargetAtTime(isMuted ? 0 : 0.035, ctx.currentTime, 0.12);
  }, [isMuted]);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      try {
        ambientOsc1Ref.current?.stop();
        ambientOsc2Ref.current?.stop();
        audioCtxRef.current?.close();
      } catch {
        // Already closed
      }
      audioCtxRef.current = null;
      ambientOsc1Ref.current = null;
      ambientOsc2Ref.current = null;
      gainNodeRef.current = null;
    };
  }, []);

  return { initAudio, playChime };
};
