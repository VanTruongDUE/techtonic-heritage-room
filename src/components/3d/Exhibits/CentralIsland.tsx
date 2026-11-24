import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';

const PEDESTAL_SLOTS: Array<{ position: [number, number, number]; color: string; speed: number }> = [
  { position: [0, 1.25, -2], color: '#FFD700', speed: 0.5 },
  { position: [3, 1.25, -5], color: '#00F0FF', speed: 0.4 },
  { position: [0, 1.25, -8], color: '#FF9900', speed: 0.45 },
  { position: [-3, 1.25, -5], color: '#0066FF', speed: 0.5 },
];

export const CentralIsland: React.FC = () => {
  const { setHoveringInteractive, openModal, exhibitItems } = useHeritageStore();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const trophyRefs = useRef<Array<THREE.Group | null>>([]);

  useFrame((_, delta) => {
    PEDESTAL_SLOTS.forEach((slot, idx) => {
      const group = trophyRefs.current[idx];
      if (!group) return;
      const boost = hoveredIdx === idx ? 2.2 : 1;
      group.rotation.y += delta * slot.speed * boost;
      const targetScale = hoveredIdx === idx ? 1.08 : 1;
      group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    });
  });

  const exhibits = useMemo(
    () =>
      PEDESTAL_SLOTS.map((slot, idx) => ({
        ...slot,
        item: exhibitItems[idx] ?? exhibitItems[0],
      })).filter((ex) => Boolean(ex.item)),
    [exhibitItems]
  );

  return (
    <group position={[0, 0, 0]}>
      {/* ================= CENTRAL ISLAND BASE (PHYSICS COLLIDER) ================= */}
      <RigidBody type="fixed" position={[0, 0.2, -5]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[4.6, 4.8, 0.4, 48]} />
          <meshStandardMaterial color="#0c101a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.5, 4.6, 48]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>
      </RigidBody>

      <mesh position={[0, 0.42, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial color="#070a10" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ================= DISPLAY PEDESTALS & GLASS CASES ================= */}
      {exhibits.map((ex, idx) => {
        const isHovered = hoveredIdx === idx;
        const handleOpen = () => openModal('exhibit', ex.item);

        return (
          <group key={ex.item.id}>
            <RigidBody type="fixed" position={[ex.position[0], 0.7, ex.position[2]]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1.2, 0.8, 1.2]} />
                <meshStandardMaterial color="#182338" roughness={0.4} metalness={0.45} />
              </mesh>
              <mesh position={[0, 0.41, 0]}>
                <boxGeometry args={[1.22, 0.04, 1.22]} />
                <meshBasicMaterial color={ex.color} />
              </mesh>
            </RigidBody>

            <mesh position={[ex.position[0], 1.5, ex.position[2]]}>
              <boxGeometry args={[1.1, 0.9, 1.1]} />
              <meshPhysicalMaterial
                transparent
                opacity={isHovered ? 0.22 : 0.3}
                roughness={0.1}
                metalness={0.1}
                transmission={0.9}
                ior={1.5}
              />
            </mesh>

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
                setHoveringInteractive(true, `Xem: ${ex.item.title}`, handleOpen);
              }}
              onPointerOut={() => {
                setHoveredIdx((prev) => (prev === idx ? null : prev));
                setHoveringInteractive(false);
              }}
            >
              <mesh position={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.28, 0.12, 16]} />
                <meshStandardMaterial color="#1a1e28" metalness={0.9} roughness={0.2} />
              </mesh>

              <mesh position={[0, 0.16, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.2, 16]} />
                <meshStandardMaterial color={ex.color} metalness={0.9} roughness={0.1} />
              </mesh>

              <mesh position={[0, 0.35, 0]}>
                <cylinderGeometry args={[0.24, 0.08, 0.25, 16]} />
                <meshStandardMaterial
                  color={ex.color}
                  metalness={0.95}
                  roughness={0.1}
                  emissive={ex.color}
                  emissiveIntensity={isHovered ? 0.65 : 0.25}
                />
              </mesh>

              <mesh position={[0, 0.5, 0]}>
                <octahedronGeometry args={[0.1]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            <pointLight
              position={[ex.position[0], 1.15, ex.position[2]]}
              intensity={isHovered ? 1.8 : 1.0}
              distance={2.8}
              color={ex.color}
            />
          </group>
        );
      })}
    </group>
  );
};
