import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { CLUB_PROFILE } from '../../../data/heritageSeed';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import type { HoverPreview, MemberTestimonial } from '../../../types/heritage';

interface FloatingSlot {
  position: [number, number, number];
  baseRotY: number;
  phase: number;
  floatAmp: number;
}

/**
 * 4 balanced, collision-free floating 3D coordinates framing the Front-Right
 * "THÀNH VIÊN NÓI GÌ VỀ TECHTONIC" board ([9.6, 3.1, 8.05], facing -Z).
 * Positioned clearly above the low photo pedestals (max y=0.83) and away from
 * the side portrait frames at x=4.4 and x=14.8.
 */
const FLOATING_SLOTS: FloatingSlot[] = [
  { position: [6.05, 3.65, 6.65], baseRotY: Math.PI - 0.26, phase: 0.0, floatAmp: 0.085 },
  { position: [13.15, 3.68, 6.65], baseRotY: Math.PI + 0.26, phase: 1.7, floatAmp: 0.09 },
  { position: [6.5, 2.04, 6.18], baseRotY: Math.PI - 0.18, phase: 3.1, floatAmp: 0.08 },
  { position: [12.7, 2.08, 6.18], baseRotY: Math.PI + 0.18, phase: 4.5, floatAmp: 0.085 },
];

function drawWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): void {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  let count = 0;

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      if (count + 1 >= maxLines) {
        ctx.fillText(`${line.replace(/[.,;:\s]+$/, '')}…`, x, y);
        return;
      }
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
      count += 1;
    } else {
      line = test;
    }
  }

  if (line && count < maxLines) {
    ctx.fillText(line, x, y);
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function createCardTexture(item: MemberTestimonial): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(680, 410, 1.5);
  if (ctx) {
    // Deep dark-tech obsidian glass backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 680, 410);
    bgGrad.addColorStop(0, '#071124');
    bgGrad.addColorStop(0.55, '#0b1730');
    bgGrad.addColorStop(1, '#091225');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 680, 410);

    // Soft radial accent glow in top-left behind the 3D portrait medallion
    const glow = ctx.createRadialGradient(90, 82, 12, 90, 82, 230);
    glow.addColorStop(0, `${item.accent}44`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 680, 410);

    // Subtle holographic grid dots in bottom-right
    ctx.fillStyle = `${item.accent}24`;
    for (let gx = 520; gx <= 650; gx += 18) {
      for (let gy = 300; gy <= 385; gy += 18) {
        ctx.fillRect(gx, gy, 2.5, 2.5);
      }
    }

    // Crisp outer neon border
    ctx.strokeStyle = `${item.accent}88`;
    ctx.lineWidth = 3;
    drawRoundedRectPath(ctx, 10, 10, 660, 390, 20);
    ctx.stroke();

    // Top luminous accent bar
    ctx.fillStyle = item.accent;
    ctx.fillRect(195, 10, 320, 4);

    // Tag pill (right of 3D portrait space)
    const tagText = item.tag.toUpperCase();
    ctx.font = '700 15px "JetBrains Mono", monospace';
    const tagWidth = Math.min(ctx.measureText(tagText).width + 26, 420);
    ctx.fillStyle = `${item.accent}22`;
    drawRoundedRectPath(ctx, 198, 34, tagWidth, 30, 15);
    ctx.fill();
    ctx.strokeStyle = `${item.accent}80`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = item.accent;
    ctx.fillText(tagText, 211, 54);

    // Member Name
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px Inter, sans-serif';
    ctx.fillText(item.name, 198, 102);

    // Subtle divider line cleanly below the 3D portrait medallion
    const divGrad = ctx.createLinearGradient(198, 0, 640, 0);
    divGrad.addColorStop(0, `${item.accent}99`);
    divGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = divGrad;
    ctx.fillRect(198, 122, 442, 2);

    // Decorative oversized quote glyph (placed safely below portrait medallion)
    ctx.fillStyle = `${item.accent}36`;
    ctx.font = 'bold 62px Georgia, serif';
    ctx.fillText('“', 28, 224);

    // Real member quote excerpt (starts cleanly below portrait at y=214)
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'italic 400 22px Inter, sans-serif';
    drawWrappedLines(ctx, `“${item.quote}”`, 44, 214, 594, 32, 4);

    // Footer interactive hint
    ctx.fillStyle = `${item.accent}dd`;
    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.fillText('NHẤP HOẶC [E] ĐỂ ĐỌC TRỌN VẸN CHIA SẺ →', 44, 376);
  }

  return finalizeCrispTexture(canvas, { anisotropy: 4, srgb: true });
}

