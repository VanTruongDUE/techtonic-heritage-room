import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier';
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

const CHAMPAGNE_GOLD = '#f0ca6a';
const DEEP_GOLD = '#c99b38';
const OBSIDIAN = '#070c18';
const DARK_MARBLE = '#0d1629';

const PEDESTAL_SLOTS: Array<{
  position: [number, number, number];
  plaqueRotationY: number;
  color: string;
  speed: number;
}> = [
  { position: [0, 1.24, -1.95], plaqueRotationY: 0, color: '#f7ca57', speed: 0.36 },
  { position: [3.05, 1.24, -5], plaqueRotationY: Math.PI / 2, color: '#38bdf8', speed: 0.28 },
  { position: [0, 1.24, -8.05], plaqueRotationY: Math.PI, color: '#f59e0b', speed: 0.34 },
  { position: [-3.05, 1.24, -5], plaqueRotationY: -Math.PI / 2, color: '#60a5fa', speed: 0.36 },
];

const CALYX_RIB_ANGLES = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
const CHANDELIER_LAMP_ANGLES = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
const MONUMENT_FLUTE_ANGLES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

/** Museum-grade 24K Championship Chalice with fluted calyx ribs, twin S-scroll handles & crest medallion */
const ChampionChaliceModel: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  const { cupGeom, leftHandleGeom, rightHandleGeom } = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.185, 0.0),
      new THREE.Vector2(0.185, 0.025),
      new THREE.Vector2(0.155, 0.048),
      new THREE.Vector2(0.12, 0.075),
      new THREE.Vector2(0.062, 0.12),
      new THREE.Vector2(0.045, 0.175),
      new THREE.Vector2(0.068, 0.215), // central decorative stem knop
      new THREE.Vector2(0.042, 0.255),
      new THREE.Vector2(0.065, 0.295),
      new THREE.Vector2(0.125, 0.34),
      new THREE.Vector2(0.195, 0.43),
      new THREE.Vector2(0.228, 0.545),
      new THREE.Vector2(0.244, 0.585), // flared imperial crown lip
      new THREE.Vector2(0.232, 0.598),
      new THREE.Vector2(0.205, 0.575),
      new THREE.Vector2(0.182, 0.45),
      new THREE.Vector2(0.07, 0.35),
      new THREE.Vector2(0.0, 0.35),
    ];
    const cup = new THREE.LatheGeometry(pts, 72);
    cup.computeVertexNormals();

    const makeHandle = (sign: number) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 0.215, 0.54, 0),
        new THREE.Vector3(sign * 0.315, 0.565, 0),
        new THREE.Vector3(sign * 0.34, 0.455, 0),
        new THREE.Vector3(sign * 0.275, 0.355, 0),
        new THREE.Vector3(sign * 0.155, 0.34, 0),
      ]);
      return new THREE.TubeGeometry(curve, 36, 0.017, 18, false);
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
      {/* 2-Tier Stepped Black Granite & 24K Gold Trophy Plinth */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.25, 0.08, 8]} />
        <meshPhysicalMaterial
          color="#0a0f1a"
          roughness={0.18}
          metalness={0.35}
          clearcoat={0.75}
          clearcoatRoughness={0.15}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.21, 0.045, 8]} />
        <meshPhysicalMaterial
          color="#111a2c"
          roughness={0.22}
          metalness={0.4}
          clearcoat={0.6}
        />
      </mesh>
      {/* Curved brushed-gold honor nameplate on front of trophy plinth */}
      <mesh position={[0, 0.042, 0.215]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[0.15, 0.045, 0.012]} />
        <meshPhysicalMaterial
          color={CHAMPAGNE_GOLD}
          metalness={0.96}
          roughness={0.16}
          clearcoat={0.6}
        />
      </mesh>
      {/* Twin gold base trim rings */}
      <mesh position={[0, 0.082, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.205, 0.009, 14, 48]} />
        <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.98} roughness={0.12} clearcoat={0.8} />
      </mesh>

      {/* Main 24K Mirror-Gold Sculpted Chalice */}
      <group position={[0, 0.122, 0]}>
        <mesh geometry={cupGeom} castShadow>
          <meshPhysicalMaterial
            color="#ffd466"
            metalness={0.86}
            roughness={0.19}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
            emissive="#c98a1c"
            emissiveIntensity={hovered ? 0.28 : 0.16}
            envMapIntensity={2.4}
          />
        </mesh>

        {/* Sculpted Lower Calyx Gold Fluted Ribs around bowl */}
        {CALYX_RIB_ANGLES.map((angle, i) => (
          <mesh
            key={`rib-${i}`}
            position={[Math.sin(angle) * 0.155, 0.385, Math.cos(angle) * 0.155]}
            rotation={[Math.cos(angle) * 0.42, angle, -Math.sin(angle) * 0.42]}
          >
            <capsuleGeometry args={[0.0085, 0.095, 6, 12]} />
            <meshPhysicalMaterial
              color="#ffe596"
              metalness={0.88}
              roughness={0.16}
              clearcoat={0.85}
              emissive="#b87e18"
              emissiveIntensity={0.14}
              envMapIntensity={2.3}
            />
          </mesh>
        ))}

        {/* Decorative Waist Laurel Torus Collars */}
        <mesh position={[0, 0.215, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.068, 0.011, 14, 40]} />
          <meshPhysicalMaterial color="#ffe596" metalness={0.88} roughness={0.16} clearcoat={0.85} emissive="#b87e18" emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[0, 0.585, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.238, 0.011, 14, 56]} />
          <meshPhysicalMaterial color="#ffecaa" metalness={0.88} roughness={0.14} clearcoat={0.9} emissive="#c48b1e" emissiveIntensity={0.16} />
        </mesh>

        {/* Twin S-Scroll Ribbon Handles + Ornamental Finial Bosses */}
        <mesh geometry={leftHandleGeom} castShadow>
          <meshPhysicalMaterial color="#ffd466" metalness={0.86} roughness={0.18} clearcoat={0.85} emissive="#c48b1e" emissiveIntensity={0.15} envMapIntensity={2.3} />
        </mesh>
        <mesh geometry={rightHandleGeom} castShadow>
          <meshPhysicalMaterial color="#ffd466" metalness={0.86} roughness={0.18} clearcoat={0.85} emissive="#c48b1e" emissiveIntensity={0.15} envMapIntensity={2.3} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={`finial-${side}`} position={[side * 0.315, 0.562, 0]}>
            <sphereGeometry args={[0.022, 16, 14]} />
            <meshPhysicalMaterial color="#ffe596" metalness={0.98} roughness={0.1} clearcoat={0.9} />
          </mesh>
        ))}

        {/* Embossed TechTonic Hexagonal Crest Medallion on Front Belly */}
        <group position={[0, 0.465, 0.205]} rotation={[-0.22, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.056, 0.062, 0.016, 6]} />
            <meshPhysicalMaterial color="#ffe596" metalness={0.98} roughness={0.12} clearcoat={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.009]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.036, 0.036, 0.008, 6]} />
            <meshStandardMaterial color="#0c2444" emissive="#00F0FF" emissiveIntensity={0.65} roughness={0.2} metalness={0.5} />
          </mesh>
        </group>
      </group>

      {/* Hovering Faceted Diamond Star above Imperial Rim */}
      <mesh position={[0, 0.77, 0]} rotation={[0.35, 0.6, 0]}>
        <octahedronGeometry args={[0.052, 0]} />
        <meshPhysicalMaterial
          color="#e0f7ff"
          roughness={0.02}
          metalness={0.08}
          clearcoat={1}
          ior={1.85}
          emissive="#38bdf8"
          emissiveIntensity={hovered ? 0.55 : 0.22}
          envMapIntensity={2.4}
        />
      </mesh>
    </group>
  );
};

