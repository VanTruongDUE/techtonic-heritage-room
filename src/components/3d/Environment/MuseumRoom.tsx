import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, RoundedBox } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import {
  createArchitecturalWallMaps,
  createBrushedMetalMaps,
  createFloorMaps,
  createLeatherMaps,
} from '../utils/proceduralMaterials';
import { useHeritageStore } from '../../../store/useHeritageStore';

const CEILING_DOWNLIGHTS: [number, number, number][] = [
  [0, 6.32, 26],
  [0, 6.32, 22],
  [0, 6.32, 18],
  [0, 6.32, 14],
  [0, 6.32, 10],
  [-10, 6.32, -13],
  [0, 6.32, -13],
  [10, 6.32, -13],
  [-10, 6.32, -5],
  [0, 6.32, -5],
  [10, 6.32, -5],
  [-10, 6.32, 3],
  [0, 6.32, 3],
  [10, 6.32, 3],
];

const TRACK_SPOTS: Array<{ pos: [number, number, number]; tilt: [number, number, number] }> = [
  { pos: [0, 6.18, -11], tilt: [0.42, 0, 0] },
  { pos: [-7.5, 6.18, -11.5], tilt: [0.45, -0.35, 0] },
  { pos: [7.5, 6.18, -11.5], tilt: [0.45, 0.35, 0] },
  { pos: [8.5, 6.18, -4], tilt: [0, 0, -0.52] },
  { pos: [-8.5, 6.18, -6], tilt: [0, 0, 0.52] },
  { pos: [-8.5, 6.18, 4], tilt: [0, 0, 0.52] },
  { pos: [6.0, 6.18, -12.5], tilt: [0.4, 0.25, 0] },
  { pos: [-5.2, 6.18, -8.2], tilt: [0.42, -0.38, 0] },
];

const ISLAND_CORNER_STANCHIONS: [number, number, number][] = [
  [-3.85, 0, -1.15],
  [3.85, 0, -1.15],
  [-3.85, 0, -8.85],
  [3.85, 0, -8.85],
];

const BENCH_POSITIONS: Array<{ pos: [number, number, number]; rotY: number }> = [
  { pos: [-5.8, 0, 2.2], rotY: 0.32 },
  { pos: [4.2, 0, 2.8], rotY: -0.42 },
];

const GUIDE_Z_POSITIONS = [25.5, 23, 20.5, 18, 15.5, 13, 10.5, 8, 5, 2.5];
const HALL_BEAM_CONFIG = [
  { z: -12, color: '#00F0FF' },
  { z: -7, color: '#a855f7' },
  { z: -2, color: '#00F0FF' },
  { z: 3, color: '#a855f7' },
];
const TUNNEL_RIB_Z = [26, 22, 18, 14, 10];
const PILASTER_Z = [-18.1, -11.9, -4, 1, 6];

