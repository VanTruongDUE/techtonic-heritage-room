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
  const orgTreeTarget = useRef<THREE.Object3D>(new THREE.Object3D());

  return (
    <group>
      {/* Procedural HDR-style reflection rig so marble, brushed steel, brass & vitrine glass catch crisp gallery light */}
      <Environment resolution={256} frames={1} environmentIntensity={0.82}>
        {/* Skylight main overhead bay */}
        <Lightformer
          form="rect"
          intensity={1.9}
          color="#e2eeff"
          position={[0, 8, -5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[24, 22, 1]}
        />
        {/* Warm central gallery light band over Island trophies */}
        <Lightformer
          form="ring"
          intensity={2.2}
          color="#fef3c7"
          position={[0, 7.2, -5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[6, 6, 1]}
        />
        {/* Entrance ceiling strips */}
        <Lightformer
          form="rect"
          intensity={1.3}
          color="#bae6fd"
          position={[0, 7.5, 11]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[4, 8, 1]}
        />
        {/* Side perimeter specular bounce strips */}
        <Lightformer
          form="rect"
          intensity={1.15}
          color="#bae6fd"
          position={[-14, 3.2, -4]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[22, 4.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.15}
          color="#bfdbfe"
          position={[14, 3.2, -4]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[22, 4.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.95}
          color="#e0f2fe"
          position={[0, 3.5, -16]}
          scale={[24, 4.5, 1]}
        />
        {/* Ground bounce */}
        <Lightformer
          form="rect"
          intensity={0.55}
          color="#1e293b"
          position={[0, -4, -4]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[34, 34, 1]}
        />
      </Environment>

      {/* Aimed Spotlight Targets */}
      <primitive object={centerWallTarget.current} position={[0, 3.3, -18.5]} />
      <primitive object={centralIslandTarget.current} position={[0, 1.0, -5]} />
      <primitive object={shirtTarget.current} position={[13.8, 2.0, -10.4]} />
      <primitive object={timelineTarget.current} position={[-16.2, 3.0, -6]} />
      <primitive object={activitiesTarget.current} position={[-16.2, 3.0, 4]} />
      <primitive object={interactiveTarget.current} position={[9.5, 2.2, -16.5]} />
      <primitive object={orgTreeTarget.current} position={[-9.6, 2.6, -12.2]} />

      {/* 1. Balanced Natural Architectural Fill */}
      <hemisphereLight color="#c7dcff" groundColor="#1b2438" intensity={1.3} />
      <ambientLight color="#1e293b" intensity={0.78} />
      <directionalLight
        position={[4, 14, 8]}
        intensity={0.75}
        color="#e6f0ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* 2. Entrance Corridor Ceiling Lights */}
      <pointLight position={[0, 5.6, 14]} intensity={13} distance={16} decay={1.2} color="#e0f2fe" />
      <pointLight position={[0, 5.6, 10]} intensity={13} distance={16} decay={1.2} color="#eef6ff" />

      {/* 3. Full Main Hall Ceiling Downlight Grid */}
      {HALL_DOWNLIGHT_POSITIONS.map((pos, idx) => (
        <pointLight
          key={`hall-downlight-${idx}`}
          position={pos}
          intensity={17}
          distance={22}
          decay={1.2}
          color="#e8f1ff"
        />
      ))}

      {/* 4. Center Wall Spotlights */}
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
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <spotLight
        position={[-7.5, 5.9, -11.5]}
        target={centerWallTarget.current}
        intensity={18}
        distance={22}
        decay={1.2}
        angle={0.7}
        penumbra={0.75}
        color="#7dd3fc"
      />
      <spotLight
        position={[7.5, 5.9, -11.5]}
        target={centerWallTarget.current}
        intensity={18}
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
        intensity={40}
        distance={18}
        decay={1.2}
        angle={0.75}
        penumbra={0.62}
        color="#fef3c7"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <pointLight position={[0, 2.7, -5]} intensity={10} distance={10} decay={1.2} color="#fde68a" />

      {/* 6. Right Perimeter: Club Shirt Niche & BCN Wall */}
      <spotLight
        position={[8.5, 6.0, -8.5]}
        target={shirtTarget.current}
        intensity={36}
        distance={18}
        decay={1.2}
        angle={0.72}
        penumbra={0.62}
        color="#e0f2fe"
        castShadow
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <pointLight position={[14.5, 3.6, -4]} intensity={13} distance={10} decay={1.2} color="#bae6fd" />

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
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
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

      {/* 8. Back-Left Sanctuary: Soft Diffused Wash for BCN Org Tree (no glare hotspot) */}
      <spotLight
        position={[-6.8, 6.1, -9.2]}
        target={orgTreeTarget.current}
        intensity={24}
        distance={18}
        decay={1.2}
        angle={0.85}
        penumbra={0.9}
        color="#e8f1ff"
      />
      <pointLight position={[-6.8, 2.6, -9.4]} intensity={8} distance={10} decay={1.2} color="#dbeafe" />

      {/* 9. Interactive Corner: LED Display & Guestbook Kiosk */}
      <spotLight
        position={[6.0, 6.0, -12.5]}
        target={interactiveTarget.current}
        intensity={34}
        distance={18}
        decay={1.2}
        angle={0.75}
        penumbra={0.6}
        color="#dbeafe"
      />
      <pointLight position={[7.2, 3.4, -14.8]} intensity={11} distance={10} decay={1.2} color="#bae6fd" />

      {/* 10. Front Inner Walls & Corners Gentle Fill */}
      <pointLight position={[-13.4, 4.8, -14.5]} intensity={16} distance={14} decay={1.2} color="#e0f2fe" />
      <pointLight position={[-9.6, 4.8, 4.5]} intensity={18} distance={14} decay={1.2} color="#e8f1ff" />
      <pointLight position={[9.6, 4.8, 4.5]} intensity={18} distance={14} decay={1.2} color="#e8f1ff" />
    </group>
  );
};
