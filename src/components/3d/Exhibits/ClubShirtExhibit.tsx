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
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';

interface ClubShirtExhibitProps {
  onInteract: () => void;
  onHoverChange: (hovering: boolean) => void;
}

/**
 * Generates an organic lofted polo torso BufferGeometry with non-mirrored exterior UVs:
 * uTex = 0/1 -> wearer's left side (+X), uTex = 0.25 -> center back (-Z), uTex = 0.75 -> center front (+Z).
 */
function createSculptedTorsoGeometry(): THREE.BufferGeometry {
  const radialSegs = 72;
  const heightSegs = 36;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= heightSegs; iy++) {
    const v = iy / heightSegs; // 0 = bottom hem (-0.58), 1 = neckband (+0.58)
    const y = -0.58 + v * 1.16;

    let rx: number;
    let rzFront: number;
    let rzBack: number;

    if (v < 0.35) {
      const t = v / 0.35;
      const ease = t * t * (3 - 2 * t);
      rx = THREE.MathUtils.lerp(0.415, 0.388, ease);
      rzFront = THREE.MathUtils.lerp(0.202, 0.192, ease);
      rzBack = THREE.MathUtils.lerp(0.184, 0.178, ease);
    } else if (v < 0.72) {
      const t = (v - 0.35) / 0.37;
      const ease = t * t * (3 - 2 * t);
      rx = THREE.MathUtils.lerp(0.388, 0.455, ease);
      rzFront = THREE.MathUtils.lerp(0.192, 0.236, ease);
      rzBack = THREE.MathUtils.lerp(0.178, 0.205, ease);
    } else {
      const t = (v - 0.72) / 0.28;
      const ease = Math.pow(t, 1.32);
      rx = THREE.MathUtils.lerp(0.455, 0.158, ease);
      rzFront = THREE.MathUtils.lerp(0.236, 0.148, ease);
      rzBack = THREE.MathUtils.lerp(0.205, 0.144, ease);
    }

    const shoulderDrop = v > 0.72 ? Math.pow((v - 0.72) / 0.28, 1.6) * 0.052 : 0;

    for (let ix = 0; ix <= radialSegs; ix++) {
      const u = ix / radialSegs;
      const theta = u * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const foldWeight = Math.max(0, 1 - v * 1.45);
      const drapeFold = Math.sin(theta * 5 + 0.6) * 0.005 * foldWeight;
      const superFactor = 0.042 * Math.cos(theta * 2) * (v > 0.3 && v < 0.88 ? 1 : 0.3);

      const x = cosT * (rx + drapeFold + superFactor);
      const rz = sinT >= 0 ? rzFront : rzBack;
      const z = sinT * (rz + drapeFold * 0.75);

      const neckDip =
        v > 0.86 && sinT > 0.25
          ? ((v - 0.86) / 0.14) * Math.pow(sinT, 1.4) * 0.068
          : 0;

      const py = y - Math.abs(cosT) * shoulderDrop - neckDip;

      positions.push(x, py, z);
      // 1 - u ensures exterior text reads cleanly left-to-right on both Front (+Z, uTex=0.75) & Back (-Z, uTex=0.25)
      uvs.push(1 - u, v);
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
 * Tailored polo short sleeve emerging seamlessly from inside the shoulder contour with a tucked ribbed cuff hem.
 */
function createSculptedSleeveGeometry(side: -1 | 1): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.28, 0.23, 0.0),
    new THREE.Vector3(side * 0.42, 0.20, 0.006),
    new THREE.Vector3(side * 0.53, 0.11, 0.014),
    new THREE.Vector3(side * 0.61, -0.02, 0.02),
    new THREE.Vector3(side * 0.605, -0.024, 0.02),
  ]);

  const lengthSegs = 28;
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

    // Smooth taper starting tucked inside the shoulder/armhole, peaking subtly at upper arm, tapering cleanly to tucked cuff
    let rMain: number;
    if (t < 0.26) {
      rMain = THREE.MathUtils.lerp(0.105, 0.148, Math.sin((t / 0.26) * (Math.PI / 2)));
    } else if (t < 0.94) {
      const k = (t - 0.26) / 0.68;
      rMain = THREE.MathUtils.lerp(0.148, 0.122, k);
    } else {
      // Subtle inward fabric thickness tuck at cuff hem
      const k = (t - 0.94) / 0.06;
      rMain = THREE.MathUtils.lerp(0.122, 0.098, k);
    }
    const rDepth = rMain * 0.94;

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
 * Generates a continuous folded 3D polo collar band wrapping smoothly around the neck
 * to twin pointed collar tips at the front V-placket, plus its outer white knitted edge piping.
 */