function drawMonogramAvatar(
  ctx: CanvasRenderingContext2D,
  size: number,
  item: MemberTestimonial
): void {
  const bg = ctx.createRadialGradient(size * 0.35, size * 0.3, 12, size * 0.5, size * 0.5, size * 0.55);
  bg.addColorStop(0, '#172a4a');
  bg.addColorStop(1, '#070e1d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = item.accent;
  ctx.font = `bold ${Math.round(size * 0.34)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getInitials(item.name), size / 2, size / 2 + 4);
}

interface FloatingCardProps {
  item: MemberTestimonial;
  slot: FloatingSlot;
  onSelect: (id: string) => void;
  onHover: (
    hovering: boolean,
    tooltip?: string,
    action?: (() => void) | null,
    preview?: HoverPreview | null
  ) => void;
}

const FloatingTestimonialCard: React.FC<FloatingCardProps> = ({
  item,
  slot,
  onSelect,
  onHover,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const moteRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const cardTexture = useMemo(() => createCardTexture(item), [item]);

  // Circular portrait CanvasTexture initialized with monogram fallback, then painted with real Cloudinary photo
  const portraitBundle = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawMonogramAvatar(ctx, size, item);
    }
    const texture = finalizeCrispTexture(canvas, { anisotropy: 4, srgb: true });
    return { canvas, ctx, texture, size };
  }, [item]);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled || !portraitBundle.ctx) return;
      const { ctx, size, texture } = portraitBundle;
      ctx.save();
      ctx.clearRect(0, 0, size, size);
      // Circular clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Aspect-ratio cover crop biased slightly upward so faces stay centered
      const iw = img.naturalWidth || size;
      const ih = img.naturalHeight || size;
      const crop = Math.min(iw, ih);
      const sx = (iw - crop) / 2;
      const sy = Math.max(0, (ih - crop) * 0.22);
      ctx.drawImage(img, sx, sy, crop, crop, 0, 0, size, size);

      // Subtle inner neon vignette ring
      ctx.strokeStyle = `${item.accent}cc`;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      texture.needsUpdate = true;
    };
    img.src = item.avatar;

    return () => {
      cancelled = true;
    };
  }, [item.avatar, item.accent, portraitBundle]);

  useEffect(() => {
    return () => {
      cardTexture.dispose();
      portraitBundle.texture.dispose();
    };
  }, [cardTexture, portraitBundle.texture]);

  const hoverPreview: HoverPreview = useMemo(
    () => ({
      title: item.name,
      badge: item.tag.toUpperCase(),
      summary: `“${item.quote.slice(0, 155)}…”`,
      bullets: [item.role],
      actionLabel: 'Đọc trọn vẹn lời chia sẻ',
    }),
    [item]
  );

  const handleInteract = () => onSelect(item.id);

  // Zero-allocation smooth 3D levitation & frame-rate-independent parallax sway
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
    const t = state.clock.elapsedTime;
    const g = rootRef.current;
    if (g) {
      const targetY = slot.position[1] + Math.sin(t * 1.15 + slot.phase) * slot.floatAmp;
      const targetX = slot.position[0] + Math.cos(t * 0.65 + slot.phase) * 0.04;
      const targetZ = slot.position[2] + (hovered ? -0.18 : 0);
      const posEase = 1 - Math.exp(-6 * dt);
      const hoverEase = 1 - Math.exp(-8 * dt);
      const rotEase = 1 - Math.exp(-5 * dt);

      g.position.x = THREE.MathUtils.lerp(g.position.x, targetX, posEase);
      g.position.y = THREE.MathUtils.lerp(g.position.y, targetY, posEase);
      g.position.z = THREE.MathUtils.lerp(g.position.z, targetZ, hoverEase);

      const targetRotY = slot.baseRotY + Math.sin(t * 0.7 + slot.phase) * 0.055;
      const targetRotX = Math.cos(t * 0.85 + slot.phase) * 0.03;
      const targetRotZ = Math.sin(t * 0.55 + slot.phase) * 0.018;

      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetRotX, rotEase);
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetRotY, rotEase);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, targetRotZ, rotEase);

      const targetScale = hovered ? 1.075 : 1.0;
      const nextScale = THREE.MathUtils.lerp(g.scale.x, targetScale, hoverEase);
      g.scale.setScalar(nextScale);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.55 + slot.phase;
    }

    if (moteRef.current) {
      moteRef.current.rotation.y = t * 1.1 + slot.phase;
      moteRef.current.rotation.x = t * 0.7;
    }
  });

  return (
    <group
      ref={rootRef}
      position={slot.position}
      rotation={[0, slot.baseRotY, 0]}
    >
      {/* Sculpted dark obsidian glass card chassis */}
      <RoundedBox
        args={[1.72, 1.04, 0.048]}
        radius={0.032}
        smoothness={2}
        onClick={(e) => {
          e.stopPropagation();
          handleInteract();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(true, `Đọc chia sẻ của ${item.name}`, handleInteract, hoverPreview);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(false);
        }}
      >
        <meshStandardMaterial
          color="#0a1428"
          metalness={0.82}
          roughness={0.22}
          emissive={item.accent}
          emissiveIntensity={hovered ? 0.2 : 0.06}
        />
      </RoundedBox>

      {/* Luminous front holographic testimonial display */}
      <mesh
        position={[0, 0, 0.026]}
        onClick={(e) => {
          e.stopPropagation();
          handleInteract();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(true, `Đọc chia sẻ của ${item.name}`, handleInteract, hoverPreview);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(false);
        }}
      >
        <planeGeometry args={[1.66, 0.99]} />
        <meshStandardMaterial
          map={cardTexture}
          emissive="#ffffff"
          emissiveMap={cardTexture}
          emissiveIntensity={hovered ? 0.78 : 0.58}
          roughness={0.34}
          metalness={0.05}
        />
      </mesh>

      {/* Subtle glowing back panel so card looks clean even when viewed from behind/side */}
      <mesh position={[0, 0, -0.026]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.64, 0.96]} />
        <meshStandardMaterial
          color="#071022"
          emissive={item.accent}
          emissiveIntensity={0.14}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Top & bottom neon accent edge trims */}
      <mesh position={[0, 0.525, 0.008]}>
        <boxGeometry args={[1.48, 0.014, 0.014]} />
        <meshBasicMaterial color={item.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.525, 0.008]}>
        <boxGeometry args={[1.1, 0.012, 0.012]} />
        <meshBasicMaterial color={item.accent} toneMapped={false} />
      </mesh>

      {/* Floating 3D Member Portrait Medallion protruding forward at top-left of card */}
      <group position={[-0.61, 0.3, 0.072]}>
        {/* Metallic medallion backing disc */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.012]}>
          <cylinderGeometry args={[0.19, 0.19, 0.024, 24]} />
          <meshStandardMaterial color="#111d35" metalness={0.9} roughness={0.18} />
        </mesh>

        {/* Member real portrait photo */}
        <mesh
          position={[0, 0, 0.002]}
          onClick={(e) => {
            e.stopPropagation();
            handleInteract();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            onHover(true, `Đọc chia sẻ của ${item.name}`, handleInteract, hoverPreview);
          }}
          onPointerOut={() => {
            setHovered(false);
            onHover(false);
          }}
        >
          <circleGeometry args={[0.175, 32]} />
          <meshStandardMaterial
            map={portraitBundle.texture}
            emissive="#ffffff"
            emissiveMap={portraitBundle.texture}
            emissiveIntensity={hovered ? 0.55 : 0.4}
            roughness={0.28}
            metalness={0.04}
          />
        </mesh>

        {/* Neon halo ring framing the 3D portrait */}
        <mesh ref={ringRef} position={[0, 0, 0.004]}>
          <torusGeometry args={[0.192, 0.012, 10, 36]} />
          <meshBasicMaterial color={item.accent} toneMapped={false} />
        </mesh>

        {/* Outer subtle holographic pulse ring */}
        <mesh position={[0, 0, -0.004]}>
          <ringGeometry args={[0.214, 0.226, 36]} />
          <meshBasicMaterial
            color={item.accent}
            transparent
            opacity={hovered ? 0.72 : 0.32}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Subtle zero-gravity magnetic anchor filament & diamond mote below the card */}
      <mesh position={[0, -0.68, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.26, 6]} />
        <meshBasicMaterial
          color={item.accent}
          transparent
          opacity={hovered ? 0.55 : 0.25}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={moteRef} position={[0, -0.83, 0]}>
        <octahedronGeometry args={[0.036, 0]} />
        <meshBasicMaterial color={item.accent} toneMapped={false} />
      </mesh>
    </group>
  );
};

export const FloatingTestimonials3D: React.FC = () => {
  const { setHoveringInteractive, openTestimonialsModal } = useHeritageStore(
    useShallow((s) => ({
      setHoveringInteractive: s.setHoveringInteractive,
      openTestimonialsModal: s.openTestimonialsModal,
    }))
  );

  return (
    <group name="floating-testimonials-3d">
      {CLUB_PROFILE.testimonials.slice(0, FLOATING_SLOTS.length).map((item, idx) => (
        <FloatingTestimonialCard
          key={item.id}
          item={item}
          slot={FLOATING_SLOTS[idx]}
          onSelect={(id) => openTestimonialsModal(id)}
          onHover={setHoveringInteractive}
        />
      ))}
    </group>
  );
};
