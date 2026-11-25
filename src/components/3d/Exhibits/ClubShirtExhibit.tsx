import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import {
  createBrushedMetalMaps,
  createFabricMaps,
  createMarbleMaps,
  createPedestalPlaqueTexture,
} from '../utils/proceduralMaterials';

interface ClubShirtExhibitProps {
  onInteract: () => void;
  onHoverChange: (hovering: boolean) => void;
}

/**
 * Generates an organic lofted torso BufferGeometry (smooth chest contour, tapered waist,
 * natural sloping shoulders, and subtle cotton hem drape folds).
 */
function createSculptedTorsoGeometry(): THREE.BufferGeometry {
  const radialSegs = 64;
  const heightSegs = 32;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= heightSegs; iy++) {
    const v = iy / heightSegs; // 0 = bottom hem (-0.58), 1 = neckband (+0.58)
    const y = -0.58 + v * 1.16;

    // Smooth torso silhouette profile: bottom hem -> waist taper -> broad chest -> tapered collar shoulder slope
    let rx: number;
    let rzFront: number;
    let rzBack: number;

    if (v < 0.35) {
      const t = v / 0.35;
      const ease = t * t * (3 - 2 * t);
      rx = THREE.MathUtils.lerp(0.415, 0.39, ease);
      rzFront = THREE.MathUtils.lerp(0.205, 0.195, ease);
      rzBack = THREE.MathUtils.lerp(0.185, 0.18, ease);
    } else if (v < 0.72) {
      const t = (v - 0.35) / 0.37;
      const ease = t * t * (3 - 2 * t);
      rx = THREE.MathUtils.lerp(0.39, 0.465, ease);
      rzFront = THREE.MathUtils.lerp(0.195, 0.242, ease);
      rzBack = THREE.MathUtils.lerp(0.18, 0.208, ease);
    } else {
      const t = (v - 0.72) / 0.28;
      const ease = Math.pow(t, 1.35);
      rx = THREE.MathUtils.lerp(0.465, 0.165, ease);
      rzFront = THREE.MathUtils.lerp(0.242, 0.155, ease);
      rzBack = THREE.MathUtils.lerp(0.208, 0.148, ease);
    }

    // Subtle anatomical drop across shoulders/back at very top
    const shoulderDrop = v > 0.72 ? Math.pow((v - 0.72) / 0.28, 1.6) * 0.055 : 0;

    for (let ix = 0; ix <= radialSegs; ix++) {
      const u = ix / radialSegs;
      const theta = u * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Gentle vertical fabric drape folds near waist/hem
      const foldWeight = Math.max(0, 1 - v * 1.45);
      const drapeFold = Math.sin(theta * 5 + 0.6) * 0.006 * foldWeight;

      // Subtle squaring of the shoulder-chest box into rounded oval
      const superFactor = 0.045 * Math.cos(theta * 2) * (v > 0.3 && v < 0.88 ? 1 : 0.3);

      const x = cosT * (rx + drapeFold + superFactor);
      const rz = sinT >= 0 ? rzFront : rzBack;
      const z = sinT * (rz + drapeFold * 0.75);

      // Gentle collar notch dip at front center top (sinT > 0, cosT ~ 0, v > 0.88)
      const neckDip =
        v > 0.86 && sinT > 0.25
          ? ((v - 0.86) / 0.14) * Math.pow(sinT, 1.4) * 0.065
          : 0;

      const py = y - Math.abs(cosT) * shoulderDrop - neckDip;

      positions.push(x, py, z);
      uvs.push(u, v);
    }
  }

  for (let iy = 0; iy < heightSegs; iy++) {
    for (let ix = 0; ix < radialSegs; ix++) {
      const a = iy * (radialSegs + 1) + ix;
      const b = a + radialSegs + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates a smooth curved raglan sleeve tapering from deltoid shoulder cap down to cuffed hem.
 */
function createSculptedSleeveGeometry(side: -1 | 1): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.35, 0.32, 0.0),
    new THREE.Vector3(side * 0.46, 0.27, 0.008),
    new THREE.Vector3(side * 0.56, 0.16, 0.016),
    new THREE.Vector3(side * 0.62, 0.03, 0.022),
  ]);

  const lengthSegs = 24;
  const radialSegs = 40;
  const frames = curve.computeFrenetFrames(lengthSegs, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= lengthSegs; i++) {
    const t = i / lengthSegs;
    const pt = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];

    // Smooth tailored transition from embedded armhole inside shoulder to sleek cuff
    const armholeEase = t < 0.2 ? THREE.MathUtils.lerp(0.145, 0.158, t / 0.2) : 0.158;
    const rMain = THREE.MathUtils.lerp(armholeEase, 0.128, Math.pow(t, 0.9));
    const rDepth = THREE.MathUtils.lerp(armholeEase * 0.94, 0.122, Math.pow(t, 0.9));

    for (let j = 0; j <= radialSegs; j++) {
      const theta = (j / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const vx = pt.x + (N.x * cos * rMain + B.x * sin * rDepth);
      const vy = pt.y + (N.y * cos * rMain + B.y * sin * rDepth);
      const vz = pt.z + (N.z * cos * rMain + B.z * sin * rDepth);

      positions.push(vx, vy, vz);
      uvs.push(j / radialSegs, t);
    }
  }

  for (let i = 0; i < lengthSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * (radialSegs + 1) + j;
      const b = a + radialSegs + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Tailored smooth 3D Polo Shirt mounted on an anatomical mannequin & veined marble turntable.
 */
export const ClubShirtExhibit: React.FC<ClubShirtExhibitProps> = ({
  onInteract,
  onHoverChange,
}) => {
  const mannequinTurnRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const fabricMaps = useMemo(() => createFabricMaps(), []);
  const marbleMaps = useMemo(() => createMarbleMaps(), []);
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);
  const plaqueMap = useMemo(
    () =>
      createPedestalPlaqueTexture(
        'Áo Chính Thức TechTonic Club',
        '2024 - 2027',
        'ĐH Kinh Tế - ĐH Đà Nẵng'
      ),
    []
  );

  const { torsoGeometry, leftSleeveGeom, rightSleeveGeom } = useMemo(
    () => ({
      torsoGeometry: createSculptedTorsoGeometry(),
      leftSleeveGeom: createSculptedSleeveGeometry(-1),
      rightSleeveGeom: createSculptedSleeveGeometry(1),
    }),
    []
  );

  // Chest hexagon crest + back "TECHTONIC" print textures
  const chestBadgeTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 256, 256);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 10;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = 128 + 92 * Math.cos(angle);
        const y = 128 + 92 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = '#0c182c';
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(86, 94);
      ctx.lineTo(170, 94);
      ctx.moveTo(128, 94);
      ctx.lineTo(128, 174);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }, []);

  const backPrintTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 512, 160);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '800 58px Inter, sans-serif';
      ctx.fillText('TECHTONIC', 256, 84);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('DREAM IT • CODE IT', 256, 126);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      fabricMaps.map.dispose();
      fabricMaps.bumpMap.dispose();
      marbleMaps.map.dispose();
      marbleMaps.roughnessMap.dispose();
      marbleMaps.bumpMap.dispose();
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
      plaqueMap.dispose();
      torsoGeometry.dispose();
      leftSleeveGeom.dispose();
      rightSleeveGeom.dispose();
      chestBadgeTex.dispose();
      backPrintTex.dispose();
    };
  }, [
    fabricMaps,
    marbleMaps,
    metalMaps,
    plaqueMap,
    torsoGeometry,
    leftSleeveGeom,
    rightSleeveGeom,
    chestBadgeTex,
    backPrintTex,
  ]);

  useFrame((state) => {
    if (mannequinTurnRef.current) {
      mannequinTurnRef.current.rotation.y =
        -Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.65) * 0.22;
      const targetScale = hovered ? 1.035 : 1;
      mannequinTurnRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.12
      );
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += hovered ? 0.025 : 0.008;
    }
  });

  return (
    <group position={[-0.7, 0, -6.4]}>
      {/* Dedicated Right-Wall Couture Display Alcove Flush Mounted at World x=16.52, z=-10.4 */}
      <group position={[17.22, 2.15, -4]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[3.4, 3.85, 0.14]} radius={0.04} smoothness={4} castShadow>
          <meshStandardMaterial
            color="#111a2b"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.62}
            roughness={0.38}
          />
        </RoundedBox>
        {[-1.56, 1.56].map((rx) => (
          <mesh key={`alcove-rib-${rx}`} position={[rx, 0, 0.08]}>
            <boxGeometry args={[0.03, 3.55, 0.03]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        ))}
        <mesh position={[0, 1.82, 0.08]}>
          <boxGeometry args={[3.15, 0.03, 0.03]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>
      </group>
      <pointLight position={[12.8, 2.0, -4]} intensity={9} distance={6.5} decay={1.2} color="#e0f2fe" />

      {/* ================= LAYERED MARBLE PEDESTAL WITH PHYSICS ================= */}
      <RigidBody type="fixed" position={[14.5, 0.45, -4]}>
        <mesh position={[0, -0.34, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.68, 1.78, 0.22, 64]} />
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#d8e3f4"
            roughness={0.34}
            metalness={0.28}
          />
        </mesh>

        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.38, 1.48, 0.66, 64]} />
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#d8e3f4"
            roughness={0.34}
            metalness={0.28}
          />
        </mesh>

        <mesh position={[0, 0.43, 0]}>
          <cylinderGeometry args={[1.42, 1.4, 0.05, 64]} />
          <meshStandardMaterial
            color="#64748b"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.88}
            roughness={0.22}
          />
        </mesh>

        <mesh position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.34, 1.38, 64]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </RigidBody>

      {/* Two front brushed-steel museum stanchions flanking the Shirt Exhibit */}
      {[-5.9, -2.1].map((sz) => (
        <group key={`shirt-stanchion-${sz}`} position={[12.55, 0, sz]}>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.14, 0.16, 0.05, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.022, 0.025, 0.74, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0.79, 0]}>
            <sphereGeometry args={[0.036, 16, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.16} />
          </mesh>
        </group>
      ))}
      <mesh position={[12.55, 0.74, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 3.8, 12]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Engraved Front Nameplate on Pedestal facing the hall (-X) */}
      <group position={[13.06, 0.62, -4]} rotation={[0, -Math.PI / 2, -0.18]}>
        <RoundedBox args={[1.07, 0.34, 0.044]} radius={0.01} smoothness={4}>
          <meshStandardMaterial
            color="#475569"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.85}
            roughness={0.25}
          />
        </RoundedBox>
        <mesh position={[0, 0, 0.024]}>
          <planeGeometry args={[0.98, 0.28]} />
          <meshBasicMaterial map={plaqueMap} />
        </mesh>
      </group>

      {/* Subtle turntable halo ring */}
      <mesh ref={ringRef} position={[14.5, 0.93, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 1.48, 64]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* ================= ULTRA-SMOOTH TAILORED 3D POLO SHIRT ON MANNEQUIN STAND ================= */}
      <group
        ref={mannequinTurnRef}
        position={[14.5, 1.0, -4]}
        rotation={[0, -Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onInteract();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHoverChange(true);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHoverChange(false);
        }}
      >
        {/* Brushed Steel Mannequin Stand Base & Pole */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.42, 0.05, 48]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.032, 0.038, 1.25, 32]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.16} />
        </mesh>
        {/* Tailored Mannequin Neck Neckform & Brushed Metal Collar Finial */}
        <mesh position={[0, 1.86, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.125, 0.22, 36]} />
          <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.42} />
        </mesh>
        <mesh position={[0, 1.98, 0]}>
          <cylinderGeometry args={[0.105, 0.105, 0.035, 36]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 2.02, 0]}>
          <sphereGeometry args={[0.092, 32, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Sculpted Soft Cotton Polo Torso & Raglan Sleeves with PBR Cloth Sheen */}
        <group position={[0, 1.26, 0]}>
          <mesh geometry={torsoGeometry} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={fabricMaps.map}
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.016}
              color="#1b3563"
              roughness={0.86}
              metalness={0.03}
              sheen={0.82}
              sheenRoughness={0.68}
              sheenColor="#7dd3fc"
              emissive="#0b2247"
              emissiveIntensity={hovered ? 0.3 : 0.08}
            />
          </mesh>

          <mesh geometry={leftSleeveGeom} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={fabricMaps.map}
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.016}
              color="#1b3563"
              roughness={0.86}
              metalness={0.03}
              sheen={0.82}
              sheenRoughness={0.68}
              sheenColor="#7dd3fc"
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh geometry={rightSleeveGeom} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={fabricMaps.map}
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.016}
              color="#1b3563"
              roughness={0.86}
              metalness={0.03}
              sheen={0.82}
              sheenRoughness={0.68}
              sheenColor="#7dd3fc"
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Left & Right Ribbed Sleeve Cuff Rings aligned smoothly with sleeve tips */}
          {[-1, 1].map((side) => (
            <group
              key={`cuff-${side}`}
              position={[side * 0.62, 0.03, 0.022]}
              rotation={[0, 0, side * -0.95]}
            >
              <mesh>
                <torusGeometry args={[0.128, 0.013, 16, 40]} />
                <meshPhysicalMaterial color="#10203d" roughness={0.78} sheen={0.5} sheenColor="#7dd3fc" />
              </mesh>
              <mesh position={[0, 0, 0.004]}>
                <torusGeometry args={[0.132, 0.005, 12, 40]} />
                <meshStandardMaterial color="#38bdf8" roughness={0.45} metalness={0.2} />
              </mesh>
            </group>
          ))}

          {/* Ribbed Polo Collar Band + Tailored Folded Collar Wings */}
          <mesh position={[0, 0.56, -0.005]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
            <torusGeometry args={[0.158, 0.036, 24, 56]} />
            <meshPhysicalMaterial
              color="#102140"
              roughness={0.78}
              sheen={0.65}
              sheenColor="#7dd3fc"
            />
          </mesh>
          <mesh position={[0, 0.578, -0.005]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
            <torusGeometry args={[0.162, 0.008, 16, 56]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.4} metalness={0.25} />
          </mesh>
          {[-0.082, 0.082].map((cx) => (
            <RoundedBox
              key={`collar-wing-${cx}`}
              position={[cx, 0.51, 0.155]}
              rotation={[0.36, cx > 0 ? -0.26 : 0.26, cx > 0 ? 0.34 : -0.34]}
              args={[0.125, 0.088, 0.022]}
              radius={0.01}
              smoothness={6}
            >
              <meshPhysicalMaterial
                color="#102140"
                roughness={0.76}
                sheen={0.6}
                sheenColor="#7dd3fc"
              />
            </RoundedBox>
          ))}

          {/* Contoured Front Polo Placket & Mother-of-Pearl Buttons */}
          <RoundedBox position={[0, 0.38, 0.205]} rotation={[-0.14, 0, 0]} args={[0.068, 0.25, 0.02]} radius={0.008} smoothness={4}>
            <meshPhysicalMaterial color="#101f3a" roughness={0.76} sheen={0.5} sheenColor="#7dd3fc" />
          </RoundedBox>
          {[0.44, 0.35].map((btnY, i) => (
            <mesh key={`btn-${i}`} position={[0, btnY, 0.214 - i * 0.01]} rotation={[Math.PI / 2 - 0.14, 0, 0]}>
              <cylinderGeometry args={[0.013, 0.013, 0.008, 20]} />
              <meshPhysicalMaterial color="#e2e8f0" metalness={0.45} roughness={0.16} clearcoat={1} />
            </mesh>
          ))}

          {/* Chest Embroidered Club Crest curved cleanly onto chest */}
          <mesh position={[0.21, 0.21, 0.228]} rotation={[-0.08, 0.28, 0]}>
            <planeGeometry args={[0.155, 0.155]} />
            <meshStandardMaterial map={chestBadgeTex} transparent roughness={0.55} />
          </mesh>

          {/* Upper Back Printed Typography */}
          <mesh position={[0, 0.24, -0.208]} rotation={[0.06, Math.PI, 0]}>
            <planeGeometry args={[0.6, 0.18]} />
            <meshStandardMaterial map={backPrintTex} transparent roughness={0.62} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
