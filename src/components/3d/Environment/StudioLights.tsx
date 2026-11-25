import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { soundFx } from '../../../hooks/useAudio';
import { useHeritageStore } from '../../../store/useHeritageStore';

const HALL_DOWNLIGHTS: Array<{ pos: [number, number, number]; color: string; baseIntensity: number }> = [
  { pos: [-10, 6.15, -13], color: '#00F0FF', baseIntensity: 4.8 },
  { pos: [0, 6.15, -13], color: '#7dd3fc', baseIntensity: 4.4 },
  { pos: [10, 6.15, -13], color: '#a855f7', baseIntensity: 4.8 },
  { pos: [-10, 6.15, -5], color: '#a855f7', baseIntensity: 4.6 },
  { pos: [0, 6.15, -5], color: '#fde68a', baseIntensity: 5.2 },
  { pos: [10, 6.15, -5], color: '#00F0FF', baseIntensity: 4.6 },
  { pos: [-10, 6.15, 3], color: '#38bdf8', baseIntensity: 4.4 },
  { pos: [0, 6.15, 3], color: '#818cf8', baseIntensity: 4.2 },
  { pos: [10, 6.15, 3], color: '#00F0FF', baseIntensity: 4.4 },
];

const TUNNEL_STATIONS: Array<{
  z: number;
  color: string;
  maxSpotIntensity: number;
  maxFillIntensity: number;
}> = [
  { z: 24.5, color: '#00F0FF', maxSpotIntensity: 56, maxFillIntensity: 18 },
  { z: 20.5, color: '#a855f7', maxSpotIntensity: 58, maxFillIntensity: 19 },
  { z: 16.5, color: '#00F0FF', maxSpotIntensity: 62, maxFillIntensity: 20 },
  { z: 12.5, color: '#c084fc', maxSpotIntensity: 66, maxFillIntensity: 22 },
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
  const tunnelTargets = useRef<THREE.Object3D[]>([
    new THREE.Object3D(),
    new THREE.Object3D(),
    new THREE.Object3D(),
    new THREE.Object3D(),
  ]);
  const portalFloorTarget = useRef<THREE.Object3D>(new THREE.Object3D());

  // Powerful sequential stadium walkout tunnel lights + grand hall reveal refs
  const tunnelSpotRefs = useRef<Array<THREE.SpotLight | null>>([]);
  const tunnelFillRefs = useRef<Array<THREE.PointLight | null>>([]);
  const tunnelLevelRefs = useRef<number[]>([0.24, 0, 0, 0]);
  const tunnelSurgeRefs = useRef<number[]>([0, 0, 0, 0]);
  const tunnelIgnitedRefs = useRef<boolean[]>([false, false, false, false]);
  const hallRevealRef = useRef<number>(0.24);
  const hallIgnitedRef = useRef<boolean>(false);

  const hallDownlightRefs = useRef<Array<THREE.PointLight | null>>([]);
  const centerWallSpotRef = useRef<THREE.SpotLight>(null);
  const centerCyanWashRef = useRef<THREE.SpotLight>(null);
  const centerVioletWashRef = useRef<THREE.SpotLight>(null);
  const islandGoldSpotRef = useRef<THREE.SpotLight>(null);
  const islandRimSpotRef = useRef<THREE.SpotLight>(null);
  const islandCrownGlowRef = useRef<THREE.PointLight>(null);
  const islandCyanPulseRef = useRef<THREE.PointLight>(null);
  const portalSpotRef = useRef<THREE.SpotLight>(null);
  const portalBeaconRef = useRef<THREE.PointLight>(null);
  const screenGlowRef = useRef<THREE.PointLight>(null);
  const shirtRimRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const playerZ = state.camera.position.z;
    const { hasEntered, isCenterWallCinemaActive: isCinemaActive } = useHeritageStore.getState();

    // Reset walkout ignition triggers when user returns to tunnel start
    if (playerZ > 24.9) {
      for (let i = 1; i < TUNNEL_STATIONS.length; i++) {
        tunnelIgnitedRefs.current[i] = false;
      }
      hallIgnitedRef.current = false;
    }

    // 1. Powerful Stadium Walkout Tunnel Spotlights & Flood Fills
    TUNNEL_STATIONS.forEach((st, idx) => {
      const spot = tunnelSpotRefs.current[idx];
      const fill = tunnelFillRefs.current[idx];
      if (!spot && !fill) return;

      const triggerZ = idx === 0 ? 25.4 : st.z + 3.6;
      const trailZ = st.z - 7.4;

      let target = 0.02;
      if (idx === 0 && playerZ > triggerZ) {
        target = 0.24;
      } else if (playerZ <= triggerZ && playerZ >= trailZ) {
        target = 1.0;
        if (!tunnelIgnitedRefs.current[idx] && hasEntered) {
          tunnelIgnitedRefs.current[idx] = true;
          tunnelSurgeRefs.current[idx] = 0.72; // Strong stadium floodlight ignition flash!
          soundFx.playLightIgnite(idx);
        }
      } else if (playerZ < trailZ) {
        target = 0.22;
      }

      const speed = target > tunnelLevelRefs.current[idx] ? 7.2 : 2.8;
      tunnelLevelRefs.current[idx] = THREE.MathUtils.lerp(
        tunnelLevelRefs.current[idx],
        target,
        1 - Math.exp(-speed * dt)
      );
      tunnelSurgeRefs.current[idx] = THREE.MathUtils.lerp(
        tunnelSurgeRefs.current[idx],
        0,
        1 - Math.exp(-4.2 * dt)
      );

      const power = tunnelLevelRefs.current[idx] + tunnelSurgeRefs.current[idx];
      if (spot) spot.intensity = st.maxSpotIntensity * power;
      if (fill) fill.intensity = st.maxFillIntensity * power;
    });

    // 2. Threshold Portal Floodlight & Main Hall Grand Reveal
    const hallTriggered = playerZ <= 11.6;
    if (hallTriggered && !hallIgnitedRef.current && hasEntered) {
      hallIgnitedRef.current = true;
      if (playerZ > 4.0) {
        soundFx.playHallReveal();
      }
    }

    const targetHallReveal = isCinemaActive ? 0.26 : hallTriggered ? 1.0 : 0.22;
    const hallRampSpeed = hallTriggered ? 2.8 : 1.9;
    hallRevealRef.current = THREE.MathUtils.lerp(
      hallRevealRef.current,
      targetHallReveal,
      1 - Math.exp(-hallRampSpeed * dt)
    );
    const hr = hallRevealRef.current;

    if (portalSpotRef.current) {
      const portalSpotTarget = playerZ <= 12.6 && !isCinemaActive ? 58 + Math.sin(t * 1.6) * 8 : 3.5;
      portalSpotRef.current.intensity = THREE.MathUtils.lerp(
        portalSpotRef.current.intensity,
        portalSpotTarget,
        1 - Math.exp(-5.0 * dt)
      );
    }

    if (portalBeaconRef.current) {
      const portalTarget = playerZ <= 12.6 && !isCinemaActive ? 20 + Math.sin(t * 1.5) * 4.5 : 2.0;
      portalBeaconRef.current.intensity = THREE.MathUtils.lerp(
        portalBeaconRef.current.intensity,
        portalTarget,
        1 - Math.exp(-4.8 * dt)
      );
    }

    // Organic living neon breathing across the 9 hall aisle lights (exact existing color scheme)
    hallDownlightRefs.current.forEach((dl, idx) => {
      if (!dl) return;
      const cfg = HALL_DOWNLIGHTS[idx];
      const breathe = 1 + Math.sin(t * (0.95 + idx * 0.13) + idx * 1.1) * 0.14;
      dl.intensity = cfg.baseIntensity * breathe * hr;
    });

    if (centerWallSpotRef.current) {
      centerWallSpotRef.current.intensity = isCinemaActive ? 6 : 62 * hr;
    }
    if (centerCyanWashRef.current) {
      const wave = 1 + Math.sin(t * 1.15) * 0.16;
      centerCyanWashRef.current.intensity = (isCinemaActive ? 8 : 36 * wave) * hr;
    }
    if (centerVioletWashRef.current) {
      const wave = 1 + Math.cos(t * 1.05 + 0.7) * 0.16;
      centerVioletWashRef.current.intensity = (isCinemaActive ? 8 : 34 * wave) * hr;
    }
    if (islandGoldSpotRef.current) {
      islandGoldSpotRef.current.intensity = (76 + Math.sin(t * 0.9) * 5) * hr;
    }
    if (islandRimSpotRef.current) {
      islandRimSpotRef.current.intensity = (42 + Math.cos(t * 1.1) * 4) * hr;
    }
    if (islandCrownGlowRef.current) {
      islandCrownGlowRef.current.intensity = (16 + Math.sin(t * 1.35) * 3.2) * hr;
    }
    if (islandCyanPulseRef.current) {
      islandCyanPulseRef.current.intensity = (12.5 + Math.sin(t * 1.65 + 0.4) * 3.8) * hr;
    }
    if (screenGlowRef.current) {
      screenGlowRef.current.intensity = (14.5 + Math.sin(t * 1.7 + 0.5) * 3.5) * hr;
    }
    if (shirtRimRef.current) {
      shirtRimRef.current.intensity = (13.5 + Math.sin(t * 1.45 + 2.0) * 3.4) * hr;
    }
  });

  return (
    <group>
      {/* Crisp Overhead Neon & Royal Gold Gallery Reflection Rig (no harsh wall-level slabs) */}
      <Environment resolution={256} frames={1} environmentIntensity={0.78}>
        {/* Primary overhead cool-cyan skylight reflection */}
        <Lightformer
          form="circle"
          intensity={1.6}
          color="#bae6fd"
          position={[0, 11, -5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[15, 15, 1]}
        />
        {/* Royal gold halo reflection directly over Central Island */}
        <Lightformer
          form="ring"
          intensity={2.6}
          color="#ffe49e"
          position={[0, 8.8, -5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[5.8, 5.8, 1]}
        />
        {/* Vivid Cyan & Violet Overhead Neon Reflection Strips (give metals & glass authentic neon sheen!) */}
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#00F0FF"
          position={[0, 9.2, -12]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[22, 0.7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#a855f7"
          position={[0, 9.2, -7]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[22, 0.7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#00F0FF"
          position={[0, 9.2, -2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[22, 0.7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.0}
          color="#a855f7"
          position={[0, 9.2, 3]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[22, 0.7, 1]}
        />
        <Lightformer
          form="circle"
          intensity={1.2}
          color="#7dd3fc"
          position={[0, 10, 16]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.22}
          color="#060c1a"
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
      <primitive object={portalFloorTarget.current} position={[0, 0.4, 8.5]} />
      {TUNNEL_STATIONS.map((st, idx) => (
        <primitive key={`tunnel-target-${st.z}`} object={tunnelTargets.current[idx]} position={[0, 0.2, st.z]} />
      ))}

      {/* 1. Deep Low-Key Cosmic Fill so vibrant neon & spotlights pop dramatically */}
      <hemisphereLight color="#38bdf8" groundColor="#03060f" intensity={0.22} />
      <ambientLight color="#081020" intensity={0.11} />
      <directionalLight
        position={[4, 14, 8]}
        intensity={0.22}
        color="#dbeafe"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* 2. Entrance Tunnel: Powerful Stadium Walkout Overhead Spotlights + Neon Pools */}
      {TUNNEL_STATIONS.map((st, idx) => (
        <group key={`tunnel-station-${st.z}`}>
          <spotLight
            ref={(el) => {
              tunnelSpotRefs.current[idx] = el;
            }}
            position={[0, 6.08, st.z + 0.5]}
            target={tunnelTargets.current[idx]}
            intensity={idx === 0 ? 12 : 0.4}
            distance={12.5}
            decay={1.6}
            angle={0.76}
            penumbra={0.5}
            color={st.color}
          />
          <pointLight
            ref={(el) => {
              tunnelFillRefs.current[idx] = el;
            }}
            position={[0, 3.8, st.z]}
            intensity={idx === 0 ? 4.5 : 0.2}
            distance={8.8}
            decay={2}
            color={st.color}
          />
        </group>
      ))}
      <spotLight
        ref={portalSpotRef}
        position={[0, 6.1, 9.8]}
        target={portalFloorTarget.current}
        intensity={3.5}
        distance={14}
        decay={1.6}
        angle={0.82}
        penumbra={0.55}
        color="#00F0FF"
      />
      <pointLight
        ref={portalBeaconRef}
        position={[0, 4.6, 8.6]}
        intensity={2.0}
        distance={11}
        decay={2}
        color="#00F0FF"
      />

      {/* 3. Living Breathing Neon Aisle Lights */}
      {HALL_DOWNLIGHTS.map((dl, idx) => (
        <pointLight
          key={`hall-downlight-${idx}`}
          ref={(el) => {
            hallDownlightRefs.current[idx] = el;
          }}
          position={dl.pos}
          intensity={dl.baseIntensity}
          distance={11.5}
          decay={2}
          color={dl.color}
        />
      ))}

      {/* 4. Center Wall Stage: Crisp Hero Beam + Vivid Breathing Cyan/Violet Neon Flanking Washes */}
      <spotLight
        ref={centerWallSpotRef}
        position={[0, 5.9, -11.2]}
        target={centerWallTarget.current}
        intensity={62}
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
        ref={centerCyanWashRef}
        position={[-6.8, 5.8, -12.0]}
        target={centerWallTarget.current}
        intensity={36}
        distance={19}
        decay={1.7}
        angle={0.66}
        penumbra={0.68}
        color="#00F0FF"
      />
      <spotLight
        ref={centerVioletWashRef}
        position={[6.8, 5.8, -12.0]}
        target={centerWallTarget.current}
        intensity={34}
        distance={19}
        decay={1.7}
        angle={0.66}
        penumbra={0.68}
        color="#a855f7"
      />
      <spotLight
        position={[11.75, 5.8, -12.5]}
        target={valuesTarget.current}
        intensity={46}
        distance={17}
        decay={1.75}
        angle={0.68}
        penumbra={0.6}
        color="#c084fc"
      />

      {/* 5. Central Sovereign Island 360°: Royal Champagne-Gold Key + Crisp Rim + Vivid Neon Pulse */}
      <spotLight
        ref={islandGoldSpotRef}
        position={[0, 6.25, -4.4]}
        target={centralIslandTarget.current}
        intensity={76}
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
        intensity={42}
        distance={16}
        decay={1.65}
        angle={0.64}
        penumbra={0.54}
        color="#7dd3fc"
      />
      <pointLight
        ref={islandCrownGlowRef}
        position={[0, 2.55, -5]}
        intensity={16}
        distance={10.5}
        decay={2}
        color="#fbbf24"
      />
      <pointLight
        ref={islandCyanPulseRef}
        position={[0, 1.05, -5]}
        intensity={12.5}
        distance={10.0}
        decay={2}
        color="#00F0FF"
      />

      {/* 6. Left Wall Exhibits: Electric Cyan Timeline + Vivid Neon Magenta Activities */}
      <spotLight
        position={[-9.5, 5.9, -6]}
        target={timelineTarget.current}
        intensity={50}
        distance={17}
        decay={1.65}
        angle={0.7}
        penumbra={0.58}
        color="#00F0FF"
        castShadow
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <spotLight
        position={[-9.5, 5.9, 3.6]}
        target={activitiesTarget.current}
        intensity={48}
        distance={17}
        decay={1.65}
        angle={0.7}
        penumbra={0.6}
        color="#d946ef"
      />

      {/* 7. Right Wall Exhibits: Couture Club Shirt + Vivid Electric Cyan/Cobalt Academics */}
      <spotLight
        position={[9.2, 6.0, -9.2]}
        target={shirtTarget.current}
        intensity={52}
        distance={16}
        decay={1.65}
        angle={0.6}
        penumbra={0.52}
        color="#e0f7ff"
        castShadow
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <pointLight
        ref={shirtRimRef}
        position={[14.8, 3.2, -10.4]}
        intensity={13.5}
        distance={8.5}
        decay={2}
        color="#00F0FF"
      />
      <pointLight position={[14.2, 3.6, -4.2]} intensity={17} distance={10} decay={2} color="#38bdf8" />
      <pointLight position={[14.2, 3.6, 3.8]} intensity={17} distance={10} decay={2} color="#818cf8" />

      {/* 8. Interactive Corner (Left Wing): Dynamic Neon Events Display + Guestbook Pool */}
      <spotLight
        position={[-11.75, 5.9, -12.2]}
        target={interactiveTarget.current}
        intensity={42}
        distance={16}
        decay={1.75}
        angle={0.68}
        penumbra={0.58}
        color="#38bdf8"
      />
      <pointLight
        ref={screenGlowRef}
        position={[-11.75, 3.2, -14.6]}
        intensity={14.5}
        distance={10}
        decay={2}
        color="#00F0FF"
      />

      {/* 9. Front Inner Wall Boards: Partners & Testimonials */}
      <spotLight
        position={[-12.6, 5.6, 2.2]}
        target={partnersTarget.current}
        intensity={40}
        distance={15}
        decay={1.75}
        angle={0.66}
        penumbra={0.6}
        color="#00F0FF"
      />
      <spotLight
        position={[9.6, 5.6, 2.2]}
        target={testimonialsTarget.current}
        intensity={40}
        distance={15}
        decay={1.75}
        angle={0.66}
        penumbra={0.6}
        color="#60a5fa"
      />
    </group>
  );
};
