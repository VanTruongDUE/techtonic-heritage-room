import React, { Suspense } from 'react';
import { Physics } from '@react-three/rapier';
import { StudioLights } from './Environment/StudioLights';
import { MuseumRoom } from './Environment/MuseumRoom';
import { CenterWall } from './Exhibits/CenterWall';
import { PerimeterGallery } from './Exhibits/PerimeterGallery';
import { CentralIsland } from './Exhibits/CentralIsland';
import { InteractiveCorner } from './Exhibits/InteractiveCorner';
import { TunnelGallery } from './Exhibits/TunnelGallery';
import { MemberPortraitGallery } from './Exhibits/MemberPortraitGallery';
import { PlayerController } from './PlayerController';
import { HallParticleField, OrgConstellationOrbit } from './Effects/AmbientMotion';

export const Scene: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <color attach="background" args={['#050811']} />
      <fog attach="fog" args={['#050811', 48, 115]} />

      {/* Lighting System outside Physics */}
      <StudioLights />

      {/* Subtle Ambient Motion Layers */}
      <HallParticleField />
      <OrgConstellationOrbit />

      {/* Physics World for Collisions and Character Movement */}
      <Physics gravity={[0, -9.81, 0]}>
        <MuseumRoom />
        <CenterWall />
        <PerimeterGallery />
        <CentralIsland />
        <InteractiveCorner />
        <TunnelGallery />
        <MemberPortraitGallery />
        <PlayerController initialPosition={[0, 1.4, 25.8]} />
      </Physics>
    </Suspense>
  );
};
