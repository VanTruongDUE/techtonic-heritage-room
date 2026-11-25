import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import {
  createBrushedMetalMaps,
  createCertificateTexture,
  createMarbleMaps,
  createPedestalPlaqueTexture,
} from '../utils/proceduralMaterials';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import type { ExhibitItem } from '../../../types/heritage';

const PEDESTAL_SLOTS: Array<{
  position: [number, number, number];
  plaqueRotationY: number;
  color: string;
  speed: number;
}> = [
  { position: [0, 1.17, -2], plaqueRotationY: 0, color: '#fbbf24', speed: 0.42 },
  { position: [3, 1.17, -5], plaqueRotationY: Math.PI / 2, color: '#38bdf8', speed: 0.35 },
  { position: [0, 1.17, -8], plaqueRotationY: Math.PI, color: '#f59e0b', speed: 0.38 },
  { position: [-3, 1.17, -5], plaqueRotationY: -Math.PI / 2, color: '#60a5fa', speed: 0.4 },
];

/** Sculpted Champion Chalice (LatheGeometry + twin CatmullRomCurve3 handles + fluted ring) */
const ChampionChaliceModel: React.FC<{ color: string; hovered: boolean }> = ({
  color,
  hovered,
}) => {
  const { cupGeom, leftHandleGeom, rightHandleGeom } = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.18, 0.0),
      new THREE.Vector2(0.18, 0.04),
      new THREE.Vector2(0.14, 0.07),
      new THREE.Vector2(0.055, 0.13),
      new THREE.Vector2(0.042, 0.25),
      new THREE.Vector2(0.085, 0.31),
      new THREE.Vector2(0.21, 0.44),
      new THREE.Vector2(0.23, 0.56),
      new THREE.Vector2(0.215, 0.57),
      new THREE.Vector2(0.185, 0.46),
      new THREE.Vector2(0.06, 0.35),
      new THREE.Vector2(0.0, 0.35),
    ];
    const cup = new THREE.LatheGeometry(pts, 64);
    cup.computeVertexNormals();

    const makeHandle = (sign: number) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 0.19, 0.52, 0),
        new THREE.Vector3(sign * 0.29, 0.51, 0),
        new THREE.Vector3(sign * 0.3, 0.39, 0),
        new THREE.Vector3(sign * 0.16, 0.34, 0),
      ]);
      return new THREE.TubeGeometry(curve, 32, 0.018, 16, false);
    };

    return {
      cupGeom: cup,
      leftHandleGeom: makeHandle(-1),
      rightHandleGeom: makeHandle(1),
    };
  }, []);

  useEffect(() => {
    return () => {
      cupGeom.dispose();
      leftHandleGeom.dispose();
      rightHandleGeom.dispose();
    };
  }, [cupGeom, leftHandleGeom, rightHandleGeom]);

  return (
    <group>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.23, 0.08, 48]} />
        <meshStandardMaterial color="#111827" roughness={0.28} metalness={0.45} />
      </mesh>
      {/* Brass nameplate ring on trophy plinth */}
      <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.215, 0.008, 12, 48]} />
        <meshStandardMaterial color={color} metalness={0.92} roughness={0.18} />
      </mesh>
      <group position={[0, 0.08, 0]}>
        <mesh geometry={cupGeom} castShadow>
          <meshStandardMaterial
            color={color}
            metalness={0.94}
            roughness={0.14}
            emissive={color}
            emissiveIntensity={hovered ? 0.28 : 0.08}
          />
        </mesh>
        <mesh geometry={leftHandleGeom} castShadow>
          <meshStandardMaterial color={color} metalness={0.94} roughness={0.16} />
        </mesh>
        <mesh geometry={rightHandleGeom} castShadow>
          <meshStandardMaterial color={color} metalness={0.94} roughness={0.16} />
        </mesh>
      </group>
      <mesh position={[0, 0.69, 0]}>
        <octahedronGeometry args={[0.055, 0]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          roughness={0.04}
          metalness={0.1}
          clearcoat={1}
          ior={1.6}
          envMapIntensity={1.8}
        />
      </mesh>
    </group>
  );
};

