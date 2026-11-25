import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

const HALL_DOWNLIGHTS: Array<{ pos: [number, number, number]; color: string }> = [
  { pos: [-10, 6.15, -13], color: '#38bdf8' },
  { pos: [0, 6.15, -13], color: '#7dd3fc' },
  { pos: [10, 6.15, -13], color: '#a855f7' },
  { pos: [-10, 6.15, -5], color: '#a855f7' },
  { pos: [0, 6.15, -5], color: '#e0f2fe' },
  { pos: [10, 6.15, -5], color: '#38bdf8' },
  { pos: [-10, 6.15, 3], color: '#38bdf8' },
  { pos: [0, 6.15, 3], color: '#818cf8' },
  { pos: [10, 6.15, 3], color: '#38bdf8' },
];

const TUNNEL_STATIONS: Array<{ z: number; color: string }> = [
  { z: 24.5, color: '#00F0FF' },
  { z: 20.5, color: '#a855f7' },
  { z: 16.5, color: '#38bdf8' },
  { z: 12.5, color: '#ec4899' },
];

export const StudioLights: React.FC = () => {
  const centerWallTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const valuesTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const centralIslandTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const shirtTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const timelineTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const activitiesTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const interactiveTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const partnersTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const testimonialsTarget = useRef<THREE.Object3D>(new THREE.Object3D());

  // Animated neon accent lights for living museum depth
  const islandCyanPulseRef = useRef<THREE.PointLight>(null);
  const portalBeaconRef = useRef<THREE.PointLight>(null);
  const screenGlowRef = useRef<THREE.PointLight>(null);
  const shirtRimRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (islandCyanPulseRef.current) {
      islandCyanPulseRef.current.intensity = 9 + Math.sin(t * 1.4) * 3.2;
    }
    if (portalBeaconRef.current) {
      portalBeaconRef.current.intensity = 12 + Math.sin(t * 1.1 + 1.0) * 3.5;
    }
    if (screenGlowRef.current) {
      screenGlowRef.current.intensity = 11 + Math.sin(t * 1.8 + 0.5) * 3.0;
    }
    if (shirtRimRef.current) {
      shirtRimRef.current.intensity = 10 + Math.sin(t * 1.5 + 2.0) * 2.8;
    }
  });

  return (
    <group>
      {/* Soft Overhead Gallery Reflection Rig (no harsh wall-level rectangular Lightformer slabs on the floor) */}
      <Environment resolution={256} frames={1} environmentIntensity={0.48}>
        <Lightformer
          form="circle"
          intensity={1.15}
          color="#bae6fd"
          position={[0, 11, -5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[14, 14, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.4}
          color="#fde68a"
          position={[0, 9.5, -5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[5, 5, 1]}
        />
        <Lightformer
          form="circle"
          intensity={0.95}
          color="#7dd3fc"
          position={[0, 10, 15]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.28}
          color="#091020"
          position={[0, -5, -4]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[34, 34, 1]}
        />
      </Environment>

      {/* Aimed Spotlight Targets */}
      <primitive object={centerWallTarget.current} position={[0, 3.2, -18.4]} />
      <primitive object={valuesTarget.current} position={[-11.3, 3.25, -18.4]} />
      <primitive object={centralIslandTarget.current} position={[0, 1.0, -5]} />
      <primitive object={shirtTarget.current} position={[13.8, 2.0, -10.4]} />
      <primitive object={timelineTarget.current} position={[-16.4, 3.2, -6]} />
      <primitive object={activitiesTarget.current} position={[-16.4, 3.2, 3.6]} />
      <primitive object={interactiveTarget.current} position={[11.4, 3.2, -17.8]} />
      <primitive object={partnersTarget.current} position={[-12.6, 3.1, 8.05]} />
      <primitive object={testimonialsTarget.current} position={[9.6, 3.1, 8.05]} />

      {/* 1. Moody Architectural Low-Key Fill so lighted zones pop against darker corridors */}
      <hemisphereLight color="#38bdf8" groundColor="#040711" intensity={0.28} />
      <ambientLight color="#0a1222" intensity={0.14} />
      <directionalLight
        position={[4, 14, 8]}
        intensity={0.22}
        color="#c7dcff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* 2. Entrance Tunnel: Localized Cyan & Violet Pools with shadow contrast between stations */}
      {TUNNEL_STATIONS.map((st) => (
        <pointLight
          key={`tunnel-station-${st.z}`}
          position={[0, 4.4, st.z]}
          intensity={10.5}
          distance={7.0}
          decay={2}
          color={st.color}
        />
      ))}
      <pointLight
        ref={portalBeaconRef}
        position={[0, 4.9, 8.8]}
        intensity={12}
        distance={8.5}
        decay={2}
        color="#00F0FF"
      />

      {/* 3. Subtle Ambient Aisle Markers (tight decay=2 keeps open corridors moody & contrasting) */}
      {HALL_DOWNLIGHTS.map((dl, idx) => (
        <pointLight
          key={`hall-downlight-${idx}`}
          position={dl.pos}
          intensity={3.0}
          distance={9.5}
          decay={2}
          color={dl.color}
        />
      ))}

      {/* 4. Center Wall Stage: Crisp Hero Beam + Cyan/Violet Neon Flanking Washes */}
      <spotLight
        position={[0, 5.9, -11.2]}
        target={centerWallTarget.current}
        intensity={58}
        distance={20}
        decay={1.7}
        angle={0.72}
        penumbra={0.55}
        color="#e0f7ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <spotLight
        position={[-6.8, 5.8, -12.0]}
        target={centerWallTarget.current}
        intensity={28}
        distance={18}
        decay={1.8}
        angle={0.62}
        penumbra={0.7}
        color="#00F0FF"
      />
      <spotLight
        position={[6.8, 5.8, -12.0]}
        target={centerWallTarget.current}
        intensity={24}
        distance={18}
        decay={1.8}
        angle={0.62}
        penumbra={0.7}
        color="#a855f7"
      />
      <spotLight
        position={[-11.3, 5.8, -12.5]}
        target={valuesTarget.current}
        intensity={38}
        distance={16}
        decay={1.8}
        angle={0.62}
        penumbra={0.62}
        color="#c084fc"
      />

      {/* 5. Central Island 360°: Dramatic Warm Gold Key + Animated Cyan Under-Glow */}
      <spotLight
        position={[0, 6.1, -5]}
        target={centralIslandTarget.current}
        intensity={52}
        distance={16}
        decay={1.7}
        angle={0.62}
        penumbra={0.52}
        color="#fde68a"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <pointLight
        ref={islandCyanPulseRef}
        position={[0, 2.2, -5]}
        intensity={9}
        distance={8.5}
        decay={2}
        color="#00F0FF"
      />
      <pointLight position={[0, 4.6, -5]} intensity={6.5} distance={7} decay={2} color="#a855f7" />

      {/* 6. Left Wall Exhibits: Cyan Timeline + Neon Magenta Activities */}
      <spotLight
        position={[-9.5, 5.9, -6]}
        target={timelineTarget.current}
        intensity={44}
        distance={16}
        decay={1.7}
        angle={0.68}
        penumbra={0.58}
        color="#67e8f9"
        castShadow
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <spotLight
        position={[-9.5, 5.9, 3.6]}
        target={activitiesTarget.current}
        intensity={42}
        distance={16}
        decay={1.7}
        angle={0.68}
        penumbra={0.6}
        color="#e879f9"
      />

      {/* 7. Right Wall Exhibits: Couture Club Shirt + Cobalt Academics */}
      <spotLight
        position={[9.2, 6.0, -9.2]}
        target={shirtTarget.current}
        intensity={48}
        distance={16}
        decay={1.7}
        angle={0.58}
        penumbra={0.52}
        color="#e0f7ff"
        castShadow
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <pointLight
        ref={shirtRimRef}
        position={[14.8, 3.2, -10.4]}
        intensity={10}
        distance={7.5}
        decay={2}
        color="#00F0FF"
      />
      <pointLight position={[14.2, 3.6, -4.2]} intensity={14} distance={9} decay={2} color="#38bdf8" />
      <pointLight position={[14.2, 3.6, 3.8]} intensity={14} distance={9} decay={2} color="#60a5fa" />

      {/* 8. Interactive Corner: Dynamic Neon Display Wash + Focused Guestbook Pool */}
      <spotLight
        position={[11.4, 5.9, -12.2]}
        target={interactiveTarget.current}
        intensity={34}
        distance={16}
        decay={1.8}
        angle={0.62}
        penumbra={0.58}
        color="#7dd3fc"
      />
      <pointLight
        ref={screenGlowRef}
        position={[11.4, 3.2, -14.6]}
        intensity={11}
        distance={9}
        decay={2}
        color="#00F0FF"
      />

      {/* 9. Front Inner Wall Boards: Partners & Testimonials (Department trees have their own stage spotlight rigs) */}
      <spotLight
        position={[-12.6, 5.6, 2.2]}
        target={partnersTarget.current}
        intensity={36}
        distance={14}
        decay={1.8}
        angle={0.65}
        penumbra={0.6}
        color="#38bdf8"
      />
      <spotLight
        position={[9.6, 5.6, 2.2]}
        target={testimonialsTarget.current}
        intensity={36}
        distance={14}
        decay={1.8}
        angle={0.65}
        penumbra={0.6}
        color="#60a5fa"
      />
    </group>
  );
};
