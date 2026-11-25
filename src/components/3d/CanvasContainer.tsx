import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene } from './Scene';
import { useHeritageStore } from '../../store/useHeritageStore';

export const CanvasContainer: React.FC = () => {
  const { controlMode, isHoveringInteractive, isDraggingCamera, activeModal } = useHeritageStore();

  const cursorClass =
    activeModal || controlMode === 'fps'
      ? 'cursor-default'
      : isDraggingCamera
      ? 'cursor-grabbing'
      : isHoveringInteractive
      ? 'cursor-pointer'
      : 'cursor-default';

  return (
    <div className={`absolute inset-0 w-full h-full bg-[#080d17] ${cursorClass}`}>
      <Canvas
        shadows="soft"
        camera={{
          fov: 65,
          near: 0.1,
          far: 120,
          position: [0, 2, 25.8],
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.domElement.setAttribute('role', 'img');
          gl.domElement.setAttribute(
            'aria-label',
            'Không gian bảo tàng 3D tương tác Phòng Truyền Thống TechTonic Club'
          );
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};