function createPoloCollarGeometries(): {
  collarGeom: THREE.BufferGeometry;
  whiteTrimGeom: THREE.BufferGeometry;
} {
  const segs = 56;
  const startAngle = 0.24; // right side of V-placket opening
  const endAngle = Math.PI * 2 - 0.24; // left side of V-placket opening

  const positions: number[] = [];
  const indices: number[] = [];
  const outerRimPoints: THREE.Vector3[] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    // Angle around neck where 0 = front (+Z), PI = back (-Z)
    const phi = THREE.MathUtils.lerp(startAngle, endAngle, t);
    const sinP = Math.sin(phi);
    const cosP = Math.cos(phi);

    // Inner crease sits snugly on the neckband; outer edge folds gracefully outward & downward
    const innerR = 0.152;
    const innerY = 0.562 - (cosP > 0 ? Math.pow(cosP, 1.5) * 0.048 : 0);

    // Slight collar tip extension at the front ends
    const tipBoost = cosP > 0.65 ? Math.pow((cosP - 0.65) / 0.35, 1.3) * 0.024 : 0;
    const outerR = 0.212 + tipBoost;
    const outerY = 0.502 - (cosP > 0 ? Math.pow(cosP, 1.4) * 0.068 : 0);

    // Top-crease ring & folded outer-edge ring (with subtle thickness extrusion)
    const ix = sinP * innerR;
    const iz = cosP * innerR;
    const ox = sinP * outerR;
    const oz = cosP * outerR;

    positions.push(ix, innerY + 0.008, iz);
    positions.push(ox, outerY + 0.005, oz);

    outerRimPoints.push(new THREE.Vector3(ox, outerY + 0.004, oz));
  }

  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c);
    indices.push(c, b, d);
  }

  const collarGeom = new THREE.BufferGeometry();
  collarGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  collarGeom.setIndex(indices);
  collarGeom.computeVertexNormals();

  const rimCurve = new THREE.CatmullRomCurve3(outerRimPoints, false);
  const whiteTrimGeom = new THREE.TubeGeometry(rimCurve, 72, 0.0055, 10, false);

  return { collarGeom, whiteTrimGeom };
}

