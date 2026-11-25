import React, { Suspense } from 'react';
import { Physics } from '@react-three/rapier';
import { StudioLights } from './Environment/StudioLights';
import { MuseumRoom } from './Environment/MuseumRoom';
import { CenterWall } from './Exhibits/CenterWall';
import { PerimeterGallery } from './Exhibits/PerimeterGallery';
import { CentralIsland } from './Exhibits/CentralIsland';
import { InteractiveCorner } from './Exhibits/InteractiveCorner';
import { ExecutiveOrgTree } from './Exhibits/ExecutiveOrgTree';
import { TunnelGallery } from './Exhibits/TunnelGallery';
import { MemberPortraitGallery } from './Exhibits/MemberPortraitGallery';
import { PlayerController } from './PlayerController';
import { HallParticleField, OrgConstellationOrbit } from './Effects/AmbientMotion';

export const Scene: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <color attach="background" args={['#080d17']} />
      <fog attach="fog" args={['#080d17', 38, 85]} />

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
        <ExecutiveOrgTree />
        <TunnelGallery />
        <MemberPortraitGallery />
        <PlayerController initialPosition={[0, 1.4, 25.8]} />
      </Physics>
    </Suspense>
  );
};