/** Luxury Double-Molded Gilded Frame & Honor Certificate on Precision Brass Easel */
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
      {/* Sculpted Brushed-Gold A-Frame Museum Easel */}
      {[-0.145, 0.145].map((ex, i) => (
        <mesh key={`easel-leg-${i}`} position={[ex, 0.29, -0.05]} rotation={[0.22, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.015, 0.58, 16]} />
          <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.95} roughness={0.18} clearcoat={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.27, -0.17]} rotation={[-0.36, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.014, 0.56, 16]} />
        <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.95} roughness={0.18} clearcoat={0.6} />
      </mesh>
      {/* Top crown crossbar & horizontal display ledge */}
      <mesh position={[0, 0.55, -0.11]}>
        <boxGeometry args={[0.33, 0.02, 0.024]} />
        <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.95} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.085, 0.095]}>
        <boxGeometry args={[0.46, 0.024, 0.05]} />
        <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.7} />
      </mesh>

      {/* Ornate Double-Molded Obsidian & Gilded Frame */}
      <group position={[0, 0.365, 0.025]} rotation={[-0.22, 0, 0]}>
        <RoundedBox args={[0.52, 0.64, 0.044]} radius={0.014} smoothness={4} castShadow>
          <meshPhysicalMaterial
            color="#0e1628"
            metalness={0.72}
            roughness={0.22}
            clearcoat={0.75}
            emissive="#0ea5e9"
            emissiveIntensity={hovered ? 0.18 : 0.03}
          />
        </RoundedBox>
        {/* Inner gilded perimeter fillet */}
        <RoundedBox position={[0, 0, 0.012]} args={[0.465, 0.585, 0.026]} radius={0.008} smoothness={4}>
          <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.8} />
        </RoundedBox>
        {/* 4 Sculpted Royal Brass Corner Caps */}
        {[
          [-0.235, 0.295],
          [0.235, 0.295],
          [-0.235, -0.295],
          [0.235, -0.295],
        ].map(([bx, by], i) => (
          <mesh key={`corner-${i}`} position={[bx, by, 0.019]}>
            <boxGeometry args={[0.055, 0.055, 0.024]} />
            <meshPhysicalMaterial color="#ffe082" metalness={0.98} roughness={0.14} clearcoat={0.8} />
          </mesh>
        ))}

        {/* Certificate Artwork */}
        <mesh position={[0, 0, 0.026]}>
          <planeGeometry args={[0.425, 0.545]} />
          <meshStandardMaterial
            map={certTex}
            emissive="#ffffff"
            emissiveMap={certTex}
            emissiveIntensity={0.14}
            roughness={0.32}
          />
        </mesh>

        {/* 3D Embossed Royal Gold Crest Seal + Ribbon Tails */}
        <group position={[0.13, -0.175, 0.032]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.034, 0.038, 0.012, 16]} />
            <meshPhysicalMaterial color="#f6c750" metalness={0.98} roughness={0.14} clearcoat={0.9} />
          </mesh>
          <mesh position={[-0.012, -0.042, -0.003]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.014, 0.055, 0.004]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.55} />
          </mesh>
          <mesh position={[0.012, -0.042, -0.003]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.014, 0.055, 0.004]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.55} />
          </mesh>
        </group>

        {/* Protective Anti-Reflective Glass Glazing */}
        <mesh position={[0, 0, 0.036]}>
          <planeGeometry args={[0.435, 0.555]} />
          <meshPhysicalMaterial
            color="#f0f9ff"
            transparent
            opacity={0.12}
            roughness={0.03}
            clearcoat={1}
            reflectivity={1}
          />
        </mesh>
      </group>
    </group>
  );
};

