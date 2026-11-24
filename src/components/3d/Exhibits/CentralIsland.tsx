import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import {
  createCertificateTexture,
  createMarbleTexture,
  createPedestalPlaqueTexture,
} from '../utils/proceduralMaterials';
import type { ExhibitItem } from '../../../types/heritage';

const PEDESTAL_SLOTS: Array<{
  position: [number, number, number];
  plaqueRotationY: number;
  color: string;
  speed: number;
}> = [
  { position: [0, 1.15, -2], plaqueRotationY: 0, color: '#fbbf24', speed: 0.42 },
  { position: [3, 1.15, -5], plaqueRotationY: Math.PI / 2, color: '#38bdf8', speed: 0.35 },
  { position: [0, 1.15, -8], plaqueRotationY: Math.PI, color: '#f59e0b', speed: 0.38 },
  { position: [-3, 1.15, -5], plaqueRotationY: -Math.PI / 2, color: '#60a5fa', speed: 0.4 },
];

/** Sculpted Champion Chalice (LatheGeometry + twin CatmullRomCurve3 handles) */
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
      {/* Stepped ebony trophy base */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.23, 0.08, 48]} />
        <meshStandardMaterial color="#111827" roughness={0.28} metalness={0.4} />
      </mesh>
      <group position={[0, 0.08, 0]}>
        <mesh geometry={cupGeom} castShadow>
          <meshStandardMaterial
            color={color}
            metalness={0.92}
            roughness={0.14}
            emissive={color}
            emissiveIntensity={hovered ? 0.28 : 0.08}
          />
        </mesh>
        <mesh geometry={leftHandleGeom} castShadow>
          <meshStandardMaterial color={color} metalness={0.92} roughness={0.16} />
        </mesh>
        <mesh geometry={rightHandleGeom} castShadow>
          <meshStandardMaterial color={color} metalness={0.92} roughness={0.16} />
        </mesh>
      </group>
      {/* Crystal finial */}
      <mesh position={[0, 0.69, 0]}>
        <octahedronGeometry args={[0.055, 0]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          roughness={0.05}
          metalness={0.1}
          clearcoat={1}
          ior={1.6}
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
      {/* Brass easel legs */}
      <mesh position={[-0.14, 0.28, -0.06]} rotation={[0.24, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.014, 0.56, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0.14, 0.28, -0.06]} rotation={[0.24, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.014, 0.56, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.26, -0.16]} rotation={[-0.35, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.014, 0.56, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.22} />
      </mesh>

      {/* Tilted certificate frame */}
      <group position={[0, 0.34, 0.02]} rotation={[-0.24, 0, 0]}>
        <RoundedBox args={[0.48, 0.6, 0.04]} radius={0.012} smoothness={4} castShadow>
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.75}
            roughness={0.25}
            emissive="#0ea5e9"
            emissiveIntensity={hovered ? 0.22 : 0.04}
          />
        </RoundedBox>
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
        <meshStandardMaterial color="#111827" roughness={0.28} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.14, 32]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.14, 48, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.92}
          roughness={0.14}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 3, 0.35, 0]}>
        <torusGeometry args={[0.22, 0.018, 24, 64]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 3, -0.35, 0]}>
        <torusGeometry args={[0.22, 0.015, 24, 64]} />
        <meshStandardMaterial color={color} metalness={0.92} roughness={0.18} />
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
        <meshStandardMaterial color="#111827" roughness={0.28} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.14, 0.48, 6]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.08}
          metalness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.06}
          emissive={color}
          emissiveIntensity={hovered ? 0.35 : 0.14}
        />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <coneGeometry args={[0.04, 0.08, 6]} />
        <meshPhysicalMaterial color="#e0f2fe" clearcoat={1} roughness={0.05} />
      </mesh>
    </group>
  );
};

