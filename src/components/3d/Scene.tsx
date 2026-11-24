import React, { Suspense } from 'react';
import { Physics } from '@react-three/rapier';
import { StudioLights } from './Environment/StudioLights';
import { MuseumRoom } from './Environment/MuseumRoom';
import { CenterWall } from './Exhibits/CenterWall';
import { PerimeterGallery } from './Exhibits/PerimeterGallery';
import { CentralIsland } from './Exhibits/CentralIsland';
import { InteractiveCorner } from './Exhibits/InteractiveCorner';
import { PlayerController } from './PlayerController';

export const Scene: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <color attach="background" args={['#080d17']} />
      <fog attach="fog" args={['#080d17', 38, 85]} />

      {/* Lighting System outside Physics */}
      <StudioLights />

      {/* Physics World for Collisions and Character Movement */}
      <Physics gravity={[0, -9.81, 0]}>
        <MuseumRoom />
        <CenterWall />
        <PerimeterGallery />
        <CentralIsland />
        <InteractiveCorner />
        <PlayerController initialPosition={[0, 1.4, 13.5]} />
      </Physics>
    </Suspense>
  );
};
