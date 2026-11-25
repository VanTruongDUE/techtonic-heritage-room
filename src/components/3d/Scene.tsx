import React, { Suspense } from 'react';
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
import { PlayerController } from './PlayerController';
import { HallParticleField, OrgConstellationOrbit } from './Effects/AmbientMotion';
import { CodeCosmosOrbit } from './Effects/CodeCosmosOrbit';

export const Scene: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <color attach="background" args={['#02040b']} />
      <fog attach="fog" args={['#02040b', 180, 440]} />

      {/* 360° Deep-Space Starfield, Nebula & Glowing 3D Moon outside the Observatory */}
      <CosmicBackdrop />

      {/* Lighting System outside Physics */}
      <StudioLights />

      {/* Subtle Ambient Motion Layers */}
      <HallParticleField />
      <OrgConstellationOrbit />
      <CodeCosmosOrbit />

      {/* Physics World for Collisions and Character Movement */}
      <Physics gravity={[0, -9.81, 0]}>
        <MuseumRoom />
        <CenterWall />
        <PerimeterGallery />
        <CentralIsland />
        <InteractiveCorner />
        <TunnelGallery />
        <MemberPortraitGallery />
        <PhotoPedestalGallery />
        <PlayerController initialPosition={[0, 1.4, 25.8]} />
      </Physics>
    </Suspense>
  );
};