export const CentralIsland: React.FC = () => {
  const { setHoveringInteractive, openModal, exhibitItems } = useHeritageStore();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const trophyRefs = useRef<Array<THREE.Group | null>>([]);

  const marbleMap = useMemo(() => createMarbleTexture(), []);

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

  // Center Island inlaid crest texture
  const centerMedallionTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(256, 256, 232, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
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
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      marbleMap.dispose();
      centerMedallionTex.dispose();
    };
  }, [marbleMap, centerMedallionTex]);

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
      {/* ================= CENTRAL ISLAND STEPPED PLATFORM (64 SEGMENTS) ================= */}
      <RigidBody type="fixed" position={[0, 0.18, -5]}>
        {/* Lower bevel base */}
        <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[4.75, 4.9, 0.18, 64]} />
          <meshStandardMaterial map={marbleMap} color="#182235" roughness={0.38} metalness={0.3} />
        </mesh>
        {/* Main marble upper deck */}
        <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[4.55, 4.68, 0.18, 64]} />
          <meshStandardMaterial map={marbleMap} color="#1b273d" roughness={0.34} metalness={0.32} />
        </mesh>
        {/* Brushed titanium edge trim */}
        <mesh position={[0, 0.175, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.48, 4.55, 64]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.176, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.42, 4.46, 64]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </RigidBody>

      {/* Center Inlaid Medallion on Island Floor */}
      <mesh position={[0, 0.36, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.35, 64]} />
        <meshStandardMaterial map={centerMedallionTex} roughness={0.32} metalness={0.35} />
      </mesh>

      {/* ================= MUSEUM DISPLAY VITRINES & SCULPTED AWARDS ================= */}
      {exhibits.map((ex, idx) => {
        const isHovered = hoveredIdx === idx;
        const handleOpen = () => openModal('exhibit', ex.item);

        return (
          <group key={ex.item.id}>
            {/* Rounded Marble Plinth with Physics Collider */}
            <RigidBody type="fixed" position={[ex.position[0], 0.72, ex.position[2]]}>
              <RoundedBox args={[1.22, 0.82, 1.22]} radius={0.04} smoothness={6} castShadow receiveShadow>
                <meshStandardMaterial
                  map={marbleMap}
                  color="#1a253a"
                  roughness={0.36}
                  metalness={0.28}
                />
              </RoundedBox>
              {/* Recessed Brushed Titanium Trim Collar */}
              <RoundedBox position={[0, 0.415, 0]} args={[1.24, 0.04, 1.24]} radius={0.015} smoothness={4}>
                <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.24} />
              </RoundedBox>
            </RigidBody>

            {/* Engraved Nameplate Plaque on front face of pedestal */}
            {ex.plaqueTex && (
              <group
                position={[
                  ex.position[0] + Math.sin(ex.plaqueRotationY) * 0.625,
                  0.82,
                  ex.position[2] + Math.cos(ex.plaqueRotationY) * 0.625,
                ]}
                rotation={[-0.14, ex.plaqueRotationY, 0]}
              >
                <mesh>
                  <boxGeometry args={[0.78, 0.24, 0.025]} />
                  <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.28} />
                </mesh>
                <mesh position={[0, 0, 0.015]}>
                  <planeGeometry args={[0.74, 0.21]} />
                  <meshBasicMaterial map={ex.plaqueTex} />
                </mesh>
              </group>
            )}

            {/* Framed Anti-Reflective Museum Glass Vitrine */}
            <group position={[ex.position[0], 1.62, ex.position[2]]}>
              {/* Clean reflective glass shell */}
              <mesh>
                <boxGeometry args={[1.08, 0.96, 1.08]} />
                <meshPhysicalMaterial
                  color="#e0f2fe"
                  transparent
                  opacity={isHovered ? 0.14 : 0.2}
                  roughness={0.04}
                  metalness={0.04}
                  clearcoat={1}
                  clearcoatRoughness={0.04}
                  reflectivity={0.95}
                  envMapIntensity={1.6}
                  depthWrite={false}
                />
              </mesh>

              {/* 4 Brushed Titanium Vertical Corner Mullions */}
              {[
                [-0.54, -0.54],
                [0.54, -0.54],
                [-0.54, 0.54],
                [0.54, 0.54],
              ].map(([cx, cz], cornerIdx) => (
                <mesh key={`post-${cornerIdx}`} position={[cx, 0, cz]}>
                  <cylinderGeometry args={[0.014, 0.014, 0.98, 12]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.2} />
                </mesh>
              ))}

              {/* Vitrine Top Bezel Cap & Subtle Showcase Light Ring */}
              <RoundedBox position={[0, 0.49, 0]} args={[1.12, 0.045, 1.12]} radius={0.015} smoothness={4}>
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
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
              intensity={isHovered ? 4.5 : 2.8}
              distance={2.8}
              decay={1.2}
              color={ex.color}
            />
          </group>
        );
      })}
    </group>
  );
};