/** Imperial Celestial Armillary Tech-Sphere Award */
const HackathonGlobeModel: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  return (
    <group>
      {/* Stepped Granite & Gold Base */}
      <mesh position={[0, 0.045, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.24, 0.09, 8]} />
        <meshPhysicalMaterial color="#0b1120" roughness={0.2} metalness={0.38} clearcoat={0.7} />
      </mesh>
      <mesh position={[0, 0.095, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.205, 0.009, 14, 48]} />
        <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.98} roughness={0.12} clearcoat={0.8} />
      </mesh>
      {/* Fluted Gold Column & Cradle Cup */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.095, 0.15, 24]} />
        <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.14} clearcoat={0.8} />
      </mesh>

      {/* Armillary Sphere Assembly */}
      <group position={[0, 0.45, 0]}>
        {/* Faceted Sapphire-Gold Luminous Core */}
        <mesh castShadow>
          <icosahedronGeometry args={[0.125, 2]} />
          <meshPhysicalMaterial
            color="#f5c754"
            metalness={0.95}
            roughness={0.12}
            clearcoat={0.95}
            emissive="#f59e0b"
            emissiveIntensity={hovered ? 0.34 : 0.14}
            envMapIntensity={2.3}
          />
        </mesh>
        {/* Inner glowing cyan tech lattice */}
        <mesh>
          <icosahedronGeometry args={[0.132, 1]} />
          <meshBasicMaterial color="#00F0FF" wireframe transparent opacity={0.45} />
        </mesh>

        {/* 4 Interlocking Graduated Gold & Titanium Meridian Rings */}
        <mesh rotation={[Math.PI / 3, 0.35, 0]}>
          <torusGeometry args={[0.22, 0.016, 20, 64]} />
          <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.98} roughness={0.12} clearcoat={0.85} envMapIntensity={2.3} />
        </mesh>
        <mesh rotation={[-Math.PI / 3, -0.35, 0]}>
          <torusGeometry args={[0.245, 0.013, 20, 64]} />
          <meshPhysicalMaterial color="#e2e8f0" metalness={0.95} roughness={0.14} clearcoat={0.8} envMapIntensity={2.2} />
        </mesh>
        <mesh rotation={[0.15, Math.PI / 4, Math.PI / 2]}>
          <torusGeometry args={[0.205, 0.012, 16, 64]} />
          <meshPhysicalMaterial color="#7dd3fc" metalness={0.92} roughness={0.16} clearcoat={0.85} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.262, 0.011, 16, 64]} />
          <meshPhysicalMaterial color={DEEP_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.8} />
        </mesh>

        {/* Diagonal Polar Finial Axis Spear */}
        <group rotation={[0, 0, -0.38]}>
          <mesh>
            <cylinderGeometry args={[0.008, 0.008, 0.62, 12]} />
            <meshPhysicalMaterial color="#ffe596" metalness={0.98} roughness={0.12} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <octahedronGeometry args={[0.026, 0]} />
            <meshPhysicalMaterial color="#e0f7ff" clearcoat={1} roughness={0.04} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

