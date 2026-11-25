import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import { useReducedMotionPreference } from '../Effects/AmbientMotion';

/** Procedural photorealistic Lunar Surface (maria plains + highlands + impact craters) */
function createMoonMaps(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const { canvas: diffCanvas, ctx: dCtx } = createHiResCanvas(1024, 512, 1);
  const { canvas: bumpCanvas, ctx: bCtx } = createHiResCanvas(1024, 512, 1);

  let seed = 49157;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  if (dCtx && bCtx) {
    // Base lunar regolith highland tone
    dCtx.fillStyle = '#cfd6e2';
    dCtx.fillRect(0, 0, 1024, 512);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 1024, 512);

    // Subtle global mottling
    for (let i = 0; i < 600; i++) {
      const x = rand() * 1024;
      const y = rand() * 512;
      const r = 14 + rand() * 58;
      const shade = 175 + Math.floor(rand() * 55);
      const grad = dCtx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${shade}, ${shade + 4}, ${shade + 10}, 0.14)`);
      grad.addColorStop(1, 'rgba(200, 210, 224, 0)');
      dCtx.fillStyle = grad;
      dCtx.beginPath();
      dCtx.arc(x, y, r, 0, Math.PI * 2);
      dCtx.fill();
    }

    // Iconic Lunar Maria (dark volcanic basalt seas)
    const maria: Array<[number, number, number, number, number]> = [
      [340, 200, 130, 88, 0.56],
      [470, 175, 115, 76, 0.52],
      [560, 240, 128, 86, 0.54],
      [250, 275, 96, 68, 0.45],
      [675, 210, 88, 66, 0.48],
      [420, 300, 92, 62, 0.42],
      [760, 275, 72, 54, 0.4],
    ];

    maria.forEach(([mx, my, rx, ry, alpha]) => {
      const g = dCtx.createRadialGradient(mx, my, rx * 0.12, mx, my, rx);
      g.addColorStop(0, `rgba(62, 72, 92, ${alpha})`);
      g.addColorStop(0.65, `rgba(88, 99, 120, ${alpha * 0.68})`);
      g.addColorStop(1, 'rgba(120, 132, 154, 0)');
      dCtx.save();
      dCtx.translate(mx, my);
      dCtx.scale(1, ry / rx);
      dCtx.fillStyle = g;
      dCtx.beginPath();
      dCtx.arc(0, 0, rx, 0, Math.PI * 2);
      dCtx.fill();
      dCtx.restore();

      const bg = bCtx.createRadialGradient(mx, my, 0, mx, my, rx);
      bg.addColorStop(0, 'rgba(72, 72, 72, 0.45)');
      bg.addColorStop(1, 'rgba(128, 128, 128, 0)');
      bCtx.save();
      bCtx.translate(mx, my);
      bCtx.scale(1, ry / rx);
      bCtx.fillStyle = bg;
      bCtx.beginPath();
      bCtx.arc(0, 0, rx, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.restore();
    });

    // Detailed Lunar Impact Craters (bright raised rims + shaded interior bowls)
    for (let i = 0; i < 240; i++) {
      const cx = rand() * 1024;
      const cy = 28 + rand() * 456;
      const r = i < 26 ? 12 + rand() * 24 : 2.5 + rand() * 9;

      // Crater rim highlight
      dCtx.strokeStyle = 'rgba(244, 248, 255, 0.34)';
      dCtx.lineWidth = Math.max(1, r * 0.14);
      dCtx.beginPath();
      dCtx.arc(cx, cy, r, 0, Math.PI * 2);
      dCtx.stroke();

      // Crater inner shadow bowl
      const cg = dCtx.createRadialGradient(cx - r * 0.18, cy - r * 0.18, r * 0.08, cx, cy, r);
      cg.addColorStop(0, 'rgba(74, 84, 102, 0.44)');
      cg.addColorStop(0.75, 'rgba(120, 130, 148, 0.16)');
      cg.addColorStop(1, 'rgba(220, 228, 240, 0)');
      dCtx.fillStyle = cg;
      dCtx.beginPath();
      dCtx.arc(cx, cy, r * 0.94, 0, Math.PI * 2);
      dCtx.fill();

      // Matching bump crater rim & depression
      bCtx.strokeStyle = 'rgba(220, 220, 220, 0.5)';
      bCtx.lineWidth = Math.max(1, r * 0.16);
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.stroke();

      bCtx.fillStyle = 'rgba(55, 55, 55, 0.42)';
      bCtx.beginPath();
      bCtx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
      bCtx.fill();
    }

    // Subtle Tycho-like bright ejecta rays from a prominent southern crater
    const tx = 445;
    const ty = 356;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + rand() * 0.2;
      const len = 48 + rand() * 95;
      const rg = dCtx.createLinearGradient(tx, ty, tx + Math.cos(a) * len, ty + Math.sin(a) * len);
      rg.addColorStop(0, 'rgba(248, 250, 255, 0.36)');
      rg.addColorStop(1, 'rgba(248, 250, 255, 0)');
      dCtx.strokeStyle = rg;
      dCtx.lineWidth = 1.6 + rand() * 2;
      dCtx.beginPath();
      dCtx.moveTo(tx, ty);
      dCtx.lineTo(tx + Math.cos(a) * len, ty + Math.sin(a) * len);
      dCtx.stroke();
    }
  }

  return {
    map: finalizeCrispTexture(diffCanvas, { anisotropy: 8, srgb: true }),
    bumpMap: finalizeCrispTexture(bumpCanvas, { anisotropy: 4, srgb: false }),
  };
}

/** Deep-space panoramic sky dome texture with subtle Milky Way & indigo cosmic dust */
function createCosmicDomeTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(2048, 1024, 1);
  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 1024);
    bg.addColorStop(0, '#01030a');
    bg.addColorStop(0.35, '#030817');
    bg.addColorStop(0.65, '#050b1d');
    bg.addColorStop(1, '#02040c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 2048, 1024);

    // Subtle sweeping Milky Way nebula band across the cosmos
    const clouds: Array<[number, number, number, string]> = [
      [340, 320, 420, 'rgba(29, 78, 216, 0.14)'],
      [680, 280, 460, 'rgba(56, 189, 248, 0.11)'],
      [1040, 360, 520, 'rgba(99, 102, 241, 0.13)'],
      [1380, 440, 440, 'rgba(139, 92, 246, 0.11)'],
      [1720, 350, 420, 'rgba(14, 165, 233, 0.1)'],
      [960, 660, 480, 'rgba(30, 58, 138, 0.11)'],
      [1520, 690, 380, 'rgba(88, 28, 135, 0.08)'],
    ];

    clouds.forEach(([cx, cy, r, color]) => {
      const g = ctx.createRadialGradient(cx, cy, r * 0.06, cx, cy, r);
      g.addColorStop(0, color);
      g.addColorStop(0.55, color.replace(/0\.\d+\)$/, '0.04)'));
      g.addColorStop(1, 'rgba(2, 6, 20, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ultra-fine distant background star dust baked into the dome
    let seed = 88231;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 2400; i++) {
      const x = rand() * 2048;
      const y = rand() * 1024;
      const alpha = 0.18 + rand() * 0.65;
      const size = rand() > 0.92 ? 1.8 : 1.0;
      ctx.fillStyle =
        rand() > 0.72
          ? `rgba(186, 230, 253, ${alpha})`
          : rand() > 0.45
          ? `rgba(255, 255, 255, ${alpha})`
          : `rgba(254, 243, 199, ${alpha * 0.9})`;
      ctx.fillRect(x, y, size, size);
    }
  }
  return finalizeCrispTexture(canvas, { anisotropy: 4, srgb: true });
}

/** Crisp circular glowing star sprite texture */
function createStarGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.22, 'rgba(224, 242, 254, 0.88)');
    g.addColorStop(0.55, 'rgba(125, 211, 252, 0.22)');
    g.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft radial lunar corona halo texture */
function createMoonHaloTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 32, 128, 128, 128);
    g.addColorStop(0, 'rgba(224, 242, 254, 0.48)');
    g.addColorStop(0.35, 'rgba(147, 197, 253, 0.24)');
    g.addColorStop(0.7, 'rgba(56, 189, 248, 0.06)');
    g.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const CosmicBackdrop: React.FC = () => {
  const reducedMotion = useReducedMotionPreference();
  const farStarsRef = useRef<THREE.Points>(null);
  const brightStarsRef = useRef<THREE.Points>(null);
  const brightStarsMatRef = useRef<THREE.PointsMaterial>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const shootingStarRef = useRef<THREE.Mesh>(null);

  const domeTex = useMemo(() => createCosmicDomeTexture(), []);
  const moonMaps = useMemo(() => createMoonMaps(), []);
  const starTex = useMemo(() => createStarGlowTexture(), []);
  const moonHaloTex = useMemo(() => createMoonHaloTexture(), []);

  // 2,400 Crisp Surrounding Deep-Space Stars (360° all around & above/below the museum)
  const farStarField = useMemo(() => {
    const count = 2400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#dbeafe'),
      new THREE.Color('#bae6fd'),
      new THREE.Color('#fef3c7'),
      new THREE.Color('#e9d5ff'),
      new THREE.Color('#93c5fd'),
    ];
    let seed = 192837;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const u = rand() * 2 - 1; // full sphere coverage
      const phi = Math.acos(u);
      const radius = 56 + rand() * 88;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) + 8;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 2;

      const c = palette[i % palette.length];
      const brightness = 0.72 + rand() * 0.28;
      colors[i * 3] = c.r * brightness;
      colors[i * 3 + 1] = c.g * brightness;
      colors[i * 3 + 2] = c.b * brightness;
    }
    return { positions, colors };
  }, []);

  // 420 Brighter Shimmering Hero Stars closer around the observatory glass
  const brightStarField = useMemo(() => {
    const count = 420;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#7dd3fc'),
      new THREE.Color('#fde68a'),
      new THREE.Color('#c4b5fd'),
      new THREE.Color('#38bdf8'),
    ];
    let seed = 66109;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      // Bias slightly toward upper hemisphere & side horizon so observatory windows frame rich stars
      const yNorm = -0.35 + rand() * 1.35;
      const clampedY = Math.max(-0.95, Math.min(0.98, yNorm));
      const horiz = Math.sqrt(Math.max(0.01, 1 - clampedY * clampedY));
      const radius = 44 + rand() * 54;
      positions[i * 3] = radius * horiz * Math.cos(theta);
      positions[i * 3 + 1] = radius * clampedY + 6;
      positions[i * 3 + 2] = radius * horiz * Math.sin(theta) - 2;

      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, []);

  useEffect(() => {
    return () => {
      domeTex.dispose();
      moonMaps.map.dispose();
      moonMaps.bumpMap.dispose();
      starTex.dispose();
      moonHaloTex.dispose();
    };
  }, [domeTex, moonMaps, starTex, moonHaloTex]);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;

    if (farStarsRef.current) {
      farStarsRef.current.rotation.y += delta * 0.0045;
    }
    if (brightStarsRef.current) {
      brightStarsRef.current.rotation.y += delta * 0.0075;
    }
    if (brightStarsMatRef.current) {
      brightStarsMatRef.current.opacity = 0.78 + Math.sin(t * 2.1) * 0.16;
    }
    if (moonRef.current) {
      moonRef.current.rotation.y += delta * 0.008;
    }

    // Periodic graceful shooting star streaking across the glass sky dome every ~9s
    if (shootingStarRef.current) {
      const cycle = t % 9.5;
      if (cycle < 1.15) {
        const p = cycle / 1.15;
        shootingStarRef.current.visible = true;
        shootingStarRef.current.position.set(
          -42 + p * 84,
          42 - p * 12,
          -62 + p * 10
        );
        const mat = shootingStarRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.sin(p * Math.PI) * 0.85;
      } else {
        shootingStarRef.current.visible = false;
      }
    }
  });

  return (
    <group>
      {/* 1. Deep-Space Panoramic Cosmic Sky Dome */}
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[175, 48, 32]} />
        <meshBasicMaterial map={domeTex} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>

      {/* 2. Distant Dense 360° Starfield */}
      <points ref={farStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[farStarField.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[farStarField.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={starTex}
          vertexColors
          transparent
          opacity={0.92}
          size={1.05}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </points>

      {/* 3. Brighter Twinkling Hero Stars around the Observatory */}
      <points ref={brightStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[brightStarField.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[brightStarField.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={brightStarsMatRef}
          map={starTex}
          vertexColors
          transparent
          opacity={0.88}
          size={2.05}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </points>

      {/* 4. Hero Glowing 3D Moon visible through the Glass Skylight Roof & Observatory Walls */}
      <group position={[15, 20.5, -54]}>
        {/* Atmospheric Lunar Silver-Blue Corona Halo */}
        <sprite scale={[34, 34, 1]}>
          <spriteMaterial
            map={moonHaloTex}
            transparent
            opacity={0.76}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
            toneMapped={false}
          />
        </sprite>

        {/* Sculpted Cratered Lunar Sphere */}
        <mesh ref={moonRef} rotation={[0.15, -0.75, 0.08]}>
          <sphereGeometry args={[8.1, 64, 48]} />
          <meshStandardMaterial
            map={moonMaps.map}
            bumpMap={moonMaps.bumpMap}
            bumpScale={0.22}
            emissive="#dce9ff"
            emissiveMap={moonMaps.map}
            emissiveIntensity={0.82}
            roughness={0.88}
            metalness={0.02}
            fog={false}
          />
        </mesh>

        {/* Dedicated subtle directional moonlight rim across the lunar sphere */}
        <pointLight position={[-14, 10, 18]} intensity={42} distance={50} decay={1.2} color="#e0f2fe" />
      </group>

      {/* 5. Distant Serene Ringed Planet Silhouette far across the opposite horizon */}
      <group position={[-54, 23, -44]} rotation={[0.28, 0.4, -0.22]}>
        <mesh>
          <sphereGeometry args={[3.2, 36, 28]} />
          <meshStandardMaterial
            color="#3b5998"
            emissive="#1e3a8a"
            emissiveIntensity={0.45}
            roughness={0.7}
            fog={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0.1, 0]}>
          <ringGeometry args={[4.4, 6.8, 64]} />
          <meshBasicMaterial
            color="#7dd3fc"
            transparent
            opacity={0.24}
            side={THREE.DoubleSide}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      </group>

      {/* 6. Periodic Shooting Star gliding across the skylight */}
      <mesh ref={shootingStarRef} visible={false} rotation={[0, 0, -0.14]}>
        <boxGeometry args={[5.5, 0.07, 0.07]} />
        <meshBasicMaterial
          color="#e0f7ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};