export const MuseumRoom: React.FC = () => {
  const graphicsQuality = useHeritageStore((s) => s.graphicsQuality);
  const floorMaps = useMemo(() => createFloorMaps(), []);
  const wallMaps = useMemo(() => createArchitecturalWallMaps(), []);
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);
  const leatherMaps = useMemo(() => createLeatherMaps(), []);
  const guideMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const tunnelRibTopRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const tunnelRibLeftRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const tunnelRibRightRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const tunnelDownlightRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const tunnelSideStripRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const portalGlowMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const ribGlowLevels = useRef<number[]>([0.25, 0.05, 0.05, 0.05, 0.05]);
  const portalLevelRef = useRef<number>(0.12);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const playerZ = state.camera.position.z;

    // 1. Sequential Superstar Runway Floor Guide Bars (light up ahead of player footsteps)
    GUIDE_Z_POSITIONS.forEach((gz, idx) => {
      const mat = guideMatRefs.current[idx];
      if (!mat) return;
      const wave = Math.sin(t * 3.0 - idx * 0.7) * 0.5 + 0.5;
      if (gz > 8.5) {
        // Tunnel runway bars: dim ahead of player, blazing brightly right ahead & under footsteps
        const distAhead = playerZ - gz; // positive means bar is in front of player
        const active =
          distAhead >= -3.5 && distAhead <= 4.8
            ? 1.0
            : distAhead < -3.5
            ? 0.28
            : 0.06;
        const targetOp = active * (0.38 + wave * 0.58);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOp, 1 - Math.exp(-7 * dt));
      } else {
        // Hall threshold bars ignite as player nears the exit portal
        const hallOn = playerZ <= 12.0 ? 1.0 : 0.14;
        mat.opacity = THREE.MathUtils.lerp(
          mat.opacity,
          hallOn * (0.24 + wave * 0.6),
          1 - Math.exp(-5 * dt)
        );
      }
    });

    // 2. Sequential Tunnel Rib Arches & Overhead Downlights (stadium walkout reveal!)
    TUNNEL_RIB_Z.forEach((tz, idx) => {
      const triggerZ = idx === 0 ? 25.5 : tz + 3.8;
      const trailZ = tz - 6.8;
      let target = 0.05;
      if (idx === 0 && playerZ > triggerZ) {
        target = 0.25;
      } else if (playerZ <= triggerZ && playerZ >= trailZ) {
        target = 1.0;
      } else if (playerZ < trailZ) {
        target = 0.26;
      }

      const speed = target > ribGlowLevels.current[idx] ? 6.5 : 2.6;
      ribGlowLevels.current[idx] = THREE.MathUtils.lerp(
        ribGlowLevels.current[idx],
        target,
        1 - Math.exp(-speed * dt)
      );
      const lvl = ribGlowLevels.current[idx];

      const topMat = tunnelRibTopRefs.current[idx];
      if (topMat) topMat.opacity = lvl;
      const leftMat = tunnelRibLeftRefs.current[idx];
      if (leftMat) leftMat.opacity = lvl * 0.78;
      const rightMat = tunnelRibRightRefs.current[idx];
      if (rightMat) rightMat.opacity = lvl * 0.78;
      const dlMat = tunnelDownlightRefs.current[idx];
      if (dlMat) dlMat.opacity = 0.06 + lvl * 0.94;
    });

    // 3. Long Tunnel Ceiling & Floor Edge Strips scale smoothly with walkout progress
    const walkoutProgress = THREE.MathUtils.clamp((25.8 - playerZ) / 15.5, 0, 1);
    tunnelSideStripRefs.current.forEach((mat) => {
      if (mat) {
        mat.opacity = 0.12 + walkoutProgress * 0.88;
      }
    });

    // 4. Grand Entrance Threshold Portal ignites dramatically as you step up to z <= 12.2
    const targetPortal = playerZ <= 12.2 ? 0.78 + Math.sin(t * 2.2) * 0.22 : 0.12;
    portalLevelRef.current = THREE.MathUtils.lerp(
      portalLevelRef.current,
      targetPortal,
      1 - Math.exp(-4.5 * dt)
    );
    portalGlowMatRefs.current.forEach((mat) => {
      if (mat) mat.opacity = portalLevelRef.current;
    });
  });

  useEffect(() => {
    return () => {
      floorMaps.map.dispose();
      floorMaps.roughnessMap.dispose();
      floorMaps.bumpMap.dispose();
      wallMaps.map.dispose();
      wallMaps.roughnessMap.dispose();
      wallMaps.bumpMap.dispose();
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
      leatherMaps.roughnessMap.dispose();
      leatherMaps.bumpMap.dispose();
    };
  }, [floorMaps, wallMaps, metalMaps, leatherMaps]);

  return (
    <group>
      {/* ================= DEEP-SPACE COSMIC REFLECTIVE OBSERVATORY FLOOR ================= */}
      <RigidBody type="fixed" colliders={false} friction={1} restitution={0}>
        {/* Explicit solid physics colliders for Main Hall & Tunnel floors */}
        <CuboidCollider args={[17, 0.05, 14]} position={[0, -0.055, -5]} />
        <CuboidCollider args={[3, 0.05, 10.2]} position={[0, -0.05, 18.5]} />

        {/* Tunnel Cosmic Obsidian Glass Walkway Floor */}
        <mesh position={[0, -0.05, 18.5]} receiveShadow>
          <boxGeometry args={[6, 0.1, 20.4]} />
          <meshPhysicalMaterial
            map={floorMaps.map}
            roughnessMap={floorMaps.roughnessMap}
            bumpMap={floorMaps.bumpMap}
            bumpScale={0.006}
            color="#203252"
            roughness={0.26}
            metalness={0.38}
            clearcoat={0.55}
            clearcoatRoughness={0.22}
            envMapIntensity={0.95}
          />
        </mesh>
      </RigidBody>

      {/* Main Hall Planar Real-Time Space-Mirror Reflector Floor (reflects stars, Moon, neon & golden island!) */}
      <mesh position={[0, 0.002, -5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[31.8, 25.8]} />
        <MeshReflectorMaterial
          key={`floor-reflector-${graphicsQuality}`}
          blur={graphicsQuality === 'high' ? [260, 80] : [180, 60]}
          resolution={graphicsQuality === 'high' ? 512 : 256}
          mixBlur={0.86}
          mixStrength={graphicsQuality === 'high' ? 0.62 : 0.48}
          roughness={0.42}
          depthScale={0.8}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0e182c"
          metalness={0.36}
          mirror={0.58}
          map={floorMaps.map}
          roughnessMap={floorMaps.roughnessMap}
          bumpMap={floorMaps.bumpMap}
          bumpScale={0.004}
        />
      </mesh>

      {/* Perimeter Translucent Cosmic-Glass Floor Viewing Borders (peek into starry void beneath the station!) */}
      {[
        { pos: [0, 0.001, -18.25] as [number, number, number], args: [33.4, 1.1] as [number, number] },
        { pos: [-16.25, 0.001, -5] as [number, number, number], args: [1.1, 26.8] as [number, number] },
        { pos: [16.25, 0.001, -5] as [number, number, number], args: [1.1, 26.8] as [number, number] },
        { pos: [-9.75, 0.001, 7.95] as [number, number, number], args: [14.2, 1.1] as [number, number] },
        { pos: [9.75, 0.001, 7.95] as [number, number, number], args: [14.2, 1.1] as [number, number] },
      ].map((strip, idx) => (
        <mesh
          key={`cosmic-floor-trench-${idx}`}
          position={strip.pos}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={strip.args} />
          <meshPhysicalMaterial
            color="#071327"
            transparent
            opacity={0.38}
            roughness={0.08}
            metalness={0.25}
            clearcoat={0.9}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ================= PANORAMIC GLASS SKYLIGHT OBSERVATORY CEILING ================= */}
      {/* Ultra-clear tinted cosmic skylight glass panes overhead (revealing stars, nebula & Moon!) */}
      <mesh position={[0, 6.52, -5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[33.2, 27.2]} />
        <meshPhysicalMaterial
          color="#0a1933"
          transparent
          opacity={0.12}
          roughness={0.06}
          metalness={0.18}
          clearcoat={0.85}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 6.52, 18.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 20.4]} />
        <meshPhysicalMaterial
          color="#0a1933"
          transparent
          opacity={0.14}
          roughness={0.06}
          metalness={0.18}
          clearcoat={0.85}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Architectural Titanium Roof Perimeter Fascia & Longitudinal Skylight Girders */}
      {[
        { pos: [0, 6.48, -18.5] as [number, number, number], args: [34.4, 0.24, 1.1] as [number, number, number] },
        { pos: [-16.6, 6.48, -5] as [number, number, number], args: [1.1, 0.24, 28.0] as [number, number, number] },
        { pos: [16.6, 6.48, -5] as [number, number, number], args: [1.1, 0.24, 28.0] as [number, number, number] },
        { pos: [-9.8, 6.48, 8.3] as [number, number, number], args: [14.6, 0.24, 1.1] as [number, number, number] },
        { pos: [9.8, 6.48, 8.3] as [number, number, number], args: [14.6, 0.24, 1.1] as [number, number, number] },
        // 3 Longitudinal skylight structural ribs spanning front-to-back across the glass roof
        { pos: [-10, 6.46, -5] as [number, number, number], args: [0.22, 0.18, 26.8] as [number, number, number] },
        { pos: [0, 6.46, -5] as [number, number, number], args: [0.24, 0.18, 26.8] as [number, number, number] },
        { pos: [10, 6.46, -5] as [number, number, number], args: [0.22, 0.18, 26.8] as [number, number, number] },
        // Tunnel skylight edge rails
        { pos: [-2.45, 6.48, 18.5] as [number, number, number], args: [0.28, 0.2, 20.4] as [number, number, number] },
        { pos: [2.45, 6.48, 18.5] as [number, number, number], args: [0.28, 0.2, 20.4] as [number, number, number] },
      ].map((g, idx) => (
        <mesh key={`skylight-girder-${idx}`} position={g.pos}>
          <boxGeometry args={g.args} />
          <meshStandardMaterial
            color="#101a2e"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.76}
            roughness={0.32}
          />
        </mesh>
      ))}

      {HALL_BEAM_CONFIG.map((beam) => (
        <group key={`beam-${beam.z}`} position={[0, 6.32, beam.z]}>
          <RoundedBox args={[32, 0.28, 0.44]} radius={0.04} smoothness={4}>
            <meshStandardMaterial
              color="#141e32"
              roughnessMap={metalMaps.roughnessMap}
              bumpMap={metalMaps.bumpMap}
              bumpScale={0.004}
              metalness={0.62}
              roughness={0.38}
            />
          </RoundedBox>
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[28, 0.024, 0.11]} />
            <meshBasicMaterial color={beam.color} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[28, 0.34]} />
            <meshBasicMaterial
              color={beam.color}
              transparent
              opacity={0.14}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {/* Subtle Volumetric Light Cones under Hero Spotlights */}
      <mesh position={[0, 3.6, -5]}>
        <coneGeometry args={[3.4, 4.9, 32, 1, true]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.025}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[13.8, 3.6, -10.4]}>
        <coneGeometry args={[2.0, 4.7, 28, 1, true]} />
        <meshBasicMaterial
          color="#00F0FF"
          transparent
          opacity={0.028}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 4.1, -15.4]} rotation={[-0.36, 0, 0]}>
        <coneGeometry args={[2.5, 4.8, 28, 1, true]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.024}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Extended Entrance Tunnel Architectural Rib Arches & Sequential Superstar Walkout Strips */}
      {TUNNEL_RIB_Z.map((tz, i) => {
        const ribColor = i % 2 === 0 ? '#00F0FF' : '#a855f7';
        return (
          <group key={`tunnel-rib-${tz}`} position={[0, 6.26, tz]}>
            <RoundedBox args={[4.8, 0.24, 0.34]} radius={0.03} smoothness={4}>
              <meshStandardMaterial
                color="#141e32"
                roughnessMap={metalMaps.roughnessMap}
                metalness={0.72}
                roughness={0.32}
              />
            </RoundedBox>
            <mesh position={[0, -0.13, 0]}>
              <boxGeometry args={[4.2, 0.026, 0.095]} />
              <meshBasicMaterial
                ref={(el) => {
                  tunnelRibTopRefs.current[i] = el;
                }}
                color={ribColor}
                transparent
                opacity={i === 0 ? 0.25 : 0.05}
                toneMapped={false}
              />
            </mesh>
            {/* Side wall vertical neon arch continuation */}
            <mesh position={[-2.38, -3.1, 0]}>
              <boxGeometry args={[0.028, 5.9, 0.045]} />
              <meshBasicMaterial
                ref={(el) => {
                  tunnelRibLeftRefs.current[i] = el;
                }}
                color={ribColor}
                transparent
                opacity={i === 0 ? 0.2 : 0.04}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[2.38, -3.1, 0]}>
              <boxGeometry args={[0.028, 5.9, 0.045]} />
              <meshBasicMaterial
                ref={(el) => {
                  tunnelRibRightRefs.current[i] = el;
                }}
                color={ribColor}
                transparent
                opacity={i === 0 ? 0.2 : 0.04}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
      <group position={[0, 6.35, 18.5]}>
        <mesh position={[-1.4, 0, 0]}>
          <boxGeometry args={[0.1, 0.035, 19.2]} />
          <meshBasicMaterial
            ref={(el) => {
              tunnelSideStripRefs.current[0] = el;
            }}
            color="#00F0FF"
            transparent
            opacity={0.14}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[1.4, 0, 0]}>
          <boxGeometry args={[0.1, 0.035, 19.2]} />
          <meshBasicMaterial
            ref={(el) => {
              tunnelSideStripRefs.current[1] = el;
            }}
            color="#a855f7"
            transparent
            opacity={0.14}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Recessed Ceiling Downlight Fixtures */}
      {CEILING_DOWNLIGHTS.map((pos, idx) => (
        <group key={`downlight-${idx}`} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.38, 0.42, 0.12, 32]} />
            <meshStandardMaterial
              color="#2b3b5a"
              roughnessMap={metalMaps.roughnessMap}
              metalness={0.78}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, -0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3, 32]} />
            <meshBasicMaterial
              ref={(el) => {
                if (idx < 5) tunnelDownlightRefs.current[idx] = el;
              }}
              color={idx < 5 ? (idx % 2 === 0 ? '#00F0FF' : '#a855f7') : '#7dd3fc'}
              transparent={idx < 5}
              opacity={idx < 5 ? (idx === 0 ? 0.3 : 0.06) : 1}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Aimed Gallery Track Spotlight Cans with Gimbal Yokes */}
      {TRACK_SPOTS.map((spot, idx) => (
        <group key={`trackspot-${idx}`} position={spot.pos}>
          {/* Ceiling track rail stem */}
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.22, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
          </mesh>
          <group rotation={spot.tilt}>
            <mesh>
              <cylinderGeometry args={[0.13, 0.16, 0.28, 24]} />
              <meshStandardMaterial
                color="#334155"
                roughnessMap={metalMaps.roughnessMap}
                metalness={0.85}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0, -0.145, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.11, 24]} />
              <meshBasicMaterial color={idx % 2 === 0 ? '#00F0FF' : '#c084fc'} toneMapped={false} />
            </mesh>
          </group>
        </group>
      ))}

      {/* ================= PANORAMIC COSMIC-GLASS OBSERVATORY WALLS & EXACT PHYSICS ================= */}
      {/* Explicit 1:1 solid physics boundary walls (zero layout or collision changes) */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[17, 3.25, 0.4]} position={[0, 3.25, -19]} />
        <CuboidCollider args={[0.4, 3.25, 14]} position={[-17, 3.25, -5]} />
        <CuboidCollider args={[0.4, 3.25, 14]} position={[17, 3.25, -5]} />
        <CuboidCollider args={[7.25, 3.25, 0.4]} position={[-9.75, 3.25, 8.5]} />
        <CuboidCollider args={[7.25, 3.25, 0.4]} position={[9.75, 3.25, 8.5]} />
        <CuboidCollider args={[0.2, 3.25, 10.2]} position={[-2.6, 3.25, 18.5]} />
        <CuboidCollider args={[0.2, 3.25, 10.2]} position={[2.6, 3.25, 18.5]} />
        <CuboidCollider args={[2.8, 3.25, 0.2]} position={[0, 3.25, 28.7]} />
      </RigidBody>

      {/* Architectural Solid Obsidian Dado Bases (y=0..0.92) & Upper Cornice Headers (y=6.0..6.5) */}
      {[
        { pos: [0, 0.46, -18.85] as [number, number, number], args: [34, 0.92, 0.45] as [number, number, number] },
        { pos: [0, 6.26, -18.85] as [number, number, number], args: [34, 0.48, 0.45] as [number, number, number] },
        { pos: [-16.85, 0.46, -5] as [number, number, number], args: [0.45, 0.92, 28] as [number, number, number] },
        { pos: [-16.85, 6.26, -5] as [number, number, number], args: [0.45, 0.48, 28] as [number, number, number] },
        { pos: [16.85, 0.46, -5] as [number, number, number], args: [0.45, 0.92, 28] as [number, number, number] },
        { pos: [16.85, 6.26, -5] as [number, number, number], args: [0.45, 0.48, 28] as [number, number, number] },
        { pos: [-9.75, 0.46, 8.35] as [number, number, number], args: [14.5, 0.92, 0.45] as [number, number, number] },
        { pos: [-9.75, 6.26, 8.35] as [number, number, number], args: [14.5, 0.48, 0.45] as [number, number, number] },
        { pos: [9.75, 0.46, 8.35] as [number, number, number], args: [14.5, 0.92, 0.45] as [number, number, number] },
        { pos: [9.75, 6.26, 8.35] as [number, number, number], args: [14.5, 0.48, 0.45] as [number, number, number] },
        // Entrance Tunnel dado & header frames
        { pos: [-2.55, 0.46, 18.5] as [number, number, number], args: [0.28, 0.92, 20.4] as [number, number, number] },
        { pos: [-2.55, 6.26, 18.5] as [number, number, number], args: [0.28, 0.48, 20.4] as [number, number, number] },
        { pos: [2.55, 0.46, 18.5] as [number, number, number], args: [0.28, 0.92, 20.4] as [number, number, number] },
        { pos: [2.55, 6.26, 18.5] as [number, number, number], args: [0.28, 0.48, 20.4] as [number, number, number] },
        { pos: [0, 0.46, 28.65] as [number, number, number], args: [5.4, 0.92, 0.28] as [number, number, number] },
        { pos: [0, 6.26, 28.65] as [number, number, number], args: [5.4, 0.48, 0.28] as [number, number, number] },
      ].map((part, idx) => (
        <mesh key={`obs-trim-${idx}`} position={part.pos} receiveShadow>
          <boxGeometry args={part.args} />
          <meshStandardMaterial
            map={wallMaps.map}
            roughnessMap={wallMaps.roughnessMap}
            bumpMap={wallMaps.bumpMap}
            bumpScale={0.008}
            color="#15233b"
            roughness={0.46}
            metalness={0.54}
          />
        </mesh>
      ))}

      {/* Panoramic Smoked Space-Observatory Curtain-Wall Glass (y=0.92..6.02) revealing 360° cosmos outside */}
      {[
        { pos: [0, 3.47, -18.72] as [number, number, number], rot: [0, 0, 0] as [number, number, number], args: [33.4, 5.1] as [number, number] },
        { pos: [-16.72, 3.47, -5] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], args: [27.4, 5.1] as [number, number] },
        { pos: [16.72, 3.47, -5] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], args: [27.4, 5.1] as [number, number] },
        { pos: [-9.75, 3.47, 8.22] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], args: [14.2, 5.1] as [number, number] },
        { pos: [9.75, 3.47, 8.22] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], args: [14.2, 5.1] as [number, number] },
        // Entrance Tunnel glass observatory walls (stars glide outside during walkout!)
        { pos: [-2.52, 3.47, 18.5] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], args: [20.2, 5.1] as [number, number] },
        { pos: [2.52, 3.47, 18.5] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], args: [20.2, 5.1] as [number, number] },
        { pos: [0, 3.47, 28.58] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number], args: [5.2, 5.1] as [number, number] },
      ].map((pane, idx) => (
        <mesh key={`obs-glass-${idx}`} position={pane.pos} rotation={pane.rot}>
          <planeGeometry args={pane.args} />
          <meshPhysicalMaterial
            color="#071329"
            transparent
            opacity={0.26}
            roughness={0.08}
            metalness={0.24}
            clearcoat={0.9}
            clearcoatRoughness={0.06}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Slim Brushed-Titanium Curtain-Wall Window Mullions framing the Cosmic Views */}
      {[-12.5, -7.6, 7.6, 12.5].map((mx) => (
        <mesh key={`back-mullion-${mx}`} position={[mx, 3.47, -18.74]}>
          <boxGeometry args={[0.09, 5.1, 0.12]} />
          <meshStandardMaterial color="#1e2d48" metalness={0.82} roughness={0.26} />
        </mesh>
      ))}
      {[-12.5, -6.2, 6.2, 12.5].map((mx) => (
        <mesh key={`front-mullion-${mx}`} position={[mx, 3.47, 8.24]}>
          <boxGeometry args={[0.09, 5.1, 0.12]} />
          <meshStandardMaterial color="#1e2d48" metalness={0.82} roughness={0.26} />
        </mesh>
      ))}

      {/* ================= SCULPTURAL ENTRANCE THRESHOLD PORTAL ================= */}
      <group position={[0, 0, 8.5]}>
        {[-2.42, 2.42].map((px, pIdx) => (
          <group key={`portal-col-${px}`} position={[px, 2.8, 0]}>
            <RoundedBox args={[0.24, 5.6, 0.56]} radius={0.03} smoothness={4} castShadow>
              <meshStandardMaterial
                color="#1f2d47"
                roughnessMap={metalMaps.roughnessMap}
                metalness={0.78}
                roughness={0.28}
              />
            </RoundedBox>
            <mesh position={[px > 0 ? -0.125 : 0.125, 0, 0]}>
              <boxGeometry args={[0.028, 5.2, 0.07]} />
              <meshBasicMaterial
                ref={(el) => {
                  portalGlowMatRefs.current[pIdx] = el;
                }}
                color="#00F0FF"
                transparent
                opacity={0.12}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
        <RoundedBox position={[0, 5.55, 0]} args={[5.1, 0.34, 0.58]} radius={0.03} smoothness={4}>
          <meshStandardMaterial
            color="#1f2d47"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.78}
            roughness={0.28}
          />
        </RoundedBox>
        <mesh position={[0, 5.37, 0]}>
          <boxGeometry args={[4.6, 0.035, 0.09]} />
          <meshBasicMaterial
            ref={(el) => {
              portalGlowMatRefs.current[2] = el;
            }}
            color="#00F0FF"
            transparent
            opacity={0.12}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ================= PERIMETER NEON COVE LIGHTING & BRUSHED BASEBOARDS ================= */}
      <mesh position={[0, 6.22, -18.55]}>
        <boxGeometry args={[32.8, 0.05, 0.07]} />
        <meshBasicMaterial color="#00F0FF" toneMapped={false} />
      </mesh>
      <mesh position={[-16.55, 6.22, -5]}>
        <boxGeometry args={[0.07, 0.05, 26.8]} />
        <meshBasicMaterial color="#a855f7" toneMapped={false} />
      </mesh>
      <mesh position={[16.55, 6.22, -5]}>
        <boxGeometry args={[0.07, 0.05, 26.8]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} />
      </mesh>
      <mesh position={[-9.75, 6.22, 8.05]}>
        <boxGeometry args={[13.2, 0.05, 0.07]} />
        <meshBasicMaterial color="#00F0FF" toneMapped={false} />
      </mesh>
      <mesh position={[9.75, 6.22, 8.05]}>
        <boxGeometry args={[13.2, 0.05, 0.07]} />
        <meshBasicMaterial color="#a855f7" toneMapped={false} />
      </mesh>

      {/* Brushed Metallic Architectural Baseboards across All Hall Walls */}
      <mesh position={[0, 0.14, -18.55]}>
        <boxGeometry args={[33.2, 0.28, 0.08]} />
        <meshStandardMaterial
          color="#2b3b5a"
          roughnessMap={metalMaps.roughnessMap}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[-16.55, 0.14, -5]}>
        <boxGeometry args={[0.08, 0.28, 27.2]} />
        <meshStandardMaterial
          color="#2b3b5a"
          roughnessMap={metalMaps.roughnessMap}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[16.55, 0.14, -5]}>
        <boxGeometry args={[0.08, 0.28, 27.2]} />
        <meshStandardMaterial
          color="#2b3b5a"
          roughnessMap={metalMaps.roughnessMap}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Tunnel Brushed Baseboards & Corridor Floor Guiding Strips */}
      <mesh position={[-2.38, 0.14, 18.5]}>
        <boxGeometry args={[0.06, 0.28, 20]} />
        <meshStandardMaterial
          color="#2b3b5a"
          roughnessMap={metalMaps.roughnessMap}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[2.38, 0.14, 18.5]}>
        <boxGeometry args={[0.06, 0.28, 20]} />
        <meshStandardMaterial
          color="#2b3b5a"
          roughnessMap={metalMaps.roughnessMap}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[-2.3, 0.015, 18.5]}>
        <boxGeometry args={[0.05, 0.015, 20]} />
        <meshBasicMaterial
          ref={(el) => {
            tunnelSideStripRefs.current[2] = el;
          }}
          color="#00F0FF"
          transparent
          opacity={0.14}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[2.3, 0.015, 18.5]}>
        <boxGeometry args={[0.05, 0.015, 20]} />
        <meshBasicMaterial
          ref={(el) => {
            tunnelSideStripRefs.current[3] = el;
          }}
          color="#a855f7"
          transparent
          opacity={0.14}
          toneMapped={false}
        />
      </mesh>

      {GUIDE_Z_POSITIONS.map((z, idx) => (
        <mesh key={`guide-${z}`} position={[0, 0.012, z]}>
          <boxGeometry args={[0.72, 0.012, 0.05]} />
          <meshBasicMaterial
            ref={(el) => {
              guideMatRefs.current[idx] = el;
            }}
            color={idx % 2 === 0 ? '#00F0FF' : '#7dd3fc'}
            transparent
            opacity={0.45}
            toneMapped={false}
          />
        </mesh>
      ))}

      <mesh position={[0, 0.015, -18.5]}>
        <boxGeometry args={[33, 0.018, 0.065]} />
        <meshBasicMaterial color="#00F0FF" toneMapped={false} />
      </mesh>

      {/* ================= MUSEUM CORNER STANCHION BOLLARDS AROUND CENTRAL ISLAND ================= */}
      {ISLAND_CORNER_STANCHIONS.map((pos, idx) => (
        <group key={`stanchion-${idx}`} position={pos}>
          {/* Weighted brushed-steel base */}
          <mesh position={[0, 0.025, 0]} receiveShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.05, 32]} />
            <meshStandardMaterial
              color="#94a3b8"
              roughnessMap={metalMaps.roughnessMap}
              metalness={0.9}
              roughness={0.22}
            />
          </mesh>
          {/* Vertical post */}
          <mesh position={[0, 0.44, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.028, 0.82, 20]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
          </mesh>
          {/* Crown finial sphere */}
          <mesh position={[0, 0.87, 0]}>
            <sphereGeometry args={[0.042, 20, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.16} />
          </mesh>
          {/* Subtle cyan collar accent */}
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.02, 20]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      {/* ================= SCULPTED LEATHER & TITANIUM MUSEUM BENCHES ================= */}
      {BENCH_POSITIONS.map((bench, idx) => (
        <RigidBody
          key={`museum-bench-${idx}`}
          type="fixed"
          position={bench.pos}
          rotation={[0, bench.rotY, 0]}
        >
          {/* Left & Right Brushed Steel Frame Legs */}
          {[-0.95, 0.95].map((lx) => (
            <group key={`bench-leg-${lx}`} position={[lx, 0.21, 0]}>
              <RoundedBox args={[0.08, 0.42, 0.62]} radius={0.015} smoothness={4} castShadow receiveShadow>
                <meshStandardMaterial
                  color="#64748b"
                  roughnessMap={metalMaps.roughnessMap}
                  metalness={0.86}
                  roughness={0.24}
                />
              </RoundedBox>
            </group>
          ))}
          {/* Center Under-frame Spine */}
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[1.9, 0.06, 0.22]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Tufted Leather Seat Cushion */}
          <RoundedBox position={[0, 0.47, 0]} args={[2.28, 0.13, 0.7]} radius={0.045} smoothness={6} castShadow receiveShadow>
            <meshStandardMaterial
              color="#192842"
              roughnessMap={leatherMaps.roughnessMap}
              bumpMap={leatherMaps.bumpMap}
              bumpScale={0.01}
              roughness={0.62}
              metalness={0.12}
            />
          </RoundedBox>
          {/* Decorative Center Seam Stitch */}
          <mesh position={[0, 0.537, 0]}>
            <boxGeometry args={[0.015, 0.008, 0.68]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </RigidBody>
      ))}

      {/* ================= CHAMFERED ARCHITECTURAL PILASTERS ================= */}
      {PILASTER_Z.map((z, i) => (
        <group key={`left-pillar-${z}`} position={[-16.62, 3.25, z]}>
          <RoundedBox args={[0.18, 5.9, 0.42]} radius={0.03} smoothness={4} castShadow>
            <meshStandardMaterial
              color="#162035"
              roughnessMap={metalMaps.roughnessMap}
              metalness={0.62}
              roughness={0.34}
            />
          </RoundedBox>
          <mesh position={[0.095, 0, 0]}>
            <boxGeometry args={[0.022, 5.2, 0.055]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#00F0FF' : '#a855f7'} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {PILASTER_Z.map((z, i) => (
        <group key={`right-pillar-${z}`} position={[16.62, 3.25, z]}>
          <RoundedBox args={[0.18, 5.9, 0.42]} radius={0.03} smoothness={4} castShadow>
            <meshStandardMaterial
              color="#162035"
              roughnessMap={metalMaps.roughnessMap}
              metalness={0.62}
              roughness={0.34}
            />
          </RoundedBox>
          <mesh position={[-0.095, 0, 0]}>
            <boxGeometry args={[0.022, 5.2, 0.055]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#a855f7' : '#00F0FF'} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