/** Framed Honor Certificate resting on a brass museum easel */
const CertificateEaselModel: React.FC<{ item: ExhibitItem; hovered: boolean }> = ({
  item,
  hovered,
}) => {
  const certTex = useMemo(
    () => createCertificateTexture(item.title, item.year),
    [item.title, item.year]
  );

  useEffect(() => {
    return () => {
      certTex.dispose();
    };
  }, [certTex]);

  return (
    <group position={[0, 0.02, 0]}>
      <mesh position={[-0.14, 0.28, -0.06]} rotation={[0.24, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.014, 0.56, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.22} />
      </mesh>
      <mesh position={[0.14, 0.28, -0.06]} rotation={[0.24, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.014, 0.56, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.26, -0.16]} rotation={[-0.35, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.014, 0.56, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.22} />
      </mesh>
      {/* Brass horizontal shelf bar */}
      <mesh position={[0, 0.08, 0.09]}>
        <boxGeometry args={[0.42, 0.018, 0.04]} />
        <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.22} />
      </mesh>

      <group position={[0, 0.34, 0.02]} rotation={[-0.24, 0, 0]}>
        <RoundedBox args={[0.48, 0.6, 0.04]} radius={0.012} smoothness={4} castShadow>
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.8}
            roughness={0.24}
            emissive="#0ea5e9"
            emissiveIntensity={hovered ? 0.22 : 0.04}
          />
        </RoundedBox>
        {/* 4 Brass corner frame caps */}
        {[
          [-0.22, 0.28],
          [0.22, 0.28],
          [-0.22, -0.28],
          [0.22, -0.28],
        ].map(([bx, by], i) => (
          <mesh key={`corner-${i}`} position={[bx, by, 0.015]}>
            <boxGeometry args={[0.045, 0.045, 0.025]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[0.42, 0.54]} />
          <meshStandardMaterial map={certTex} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
};

/** Ringed Gold Hackathon Medallion & Globe Trophy */
const HackathonGlobeModel: React.FC<{ color: string; hovered: boolean }> = ({ color, hovered }) => {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.23, 0.1, 48]} />
        <meshStandardMaterial color="#111827" roughness={0.28} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.14, 32]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.14, 48, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.94}
          roughness={0.14}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 3, 0.35, 0]}>
        <torusGeometry args={[0.22, 0.018, 24, 64]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.16} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 3, -0.35, 0]}>
        <torusGeometry args={[0.22, 0.015, 24, 64]} />
        <meshStandardMaterial color={color} metalness={0.94} roughness={0.16} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[0, Math.PI / 4, Math.PI / 2]}>
        <torusGeometry args={[0.22, 0.012, 16, 64]} />
        <meshStandardMaterial color="#93c5fd" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
};

/** Crystal & Cobalt Modern Obelisk Award */
const CrystalObeliskModel: React.FC<{ color: string; hovered: boolean }> = ({ color, hovered }) => {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.22, 0.1, 48]} />
        <meshStandardMaterial color="#111827" roughness={0.28} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.14, 0.48, 6]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.06}
          metalness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.05}
          emissive={color}
          emissiveIntensity={hovered ? 0.35 : 0.14}
          envMapIntensity={1.9}
        />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <coneGeometry args={[0.04, 0.08, 6]} />
        <meshPhysicalMaterial color="#e0f2fe" clearcoat={1} roughness={0.04} envMapIntensity={1.9} />
      </mesh>
    </group>
  );
};

