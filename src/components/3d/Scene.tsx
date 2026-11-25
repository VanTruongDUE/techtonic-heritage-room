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
import { useHeritageStore } from '../../store/useHeritageStore';

export const Scene: React.FC = () => {
  const activeModal = useHeritageStore((s) => s.activeModal);

  return (
    <Suspense fallback={null}>
      <color attach="background" args={['#010206']} />
      <fog attach="fog" args={['#010206', 190, 445]} />

      {/* 360° Deep-Space Starfield, Nebula & Glowing 3D Moon outside the Observatory */}
      <CosmicBackdrop />

      {/* Lighting System outside Physics */}
      <StudioLights />

      {/* Subtle Ambient Motion Layers */}
      <HallParticleField />
      <OrgConstellationOrbit />
      <CodeCosmosOrbit />

      {/* Physics World (paused automatically while viewing 2D modals to save CPU) */}
      <Physics gravity={[0, -9.81, 0]} paused={Boolean(activeModal)}>
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
