import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CylinderCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
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

const CHAMPAGNE_GOLD = '#e4bc5c';

/**
 * Generates a realistic, slim, athletic-tailored Size XL polo torso BufferGeometry:
 * - Longer tailored drape (total height 1.38 vs sleek chest width 0.80 -> authentic XL proportion)
 * - Slim natural front-to-back chest depth (no puffy/boxy barrel look)
 * - Subtle side-vent curved hem, collarbone shoulder slope, and realistic vertical gravity drape folds
 * - Non-mirrored exterior UVs: uTex=0/1 -> wearer's left flank (+X), uTex=0.25 -> back (-Z), uTex=0.75 -> front (+Z).
 */
function createSculptedTorsoGeometry(): THREE.BufferGeometry {
  const radialSegs = 80;
  const heightSegs = 44;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= heightSegs; iy++) {
    const v = iy / heightSegs; // 0 = bottom hem (-0.74), 1 = neckband (+0.64)
    const y = -0.74 + v * 1.38;

    let rx: number;
    let rzFront: number;
    let rzBack: number;

    if (v < 0.36) {
      // Lower hem -> tailored waist (slight athletic inward taper, long sleek XL line)
      const t = v / 0.36;
      const ease = t * t * (3 - 2 * t);
      rx = THREE.MathUtils.lerp(0.352, 0.336, ease);
      rzFront = THREE.MathUtils.lerp(0.146, 0.14, ease);
      rzBack = THREE.MathUtils.lerp(0.132, 0.128, ease);
    } else if (v < 0.74) {
      // Waist -> structured XL chest & shoulder breadth
      const t = (v - 0.36) / 0.38;
      const ease = t * t * (3 - 2 * t);
      rx = THREE.MathUtils.lerp(0.336, 0.398, ease);
      rzFront = THREE.MathUtils.lerp(0.14, 0.172, ease);
      rzBack = THREE.MathUtils.lerp(0.128, 0.15, ease);
    } else {
      // Structured shoulders tapering smoothly to collar neckband
      const t = (v - 0.74) / 0.26;
      const ease = Math.pow(t, 1.34);
      rx = THREE.MathUtils.lerp(0.398, 0.136, ease);
      rzFront = THREE.MathUtils.lerp(0.172, 0.122, ease);
      rzBack = THREE.MathUtils.lerp(0.15, 0.118, ease);
    }

    // Natural trapezius & shoulder-seam slope
    const shoulderDrop = v > 0.74 ? Math.pow((v - 0.74) / 0.26, 1.55) * 0.056 : 0;

    for (let ix = 0; ix <= radialSegs; ix++) {
      const u = ix / radialSegs;
      const theta = u * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Subtle natural cotton piqué gravity folds near lower waist & hem
      const foldWeight = Math.max(0, 1 - v * 1.55);
      const drapeFold =
        (Math.sin(theta * 6 + 0.5) * 0.0042 + Math.cos(theta * 10 - 0.4) * 0.0018) * foldWeight;

      // Tailored chest-side squaring so front & back read flat and athletic rather than cylindrical
      const athleticFlatten = 0.026 * Math.cos(theta * 2) * (v > 0.22 && v < 0.88 ? 1 : 0.35);

      // Subtle hem flare at very bottom edge
      const hemRoll = v < 0.04 ? (1 - v / 0.04) * -0.005 : 0;

      const x = cosT * (rx + drapeFold + athleticFlatten + hemRoll);
      const rz = sinT >= 0 ? rzFront : rzBack;
      const z = sinT * (rz + drapeFold * 0.65 + hemRoll * 0.6);

      // Front V-placket collar neckline dip
      const neckDip =
        v > 0.86 && sinT > 0.25
          ? ((v - 0.86) / 0.14) * Math.pow(sinT, 1.45) * 0.068
          : 0;

      // Subtle tailored polo side-vent hem curve (slightly arched up at left/right flanks)
      const sideHemArch = v < 0.08 ? (1 - v / 0.08) * Math.pow(Math.abs(cosT), 2.4) * 0.018 : 0;

      const py = y - Math.abs(cosT) * shoulderDrop - neckDip + sideHemArch;

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
 * Slim, athletic-tailored XL polo short sleeve emerging cleanly from the shoulder contour
 * with a realistic angled arm drape and tucked knitted ribbed cuff.
 */
function createSculptedSleeveGeometry(side: -1 | 1): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.26, 0.305, 0.0),
    new THREE.Vector3(side * 0.375, 0.27, 0.005),
    new THREE.Vector3(side * 0.465, 0.145, 0.014),
    new THREE.Vector3(side * 0.525, -0.02, 0.022),
    new THREE.Vector3(side * 0.521, -0.024, 0.022),
  ]);

  const lengthSegs = 30;
  const radialSegs = 44;
  const frames = curve.computeFrenetFrames(lengthSegs, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= lengthSegs; i++) {
    const t = i / lengthSegs;
    const pt = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];

    let rMain: number;
    if (t < 0.25) {
      rMain = THREE.MathUtils.lerp(0.092, 0.128, Math.sin((t / 0.25) * (Math.PI / 2)));
    } else if (t < 0.94) {
      const k = (t - 0.25) / 0.69;
      rMain = THREE.MathUtils.lerp(0.128, 0.102, k);
    } else {
      const k = (t - 0.94) / 0.06;
      rMain = THREE.MathUtils.lerp(0.102, 0.082, k);
    }
    const rDepth = rMain * 0.9;

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
 * Tailored continuous folded 3D polo collar wrapping cleanly around the slim XL neckband
 * to twin crisp pointed collar tips + white knitted outer edge piping.
 */
