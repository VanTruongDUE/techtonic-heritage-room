import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene } from './Scene';

export const CanvasContainer: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#05070a]">
      <Canvas
        shadows
        camera={{
          fov: 65,
          near: 0.1,
          far: 120,
          position: [0, 2, 13.5],
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
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
