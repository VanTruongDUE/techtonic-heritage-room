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

/** Deep-space panoramic sky dome texture: pitch-dark obsidian cosmos with subtle deep nebula so tech neon pops */
function createCosmicDomeTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(2048, 1024, 1);
  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, 1024);
    bg.addColorStop(0, '#000003');
    bg.addColorStop(0.35, '#010207');
    bg.addColorStop(0.68, '#02040c');
    bg.addColorStop(1, '#000003');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 2048, 1024);

    // Restrained deep-space nebula wisps (keeps cosmic ceiling ultra-dark so room neon pops sharply)
    const clouds: Array<[number, number, number, string]> = [
      [310, 300, 420, 'rgba(20, 56, 150, 0.085)'],
      [660, 250, 450, 'rgba(6, 130, 165, 0.075)'],
      [1040, 320, 520, 'rgba(58, 56, 168, 0.08)'],
      [1390, 380, 440, 'rgba(118, 42, 185, 0.085)'],
      [1740, 320, 420, 'rgba(10, 110, 165, 0.07)'],
      [960, 620, 480, 'rgba(18, 44, 120, 0.068)'],
      [1520, 650, 380, 'rgba(110, 22, 145, 0.062)'],
    ];

    clouds.forEach(([cx, cy, r, color]) => {
      const g = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r);
      g.addColorStop(0, color);
      g.addColorStop(0.48, color.replace(/0\.\d+\)$/, '0.025)'));
      g.addColorStop(1, 'rgba(0, 1, 5, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Subtle dark-void aurora veil across upper dome (never brightens the ceiling)
    ctx.save();
    ctx.translate(1024, 300);
    ctx.rotate(-0.14);
    const auroraGrad = ctx.createLinearGradient(-950, 0, 950, 0);
    auroraGrad.addColorStop(0, 'rgba(0, 245, 255, 0)');
    auroraGrad.addColorStop(0.28, 'rgba(0, 245, 255, 0.042)');
    auroraGrad.addColorStop(0.54, 'rgba(99, 102, 241, 0.05)');
    auroraGrad.addColorStop(0.78, 'rgba(168, 85, 247, 0.045)');
    auroraGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = auroraGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 940, 110, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Crisp pinpoint distant star dust against the pitch-dark obsidian cosmos
    let seed = 88231;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 2600; i++) {
      const x = rand() * 2048;
      const y = rand() * 1024;
      const alpha = 0.16 + rand() * 0.62;
      const size = rand() > 0.92 ? 1.7 : 1.0;
      ctx.fillStyle =
        rand() > 0.7
          ? `rgba(165, 243, 252, ${alpha})`
          : rand() > 0.45
          ? `rgba(255, 255, 255, ${alpha})`
          : rand() > 0.22
          ? `rgba(233, 213, 255, ${alpha * 0.85})`
          : `rgba(254, 240, 138, ${alpha * 0.85})`;
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

/** Soft radial lunar corona halo texture (crisp against dark void) */
function createMoonHaloTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 34, 128, 128, 128);
    g.addColorStop(0, 'rgba(224, 242, 254, 0.38)');
    g.addColorStop(0.32, 'rgba(147, 197, 253, 0.16)');
    g.addColorStop(0.68, 'rgba(56, 189, 248, 0.035)');
    g.addColorStop(1, 'rgba(1, 3, 10, 0)');
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
  const farStarsMatRef = useRef<THREE.PointsMaterial>(null);
  const brightStarsRef = useRef<THREE.Points>(null);
  const brightStarsMatRef = useRef<THREE.PointsMaterial>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const shootingStarRef = useRef<THREE.Mesh>(null);
  const shootingStar2Ref = useRef<THREE.Mesh>(null);

  const domeTex = useMemo(() => createCosmicDomeTexture(), []);
  const moonMaps = useMemo(() => createMoonMaps(), []);
  const starTex = useMemo(() => createStarGlowTexture(), []);
  const moonHaloTex = useMemo(() => createMoonHaloTexture(), []);

  // 1,800 Fine Pinpoint Distant Countryside Night-Sky Stars (optimized vertex count, same realistic scale)
  const farStarField = useMemo(() => {
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#f8fafc'),
      new THREE.Color('#dbeafe'),
      new THREE.Color('#fef9c3'),
      new THREE.Color('#e0f2fe'),
      new THREE.Color('#fde68a'),
    ];
    let seed = 192837;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const u = rand() * 2 - 1;
      const phi = Math.acos(u);
      const radius = 175 + rand() * 85;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) + 12;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 5;

      const c = palette[i % palette.length];
      const brightness = 0.52 + rand() * 0.48;
      colors[i * 3] = c.r * brightness;
      colors[i * 3 + 1] = c.g * brightness;
      colors[i * 3 + 2] = c.b * brightness;
    }
    return { positions, colors };
  }, []);

  // 280 Delicate Twinkling First-Magnitude Countryside Stars (small, crisp, distant — never giant blobs)
  const brightStarField = useMemo(() => {
    const count = 280;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#e0f2fe'),
      new THREE.Color('#fef3c7'),
      new THREE.Color('#bae6fd'),
      new THREE.Color('#f8fafc'),
    ];
    let seed = 66109;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const yNorm = -0.25 + rand() * 1.25;
      const clampedY = Math.max(-0.92, Math.min(0.99, yNorm));
      const horiz = Math.sqrt(Math.max(0.01, 1 - clampedY * clampedY));
      const radius = 160 + rand() * 75;
      positions[i * 3] = radius * horiz * Math.cos(theta);
      positions[i * 3 + 1] = radius * clampedY + 12;
      positions[i * 3 + 2] = radius * horiz * Math.sin(theta) - 5;

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
    if (farStarsMatRef.current) {
      farStarsMatRef.current.opacity = 0.8 + Math.cos(t * 1.4) * 0.1;
    }
    if (brightStarsRef.current) {
      brightStarsRef.current.rotation.y += delta * 0.0075;
    }
    if (brightStarsMatRef.current) {
      brightStarsMatRef.current.opacity = 0.82 + Math.sin(t * 2.1) * 0.16;
    }
    if (moonRef.current) {
      moonRef.current.rotation.y += delta * 0.008;
    }

    // Periodic subtle distant shooting star #1 (electric cyan) gliding high across the night sky every ~9.5s
    if (shootingStarRef.current) {
      const cycle = t % 9.5;
      if (cycle < 1.1) {
        const p = cycle / 1.1;
        shootingStarRef.current.visible = true;
        shootingStarRef.current.position.set(
          -75 + p * 150,
          96 - p * 22,
          -145 + p * 18
        );
        const mat = shootingStarRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.sin(p * Math.PI) * 0.82;
      } else {
        shootingStarRef.current.visible = false;
      }
    }

    // Periodic subtle distant shooting star #2 (cyber violet) staggered on opposite skylight arc
    if (shootingStar2Ref.current) {
      const cycle2 = (t + 4.8) % 12.5;
      if (cycle2 < 1.15) {
        const p = cycle2 / 1.15;
        shootingStar2Ref.current.visible = true;
        shootingStar2Ref.current.position.set(
          85 - p * 155,
          104 - p * 24,
          -150 + p * 24
        );
        const mat = shootingStar2Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.sin(p * Math.PI) * 0.78;
      } else {
        shootingStar2Ref.current.visible = false;
      }
    }
  });

  return (
    <group>
      {/* 1. Vast Distant Countryside Night Sky Dome */}
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[310, 48, 32]} />
        <meshBasicMaterial map={domeTex} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>

      {/* 2. Fine Pinpoint Distant Countryside Starfield */}
      <points ref={farStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[farStarField.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[farStarField.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={farStarsMatRef}
          map={starTex}
          vertexColors
          transparent
          opacity={0.86}
          size={0.82}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </points>

      {/* 3. Delicate Twinkling Natural First-Magnitude Stars */}
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
          opacity={0.84}
          size={1.45}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </points>

      {/* 4. Distant Full Moon (positioned high & bold inside the open skylight sky band) */}
      <group position={[42, 118, -155]}>
        {/* Gentle Silvery-Warm Countryside Moonlight Corona Halo */}
        <sprite scale={[60, 60, 1]}>
          <spriteMaterial
            map={moonHaloTex}
            transparent
            opacity={0.66}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
            toneMapped={false}
          />
        </sprite>

        {/* Sculpted Distant Cratered Full Moon */}
        <mesh ref={moonRef} rotation={[0.15, -0.75, 0.08]}>
          <sphereGeometry args={[14, 48, 36]} />
          <meshStandardMaterial
            map={moonMaps.map}
            bumpMap={moonMaps.bumpMap}
            bumpScale={0.14}
            emissive="#edf3ff"
            emissiveMap={moonMaps.map}
            emissiveIntensity={0.92}
            roughness={0.88}
            metalness={0.02}
            fog={false}
          />
        </mesh>
      </group>

      {/* 5. Periodic Distant Shooting Stars gliding high across the night sky */}
      <mesh ref={shootingStarRef} visible={false} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[8.5, 0.1, 0.1]} />
        <meshBasicMaterial
          color="#a5f3fc"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={shootingStar2Ref} visible={false} rotation={[0, 0, 0.16]}>
        <boxGeometry args={[8.0, 0.095, 0.095]} />
        <meshBasicMaterial
          color="#e879f9"
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