/**
 * Tailored 3D TechTonic Polo Shirt matching the official club uniform photo
 * on a motorized 360-degree museum turntable.
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

  const { torsoGeometry, leftSleeveGeom, rightSleeveGeom, collarGeom, whiteTrimGeom } = useMemo(
    () => ({
      torsoGeometry: createSculptedTorsoGeometry(),
      leftSleeveGeom: createSculptedSleeveGeometry(-1),
      rightSleeveGeom: createSculptedSleeveGeometry(1),
      ...createPoloCollarGeometries(),
    }),
    []
  );

  // High-res 2048x1024 baked shirt diffuse map:
  // deep navy body + light sky-blue left flank panel + curved left-chest TECH TONIC + back TECHTONIC / Dream it - Code it
  const shirtDiffuseTex = useMemo(() => {
    const W = 2048;
    const H = 1024;
    const { canvas, ctx } = createHiResCanvas(W, H, 1);
    if (ctx) {
      // Base deep navy-indigo fabric (#1f305c)
      ctx.fillStyle = '#1f305c';
      ctx.fillRect(0, 0, W, H);

      // Subtle vertical-horizontal pique knit grain
      const step = 4;
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          if (((x + y) / step) % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.028)';
            ctx.fillRect(x, y, step - 1, step - 1);
          } else {
            ctx.fillStyle = 'rgba(8, 15, 34, 0.14)';
            ctx.fillRect(x, y, step - 1, step - 1);
          }
        }
      }

      // 1. Distinctive light sky-blue vertical side panel along wearer's left flank (uTex near 0 and 1)
      const drawSideStripe = (cx: number) => {
        const grad = ctx.createLinearGradient(cx - 110, 0, cx + 110, 0);
        grad.addColorStop(0, '#85c3eb');
        grad.addColorStop(0.5, '#a3d5f5');
        grad.addColorStop(1, '#85c3eb');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - 106, H);
        ctx.lineTo(cx - 72, 355);
        ctx.quadraticCurveTo(cx, 315, cx + 72, 355);
        ctx.lineTo(cx + 106, H);
        ctx.closePath();
        ctx.fill();
      };
      drawSideStripe(0);
      drawSideStripe(W);

      // 2. Front Left-Chest Official "TECH TONIC" Gear-C Logo (uTex ≈ 0.862, v ≈ 0.69 -> y ≈ 318)
      const cx = W * 0.858;
      const cy = 322;
      ctx.save();
      ctx.translate(cx - 32, cy);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        if (angle > -0.5 && angle < 0.5) continue;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillRect(-3.5, -21, 7, 6.5);
        ctx.restore();
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0.55, Math.PI * 2 - 0.55);
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 26px Inter, sans-serif';
      ctx.fillText('TECH', cx - 6, cy - 3);
      ctx.fillText('TONIC', cx - 6, cy + 22);

      // 3. Upper Back Official Typography: "TECHTONIC" + "Dream it - Code it" (uTex = 0.25, v ≈ 0.72 -> y ≈ 290)
      const bx = W * 0.25;
      const by = 296;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px Inter, sans-serif';
      ctx.fillText('TECHTONIC', bx, by);

      ctx.fillStyle = '#8ec8ec';
      ctx.font = '700 26px Inter, sans-serif';
      ctx.fillText('Dream it - Code it', bx, by + 38);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  // Sleeve UV texture with deep navy fabric, ribbed cuff band, and baked crisp white pinstripe (zero detached rings)
  const sleeveDiffuseTex = useMemo(() => {
    const W = 512;
    const H = 512;
    const { canvas, ctx } = createHiResCanvas(W, H, 1);
    if (ctx) {
      ctx.fillStyle = '#1f305c';
      ctx.fillRect(0, 0, W, H);

      const step = 4;
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          ctx.fillStyle =
            ((x + y) / step) % 2 === 0 ? 'rgba(255,255,255,0.028)' : 'rgba(8,15,34,0.14)';
          ctx.fillRect(x, y, step - 1, step - 1);
        }
      }

      // v = 0..1 goes shoulder (bottom of flipped canvas, y=512) -> sleeve cuff hem (top, y=0)
      // Ribbed cuff band at t in [0.85, 1.0] -> y in [0, 76]
      ctx.fillStyle = '#18264c';
      ctx.fillRect(0, 0, W, 72);

      // Crisp white knitted cuff pinstripe right near cuff rim (t ≈ 0.90 -> y ≈ 36..50)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 38, W, 13);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
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
      collarGeom.dispose();
      whiteTrimGeom.dispose();
      shirtDiffuseTex.dispose();
      sleeveDiffuseTex.dispose();
    };
  }, [
    fabricMaps,
    marbleMaps,
    metalMaps,
    plaqueMap,
    torsoGeometry,
    leftSleeveGeom,
    rightSleeveGeom,
    collarGeom,
    whiteTrimGeom,
    shirtDiffuseTex,
    sleeveDiffuseTex,
  ]);

  useFrame((_, delta) => {
    if (mannequinTurnRef.current) {
      // Smooth 360° museum turntable so visitors can see front logo, sky-blue flank, and back print effortlessly
      mannequinTurnRef.current.rotation.y += delta * (hovered ? 0.1 : 0.45);
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
            <meshBasicMaterial color="#00F0FF" toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 1.82, 0.08]}>
          <boxGeometry args={[3.15, 0.03, 0.03]} />
          <meshBasicMaterial color="#00F0FF" toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[12.8, 2.2, -4]} intensity={10} distance={7.5} decay={2} color="#38bdf8" />

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
          <meshStandardMaterial
            map={plaqueMap}
            emissive="#ffffff"
            emissiveMap={plaqueMap}
            emissiveIntensity={0.32}
            roughness={0.34}
            metalness={0.12}
          />
        </mesh>
      </group>

      {/* Subtle turntable halo ring */}
      <mesh ref={ringRef} position={[14.5, 0.93, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 1.48, 64]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* ================= TAILORED 3D POLO SHIRT ON 360-DEGREE TURNTABLE ================= */}
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
        {/* Dark Neck Liner & Brushed Metal Collar Finial */}
        <mesh position={[0, 1.84, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.135, 0.2, 36]} />
          <meshStandardMaterial color="#141e35" metalness={0.35} roughness={0.62} />
        </mesh>
        <mesh position={[0, 1.96, 0]}>
          <cylinderGeometry args={[0.102, 0.102, 0.03, 36]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 2.0, 0]}>
          <sphereGeometry args={[0.088, 32, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Sculpted Polo Torso with Contoured UV-Baked Graphics & Raglan Sleeves */}
        <group position={[0, 1.26, 0]}>
          <mesh geometry={torsoGeometry} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={shirtDiffuseTex}
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.014}
              color="#ffffff"
              roughness={0.85}
              metalness={0.02}
              sheen={0.7}
              sheenRoughness={0.7}
              sheenColor="#93c5fd"
              emissive="#102044"
              emissiveIntensity={hovered ? 0.24 : 0.08}
            />
          </mesh>

          <mesh geometry={leftSleeveGeom} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={sleeveDiffuseTex}
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.014}
              color="#ffffff"
              roughness={0.85}
              metalness={0.02}
              sheen={0.7}
              sheenRoughness={0.7}
              sheenColor="#93c5fd"
              emissive="#102044"
              emissiveIntensity={hovered ? 0.24 : 0.08}
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh geometry={rightSleeveGeom} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={sleeveDiffuseTex}
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.014}
              color="#ffffff"
              roughness={0.85}
              metalness={0.02}
              sheen={0.7}
              sheenRoughness={0.7}
              sheenColor="#93c5fd"
              emissive="#102044"
              emissiveIntensity={hovered ? 0.24 : 0.08}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Continuous Folded 3D Polo Collar & White Outer Edge Piping */}
          <mesh geometry={collarGeom} castShadow>
            <meshPhysicalMaterial
              color="#182548"
              roughness={0.76}
              sheen={0.58}
              sheenColor="#93c5fd"
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh geometry={whiteTrimGeom}>
            <meshStandardMaterial color="#f8fafc" roughness={0.45} metalness={0.04} />
          </mesh>

          {/* Contoured Front 2-Button Polo Placket & High-Contrast Pearlescent Buttons */}
          <RoundedBox position={[0, 0.37, 0.205]} rotation={[-0.14, 0, 0]} args={[0.068, 0.24, 0.018]} radius={0.008} smoothness={4}>
            <meshPhysicalMaterial color="#24396b" roughness={0.74} sheen={0.55} sheenColor="#93c5fd" />
          </RoundedBox>
          {[0.435, 0.34].map((btnY, i) => (
            <mesh key={`btn-${i}`} position={[0, btnY, 0.214 - i * 0.011]} rotation={[Math.PI / 2 - 0.14, 0, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.01, 24]} />
              <meshStandardMaterial color="#ffffff" emissive="#e2e8f0" emissiveIntensity={0.22} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
};
