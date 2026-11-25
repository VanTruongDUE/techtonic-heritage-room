import React, { Suspense, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { StudioLights } from './Environment/StudioLights';
import { CosmicBackdrop } from './Environment/CosmicBackdrop';
import { MuseumRoom } from './Environment/MuseumRoom';
import { CenterWall } from './Exhibits/CenterWall';
import { PerimeterGallery } from './Exhibits/PerimeterGallery';
import { CentralIsland } from './Exhibits/CentralIsland';
import { InteractiveCorner } from './Exhibits/InteractiveCorner';
import { TunnelGallery } from './Exhibits/TunnelGallery';
import { MemberPortraitGallery } from './Exhibits/MemberPortraitGallery';
import { PhotoPedestalGallery } from './Exhibits/PhotoPedestalGallery';
import { DigitalEcosystemVitrines } from './Exhibits/DigitalEcosystemVitrines';
import { DepartmentMascots3D } from './Exhibits/DepartmentMascots3D';
import { PlayerController } from './PlayerController';
import { HallParticleField, OrgConstellationOrbit } from './Effects/AmbientMotion';
import { CodeCosmosOrbit } from './Effects/CodeCosmosOrbit';
import { useHeritageStore } from '../../store/useHeritageStore';

/**
 * Multi-stage GPU Pre-Warmer:
 * Compiles all WebGL shaders & uploads textures/mipmaps across 6 silent frames
 * while the LoadingScreen is displayed so entering and panning inside the 3D museum
 * starts at locked 60 FPS with ZERO first-look stutter.
 */
const ShaderPrewarmer: React.FC = () => {
  const { gl, scene, camera } = useThree();
  const setSceneWarmupProgress = useHeritageStore((s) => s.setSceneWarmupProgress);
  const stageRef = useRef<'init' | 'compiled' | 'done'>('init');
  const warmFramesRef = useRef(0);

  useEffect(() => {
    setSceneWarmupProgress(15);
    const timer = window.setTimeout(() => {
      if (stageRef.current !== 'done') {
        stageRef.current = 'done';
        setSceneWarmupProgress(100);
      }
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [setSceneWarmupProgress]);

  useFrame(() => {
    if (stageRef.current === 'done') return;

    if (stageRef.current === 'init') {
      try {
        gl.compile(scene, camera);
      } catch {
        // Ignore if context is disposed during hot reload
      }
      stageRef.current = 'compiled';
      setSceneWarmupProgress(55);
      return;
    }

    warmFramesRef.current += 1;
    if (warmFramesRef.current === 2) {
      setSceneWarmupProgress(75);
    } else if (warmFramesRef.current === 4) {
      setSceneWarmupProgress(90);
    } else if (warmFramesRef.current >= 6) {
      stageRef.current = 'done';
      setSceneWarmupProgress(100);
    }
  });

  return null;
};

export const Scene: React.FC = () => {
  const activeModal = useHeritageStore((s) => s.activeModal);

  return (
    <Suspense fallback={null}>
      <color attach="background" args={['#000105']} />
      <fog attach="fog" args={['#010208', 195, 455]} />
      <ShaderPrewarmer />

      {/* 360° Deep-Space Starfield, Nebula & Glowing 3D Moon outside the Observatory */}
      <CosmicBackdrop />

      {/* Lighting System outside Physics */}
      <StudioLights />

      {/* Subtle Ambient Motion Layers */}
      <HallParticleField />
      <OrgConstellationOrbit />
      <CodeCosmosOrbit />

      {/* Physics World: variable frame-synced step eliminates 60Hz-vs-120/144Hz movement judder */}
      <Physics gravity={[0, -9.81, 0]} timeStep="vary" paused={Boolean(activeModal)}>
        <MuseumRoom />
        <CenterWall />
        <PerimeterGallery />
        <CentralIsland />
        <InteractiveCorner />
        <TunnelGallery />
        <MemberPortraitGallery />
        <PhotoPedestalGallery />
        <DigitalEcosystemVitrines />
        <DepartmentMascots3D />
        <PlayerController initialPosition={[0, 1.4, 25.8]} />
      </Physics>
    </Suspense>
  );
};
