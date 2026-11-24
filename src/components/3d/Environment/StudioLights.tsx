import React, { useRef } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

const HALL_DOWNLIGHT_POSITIONS: [number, number, number][] = [
  [-10, 6.15, -13],
  [0, 6.15, -13],
  [10, 6.15, -13],
  [-10, 6.15, -5],
  [0, 6.15, -5],
  [10, 6.15, -5],
  [-10, 6.15, 3],
  [0, 6.15, 3],
  [10, 6.15, 3],
];

export const StudioLights: React.FC = () => {
  const centerWallTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const centralIslandTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const shirtTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const timelineTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const activitiesTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const interactiveTarget = useRef<THREE.Object3D>(new THREE.Object3D());

  return (
    <group>
      {/* Procedural reflection environment (zero network assets) so glass & metallic exhibits look natural */}
      <Environment resolution={128} frames={1} environmentIntensity={0.65}>
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#e2eeff"
          position={[0, 8, -4]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[26, 22, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#bae6fd"
          position={[-14, 3, -4]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[20, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#bfdbfe"
          position={[14, 3, -4]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[20, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.5}
          color="#1e293b"
          position={[0, -4, -4]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[30, 30, 1]}
        />
      </Environment>

      {/* Spotlight targets */}
      <primitive object={centerWallTarget.current} position={[0, 3.3, -18.5]} />
      <primitive object={centralIslandTarget.current} position={[0, 1.0, -5]} />
      <primitive object={shirtTarget.current} position={[15.2, 2.2, -4]} />
      <primitive object={timelineTarget.current} position={[-16.2, 3.0, -6]} />
      <primitive object={activitiesTarget.current} position={[-16.2, 3.0, 4]} />
      <primitive object={interactiveTarget.current} position={[9.5, 2.2, -16.5]} />

      {/* 1. Balanced Natural Architectural Fill */}
      <hemisphereLight color="#c7dcff" groundColor="#1b2438" intensity={1.35} />
      <ambientLight color="#1e293b" intensity={0.85} />
      <directionalLight position={[4, 14, 8]} intensity={0.75} color="#e6f0ff" />

      {/* 2. Entrance Corridor Ceiling Lights */}
      <pointLight
        position={[0, 5.6, 14]}
        intensity={14}
        distance={16}
        decay={1.2}
        color="#e0f2fe"
      />
      <pointLight
        position={[0, 5.6, 10]}
        intensity={14}
        distance={16}
        decay={1.2}
        color="#eef6ff"
      />

      {/* 3. Full Main Hall Ceiling Downlight Grid (3x3 coverage, gentle non-glaring falloff) */}
      {HALL_DOWNLIGHT_POSITIONS.map((pos, idx) => (
        <pointLight
          key={`hall-downlight-${idx}`}
          position={pos}
          intensity={18}
          distance={22}
          decay={1.2}
          color="#e8f1ff"
        />
      ))}

      {/* 4. Center Wall Spotlights (Natural gallery white + soft cool blue side wash) */}
      <spotLight
        position={[0, 6.0, -11]}
        target={centerWallTarget.current}
        intensity={42}
        distance={24}
        decay={1.2}
        angle={0.8}
        penumbra={0.65}
        color="#f8fafc"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        position={[-7.5, 5.9, -11.5]}
        target={centerWallTarget.current}
        intensity={20}
        distance={22}
        decay={1.2}
        angle={0.7}
        penumbra={0.75}
        color="#7dd3fc"
      />
      <spotLight
        position={[7.5, 5.9, -11.5]}
        target={centerWallTarget.current}
        intensity={20}
        distance={22}
        decay={1.2}
        angle={0.7}
        penumbra={0.75}
        color="#93c5fd"
      />

      {/* 5. Central Island Trophy Showcase (Warm museum halogen accent) */}
      <spotLight
        position={[0, 6.1, -5]}
        target={centralIslandTarget.current}
        intensity={38}
        distance={18}
        decay={1.2}
        angle={0.75}
        penumbra={0.6}
        color="#fef3c7"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight
        position={[0, 2.6, -5]}
        intensity={10}
        distance={10}
        decay={1.2}
        color="#fde68a"
      />

      {/* 6. Right Perimeter: Club Shirt & BCN Wall */}
      <spotLight
        position={[8.5, 6.0, -4]}
        target={shirtTarget.current}
        intensity={36}
        distance={18}
        decay={1.2}
        angle={0.7}
        penumbra={0.6}
        color="#e0f2fe"
        castShadow
      />
      <pointLight
        position={[14.2, 3.6, -4]}
        intensity={12}
        distance={9}
        decay={1.2}
        color="#bae6fd"
      />

      {/* 7. Left Perimeter: Timeline & Activity Highlights */}
      <spotLight
        position={[-8.5, 6.0, -6]}
        target={timelineTarget.current}
        intensity={36}
        distance={18}
        decay={1.2}
        angle={0.75}
        penumbra={0.65}
        color="#f1f5f9"
        castShadow
      />
      <spotLight
        position={[-8.5, 6.0, 4]}
        target={activitiesTarget.current}
        intensity={34}
        distance={18}
        decay={1.2}
        angle={0.75}
        penumbra={0.65}
        color="#e2e8f0"
      />

      {/* 8. Interactive Corner: LED Display & Guestbook Kiosk */}
      <spotLight
        position={[6.0, 6.0, -12.5]}
        target={interactiveTarget.current}
        intensity={32}
        distance={18}
        decay={1.2}
        angle={0.75}
        penumbra={0.6}
        color="#dbeafe"
      />
      <pointLight
        position={[7.2, 3.4, -14.8]}
        intensity={11}
        distance={10}
        decay={1.2}
        color="#bae6fd"
      />
    </group>
  );
};
