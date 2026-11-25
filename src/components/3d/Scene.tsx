import React, { Suspense, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
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
import { PlayerController } from './PlayerController';
import { HallParticleField, OrgConstellationOrbit } from './Effects/AmbientMotion';
import { CodeCosmosOrbit } from './Effects/CodeCosmosOrbit';
import { useHeritageStore } from '../../store/useHeritageStore';

/**
 * Pre-compiles WebGL shaders in the background while the Welcome overlay is active
 * so panning the camera around the gallery has ZERO first-look shader compilation hitch.
 */
const ShaderPrewarmer: React.FC = () => {
  const { gl, scene, camera } = useThree();
  const compiledRef = useRef(false);

  useEffect(() => {
    if (compiledRef.current) return;
    const rafId = window.requestAnimationFrame(() => {
      try {
        gl.compile(scene, camera);
        compiledRef.current = true;
      } catch {
        // Ignore if context is disposed during hot reload
      }
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [gl, scene, camera]);

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
        <PlayerController initialPosition={[0, 1.4, 25.8]} />
      </Physics>
    </Suspense>
  );
};