function createPoloCollarGeometries(): {
  collarGeom: THREE.BufferGeometry;
  whiteTrimGeom: THREE.BufferGeometry;
} {
  const segs = 60;
  const startAngle = 0.23;
  const endAngle = Math.PI * 2 - 0.23;

  const positions: number[] = [];
  const indices: number[] = [];
  const outerRimPoints: THREE.Vector3[] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const phi = THREE.MathUtils.lerp(startAngle, endAngle, t);
    const sinP = Math.sin(phi);
    const cosP = Math.cos(phi);

    const innerR = 0.132;
    const innerY = 0.625 - (cosP > 0 ? Math.pow(cosP, 1.5) * 0.05 : 0);

    const tipBoost = cosP > 0.65 ? Math.pow((cosP - 0.65) / 0.35, 1.35) * 0.025 : 0;
    const outerR = 0.19 + tipBoost;
    const outerY = 0.562 - (cosP > 0 ? Math.pow(cosP, 1.4) * 0.072 : 0);

    const ix = sinP * innerR;
    const iz = cosP * innerR * 0.94;
    const ox = sinP * outerR;
    const oz = cosP * outerR * 0.94;

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
  const whiteTrimGeom = new THREE.TubeGeometry(rimCurve, 76, 0.0048, 10, false);

  return { collarGeom, whiteTrimGeom };
}

/** Boutique Showcase Header Crest Texture */
function createBoutiqueHeaderTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(1024, 160, 2);
  if (ctx) {
    ctx.fillStyle = '#0a1222';
    ctx.fillRect(0, 0, 1024, 160);
    ctx.strokeStyle = 'rgba(228, 188, 92, 0.72)';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 1008, 144);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e4bc5c';
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText('OFFICIAL CLUB UNIFORM  •  TAILORED FIT SIZE XL', 512, 58);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 44px Inter, sans-serif';
    ctx.fillText('ĐỒNG PHỤC CHÍNH THỨC TECHTONIC', 512, 118);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}