/** Sculpted Faceted Sapphire-Obsidian Crystal Tower Award with Inner Glowing Helix Core */
const CrystalObeliskModel: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  return (
    <group>
      {/* Stepped Hexagonal Black Granite & Champagne-Gold Plinth */}
      <mesh position={[0, 0.045, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.24, 0.09, 6]} />
        <meshPhysicalMaterial color="#0b1120" roughness={0.18} metalness={0.4} clearcoat={0.75} />
      </mesh>
      <mesh position={[0, 0.115, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.195, 0.05, 6]} />
        <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.14} clearcoat={0.8} />
      </mesh>

      {/* Outer Translucent Faceted Sapphire Crystal Tower */}
      <mesh position={[0, 0.415, 0]} castShadow>
        <cylinderGeometry args={[0.058, 0.155, 0.55, 6]} />
        <meshPhysicalMaterial
          color="#1d6fd8"
          transparent
          opacity={0.78}
          roughness={0.04}
          metalness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.03}
          ior={1.78}
          emissive="#0284c7"
          emissiveIntensity={hovered ? 0.38 : 0.16}
          envMapIntensity={2.3}
        />
      </mesh>

      {/* Internal Glowing TechTonic Gold-Cyan Energy Core */}
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.018, 0.052, 0.44, 6]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={hovered ? 1.4 : 0.85}
          roughness={0.1}
        />
      </mesh>

      {/* Dual Tilted Precision Champagne-Gold Orbital Accent Collars */}
      <mesh position={[0, 0.32, 0]} rotation={[0.38, 0.25, 0.22]}>
        <torusGeometry args={[0.178, 0.011, 14, 48]} />
        <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.98} roughness={0.12} clearcoat={0.85} />
      </mesh>
      <mesh position={[0, 0.49, 0]} rotation={[-0.36, -0.3, -0.2]}>
        <torusGeometry args={[0.135, 0.01, 14, 48]} />
        <meshPhysicalMaterial color="#e2e8f0" metalness={0.96} roughness={0.14} clearcoat={0.85} />
      </mesh>

      {/* Razor-Sharp Faceted Diamond Apex */}
      <mesh position={[0, 0.735, 0]}>
        <coneGeometry args={[0.058, 0.095, 6]} />
        <meshPhysicalMaterial
          color="#e0f7ff"
          clearcoat={1}
          roughness={0.02}
          ior={1.9}
          emissive="#7dd3fc"
          emissiveIntensity={hovered ? 0.5 : 0.2}
          envMapIntensity={2.4}
        />
      </mesh>
    </group>
  );
};

