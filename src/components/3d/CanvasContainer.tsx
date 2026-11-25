import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene } from './Scene';
import { useHeritageStore } from '../../store/useHeritageStore';

/**
 * Lightweight adaptive FPS watchdog:
 * Monitors rolling frame times once the user enters the 3D hall.
 * If a laptop struggles below ~36 FPS, automatically lowers pixel ratio and/or
 * switches to 'balanced' mode so navigation stays silky smooth on every device.
 */
const AdaptivePerformanceGuard: React.FC<{
  onDownscaleDpr: () => void;
}> = ({ onDownscaleDpr }) => {
  const hasEntered = useHeritageStore((s) => s.hasEntered);
  const graphicsQuality = useHeritageStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useHeritageStore((s) => s.setGraphicsQuality);
  const sampleCountRef = useRef(0);
  const sampleDeltaSumRef = useRef(0);
  const lowFpsStrikesRef = useRef(0);
  const didDownscaleDprRef = useRef(false);

  useFrame((_, delta) => {
    if (!hasEntered || document.hidden) return;
    // Ignore huge tab-switch spikes (> 0.25s)
    if (delta > 0.25) return;

    sampleCountRef.current += 1;
    sampleDeltaSumRef.current += delta;

    // Evaluate rolling average every ~60 frames
    if (sampleCountRef.current >= 60) {
      const avgFps = sampleCountRef.current / Math.max(0.001, sampleDeltaSumRef.current);
      sampleCountRef.current = 0;
      sampleDeltaSumRef.current = 0;

      if (avgFps < 36) {
        lowFpsStrikesRef.current += 1;
        if (lowFpsStrikesRef.current >= 2) {
          if (graphicsQuality === 'high') {
            setGraphicsQuality('balanced', true);
            lowFpsStrikesRef.current = 0;
          } else if (!didDownscaleDprRef.current) {
            didDownscaleDprRef.current = true;
            onDownscaleDpr();
          }
        }
      } else {
        lowFpsStrikesRef.current = Math.max(0, lowFpsStrikesRef.current - 1);
      }
    }
  });

  return null;
};

export const CanvasContainer: React.FC = () => {
  const {
    controlMode,
    isHoveringInteractive,
    isDraggingCamera,
    activeModal,
    graphicsQuality,
  } = useHeritageStore();
  const [lowPowerDpr, setLowPowerDpr] = useState(false);

  useEffect(() => {
    if (graphicsQuality === 'high') {
      setLowPowerDpr(false);
    }
  }, [graphicsQuality]);

  const cursorClass =
    activeModal || controlMode === 'fps'
      ? 'cursor-default'
      : isDraggingCamera
      ? 'cursor-grabbing'
      : isHoveringInteractive
      ? 'cursor-pointer'
      : 'cursor-default';

  const dpr: [number, number] = lowPowerDpr
    ? [0.75, 0.9]
    : graphicsQuality === 'high'
    ? [1, 1.45]
    : [0.85, 1.15];

  return (
    <div className={`absolute inset-0 w-full h-full bg-[#010207] ${cursorClass}`}>
      <Canvas
        shadows={graphicsQuality === 'high'}
        camera={{
          fov: 65,
          near: 0.15,
          far: 420,
          position: [0, 2, 25.8],
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.18,
        }}
        dpr={dpr}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.domElement.setAttribute('role', 'img');
          gl.domElement.setAttribute(
            'aria-label',
            'Không gian bảo tàng 3D tương tác Phòng Truyền Thống TechTonic Club'
          );
        }}
      >
        <AdaptivePerformanceGuard onDownscaleDpr={() => setLowPowerDpr(true)} />
        <Scene />
      </Canvas>
    </div>
  );
};
