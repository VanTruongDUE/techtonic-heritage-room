import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { soundFx } from '../../../hooks/useAudio';
import { useHeritageStore } from '../../../store/useHeritageStore';

const TUNNEL_STATION_Z = [24.5, 20.5, 16.5, 12.5];
const TUNNEL_STATION_COLORS = [
  new THREE.Color('#00F5FF'),
  new THREE.Color('#b84dff'),
  new THREE.Color('#00F5FF'),
  new THREE.Color('#c864ff'),
];

/**
 * High-performance museum lighting rig (~11 total real-time lights vs 61 previously):
 * - Single Environment cubemap (128px, rendered once) with electric cyan, cyber-violet & royal gold Lightformers
 *   delivers crisp neon reflections across all brushed titanium, gold, glass & obsidian surfaces at zero per-frame cost.
 * - 1 dynamic traveling tunnel walkout light tracks the player's footsteps with ignition surges & SFX.
 * - 1 hero shadow map in 'high' quality (0 shadow maps in 'balanced' mode) for locked 60 FPS on laptops.
 */
export const StudioLights: React.FC = () => {
  const graphicsQuality = useHeritageStore((s) => s.graphicsQuality);
  const centerWallTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const centralIslandTarget = useRef<THREE.Object3D>(new THREE.Object3D());
  const shirtTarget = useRef<THREE.Object3D>(new THREE.Object3D());

  const tunnelLightRef = useRef<THREE.PointLight>(null);
  const tunnelIgnitedRefs = useRef<boolean[]>([false, false, false, false]);
  const tunnelSurgeRef = useRef<number>(0);

  const hallRevealRef = useRef<number>(0.3);
  const hallIgnitedRef = useRef<boolean>(false);

  const centerWallSpotRef = useRef<THREE.SpotLight>(null);
  const islandGoldSpotRef = useRef<THREE.SpotLight>(null);
  const islandCrownGlowRef = useRef<THREE.PointLight>(null);
  const hallCyanFillRef = useRef<THREE.PointLight>(null);
  const hallVioletFillRef = useRef<THREE.PointLight>(null);
  const shirtKeySpotRef = useRef<THREE.SpotLight>(null);
  const frontHallFillRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const playerZ = state.camera.position.z;
    const { hasEntered, isCenterWallCinemaActive: isCinemaActive } = useHeritageStore.getState();

    // Reset walkout ignition triggers when user returns to tunnel start
    if (playerZ > 24.9) {
      for (let i = 1; i < TUNNEL_STATION_Z.length; i++) {
        tunnelIgnitedRefs.current[i] = false;
      }
      hallIgnitedRef.current = false;
    }

    // 1. Dynamic Traveling Superstar Tunnel Walkout Light (replaces 8 static lights with 1!)
    let activeStation = -1;
    for (let i = 0; i < TUNNEL_STATION_Z.length; i++) {
      const sz = TUNNEL_STATION_Z[i];
      const triggerZ = i === 0 ? 25.4 : sz + 3.6;
      const trailZ = sz - 3.0;
      if (playerZ <= triggerZ && playerZ >= trailZ) {
        activeStation = i;
        if (!tunnelIgnitedRefs.current[i] && hasEntered) {
          tunnelIgnitedRefs.current[i] = true;
          tunnelSurgeRef.current = 1.0;
          soundFx.playLightIgnite(i);
        }
      }
    }

    tunnelSurgeRef.current = THREE.MathUtils.lerp(
      tunnelSurgeRef.current,
      0,
      1 - Math.exp(-4.5 * dt)
    );

    if (tunnelLightRef.current) {
      const inTunnel = playerZ > 8.6;
      const targetZ = THREE.MathUtils.clamp(playerZ - 1.2, 9.5, 25.2);
      tunnelLightRef.current.position.z = THREE.MathUtils.lerp(
        tunnelLightRef.current.position.z,
        targetZ,
        1 - Math.exp(-7 * dt)
      );

      const stationIdx = activeStation >= 0 ? activeStation : 0;
      tunnelLightRef.current.color.lerp(TUNNEL_STATION_COLORS[stationIdx], 1 - Math.exp(-6 * dt));

      const baseTunnelIntensity = inTunnel
        ? activeStation >= 0
          ? 28 + tunnelSurgeRef.current * 26
          : 12
        : 0;
      tunnelLightRef.current.intensity = THREE.MathUtils.lerp(
        tunnelLightRef.current.intensity,
        baseTunnelIntensity,
        1 - Math.exp(-6 * dt)
      );
    }

    // 2. Main Hall Grand Reveal
    const hallTriggered = playerZ <= 11.6;
    if (hallTriggered && !hallIgnitedRef.current && hasEntered) {
      hallIgnitedRef.current = true;
      if (playerZ > 4.0) {
        soundFx.playHallReveal();
      }
    }

    const targetHallReveal = isCinemaActive ? 0.25 : hallTriggered ? 1.0 : 0.26;
    hallRevealRef.current = THREE.MathUtils.lerp(
      hallRevealRef.current,
      targetHallReveal,
      1 - Math.exp(-(hallTriggered ? 3.0 : 2.0) * dt)
    );
    const hr = hallRevealRef.current;

    if (centerWallSpotRef.current) {
      centerWallSpotRef.current.intensity = isCinemaActive ? 6 : 68 * hr;
    }
    if (islandGoldSpotRef.current) {
      islandGoldSpotRef.current.intensity = (92 + Math.sin(t * 0.9) * 5) * hr;
    }
    if (islandCrownGlowRef.current) {
      islandCrownGlowRef.current.intensity = (24 + Math.sin(t * 1.35) * 3.5) * hr;
    }
    if (hallCyanFillRef.current) {
      hallCyanFillRef.current.intensity = (28 + Math.sin(t * 1.1) * 4.0) * hr;
    }
    if (hallVioletFillRef.current) {
      hallVioletFillRef.current.intensity = (27 + Math.cos(t * 1.0 + 0.6) * 4.0) * hr;
    }
    if (shirtKeySpotRef.current) {
      shirtKeySpotRef.current.intensity = 62 * hr;
    }
    if (frontHallFillRef.current) {
      frontHallFillRef.current.intensity = (22 + Math.sin(t * 1.25 + 1.0) * 3.0) * hr;
    }
  });

  return (
    <group>
      {/* Lightweight 128px IBL Environment Cubemap (rendered once, zero per-frame cost!) */}
      <Environment resolution={128} frames={1} environmentIntensity={1.1}>
        <Lightformer
          form="circle"
          intensity={2.0}
          color="#ccf9ff"
          position={[0, 11, -5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[16, 16, 1]}
        />
        <Lightformer
          form="ring"
          intensity={3.4}
          color="#ffe6a0"
          position={[0, 8.8, -5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[6.0, 6.0, 1]}
        />
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#00F5FF"
          position={[0, 9.2, -12]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[24, 0.85, 1]}
        />
        <Lightformer
          form="rect"
          intensity={3.0}
          color="#b84dff"
          position={[0, 9.2, -7]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[24, 0.85, 1]}
        />
        <Lightformer
          form="rect"
          intensity={3.0}
          color="#00F5FF"
          position={[0, 9.2, -2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[24, 0.85, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.8}
          color="#b84dff"
          position={[0, 9.2, 3]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[24, 0.85, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.14}
          color="#030712"
          position={[0, -5, -4]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[34, 34, 1]}
        />
      </Environment>

      {/* Aimed Spotlight Targets */}
      <primitive object={centerWallTarget.current} position={[0, 3.2, -18.4]} />
      <primitive object={centralIslandTarget.current} position={[0, 1.5, -5]} />
      <primitive object={shirtTarget.current} position={[13.8, 2.0, -10.4]} />

      {/* 1–3. Crisp Dark-Tech Interior Fill + Single Optional Hero Shadow Caster */}
      <hemisphereLight color="#84e8ff" groundColor="#060c1a" intensity={0.58} />
      <ambientLight color="#0e1c36" intensity={0.24} />
      <directionalLight
        position={[4, 14, 8]}
        intensity={0.42}
        color="#eaf6ff"
        castShadow={graphicsQuality === 'high'}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* 4. Dynamic Traveling Superstar Tunnel Walkout Light */}
      <pointLight
        ref={tunnelLightRef}
        position={[0, 4.4, 24.5]}
        intensity={12}
        distance={14}
        decay={1.6}
        color="#00F5FF"
      />

      {/* 5. Center Wall Stage Hero Key Spotlight */}
      <spotLight
        ref={centerWallSpotRef}
        position={[0, 5.9, -10.8]}
        target={centerWallTarget.current}
        intensity={68}
        distance={24}
        decay={1.55}
        angle={0.86}
        penumbra={0.88}
        color="#e8f6ff"
      />

      {/* 6–7. Central Sovereign Honor Island: Champagne-Gold Key + Center Crown Glow */}
      <spotLight
        ref={islandGoldSpotRef}
        position={[0, 6.25, -4.4]}
        target={centralIslandTarget.current}
        intensity={92}
        distance={19}
        decay={1.45}
        angle={0.82}
        penumbra={0.86}
        color="#ffe8b0"
      />
      <pointLight
        ref={islandCrownGlowRef}
        position={[0, 2.35, -5]}
        intensity={24}
        distance={13}
        decay={1.7}
        color="#ffd466"
      />

      {/* 8–9. Wide Living Electric-Cyan & Cyber-Violet Hall Neon Bounce Lights */}
      <pointLight
        ref={hallCyanFillRef}
        position={[-8.5, 5.2, -5.5]}
        intensity={28}
        distance={26}
        decay={1.45}
        color="#00F5FF"
      />
      <pointLight
        ref={hallVioletFillRef}
        position={[8.5, 5.2, -5.5]}
        intensity={27}
        distance={26}
        decay={1.45}
        color="#b84dff"
      />

      {/* 10. Right Wall Boutique Studio Spotlight (Club Shirt Size XL) */}
      <spotLight
        ref={shirtKeySpotRef}
        position={[9.2, 6.0, -9.2]}
        target={shirtTarget.current}
        intensity={62}
        distance={18}
        decay={1.55}
        angle={0.74}
        penumbra={0.84}
        color="#f2faff"
      />

      {/* 11. Front Hall Neon Azure Fill (Partners, Testimonials & Portal Threshold) */}
      <pointLight
        ref={frontHallFillRef}
        position={[0, 4.9, 4.2]}
        intensity={22}
        distance={22}
        decay={1.5}
        color="#38bdf8"
      />
    </group>
  );
};