export const CentralIsland: React.FC = () => {
  const { setHoveringInteractive, openModal, exhibitItems } = useHeritageStore();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const trophyRefs = useRef<Array<THREE.Group | null>>([]);
  const sovereignCoreRef = useRef<THREE.Group>(null);
  const gyroRing1Ref = useRef<THREE.Mesh>(null);
  const gyroRing2Ref = useRef<THREE.Mesh>(null);
  const gyroRing3Ref = useRef<THREE.Mesh>(null);

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

  // Regal Obsidian & Champagne-Gold Floor Medallion Ring around Central Sovereign Monument
  const centerMedallionTex = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(1024, 1024, 1.5);
    if (ctx) {
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, 1024, 1024);

      const radGrad = ctx.createRadialGradient(512, 512, 120, 512, 512, 500);
      radGrad.addColorStop(0, '#16243d');
      radGrad.addColorStop(0.65, '#0d1628');
      radGrad.addColorStop(1, '#080e1a');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Double champagne-gold imperial compass border
      ctx.strokeStyle = '#e4bc5c';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(512, 512, 476, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(228, 188, 92, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(512, 512, 444, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(512, 512, 340, 0, Math.PI * 2);
      ctx.stroke();

      // 36 precision compass degree ticks
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const inner = i % 3 === 0 ? 412 : 426;
        ctx.strokeStyle = i % 3 === 0 ? '#e4bc5c' : 'rgba(228, 188, 92, 0.35)';
        ctx.lineWidth = i % 3 === 0 ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(512 + Math.cos(a) * inner, 512 + Math.sin(a) * inner);
        ctx.lineTo(512 + Math.cos(a) * 442, 512 + Math.sin(a) * 442);
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8e3a3';
      ctx.font = '800 40px Inter, sans-serif';
      ctx.fillText('TECHTONIC • HALL OF FAME', 512, 134);
      ctx.fillText('DREAM IT • CODE IT', 512, 916);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  // Engraved Wraparound Crest Plaque for the Central Sovereign Monument
  const sovereignPlaqueTex = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(1024, 256, 1.5);
    if (ctx) {
      ctx.fillStyle = '#090f1c';
      ctx.fillRect(0, 0, 1024, 256);
      ctx.strokeStyle = '#e4bc5c';
      ctx.lineWidth = 8;
      ctx.strokeRect(12, 12, 1000, 232);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, 976, 208);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#e4bc5c';
      ctx.font = '700 28px "JetBrains Mono", monospace';
      ctx.fillText('CLB HỌC THUẬT CÔNG NGHỆ • DUE ĐÀ NẴNG', 512, 86);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 56px Inter, sans-serif';
      ctx.fillText('ĐẢO VINH DANH TECHTONIC', 512, 156);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.fillText('EST. 2024  •  DREAM IT - CODE IT  •  HALL OF HONOR', 512, 208);
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
      sovereignPlaqueTex.dispose();
    };
  }, [marbleMaps, metalMaps, centerMedallionTex, sovereignPlaqueTex]);

  useEffect(() => {
    return () => {
      exhibits.forEach((ex) => ex.plaqueTex?.dispose());
    };
  }, [exhibits]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    PEDESTAL_SLOTS.forEach((slot, idx) => {
      const group = trophyRefs.current[idx];
      if (!group) return;
      const boost = hoveredIdx === idx ? 2.1 : 1;
      group.rotation.y += delta * slot.speed * boost;
      const targetScale = hoveredIdx === idx ? 1.07 : 1;
      const nextScale = THREE.MathUtils.lerp(group.scale.x, targetScale, 1 - Math.exp(-9 * Math.min(delta, 0.05)));
      group.scale.setScalar(nextScale);
    });

    // Regal Sovereign Crest Core floating majestically above the surrounding vitrines
    if (sovereignCoreRef.current) {
      sovereignCoreRef.current.position.y = 3.22 + Math.sin(t * 1.4) * 0.06;
      sovereignCoreRef.current.rotation.y += delta * 0.35;
    }
    if (gyroRing1Ref.current) {
      gyroRing1Ref.current.rotation.z += delta * 0.42;
      gyroRing1Ref.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.5) * 0.12;
    }
    if (gyroRing2Ref.current) {
      gyroRing2Ref.current.rotation.y -= delta * 0.34;
      gyroRing2Ref.current.rotation.z = -Math.PI / 4 + Math.cos(t * 0.4) * 0.1;
    }
    if (gyroRing3Ref.current) {
      gyroRing3Ref.current.rotation.x += delta * 0.28;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ================= 3-TIER IMPERIAL OBSIDIAN & CHAMPAGNE-GOLD DAIS ================= */}
      <RigidBody type="fixed" colliders={false} position={[0, 0.18, -5]}>
        <CylinderCollider args={[0.18, 5.1]} position={[0, 0, 0]} />
        <CylinderCollider args={[0.25, 1.8]} position={[0, 0.25, 0]} />
        {/* Tier 1: Wide Grounded Obsidian Plinth + Warm Gold Under-Glow Halo */}
        <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[5.05, 5.22, 0.16, 64]} />
          <meshPhysicalMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#152036"
            roughness={0.28}
            metalness={0.36}
            clearcoat={0.45}
          />
        </mesh>
        {/* Warm recessed champagne-gold step light under Tier 1 */}
        <mesh position={[0, -0.168, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.15, 5.26, 64]} />
          <meshBasicMaterial color={CHAMPAGNE_GOLD} toneMapped={false} />
        </mesh>
        {/* Brushed gold outer riser band */}
        <mesh position={[0, -0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.95, 5.05, 64]} />
          <meshPhysicalMaterial
            color={CHAMPAGNE_GOLD}
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.95}
            roughness={0.18}
            clearcoat={0.6}
          />
        </mesh>

        {/* Tier 2: Main Honed Nero-Marble Exhibition Deck */}
        <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[4.68, 4.8, 0.2, 64]} />
          <meshPhysicalMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.007}
            color={DARK_MARBLE}
            roughness={0.26}
            metalness={0.38}
            clearcoat={0.5}
          />
        </mesh>
        {/* Brushed Champagne-Gold Deck Perimeter Inlay + Precision Cyan Hairline */}
        <mesh position={[0, 0.183, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.56, 4.67, 64]} />
          <meshPhysicalMaterial
            color={CHAMPAGNE_GOLD}
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.95}
            roughness={0.18}
            clearcoat={0.7}
          />
        </mesh>
        <mesh position={[0, 0.185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.46, 4.5, 64]} />
          <meshBasicMaterial color="#00F0FF" toneMapped={false} />
        </mesh>

        {/* 4 Brushed-Gold Radial Honor Processional Strips connecting Center to the 4 Vitrines */}
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ang, i) => (
          <mesh
            key={`radial-strip-${i}`}
            position={[Math.sin(ang) * 2.45, 0.184, Math.cos(ang) * 2.45]}
            rotation={[0, ang, 0]}
          >
            <boxGeometry args={[0.14, 0.008, 2.2]} />
            <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.95} roughness={0.18} />
          </mesh>
        ))}

        {/* Tier 3: Elevated Inner Sovereign Throne Plinth */}
        <mesh position={[0, 0.26, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.66, 1.82, 0.16, 8]} />
          <meshPhysicalMaterial
            color={OBSIDIAN}
            roughness={0.22}
            metalness={0.45}
            clearcoat={0.65}
          />
        </mesh>
        <mesh position={[0, 0.343, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.56, 1.66, 32]} />
          <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.8} />
        </mesh>
        <mesh position={[0, 0.186, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 1.87, 32]} />
          <meshBasicMaterial color="#fbbf24" toneMapped={false} />
        </mesh>
      </RigidBody>

      {/* Engraved Imperial Medallion on Elevated Inner Sovereign Stage */}
      <mesh position={[0, 0.525, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.54, 64]} />
        <meshStandardMaterial map={centerMedallionTex} roughness={0.26} metalness={0.5} />
      </mesh>

      {/* ================= CENTRAL TECHTONIC SOVEREIGN MONUMENT & ROYAL CROWN HALO ================= */}
      <group position={[0, 0, -5]}>
        {/* Sculpted Tall Octagonal Fluted Obsidian & Gold Sovereign Column */}
        <RigidBody type="fixed" colliders={false}>
          <CylinderCollider args={[0.95, 0.56]} position={[0, 1.45, 0]} />
          <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.34, 0.54, 1.76, 8]} />
            <meshPhysicalMaterial
              color="#0b1220"
              roughnessMap={metalMaps.roughnessMap}
              roughness={0.24}
              metalness={0.55}
              clearcoat={0.7}
            />
          </mesh>
          {/* 8 Vertical Champagne-Gold Fluted Column Ribs */}
          {MONUMENT_FLUTE_ANGLES.map((ang, i) => (
            <mesh
              key={`mon-flute-${i}`}
              position={[Math.sin(ang) * 0.43, 1.4, Math.cos(ang) * 0.43]}
              rotation={[0, ang, 0]}
            >
              <boxGeometry args={[0.032, 1.7, 0.04]} />
              <meshPhysicalMaterial
                color={CHAMPAGNE_GOLD}
                metalness={0.92}
                roughness={0.18}
                clearcoat={0.75}
                emissive="#a67418"
                emissiveIntensity={0.12}
              />
            </mesh>
          ))}
          {/* Flared Imperial Gold Capital Crown */}
          <mesh position={[0, 2.33, 0]} castShadow>
            <cylinderGeometry args={[0.52, 0.36, 0.12, 8]} />
            <meshPhysicalMaterial
              color={CHAMPAGNE_GOLD}
              metalness={0.92}
              roughness={0.16}
              clearcoat={0.85}
              emissive="#b8821d"
              emissiveIntensity={0.14}
            />
          </mesh>
          <mesh position={[0, 2.41, 0]}>
            <cylinderGeometry args={[0.42, 0.46, 0.045, 8]} />
            <meshStandardMaterial color="#0b1322" roughness={0.25} metalness={0.6} />
          </mesh>
          {/* Glowing Golden & Cyan Emitter Dish under Floating Crown Core */}
          <mesh position={[0, 2.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.24, 0.35, 48]} />
            <meshBasicMaterial color="#00F0FF" toneMapped={false} />
          </mesh>
        </RigidBody>

        {/* Front & Back Illuminated Sovereign Monument Plaques */}
        {[0, Math.PI].map((rotY, idx) => (
          <group
            key={`sov-plaque-${idx}`}
            position={[0, 1.92, idx === 0 ? 0.41 : -0.41]}
            rotation={[0, rotY, 0]}
          >
            <RoundedBox args={[0.66, 0.18, 0.024]} radius={0.008} smoothness={4}>
              <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.95} roughness={0.18} />
            </RoundedBox>
            <mesh position={[0, 0, 0.014]}>
              <planeGeometry args={[0.61, 0.145]} />
              <meshStandardMaterial
                map={sovereignPlaqueTex}
                emissive="#ffffff"
                emissiveMap={sovereignPlaqueTex}
                emissiveIntensity={0.34}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}

        {/* Floating Sculpted Gold & Sapphire TechTonic Sovereign Crown Core */}
        <group ref={sovereignCoreRef} position={[0, 3.22, 0]}>
          {/* Outer Sculpted Gold Hexagonal Crest Ring */}
          <mesh rotation={[0, 0, Math.PI / 6]} castShadow>
            <torusGeometry args={[0.31, 0.048, 8, 6]} />
            <meshPhysicalMaterial
              color="#ffd466"
              metalness={0.88}
              roughness={0.16}
              clearcoat={0.9}
              emissive="#c48b1e"
              emissiveIntensity={0.2}
              envMapIntensity={2.4}
            />
          </mesh>
          {/* Inner Chamfered Obsidian-Titanium Hex Bezel */}
          <mesh rotation={[0, 0, Math.PI / 6]}>
            <torusGeometry args={[0.19, 0.022, 8, 6]} />
            <meshPhysicalMaterial color="#cbd5e1" metalness={0.95} roughness={0.16} clearcoat={0.8} />
          </mesh>
          {/* Radiant Sapphire-Cyan Crystal Core Orb */}
          <mesh>
            <icosahedronGeometry args={[0.105, 2]} />
            <meshPhysicalMaterial
              color="#38bdf8"
              emissive="#00F0FF"
              emissiveIntensity={0.85}
              roughness={0.04}
              metalness={0.12}
              clearcoat={1}
              ior={1.8}
              envMapIntensity={2.4}
            />
          </mesh>

          {/* 3 Counter-Rotating Precision Brushed-Gold & Cyan Gyroscopic Rings */}
          <mesh ref={gyroRing1Ref} rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[0.45, 0.013, 16, 64]} />
            <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.98} roughness={0.12} clearcoat={0.85} envMapIntensity={2.3} />
          </mesh>
          <mesh ref={gyroRing2Ref} rotation={[-Math.PI / 4, 0.4, 0]}>
            <torusGeometry args={[0.56, 0.01, 16, 64]} />
            <meshPhysicalMaterial color="#e2e8f0" metalness={0.95} roughness={0.14} clearcoat={0.8} />
          </mesh>
          <mesh ref={gyroRing3Ref} rotation={[Math.PI / 2, 0.2, 0]}>
            <torusGeometry args={[0.66, 0.008, 12, 72]} />
            <meshBasicMaterial color="#00F0FF" transparent opacity={0.72} toneMapped={false} />
          </mesh>
        </group>

        {/* Suspended Architectural Royal Gold Crown Chandelier Halo Overhead */}
        <group position={[0, 5.58, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.55, 0.055, 18, 72]} />
            <meshPhysicalMaterial
              color={CHAMPAGNE_GOLD}
              roughnessMap={metalMaps.roughnessMap}
              metalness={0.96}
              roughness={0.16}
              clearcoat={0.8}
              envMapIntensity={2.2}
            />
          </mesh>
          <mesh position={[0, -0.048, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.46, 2.54, 72]} />
            <meshBasicMaterial color="#fde68a" toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
          {/* 12 Recessed Downward Jewel Crown Lamps */}
          {CHANDELIER_LAMP_ANGLES.map((ang, i) => (
            <mesh
              key={`halo-lamp-${i}`}
              position={[Math.sin(ang) * 2.55, -0.062, Math.cos(ang) * 2.55]}
            >
              <sphereGeometry args={[0.032, 12, 10]} />
              <meshBasicMaterial color={i % 3 === 0 ? '#00F0FF' : '#fef08a'} toneMapped={false} />
            </mesh>
          ))}
          {/* 4 Ultra-Slim Brushed Titanium Suspension Cables to Ceiling */}
          {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ang, i) => (
            <mesh
              key={`halo-cable-${i}`}
              position={[Math.sin(ang) * 2.55, 0.45, Math.cos(ang) * 2.55]}
            >
              <cylinderGeometry args={[0.009, 0.009, 0.9, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ================= 4 ARCHITECTURAL LUXURY MUSEUM VITRINES & HERO AWARDS ================= */}
      {exhibits.map((ex, idx) => {
        const isHovered = hoveredIdx === idx;
        const handleOpen = () => openModal('exhibit', ex.item);

        return (
          <group key={ex.item.id}>
            {/* Sculpted Obsidian & Champagne-Gold Museum Plinth */}
            <RigidBody type="fixed" colliders={false} position={[ex.position[0], 0.78, ex.position[2]]}>
              <CuboidCollider args={[0.66, 0.48, 0.66]} position={[0, 0.05, 0]} />
              {/* Grounded Stepped Base Foot + Recessed Gold Toe-Kick Light */}
              <RoundedBox position={[0, -0.36, 0]} args={[1.34, 0.12, 1.34]} radius={0.02} smoothness={4} castShadow receiveShadow>
                <meshPhysicalMaterial color="#090f1c" roughness={0.26} metalness={0.42} clearcoat={0.5} />
              </RoundedBox>
              <mesh position={[0, -0.292, 0]}>
                <boxGeometry args={[1.25, 0.016, 1.25]} />
                <meshBasicMaterial color={ex.color} toneMapped={false} />
              </mesh>

              {/* Main Obsidian Marble Pedestal Body */}
              <RoundedBox position={[0, 0.04, 0]} args={[1.2, 0.72, 1.2]} radius={0.03} smoothness={6} castShadow receiveShadow>
                <meshPhysicalMaterial
                  map={marbleMaps.map}
                  roughnessMap={marbleMaps.roughnessMap}
                  bumpMap={marbleMaps.bumpMap}
                  bumpScale={0.007}
                  color="#141e33"
                  roughness={0.26}
                  metalness={0.38}
                  clearcoat={0.55}
                />
              </RoundedBox>

              {/* 4 Vertical Brushed Champagne-Gold Corner Inlay Flutes */}
              {[
                [-0.59, -0.59],
                [0.59, -0.59],
                [-0.59, 0.59],
                [0.59, 0.59],
              ].map(([fx, fz], fi) => (
                <mesh key={`plinth-flute-${fi}`} position={[fx, 0.04, fz]}>
                  <boxGeometry args={[0.04, 0.68, 0.04]} />
                  <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.8} />
                </mesh>
              ))}

              {/* Thick Beveled Champagne-Gold Capital Cornice Collar */}
              <RoundedBox position={[0, 0.425, 0]} args={[1.28, 0.055, 1.28]} radius={0.015} smoothness={4} castShadow>
                <meshPhysicalMaterial
                  color={CHAMPAGNE_GOLD}
                  roughnessMap={metalMaps.roughnessMap}
                  bumpMap={metalMaps.bumpMap}
                  bumpScale={0.003}
                  metalness={0.96}
                  roughness={0.16}
                  clearcoat={0.8}
                />
              </RoundedBox>

              {/* Deep Velvet Showcase Deck + Circular Brushed-Gold Turntable Riser */}
              <RoundedBox position={[0, 0.462, 0]} args={[1.0, 0.028, 1.0]} radius={0.01} smoothness={4} receiveShadow>
                <meshStandardMaterial color="#0b1222" roughness={0.94} metalness={0.04} />
              </RoundedBox>
              <mesh position={[0, 0.486, 0]} receiveShadow>
                <cylinderGeometry args={[0.35, 0.38, 0.032, 48]} />
                <meshPhysicalMaterial color="#121c30" roughness={0.28} metalness={0.48} clearcoat={0.6} />
              </mesh>
              <mesh position={[0, 0.503, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.33, 0.355, 48]} />
                <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.98} roughness={0.14} />
              </mesh>
            </RigidBody>

            {/* Gilded Brass-Framed Museum Nameplate Plaque */}
            {ex.plaqueTex && (
              <group
                position={[
                  ex.position[0] + Math.sin(ex.plaqueRotationY) * 0.625,
                  0.88,
                  ex.position[2] + Math.cos(ex.plaqueRotationY) * 0.625,
                ]}
                rotation={[-0.14, ex.plaqueRotationY, 0]}
              >
                <RoundedBox args={[0.84, 0.27, 0.03]} radius={0.01} smoothness={4}>
                  <meshPhysicalMaterial
                    color={CHAMPAGNE_GOLD}
                    roughnessMap={metalMaps.roughnessMap}
                    metalness={0.96}
                    roughness={0.18}
                    clearcoat={0.75}
                  />
                </RoundedBox>
                <mesh position={[0, 0, 0.017]}>
                  <planeGeometry args={[0.77, 0.22]} />
                  <meshStandardMaterial
                    map={ex.plaqueTex}
                    emissive="#ffffff"
                    emissiveMap={ex.plaqueTex}
                    emissiveIntensity={0.34}
                    roughness={0.32}
                    metalness={0.1}
                  />
                </mesh>
              </group>
            )}

            {/* Ultra-Clear Anti-Reflective Glass Vitrine with Brushed Gold Frame & Cornice */}
            <group position={[ex.position[0], 1.75, ex.position[2]]}>
              <mesh>
                <boxGeometry args={[1.1, 1.02, 1.1]} />
                <meshPhysicalMaterial
                  color="#e0f2fe"
                  transparent
                  opacity={isHovered ? 0.09 : 0.14}
                  roughness={0.02}
                  metalness={0.04}
                  clearcoat={1}
                  clearcoatRoughness={0.02}
                  reflectivity={1}
                  envMapIntensity={2.2}
                  depthWrite={false}
                />
              </mesh>

              {/* 4 Slim Brushed Champagne-Gold Corner Mullions & Luxury Brackets */}
              {[
                [-0.55, -0.55],
                [0.55, -0.55],
                [-0.55, 0.55],
                [0.55, 0.55],
              ].map(([cx, cz], cornerIdx) => (
                <group key={`post-${cornerIdx}`} position={[cx, 0, cz]}>
                  <mesh>
                    <cylinderGeometry args={[0.014, 0.014, 1.04, 12]} />
                    <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.8} />
                  </mesh>
                  {[-0.48, 0.48].map((cy) => (
                    <mesh key={`clamp-${cy}`} position={[0, cy, 0]}>
                      <boxGeometry args={[0.052, 0.058, 0.052]} />
                      <meshPhysicalMaterial color="#ffe082" metalness={0.98} roughness={0.14} clearcoat={0.85} />
                    </mesh>
                  ))}
                </group>
              ))}

              {/* Architectural Top Cornice Cap with Gold Trim & 4 Recessed Pin-Spot Emitters */}
              <RoundedBox position={[0, 0.53, 0]} args={[1.2, 0.072, 1.2]} radius={0.018} smoothness={4}>
                <meshPhysicalMaterial
                  color="#0d1526"
                  roughnessMap={metalMaps.roughnessMap}
                  metalness={0.78}
                  roughness={0.22}
                  clearcoat={0.6}
                />
              </RoundedBox>
              <RoundedBox position={[0, 0.57, 0]} args={[1.14, 0.018, 1.14]} radius={0.008} smoothness={4}>
                <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.8} />
              </RoundedBox>
              {/* Soft halo ring + 4 corner gallery pin-spot lenses inside vitrine ceiling */}
              <mesh position={[0, 0.492, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.28, 0.34, 48]} />
                <meshBasicMaterial color={ex.color} toneMapped={false} />
              </mesh>
              {[
                [-0.36, -0.36],
                [0.36, -0.36],
                [-0.36, 0.36],
                [0.36, 0.36],
              ].map(([px, pz], pi) => (
                <mesh key={`pinspot-${pi}`} position={[px, 0.49, pz]} rotation={[Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.032, 16]} />
                  <meshBasicMaterial color="#fff7df" toneMapped={false} />
                </mesh>
              ))}
            </group>

            {/* Interactive Sculpted Hero Award inside Vitrine */}
            <group
              ref={(el) => {
                trophyRefs.current[idx] = el;
              }}
              position={[ex.position[0], 1.285, ex.position[2]]}
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
              {idx === 0 && <ChampionChaliceModel hovered={isHovered} />}
              {idx === 1 && <CertificateEaselModel item={ex.item} hovered={isHovered} />}
              {idx === 2 && <HackathonGlobeModel hovered={isHovered} />}
              {idx >= 3 && <CrystalObeliskModel hovered={isHovered} />}
            </group>
          </group>
        );
      })}
    </group>
  );
};
