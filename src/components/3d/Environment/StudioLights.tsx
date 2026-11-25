import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { soundFx } from '../../../hooks/useAudio';
import { useHeritageStore } from '../../../store/useHeritageStore';

const HALL_DOWNLIGHTS: Array<{ pos: [number, number, number]; color: string }> = [
  { pos: [-10, 6.15, -13], color: '#38bdf8' },
  { pos: [0, 6.15, -13], color: '#7dd3fc' },
  { pos: [10, 6.15, -13], color: '#a855f7' },
  { pos: [-10, 6.15, -5], color: '#a855f7' },
  { pos: [0, 6.15, -5], color: '#fde68a' },
  { pos: [10, 6.15, -5], color: '#38bdf8' },
  { pos: [-10, 6.15, 3], color: '#38bdf8' },
  { pos: [0, 6.15, 3], color: '#818cf8' },
  { pos: [10, 6.15, 3], color: '#38bdf8' },
];

const TUNNEL_STATIONS: Array<{ z: number; color: string; maxIntensity: number }> = [
  { z: 24.5, color: '#00F0FF', maxIntensity: 14.5 },
  { z: 20.5, color: '#a855f7', maxIntensity: 14.5 },
  { z: 16.5, color: '#38bdf8', maxIntensity: 15.0 },
  { z: 12.5, color: '#fbbf24', maxIntensity: 15.5 },
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

  // Superstar walkout sequential tunnel lights + grand hall reveal refs
  const tunnelLightRefs = useRef<Array<THREE.PointLight | null>>([]);
  const tunnelLevelRefs = useRef<number[]>([0.28, 0, 0, 0]);
  const tunnelSurgeRefs = useRef<number[]>([0, 0, 0, 0]);
  const tunnelIgnitedRefs = useRef<boolean[]>([false, false, false, false]);
  const hallRevealRef = useRef<number>(0.24);
  const hallIgnitedRef = useRef<boolean>(false);

  const hallDownlightRefs = useRef<Array<THREE.PointLight | null>>([]);
  const centerWallSpotRef = useRef<THREE.SpotLight>(null);
  const islandGoldSpotRef = useRef<THREE.SpotLight>(null);
  const islandRimSpotRef = useRef<THREE.SpotLight>(null);
  const islandCrownGlowRef = useRef<THREE.PointLight>(null);
  const islandCyanPulseRef = useRef<THREE.PointLight>(null);
  const portalBeaconRef = useRef<THREE.PointLight>(null);
  const screenGlowRef = useRef<THREE.PointLight>(null);
  const shirtRimRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const playerZ = state.camera.position.z;
    const hasEntered = useHeritageStore.getState().hasEntered;
    const isCinemaActive = useHeritageStore.getState().isCenterWallCinemaActive;

    // Reset walkout ignition triggers when user returns to tunnel start so replay always feels epic
    if (playerZ > 24.9) {
      for (let i = 1; i < TUNNEL_STATIONS.length; i++) {
        tunnelIgnitedRefs.current[i] = false;
      }
      hallIgnitedRef.current = false;
    }

    // 1. Sequential Superstar Walkout Tunnel Lights (ignite dramatically one-by-one as player walks forward)
    TUNNEL_STATIONS.forEach((st, idx) => {
      const light = tunnelLightRefs.current[idx];
      if (!light) return;

      const triggerZ = idx === 0 ? 25.35 : st.z + 3.2;
      const trailZ = st.z - 7.0;

      let target = 0.03; // Dark dramatic tunnel ahead
      if (idx === 0 && playerZ > triggerZ) {
        // Gentle moody standby silhouette right at spawn before first step
        target = 0.28;
      } else if (playerZ <= triggerZ && playerZ >= trailZ) {
        target = 1.0;
        if (!tunnelIgnitedRefs.current[idx] && hasEntered) {
          tunnelIgnitedRefs.current[idx] = true;
          tunnelSurgeRefs.current[idx] = 0.45; // Brief stadium floodlight power-up flash
          soundFx.playLightIgnite(idx);
        }
      } else if (playerZ < trailZ) {
        // Soft dim glow trailing behind the superstar walkout
        target = 0.25;
      }

      const speed = target > tunnelLevelRefs.current[idx] ? 5.8 : 2.6;
      tunnelLevelRefs.current[idx] = THREE.MathUtils.lerp(
        tunnelLevelRefs.current[idx],
        target,
        1 - Math.exp(-speed * dt)
      );
      tunnelSurgeRefs.current[idx] = THREE.MathUtils.lerp(
        tunnelSurgeRefs.current[idx],
        0,
        1 - Math.exp(-5.0 * dt)
      );

      light.intensity =
        st.maxIntensity * (tunnelLevelRefs.current[idx] + tunnelSurgeRefs.current[idx]);
    });

    // 2. Threshold Portal & Main Hall Grand Reveal when exiting tunnel (z <= 11.4)
    const hallTriggered = playerZ <= 11.4;
    if (hallTriggered && !hallIgnitedRef.current && hasEntered) {
      hallIgnitedRef.current = true;
      // Only play grand hall reveal if walking out of tunnel (not on distant instant load)
      if (playerZ > 4.0) {
        soundFx.playHallReveal();
      }
    }

    const targetHallReveal = isCinemaActive ? 0.28 : hallTriggered ? 1.0 : 0.24;
    const hallRampSpeed = hallTriggered ? 2.4 : 1.8;
    hallRevealRef.current = THREE.MathUtils.lerp(
      hallRevealRef.current,
      targetHallReveal,
      1 - Math.exp(-hallRampSpeed * dt)
    );
    const hr = hallRevealRef.current;

    if (portalBeaconRef.current) {
      const portalTarget = playerZ <= 12.2 ? 15 + Math.sin(t * 1.4) * 3.5 : 1.8;
      portalBeaconRef.current.intensity = THREE.MathUtils.lerp(
        portalBeaconRef.current.intensity,
        portalTarget,
        1 - Math.exp(-4.5 * dt)
      );
    }

    hallDownlightRefs.current.forEach((dl) => {
      if (dl) {
        dl.intensity = 3.2 * hr;
      }
    });

    if (centerWallSpotRef.current) {
      // Turn down direct front spotlight over the OLED TV screen so colors stay rich & glare-free
      centerWallSpotRef.current.intensity = isCinemaActive ? 6 : 58 * hr;
    }
    if (islandGoldSpotRef.current) {
      islandGoldSpotRef.current.intensity = 72 * hr;
    }
    if (islandRimSpotRef.current) {
      islandRimSpotRef.current.intensity = 38 * hr;
    }
    if (islandCrownGlowRef.current) {
      islandCrownGlowRef.current.intensity = (13.5 + Math.sin(t * 1.3) * 2.5) * hr;
    }
    if (islandCyanPulseRef.current) {
      islandCyanPulseRef.current.intensity = (8.5 + Math.sin(t * 1.5) * 2.8) * hr;
    }
    if (screenGlowRef.current) {
      screenGlowRef.current.intensity = (11 + Math.sin(t * 1.8 + 0.5) * 3.0) * hr;
    }
    if (shirtRimRef.current) {
      shirtRimRef.current.intensity = (10 + Math.sin(t * 1.5 + 2.0) * 2.8) * hr;
    }
  });

  return (
    <group>
      {/* Overhead Luxury Gallery Reflection Rig (bright gold/crystal specular highlights on metals & glass) */}
      <Environment resolution={256} frames={1} environmentIntensity={0.62}>
        <Lightformer
          form="circle"
          intensity={1.35}
          color="#e0f2fe"
          position={[0, 11, -5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[14, 14, 1]}
        />
        <Lightformer
          form="ring"
          intensity={2.2}
          color="#ffe4a1"
          position={[0, 8.8, -5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[5.5, 5.5, 1]}
        />
        <Lightformer
          form="circle"
          intensity={1.1}
          color="#fef3c7"
          position={[6, 7.5, -2]}
          rotation={[Math.PI / 3, -Math.PI / 4, 0]}
          scale={[4.5, 4.5, 1]}
        />
        <Lightformer
          form="circle"
          intensity={1.0}
          color="#bae6fd"
          position={[-6, 7.5, -8]}
          rotation={[Math.PI / 3, Math.PI / 4, 0]}
          scale={[4.5, 4.5, 1]}
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
      <primitive object={valuesTarget.current} position={[11.75, 3.25, -18.4]} />
      <primitive object={centralIslandTarget.current} position={[0, 1.5, -5]} />
      <primitive object={shirtTarget.current} position={[13.8, 2.0, -10.4]} />
      <primitive object={timelineTarget.current} position={[-16.4, 3.2, -5.9]} />
      <primitive object={activitiesTarget.current} position={[-16.4, 3.2, 4.1]} />
      <primitive object={interactiveTarget.current} position={[-11.75, 3.25, -17.8]} />
      <primitive object={partnersTarget.current} position={[-12.6, 3.1, 8.05]} />
      <primitive object={testimonialsTarget.current} position={[9.6, 3.1, 8.05]} />

      {/* 1. Moody Architectural Low-Key Fill so spotlight reveals feel dramatic */}
      <hemisphereLight color="#38bdf8" groundColor="#040711" intensity={0.24} />
      <ambientLight color="#0a1222" intensity={0.12} />
      <directionalLight
        position={[4, 14, 8]}
        intensity={0.24}
        color="#dbeafe"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* 2. Entrance Tunnel: Superstar Walkout Sequential Stations (ignite dynamically on approach) */}
      {TUNNEL_STATIONS.map((st, idx) => (
        <pointLight
          key={`tunnel-station-${st.z}`}
          ref={(el) => {
            tunnelLightRefs.current[idx] = el;
          }}
          position={[0, 4.55, st.z]}
          intensity={idx === 0 ? 4.0 : 0.3}
          distance={8.2}
          decay={2}
          color={st.color}
        />
      ))}
      <pointLight
        ref={portalBeaconRef}
        position={[0, 4.9, 8.8]}
        intensity={1.8}
        distance={9.5}
        decay={2}
        color="#00F0FF"
      />

      {/* 3. Subtle Ambient Aisle Markers (swell smoothly on hall reveal) */}
      {HALL_DOWNLIGHTS.map((dl, idx) => (
        <pointLight
          key={`hall-downlight-${idx}`}
          ref={(el) => {
            hallDownlightRefs.current[idx] = el;
          }}
          position={dl.pos}
          intensity={1.0}
          distance={9.5}
          decay={2}
          color={dl.color}
        />
      ))}

      {/* 4. Center Wall Stage: Crisp Hero Beam + Cyan/Violet Neon Flanking Washes */}
      <spotLight
        ref={centerWallSpotRef}
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
        intensity={26}
        distance={18}
        decay={1.8}
        angle={0.62}
        penumbra={0.7}
        color="#00F0FF"
      />
      <spotLight
        position={[6.8, 5.8, -12.0]}
        target={centerWallTarget.current}
        intensity={22}
        distance={18}
        decay={1.8}
        angle={0.62}
        penumbra={0.7}
        color="#a855f7"
      />
      <spotLight
        position={[11.75, 5.8, -12.5]}
        target={valuesTarget.current}
        intensity={42}
        distance={16}
        decay={1.8}
        angle={0.66}
        penumbra={0.62}
        color="#c084fc"
      />

      {/* 5. Central Sovereign Island 360°: Royal 3-Point Champagne-Gold Key + Crisp Rim + Crown Uplight */}
      <spotLight
        ref={islandGoldSpotRef}
        position={[0, 6.25, -4.4]}
        target={centralIslandTarget.current}
        intensity={72}
        distance={17}
        decay={1.55}
        angle={0.72}
        penumbra={0.52}
        color="#ffe29e"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00035}
        shadow-normalBias={0.02}
      />
      <spotLight
        ref={islandRimSpotRef}
        position={[-3.4, 5.85, -8.6]}
        target={centralIslandTarget.current}
        intensity={38}
        distance={16}
        decay={1.7}
        angle={0.62}
        penumbra={0.55}
        color="#e0f2fe"
      />
      <pointLight
        ref={islandCrownGlowRef}
        position={[0, 2.55, -5]}
        intensity={13.5}
        distance={9.5}
        decay={2}
        color="#fbbf24"
      />
      <pointLight
        ref={islandCyanPulseRef}
        position={[0, 1.05, -5]}
        intensity={8.5}
        distance={9.0}
        decay={2}
        color="#00F0FF"
      />

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

      {/* 8. Interactive Corner (Left Wing): Dynamic Neon Events Display + Guestbook Pool */}
      <spotLight
        position={[-11.75, 5.9, -12.2]}
        target={interactiveTarget.current}
        intensity={36}
        distance={16}
        decay={1.8}
        angle={0.66}
        penumbra={0.58}
        color="#7dd3fc"
      />
      <pointLight
        ref={screenGlowRef}
        position={[-11.75, 3.2, -14.6]}
        intensity={11}
        distance={9}
        decay={2}
        color="#00F0FF"
      />

      {/* 9. Front Inner Wall Boards: Partners & Testimonials */}
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