export const CentralIsland: React.FC = () => {
  const { setHoveringInteractive, openModal, exhibitItems } = useHeritageStore();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const trophyRefs = useRef<Array<THREE.Group | null>>([]);

  const marbleMaps = useMemo(() => createMarbleMaps(), []);
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);

  const exhibits = useMemo(
    () =>
      PEDESTAL_SLOTS.map((slot, idx) => {
        const item = exhibitItems[idx] ?? exhibitItems[0];
        return {
          ...slot,
          item,
          plaqueTex: item
            ? createPedestalPlaqueTexture(item.title, item.year, item.highlight)
            : null,
        };
      }).filter((ex) => Boolean(ex.item)),
    [exhibitItems]
  );

  const centerMedallionTex = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(512, 512, 2);
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.72)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(256, 256, 232, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(256, 256, 200, 0, Math.PI * 2);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '800 44px Inter, sans-serif';
      ctx.fillText('TECHTONIC', 256, 246);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText('HALL OF FAME • 360°', 256, 288);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  useEffect(() => {
    return () => {
      marbleMaps.map.dispose();
      marbleMaps.roughnessMap.dispose();
      marbleMaps.bumpMap.dispose();
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
      centerMedallionTex.dispose();
    };
  }, [marbleMaps, metalMaps, centerMedallionTex]);

  useEffect(() => {
    return () => {
      exhibits.forEach((ex) => ex.plaqueTex?.dispose());
    };
  }, [exhibits]);

  useFrame((_, delta) => {
    PEDESTAL_SLOTS.forEach((slot, idx) => {
      const group = trophyRefs.current[idx];
      if (!group) return;
      const boost = hoveredIdx === idx ? 2.0 : 1;
      group.rotation.y += delta * slot.speed * boost;
      const targetScale = hoveredIdx === idx ? 1.07 : 1;
      group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    });
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ================= CENTRAL ISLAND STEPPED MARBLE PLATFORM ================= */}
      <RigidBody type="fixed" position={[0, 0.18, -5]}>
        <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[4.75, 4.9, 0.18, 64]} />
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#d8e3f4"
            roughness={0.34}
            metalness={0.32}
          />
        </mesh>
        <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[4.55, 4.68, 0.18, 64]} />
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#dce8f8"
            roughness={0.3}
            metalness={0.34}
          />
        </mesh>
        {/* Brushed titanium stepped edge trim */}
        <mesh position={[0, 0.175, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.48, 4.55, 64]} />
          <meshStandardMaterial
            color="#94a3b8"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.88}
            roughness={0.22}
          />
        </mesh>
        <mesh position={[0, 0.176, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.42, 4.46, 64]} />
          <meshBasicMaterial color="#00F0FF" toneMapped={false} />
        </mesh>
      </RigidBody>

      {/* Center Inlaid Medallion on Island Floor */}
      <mesh position={[0, 0.36, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.35, 64]} />
        <meshStandardMaterial map={centerMedallionTex} roughness={0.3} metalness={0.4} />
      </mesh>

      {/* ================= MUSEUM DISPLAY VITRINES & SCULPTED AWARDS ================= */}
      {exhibits.map((ex, idx) => {
        const isHovered = hoveredIdx === idx;
        const handleOpen = () => openModal('exhibit', ex.item);

        return (
          <group key={ex.item.id}>
            {/* Stepped Marble Plinth with Brushed Titanium Rim */}
            <RigidBody type="fixed" position={[ex.position[0], 0.72, ex.position[2]]}>
              <RoundedBox args={[1.24, 0.82, 1.24]} radius={0.04} smoothness={6} castShadow receiveShadow>
                <meshStandardMaterial
                  map={marbleMaps.map}
                  roughnessMap={marbleMaps.roughnessMap}
                  bumpMap={marbleMaps.bumpMap}
                  bumpScale={0.008}
                  color="#dce8f8"
                  roughness={0.32}
                  metalness={0.32}
                />
              </RoundedBox>
              {/* Recessed Brushed Titanium Collar */}
              <RoundedBox position={[0, 0.415, 0]} args={[1.26, 0.04, 1.26]} radius={0.015} smoothness={4}>
                <meshStandardMaterial
                  color="#64748b"
                  roughnessMap={metalMaps.roughnessMap}
                  bumpMap={metalMaps.bumpMap}
                  bumpScale={0.004}
                  metalness={0.88}
                  roughness={0.22}
                />
              </RoundedBox>
              {/* Velvet Presentation Cushion Pad + Stepped Brass-Rimmed Riser inside vitrine */}
              <RoundedBox position={[0, 0.445, 0]} args={[0.92, 0.03, 0.92]} radius={0.01} smoothness={4} receiveShadow>
                <meshStandardMaterial color="#0f172a" roughness={0.88} metalness={0.04} />
              </RoundedBox>
              <RoundedBox position={[0, 0.468, 0]} args={[0.56, 0.024, 0.56]} radius={0.008} smoothness={4} receiveShadow>
                <meshStandardMaterial color="#162033" roughness={0.75} metalness={0.18} />
              </RoundedBox>
            </RigidBody>

            {/* Engraved Nameplate Plaque on front face of pedestal */}
            {ex.plaqueTex && (
              <group
                position={[
                  ex.position[0] + Math.sin(ex.plaqueRotationY) * 0.635,
                  0.82,
                  ex.position[2] + Math.cos(ex.plaqueRotationY) * 0.635,
                ]}
                rotation={[-0.14, ex.plaqueRotationY, 0]}
              >
                <RoundedBox args={[0.8, 0.25, 0.028]} radius={0.008} smoothness={4}>
                  <meshStandardMaterial
                    color="#475569"
                    roughnessMap={metalMaps.roughnessMap}
                    metalness={0.86}
                    roughness={0.24}
                  />
                </RoundedBox>
                <mesh position={[0, 0, 0.016]}>
                  <planeGeometry args={[0.74, 0.21]} />
                  <meshStandardMaterial
                    map={ex.plaqueTex}
                    emissive="#ffffff"
                    emissiveMap={ex.plaqueTex}
                    emissiveIntensity={0.32}
                    roughness={0.34}
                    metalness={0.1}
                  />
                </mesh>
              </group>
            )}

            {/* Framed Anti-Reflective Museum Glass Vitrine + Clamps */}
            <group position={[ex.position[0], 1.63, ex.position[2]]}>
              <mesh>
                <boxGeometry args={[1.08, 0.96, 1.08]} />
                <meshPhysicalMaterial
                  color="#e0f2fe"
                  transparent
                  opacity={isHovered ? 0.14 : 0.21}
                  roughness={0.03}
                  metalness={0.05}
                  clearcoat={1}
                  clearcoatRoughness={0.03}
                  reflectivity={1}
                  envMapIntensity={2.1}
                  depthWrite={false}
                />
              </mesh>

              {/* 4 Brushed Titanium Corner Mullions + Corner Clamp Brackets */}
              {[
                [-0.54, -0.54],
                [0.54, -0.54],
                [-0.54, 0.54],
                [0.54, 0.54],
              ].map(([cx, cz], cornerIdx) => (
                <group key={`post-${cornerIdx}`} position={[cx, 0, cz]}>
                  <mesh>
                    <cylinderGeometry args={[0.014, 0.014, 0.98, 12]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.18} />
                  </mesh>
                  {/* Top & Bottom corner glass clamps */}
                  {[-0.45, 0.45].map((cy) => (
                    <mesh key={`clamp-${cy}`} position={[0, cy, 0]}>
                      <boxGeometry args={[0.05, 0.055, 0.05]} />
                      <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
                    </mesh>
                  ))}
                </group>
              ))}

              {/* Vitrine Top Bezel Cap & Internal Recessed Showcase Light Ring */}
              <RoundedBox position={[0, 0.49, 0]} args={[1.14, 0.05, 1.14]} radius={0.016} smoothness={4}>
                <meshStandardMaterial
                  color="#1e293b"
                  roughnessMap={metalMaps.roughnessMap}
                  metalness={0.82}
                  roughness={0.24}
                />
              </RoundedBox>
              <mesh position={[0, 0.464, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.26, 0.34, 48]} />
                <meshBasicMaterial color={ex.color} />
              </mesh>
            </group>

            {/* Interactive Sculpted Award inside Vitrine */}
            <group
              ref={(el) => {
                trophyRefs.current[idx] = el;
              }}
              position={ex.position}
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredIdx(idx);
                setHoveringInteractive(true, `Xem: ${ex.item.title}`, handleOpen, {
                  title: ex.item.title,
                  badge: `${ex.item.year}${ex.item.highlight ? ` • ${ex.item.highlight}` : ''}`,
                  summary: ex.item.description,
                  bullets: ex.item.bullets,
                  metrics: ex.item.metrics,
                  actionLabel: 'Mở chi tiết hiện vật vinh danh',
                });
              }}
              onPointerOut={() => {
                setHoveredIdx((prev) => (prev === idx ? null : prev));
                setHoveringInteractive(false);
              }}
            >
              {idx === 0 && <ChampionChaliceModel color={ex.color} hovered={isHovered} />}
              {idx === 1 && <CertificateEaselModel item={ex.item} hovered={isHovered} />}
              {idx === 2 && <HackathonGlobeModel color={ex.color} hovered={isHovered} />}
              {idx >= 3 && <CrystalObeliskModel color={ex.color} hovered={isHovered} />}
            </group>

            {/* Focused soft vitrine interior illumination */}
            <pointLight
              position={[ex.position[0], 1.95, ex.position[2]]}
              intensity={isHovered ? 6.5 : 4.2}
              distance={3.2}
              decay={2}
              color={ex.color}
            />
          </group>
        );
      })}
    </group>
  );
};