/**
 * Luxury Flagship Boutique 3D TechTonic Polo Shirt (Tailored Size XL)
 * on a motorized obsidian & champagne-gold 360-degree museum turntable.
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
  const boutiqueHeaderTex = useMemo(() => createBoutiqueHeaderTexture(), []);
  const plaqueMap = useMemo(
    () =>
      createPedestalPlaqueTexture(
        'Áo Polo Chính Thức TechTonic',
        'Size XL • 2024 - 2027',
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

  // High-res 2048x1024 baked piqué cotton uniform diffuse map:
  // deep navy weave + subtle vertical tailoring shading + sky-blue left flank + chest TECH TONIC + back print + hem topstitch
  const shirtDiffuseTex = useMemo(() => {
    const W = 2048;
    const H = 1024;
    const { canvas, ctx } = createHiResCanvas(W, H, 1);
    if (ctx) {
      // Deep navy-indigo cotton piqué base (#1d2e59)
      const bodyGrad = ctx.createLinearGradient(0, 0, 0, H);
      bodyGrad.addColorStop(0, '#19284f');
      bodyGrad.addColorStop(0.28, '#203363');
      bodyGrad.addColorStop(0.85, '#1d2e59');
      bodyGrad.addColorStop(1, '#142244');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(0, 0, W, H);

      // Fine realistic honeycomb cotton piqué knit micro-grain
      const step = 3;
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          if (((x + y) / step) % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.026)';
            ctx.fillRect(x, y, step - 1, step - 1);
          } else {
            ctx.fillStyle = 'rgba(7, 13, 30, 0.14)';
            ctx.fillRect(x, y, step - 1, step - 1);
          }
        }
      }

      // Subtle natural vertical tailoring shadow folds near waist/hem for realism
      for (let i = 0; i < 6; i++) {
        const fx = (i / 6) * W + 170;
        const fg = ctx.createLinearGradient(fx - 44, 0, fx + 44, 0);
        fg.addColorStop(0, 'rgba(6, 12, 28, 0)');
        fg.addColorStop(0.5, 'rgba(6, 12, 28, 0.14)');
        fg.addColorStop(1, 'rgba(6, 12, 28, 0)');
        ctx.fillStyle = fg;
        ctx.fillRect(fx - 44, H * 0.55, 88, H * 0.45);
      }

      // 1. Official light sky-blue contoured vertical side panel on wearer's left flank (uTex near 0 & 1)
      const drawSideStripe = (cx: number) => {
        const grad = ctx.createLinearGradient(cx - 102, 0, cx + 102, 0);
        grad.addColorStop(0, '#80c0ea');
        grad.addColorStop(0.5, '#a8daf8');
        grad.addColorStop(1, '#80c0ea');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - 98, H);
        ctx.lineTo(cx - 66, 360);
        ctx.quadraticCurveTo(cx, 318, cx + 66, 360);
        ctx.lineTo(cx + 98, H);
        ctx.closePath();
        ctx.fill();

        // Subtle tailoring seam line along edge of sky-blue flank panel
        ctx.strokeStyle = 'rgba(13, 25, 52, 0.42)';
        ctx.lineWidth = 3;
        ctx.stroke();
      };
      drawSideStripe(0);
      drawSideStripe(W);

      // Subtle right-side vertical tailoring seam line (uTex = 0.5)
      ctx.strokeStyle = 'rgba(8, 16, 36, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W * 0.5, 340);
      ctx.lineTo(W * 0.5, H);
      ctx.stroke();

      // Double-needle tailored bottom hem top-stitching
      ctx.strokeStyle = 'rgba(148, 184, 232, 0.24)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(0, H - 30);
      ctx.lineTo(W, H - 30);
      ctx.moveTo(0, H - 22);
      ctx.lineTo(W, H - 22);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Front Left-Chest Official "TECH TONIC" Gear-C Embroidered Logo (uTex ≈ 0.858, y ≈ 308)
      const cx = W * 0.856;
      const cy = 308;
      ctx.save();
      ctx.translate(cx - 32, cy);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        if (angle > -0.5 && angle < 0.5) continue;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillRect(-3.4, -20, 6.8, 6.2);
        ctx.restore();
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 13.5, 0.55, Math.PI * 2 - 0.55);
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 25px Inter, sans-serif';
      ctx.fillText('TECH', cx - 6, cy - 3);
      ctx.fillText('TONIC', cx - 6, cy + 21);

      // 3. Upper Back Official Typography: "TECHTONIC" + "Dream it - Code it" (uTex = 0.25, y ≈ 286)
      const bx = W * 0.25;
      const by = 286;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px Inter, sans-serif';
      ctx.fillText('TECHTONIC', bx, by);

      ctx.fillStyle = '#90ccf2';
      ctx.font = '700 25px Inter, sans-serif';
      ctx.fillText('Dream it - Code it', bx, by + 36);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  // Sleeve UV texture with deep navy piqué weave, ribbed cuff band, and baked crisp white knitted pinstripe
  const sleeveDiffuseTex = useMemo(() => {
    const W = 512;
    const H = 512;
    const { canvas, ctx } = createHiResCanvas(W, H, 1);
    if (ctx) {
      ctx.fillStyle = '#1e2f5b';
      ctx.fillRect(0, 0, W, H);

      const step = 3;
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          ctx.fillStyle =
            ((x + y) / step) % 2 === 0 ? 'rgba(255,255,255,0.026)' : 'rgba(7,13,30,0.14)';
          ctx.fillRect(x, y, step - 1, step - 1);
        }
      }

      // Ribbed cuff band at cuff hem (y in [0, 74])
      ctx.fillStyle = '#162448';
      ctx.fillRect(0, 0, W, 74);

      // Subtle vertical knit ribbing lines on cuff
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let x = 0; x < W; x += 6) {
        ctx.fillRect(x, 0, 2, 74);
      }

      // Crisp white knitted cuff pinstripe right near cuff rim
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 38, W, 12);
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
      boutiqueHeaderTex.dispose();
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
    boutiqueHeaderTex,
    plaqueMap,
    torsoGeometry,
    leftSleeveGeom,
    rightSleeveGeom,
    collarGeom,
    whiteTrimGeom,
    shirtDiffuseTex,
    sleeveDiffuseTex,
  ]);

  useFrame((state, delta) => {
    const storeState = useHeritageStore.getState();
    if (
      storeState.isCenterWallCinemaActive ||
      storeState.activeModal !== null ||
      state.camera.position.z > 12
    ) {
      return;
    }
    const dt = Math.min(delta, 0.05);
    if (mannequinTurnRef.current) {
      // Smooth 360° boutique turntable rotation (slows gracefully on hover for close inspection)
      mannequinTurnRef.current.rotation.y += dt * (hovered ? 0.1 : 0.4);
      const targetScale = hovered ? 1.03 : 1;
      const nextScale = THREE.MathUtils.lerp(
        mannequinTurnRef.current.scale.x,
        targetScale,
        1 - Math.exp(-9 * dt)
      );
      mannequinTurnRef.current.scale.setScalar(nextScale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += dt * (hovered ? 1.3 : 0.42);
    }
  });

  return (
    <group position={[-0.7, 0, -6.4]}>
      {/* ================= FLAGSHIP BOUTIQUE ALCOVE BACKDROP AT RIGHT WALL ================= */}
      <group position={[17.22, 2.32, -4]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[3.5, 4.18, 0.14]} radius={0.04} smoothness={4}>
          <meshPhysicalMaterial
            color="#070d1b"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.74}
            roughness={0.28}
            clearcoat={0.55}
          />
        </RoundedBox>
        {/* Brushed champagne-gold inner architectural border */}
        {[-1.62, 1.62].map((rx) => (
          <group key={`alcove-trim-${rx}`} position={[rx, 0, 0.08]}>
            <mesh>
              <boxGeometry args={[0.04, 3.85, 0.035]} />
              <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.95} roughness={0.18} clearcoat={0.8} />
            </mesh>
            {/* Slim boutique side showcase electric-cyan LED light tube */}
            <mesh position={[rx > 0 ? -0.045 : 0.045, 0, 0.01]}>
              <boxGeometry args={[0.02, 3.55, 0.022]} />
              <meshBasicMaterial color="#ccf9ff" toneMapped={false} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.98, 0.08]}>
          <boxGeometry args={[3.28, 0.035, 0.035]} />
          <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.95} roughness={0.18} />
        </mesh>
        {/* Crisp Boutique Header Sign above the Mannequin */}
        <mesh position={[0, 1.66, 0.082]}>
          <planeGeometry args={[2.86, 0.44]} />
          <meshStandardMaterial
            map={boutiqueHeaderTex}
            emissive="#ffffff"
            emissiveMap={boutiqueHeaderTex}
            emissiveIntensity={0.28}
            roughness={0.32}
          />
        </mesh>
      </group>

      {/* ================= LUXURY 2-TIER OBSIDIAN & CHAMPAGNE-GOLD MOTORIZED TURNTABLE ================= */}
      <RigidBody type="fixed" colliders={false} position={[14.5, 0.42, -4]}>
        <CylinderCollider args={[0.45, 1.7]} position={[0, 0, 0]} />
        {/* Tier 1: Wide Grounded Obsidian Marble Base + Warm Gold Under-Glow */}
        <mesh position={[0, -0.34, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.66, 1.76, 0.18, 64]} />
          <meshPhysicalMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.006}
            color="#111b2e"
            roughness={0.26}
            metalness={0.38}
            clearcoat={0.55}
          />
        </mesh>
        <mesh position={[0, -0.422, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.72, 1.79, 64]} />
          <meshBasicMaterial color={CHAMPAGNE_GOLD} toneMapped={false} />
        </mesh>

        {/* Tier 2: Sleek Dark Obsidian Drum Pedestal */}
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.34, 1.44, 0.62, 64]} />
          <meshPhysicalMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.006}
            color="#152238"
            roughness={0.24}
            metalness={0.42}
            clearcoat={0.6}
          />
        </mesh>

        {/* Brushed Champagne-Gold Upper Turntable Bezel Collar */}
        <mesh position={[0, 0.39, 0]}>
          <cylinderGeometry args={[1.39, 1.37, 0.055, 64]} />
          <meshPhysicalMaterial
            color={CHAMPAGNE_GOLD}
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.96}
            roughness={0.16}
            clearcoat={0.8}
          />
        </mesh>

        {/* Recessed Precision Cyan Accent Ring on Turntable Surface */}
        <mesh position={[0, 0.421, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.28, 1.32, 64]} />
          <meshBasicMaterial color="#00F0FF" toneMapped={false} />
        </mesh>
      </RigidBody>

      {/* Two Sleek Brushed Champagne-Gold Museum Stanchions flanking front of Showcase */}
      {[-5.85, -2.15].map((sz) => (
        <group key={`shirt-stanchion-${sz}`} position={[12.58, 0, sz]}>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.13, 0.15, 0.05, 24]} />
            <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.95} roughness={0.18} clearcoat={0.7} />
          </mesh>
          <mesh position={[0, 0.38, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.023, 0.7, 16]} />
            <meshPhysicalMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <sphereGeometry args={[0.034, 16, 12]} />
            <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[12.58, 0.7, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 3.7, 12]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.45} roughness={0.4} />
      </mesh>

      {/* Gilded Brass-Framed Front Nameplate Plaque facing the hall (-X) */}
      <group position={[13.09, 0.56, -4]} rotation={[0, -Math.PI / 2, -0.18]}>
        <RoundedBox args={[1.08, 0.34, 0.044]} radius={0.01} smoothness={4}>
          <meshPhysicalMaterial
            color={CHAMPAGNE_GOLD}
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.96}
            roughness={0.18}
            clearcoat={0.75}
          />
        </RoundedBox>
        <mesh position={[0, 0, 0.024]}>
          <planeGeometry args={[0.98, 0.28]} />
          <meshStandardMaterial
            map={plaqueMap}
            emissive="#ffffff"
            emissiveMap={plaqueMap}
            emissiveIntensity={0.32}
            roughness={0.32}
            metalness={0.1}
          />
        </mesh>
      </group>

      {/* Subtle Rotating Halo Ring */}
      <mesh ref={ringRef} position={[14.5, 0.855, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.41, 1.44, 64]} />
        <meshBasicMaterial color={CHAMPAGNE_GOLD} transparent opacity={0.48} side={THREE.DoubleSide} />
      </mesh>

      {/* ================= TAILORED SIZE XL 3D POLO SHIRT ON 360-DEGREE TURNTABLE ================= */}
      <group
        ref={mannequinTurnRef}
        position={[14.5, 0.86, -4]}
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
        {/* Brushed Champagne-Gold & Titanium Boutique Mannequin Stand */}
        <mesh position={[0, 0.025, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.38, 0.05, 48]} />
          <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.8} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.14, 0.18, 0.04, 32]} />
          <meshPhysicalMaterial color="#1e293b" metalness={0.85} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.68, 0]}>
          <cylinderGeometry args={[0.026, 0.032, 1.24, 32]} />
          <meshPhysicalMaterial color="#cbd5e1" metalness={0.94} roughness={0.16} clearcoat={0.6} />
        </mesh>

        {/* Sculpted Matte-Obsidian Linen Mannequin Neck Form & Brushed Gold Crown Finial */}
        <mesh position={[0, 2.02, 0]} castShadow>
          <cylinderGeometry args={[0.088, 0.122, 0.22, 36]} />
          <meshStandardMaterial color="#121b2e" metalness={0.22} roughness={0.78} />
        </mesh>
        <mesh position={[0, 2.15, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.028, 36]} />
          <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.85} />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.078, 32, 24]} />
          <meshPhysicalMaterial color={CHAMPAGNE_GOLD} metalness={0.96} roughness={0.16} clearcoat={0.85} />
        </mesh>

        {/* Sculpted Slim-Long Size XL Polo Shirt Assembly */}
        <group position={[0, 1.38, 0]}>
          {/* Dark interior collar & waist liner shadow shell so hollow openings look authentic */}
          <mesh position={[0, -0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.33, 48]} />
            <meshStandardMaterial color="#0b1326" roughness={0.95} side={THREE.DoubleSide} />
          </mesh>

          {/* Main Tailored Size XL Torso */}
          <mesh geometry={torsoGeometry} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={shirtDiffuseTex}
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.016}
              color="#ffffff"
              roughness={0.88}
              metalness={0.02}
              sheen={0.78}
              sheenRoughness={0.68}
              sheenColor="#93c5fd"
              emissive="#0f2046"
              emissiveIntensity={hovered ? 0.22 : 0.09}
            />
          </mesh>

          {/* Tailored XL Short Sleeves */}
          <mesh geometry={leftSleeveGeom} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={sleeveDiffuseTex}
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.016}
              color="#ffffff"
              roughness={0.88}
              metalness={0.02}
              sheen={0.78}
              sheenRoughness={0.68}
              sheenColor="#93c5fd"
              emissive="#0f2046"
              emissiveIntensity={hovered ? 0.22 : 0.09}
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh geometry={rightSleeveGeom} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={sleeveDiffuseTex}
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.016}
              color="#ffffff"
              roughness={0.88}
              metalness={0.02}
              sheen={0.78}
              sheenRoughness={0.68}
              sheenColor="#93c5fd"
              emissive="#0f2046"
              emissiveIntensity={hovered ? 0.22 : 0.09}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Continuous Folded 3D Polo Collar & Crisp White Knitted Edge Piping */}
          <mesh geometry={collarGeom} castShadow>
            <meshPhysicalMaterial
              color="#162448"
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.012}
              roughness={0.8}
              sheen={0.65}
              sheenColor="#93c5fd"
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh geometry={whiteTrimGeom}>
            <meshStandardMaterial color="#f8fafc" roughness={0.42} metalness={0.04} />
          </mesh>

          {/* Slim Contoured Front 2-Button Polo Placket & Pearlescent Buttons */}
          <RoundedBox
            position={[0, 0.41, 0.148]}
            rotation={[-0.14, 0, 0]}
            args={[0.058, 0.25, 0.016]}
            radius={0.007}
            smoothness={4}
          >
            <meshPhysicalMaterial
              color="#223666"
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.01}
              roughness={0.78}
              sheen={0.6}
              sheenColor="#93c5fd"
            />
          </RoundedBox>
          {[0.48, 0.375].map((btnY, i) => (
            <group
              key={`btn-${i}`}
              position={[0, btnY, 0.156 - i * 0.012]}
              rotation={[Math.PI / 2 - 0.14, 0, 0]}
            >
              <mesh>
                <cylinderGeometry args={[0.013, 0.013, 0.009, 24]} />
                <meshPhysicalMaterial
                  color="#f8fafc"
                  roughness={0.18}
                  metalness={0.08}
                  clearcoat={0.85}
                  emissive="#dbeafe"
                  emissiveIntensity={0.16}
                />
              </mesh>
              {/* Recessed inner button center rim */}
              <mesh position={[0, 0.0046, 0]}>
                <cylinderGeometry args={[0.0085, 0.0085, 0.002, 16]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.35} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
};
