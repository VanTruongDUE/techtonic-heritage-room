import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useGLTF } from '@react-three/drei';
import { CylinderCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { clone as cloneSkinnedScene } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useShallow } from 'zustand/react/shallow';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createBrushedMetalMaps, createMarbleMaps } from '../utils/proceduralMaterials';
import {
  createMythicalFurBumpMap,
  createMythicalPBRMaterial,
  createSculptedFeatherGeometry,
  createSpiraledHornGeometry,
  smoothSkinnedGeometryNormals,
} from '../utils/mythicalCreatureGeometries';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import type { Department, HoverPreview } from '../../../types/heritage';

type EmblemKind = 'wolf' | 'pegasus' | 'fox' | 'stag' | 'crown';

interface DeptEmblemConfig {
  id: string;
  dept: Department;
  kind: EmblemKind;
  isMascot: boolean;
  position: [number, number, number];
  rotationY: number;
  badge: string;
  title: string;
  subtitle: string;
  accent: string;
  secondary: string;
  description: string;
}

const CURRENT_TERM = 'Nhiệm kỳ 2026 - 2027';

// Preload all 4 rigged skeletal mythical beast models at module parse time
useGLTF.preload('/models/mascots/wolf.glb');
useGLTF.preload('/models/mascots/horse.glb');
useGLTF.preload('/models/mascots/fox.glb');
useGLTF.preload('/models/mascots/stag.glb');

/**
 * 4 Mythical Living Rigged Guardians (Tứ Linh Thần Thú TechTonic) + Sovereign Leadership Artifact:
 * - Ban Chuyên Môn:   Thiên Lang Thiên Cơ (Rigged Celestial Alpha Wolf — wolf.glb)
 * - Ban Sự Kiện:      Thiên Mã Phượng Dực (Rigged Celestial Flame Pegasus — horse.glb + sculpted flame wings & Kirin horn)
 * - Ban Nhân Sự:      Linh Hồ Ngọc Bích (Rigged Celestial Emerald Spirit Fox — fox.glb)
 * - Ban Truyền Thông: Thần Lộc Quang Ảnh (Rigged Celestial Sovereign Stag — stag.glb with crystal cyan antlers)
 * - Ban Chủ Nhiệm:    Vương Miện & La Bàn Định Hướng 3D xoay 360°
 */
const DEPT_EMBLEMS: DeptEmblemConfig[] = [
  {
    id: 'emblem-bcm-wolf',
    dept: 'Ban Chuyên Môn',
    kind: 'wolf',
    isMascot: true,
    position: [-14.87, 0, -12.95],
    rotationY: Math.PI / 2,
    badge: 'LINH THÚ THẦN THOẠI • BAN CHUYÊN MÔN',
    title: 'Thiên Lang Thiên Cơ',
    subtitle: 'Bản lĩnh dẫn đầu • Tư duy sắc bén • Kỷ luật thép',
    accent: '#fb923c',
    secondary: '#00F5FF',
    description:
      'Thiên Lang thần thoại mang bộ lông tinh vân uy nghi, ánh mắt hổ phách rực sáng và khí chất thủ lĩnh bầy đàn — biểu trưng cho tư duy thuật toán sắc bén và sức mạnh nghiên cứu của Ban Chuyên Môn.',
  },
  {
    id: 'emblem-bsk-pegasus',
    dept: 'Ban Sự Kiện',
    kind: 'pegasus',
    isMascot: true,
    position: [14.87, 0, -12.95],
    rotationY: -Math.PI / 2,
    badge: 'LINH THÚ THẦN THOẠI • BAN SỰ KIỆN',
    title: 'Thiên Mã Phượng Dực',
    subtitle: 'Bùng nổ sân khấu • Sải cánh thăng hoa • Nhiệt huyết',
    accent: '#c084fc',
    secondary: '#f472b6',
    description:
      'Thiên Mã Kỳ Lân mang bờm lửa hoàng kim, sừng xoắn pha lê và đôi cánh phượng quang rực rỡ — biểu tượng cho khí thế bùng nổ, tốc độ triển khai và dấu ấn sân khấu mãn nhãn của Ban Sự Kiện.',
  },
  {
    id: 'emblem-bns-fox',
    dept: 'Ban Nhân Sự',
    kind: 'fox',
    isMascot: true,
    position: [2.95, 0, 6.4],
    rotationY: Math.PI,
    badge: 'LINH THÚ THẦN THOẠI • BAN NHÂN SỰ',
    title: 'Linh Hồ Ngọc Bích',
    subtitle: 'Tinh tế • Thấu cảm • Gắn kết bền chặt',
    accent: '#34d399',
    secondary: '#a7f3d0',
    description:
      'Linh Hồ Ngọc Bích uyển chuyển với lớp lông nhung thanh khiết, đôi mắt tinh anh và ngọc linh khí xoay quanh — biểu trưng cho sự khéo léo, tận tâm và sợi dây gắn kết con người của Ban Nhân Sự.',
  },
  {
    id: 'emblem-btt-stag',
    dept: 'Ban Truyền Thông',
    kind: 'stag',
    isMascot: true,
    position: [-3.55, 0, 6.35],
    rotationY: Math.PI,
    badge: 'LINH THÚ THẦN THOẠI • BAN TRUYỀN THÔNG',
    title: 'Thần Lộc Quang Ảnh',
    subtitle: 'Tầm nhìn cao quý • Tỏa sáng • Lan tỏa thương hiệu',
    accent: '#38bdf8',
    secondary: '#00F5FF',
    description:
      'Thần Lộc Quang Ảnh mang cặp gạc pha lê xanh lam phát sáng như ngọn hải đăng sáng tạo — biểu trưng cho vẻ đẹp thẩm mỹ cao quý, góc nhìn nghệ thuật và sức lan tỏa mạnh mẽ của Ban Truyền Thông.',
  },
  {
    id: 'emblem-bcn-crown',
    dept: 'Ban Chủ Nhiệm',
    kind: 'crown',
    isMascot: false,
    position: [15.95, 0, 6.9],
    rotationY: Math.PI - 0.35,
    badge: 'VẬT PHẨM • BAN CHỦ NHIỆM',
    title: 'Vương Miện & La Bàn Định Hướng',
    subtitle: 'Dẫn dắt • Tầm nhìn • Chiến lược',
    accent: '#fbbf24',
    secondary: '#00F5FF',
    description:
      'Vương miện hoàng kim lồng trong la bàn con quay định hướng — biểu tượng cho vai trò lãnh đạo, kết nối 4 Ban và định vị tầm nhìn phát triển CLB.',
  },
];

function createEmblemPlaqueTexture(cfg: DeptEmblemConfig): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(460, 152, 1.5);
  if (ctx) {
    ctx.fillStyle = '#050b18';
    ctx.fillRect(0, 0, 460, 152);

    ctx.strokeStyle = cfg.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 452, 144);

    ctx.fillStyle = cfg.accent;
    ctx.fillRect(4, 4, 452, 6);

    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.accent;
    ctx.font = '700 15px "JetBrains Mono", monospace';
    ctx.fillText(cfg.badge, 230, 38, 424);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 25px Inter, sans-serif';
    ctx.fillText(cfg.title, 230, 82, 424);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 15px Inter, sans-serif';
    ctx.fillText(cfg.subtitle, 230, 120, 424);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 4, srgb: true });
}

/* ================= SHARED RISING CELESTIAL SPIRIT EMBERS ================= */
const CelestialEmbers: React.FC<{
  color: string;
  count?: number;
  radius?: number;
  height?: number;
  baseY?: number;
  hovered: boolean;
}> = ({ color, count = 34, radius = 0.62, height = 1.35, baseY = 1.02, hovered }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { geom, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seedArr = new Float32Array(count * 4);
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + (i % 5) * 0.42;
      const r = radius * (0.48 + ((i * 37) % 100) / 145);
      const y = ((i * 53) % 100) / 100;
      const speed = 0.16 + ((i * 29) % 100) / 360;
      seedArr[i * 4] = a;
      seedArr[i * 4 + 1] = r;
      seedArr[i * 4 + 2] = y;
      seedArr[i * 4 + 3] = speed;

      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = baseY + y * height;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geom: g, seeds: seedArr };
  }, [baseY, count, height, radius]);

  useEffect(() => {
    return () => {
      geom.dispose();
    };
  }, [geom]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const boost = hovered ? 1.45 : 1.0;

    for (let i = 0; i < count; i += 1) {
      const a0 = seeds[i * 4];
      const r0 = seeds[i * 4 + 1];
      const y0 = seeds[i * 4 + 2];
      const spd = seeds[i * 4 + 3];

      const cycle = (y0 + t * spd * boost) % 1;
      const swirl = a0 + t * (0.45 + spd * 0.9) * boost + cycle * 1.4;
      const r = r0 * (1 - cycle * 0.32) + Math.sin(t * 2.2 + i) * 0.035;

      pos.setXYZ(i, Math.cos(swirl) * r, baseY + cycle * height, Math.sin(swirl) * r);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geom}>
      <pointsMaterial
        color={color}
        size={hovered ? 0.048 : 0.036}
        transparent
        opacity={hovered ? 0.95 : 0.72}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
};

/* ================= SHARED FLUID SKELETAL ANIMATION & SMOOTH-NORMAL ENGINE ================= */
interface BeastBehaviorStep {
  clip: string;
  speed: number;
  hold: number;
  fade: number;
  oneShot?: boolean;
}

interface RiggedBeastProps {
  url: string;
  scale: number;
  baseRotationY: number;
  phaseOffset: number;
  headScale?: number;
  earScale?: number;
  behaviors: BeastBehaviorStep[];
  hoverClip: string;
  hoverSpeed?: number;
  hovered: boolean;
  furBump: THREE.CanvasTexture;
  resolveMaterial: (meshName: string, materialName: string) => THREE.Material;
  renderAttachments?: (bones: Record<string, THREE.Object3D>, rootGroup: THREE.Group | null) => React.ReactNode;
}

const MythicalRiggedBeast: React.FC<RiggedBeastProps> = ({
  url,
  scale,
  baseRotationY,
  phaseOffset,
  headScale = 1.12,
  earScale = 1.15,
  behaviors,
  hoverClip,
  hoverSpeed = 0.62,
  hovered,
  resolveMaterial,
  renderAttachments,
}) => {
  const gltf = useGLTF(url);
  const rootRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const currentClipRef = useRef<string>('');
  const targetClipSpeedRef = useRef<number>(behaviors[0]?.speed ?? 0.46);
  const stepIdxRef = useRef<number>(Math.floor(phaseOffset) % Math.max(1, behaviors.length));
  const switchTimerRef = useRef<number>(3.2 + (phaseOffset % 2.4));
  const prevHoveredRef = useRef<boolean>(false);

  // Clone the rigged skeleton safely, weld coincident normals for silky organic muscle smoothness,
  // and bind custom mythical PBR + Fresnel rim shaders per material zone.
  const { sceneClone, bonesMap, disposedGeoms, disposedMats } = useMemo(() => {
    const cloned = cloneSkinnedScene(gltf.scene) as THREE.Group;
    const bones: Record<string, THREE.Object3D> = {};
    const geomsToDispose: THREE.BufferGeometry[] = [];
    const matsToDispose: THREE.Material[] = [];
    const matCache = new Map<string, THREE.Material>();

    cloned.traverse((obj) => {
      if (obj.name) {
        bones[obj.name] = obj;
      }

      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;

        // Smooth split-face normals while preserving 100% of skinIndex/skinWeight!
        if (mesh.geometry) {
          const smoothed = smoothSkinnedGeometryNormals(mesh.geometry);
          geomsToDispose.push(smoothed);
          mesh.geometry = smoothed;
        }

        const swapMat = (orig: THREE.Material): THREE.Material => {
          const key = `${mesh.name}::${orig.name}`;
          const existing = matCache.get(key);
          if (existing) return existing;
          const custom = resolveMaterial(mesh.name, orig.name);
          matCache.set(key, custom);
          matsToDispose.push(custom);
          return custom;
        };

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(swapMat);
        } else if (mesh.material) {
          mesh.material = swapMat(mesh.material);
        }
      }
    });

    return {
      sceneClone: cloned,
      bonesMap: bones,
      disposedGeoms: geomsToDispose,
      disposedMats: matsToDispose,
    };
  }, [gltf.scene, resolveMaterial]);

  // Build AnimationMixer and start at each creature's asynchronous starting step
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(sceneClone);
    mixerRef.current = mixer;
    const map = new Map<string, THREE.AnimationAction>();

    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      map.set(clip.name, action);
    }
    actionsRef.current = map;

    const startStep = behaviors[stepIdxRef.current] ?? behaviors[0];
    const initialName =
      (startStep && map.has(startStep.clip) ? startStep.clip : undefined) ??
      gltf.animations[0]?.name ??
      '';
    if (initialName) {
      const firstAction = map.get(initialName)!;
      firstAction.reset().fadeIn(0.6).play();
      firstAction.time = (phaseOffset * 0.73) % Math.max(0.5, firstAction.getClip().duration);
      currentClipRef.current = initialName;
      targetClipSpeedRef.current = startStep?.speed ?? 0.46;
      mixer.timeScale = targetClipSpeedRef.current;
    }

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(sceneClone);
      mixerRef.current = null;
      actionsRef.current.clear();
    };
  }, [behaviors, gltf.animations, phaseOffset, sceneClone]);

  // Cleanly dispose cloned smoothed geometries and custom shader materials on unmount
  useEffect(() => {
    return () => {
      disposedGeoms.forEach((g) => g.dispose());
      disposedMats.forEach((m) => m.dispose());
    };
  }, [disposedGeoms, disposedMats]);

  const crossFadeTo = (targetName: string, fadeDuration = 1.15, oneShot = false) => {
    const map = actionsRef.current;
    const next = map.get(targetName);
    if (!next) return;

    if (currentClipRef.current === targetName && !oneShot) return;

    const prev = map.get(currentClipRef.current);
    next.reset();
    if (oneShot) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }
    next.setEffectiveTimeScale(1).setEffectiveWeight(1).play();

    if (prev && prev !== next) {
      prev.crossFadeTo(next, fadeDuration, true);
    } else {
      next.fadeIn(fadeDuration);
    }
    currentClipRef.current = targetName;
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // React gracefully to hover with a playful, friendly hop/salute (never jarring!)
    if (hovered !== prevHoveredRef.current) {
      prevHoveredRef.current = hovered;
      if (hovered && actionsRef.current.has(hoverClip)) {
        targetClipSpeedRef.current = hoverSpeed;
        crossFadeTo(hoverClip, 0.55, true);
        const clipDur = actionsRef.current.get(hoverClip)?.getClip().duration ?? 1.4;
        switchTimerRef.current = Math.max(1.4, (clipDur / hoverSpeed) * 0.82);
      } else {
        const calmStep = behaviors[0];
        if (calmStep && actionsRef.current.has(calmStep.clip)) {
          targetClipSpeedRef.current = calmStep.speed;
          crossFadeTo(calmStep.clip, 1.15, false);
          switchTimerRef.current = calmStep.hold;
        }
      }
    }

    // Autonomous interleaved choreography across 7-8 varied gentle actions
    switchTimerRef.current -= dt;
    if (switchTimerRef.current <= 0) {
      if (hovered) {
        // Gently alternate between curious look-around and relaxed breathing while hovered
        const attentive = behaviors[1] ?? behaviors[0];
        if (attentive) {
          targetClipSpeedRef.current = Math.min(0.62, attentive.speed * 1.18);
          crossFadeTo(attentive.clip, 1.0, false);
          switchTimerRef.current = 4.2;
        }
      } else {
        stepIdxRef.current = (stepIdxRef.current + 1) % behaviors.length;
        const step = behaviors[stepIdxRef.current];
        if (step && actionsRef.current.has(step.clip)) {
          targetClipSpeedRef.current = step.speed;
          crossFadeTo(step.clip, step.fade, Boolean(step.oneShot));
          if (step.oneShot) {
            const clipDur = actionsRef.current.get(step.clip)?.getClip().duration ?? 1.4;
            // Lead out smoothly before the one-shot clip ends so there's zero frame-0 snap
            switchTimerRef.current = Math.max(1.1, (clipDur / step.speed) * 0.8);
          } else {
            switchTimerRef.current = step.hold;
          }
        } else {
          switchTimerRef.current = 4.0;
        }
      }
    }

    if (mixerRef.current) {
      const targetSpeed = hovered ? Math.max(targetClipSpeedRef.current, 0.56) : targetClipSpeedRef.current;
      mixerRef.current.timeScale = THREE.MathUtils.lerp(mixerRef.current.timeScale, targetSpeed, dt * 2.2);
      mixerRef.current.update(dt);
    }

    // Subtle Pixar-style cute companion proportions on Head & expressive Ears (post-mixer so clips don't overwrite)
    const headBone = bonesMap['Head'];
    if (headBone && headScale !== 1) {
      headBone.scale.setScalar(headScale);
    }
    const earL = bonesMap['Ear1.L'];
    const earR = bonesMap['Ear1.R'];
    if (earL && earR && earScale !== 1) {
      const earPulse = earScale + Math.sin(t * 1.8 + phaseOffset) * 0.02;
      earL.scale.setScalar(earPulse);
      earR.scale.setScalar(earPulse);
    }

    // Dreamy, multi-harmonic organic look-around sway & soft hover breathing lift
    if (rootRef.current) {
      const organicTurn =
        baseRotationY +
        Math.sin(t * 0.22 + phaseOffset) * 0.14 +
        Math.sin(t * 0.095 + phaseOffset * 1.6) * 0.08;
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, organicTurn, dt * 1.8);
      const targetScale = scale * (hovered ? 1.055 : 1.0);
      rootRef.current.scale.setScalar(THREE.MathUtils.lerp(rootRef.current.scale.x, targetScale, dt * 3.8));
    }
  });

  return (
    <group position={[0, 1.0, 0]}>
      <group ref={rootRef} scale={scale} rotation={[0, baseRotationY, 0]}>
        <primitive object={sceneClone} />
      </group>
      {renderAttachments ? renderAttachments(bonesMap, rootRef.current) : null}
    </group>
  );
};

/* ================= 1. BAN CHUYÊN MÔN — THIÊN LANG THIÊN CƠ (CELESTIAL ALPHA WOLF) ================= */
const CelestialWolfMascot: React.FC<{ hovered: boolean; furBump: THREE.CanvasTexture }> = ({
  hovered,
  furBump,
}) => {
  const haloOuterRef = useRef<THREE.Mesh>(null);
  const haloInnerRef = useRef<THREE.Mesh>(null);

  const resolveMaterial = useMemo(
    () => (_meshName: string, materialName: string): THREE.Material => {
      if (materialName === 'Eyes_Black') {
        return new THREE.MeshStandardMaterial({
          color: '#fff7ed',
          emissive: '#fb923c',
          emissiveIntensity: 2.35,
          roughness: 0.08,
          toneMapped: false,
        });
      }
      if (materialName === 'Nose') {
        return new THREE.MeshPhysicalMaterial({
          color: '#091120',
          roughness: 0.2,
          metalness: 0.25,
          clearcoat: 0.9,
        });
      }
      if (materialName === 'Main_Light') {
        return createMythicalPBRMaterial({
          cacheKey: 'wolf-mane',
          color: '#8ea8cb',
          emissive: '#1e3a5f',
          emissiveIntensity: 0.28,
          roughness: 0.42,
          metalness: 0.16,
          sheen: 0.95,
          sheenColor: '#fed7aa',
          iridescence: 0.35,
          bumpMap: furBump,
          bumpScale: 0.008,
          rimColor: '#fb923c',
          rimPower: 2.4,
          rimStrength: 0.95,
        });
      }
      return createMythicalPBRMaterial({
        cacheKey: 'wolf-coat',
        color: '#192744',
        emissive: '#0c1c38',
        emissiveIntensity: 0.2,
        roughness: 0.44,
        metalness: 0.18,
        sheen: 0.9,
        sheenColor: '#7dd3fc',
        iridescence: 0.3,
        bumpMap: furBump,
        bumpScale: 0.009,
        rimColor: '#00f5ff',
        rimPower: 2.5,
        rimStrength: 0.88,
      });
    },
    [furBump]
  );

  const behaviors = useMemo<BeastBehaviorStep[]>(
    () => [
      { clip: 'AnimalArmature|Idle', speed: 0.44, hold: 5.4, fade: 1.3 },
      { clip: 'AnimalArmature|Idle_2', speed: 0.48, hold: 5.0, fade: 1.25 },
      { clip: 'AnimalArmature|Eating', speed: 0.44, hold: 4.4, fade: 1.2 },
      { clip: 'AnimalArmature|Idle_2_HeadLow', speed: 0.46, hold: 4.8, fade: 1.25 },
      { clip: 'AnimalArmature|Walk', speed: 0.45, hold: 2.7, fade: 1.0 },
      { clip: 'AnimalArmature|Idle', speed: 0.43, hold: 4.6, fade: 1.3 },
      { clip: 'AnimalArmature|Jump_ToIdle', speed: 0.54, hold: 2.2, fade: 0.85, oneShot: true },
      { clip: 'AnimalArmature|Idle_2', speed: 0.46, hold: 4.8, fade: 1.2 },
    ],
    []
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (haloOuterRef.current) {
      haloOuterRef.current.rotation.z += dt * (hovered ? 0.65 : 0.24);
      haloOuterRef.current.position.y = 1.52 + Math.sin(t * 1.1) * 0.022;
    }
    if (haloInnerRef.current) {
      haloInnerRef.current.rotation.z -= dt * (hovered ? 0.85 : 0.34);
      haloInnerRef.current.position.y = 1.52 + Math.sin(t * 1.1) * 0.022;
    }
  });

  return (
    <group>
      <MythicalRiggedBeast
        url="/models/mascots/wolf.glb"
        scale={0.305}
        baseRotationY={0.28}
        phaseOffset={0.4}
        headScale={1.14}
        earScale={1.16}
        behaviors={behaviors}
        hoverClip="AnimalArmature|Jump_ToIdle"
        hoverSpeed={0.6}
        hovered={hovered}
        furBump={furBump}
        resolveMaterial={resolveMaterial}
      />

      {/* Sovereign Arcane Runic Halo behind Alpha Wolf's shoulders */}
      <mesh ref={haloOuterRef} position={[0, 1.52, -0.28]} rotation={[0.14, 0.22, 0]}>
        <torusGeometry args={[0.42, 0.009, 10, 56]} />
        <meshBasicMaterial color="#fb923c" transparent opacity={hovered ? 0.9 : 0.52} toneMapped={false} />
      </mesh>
      <mesh ref={haloInnerRef} position={[0, 1.52, -0.28]} rotation={[0.14, 0.22, Math.PI / 6]}>
        <ringGeometry args={[0.3, 0.322, 6]} />
        <meshBasicMaterial
          color="#00F5FF"
          transparent
          opacity={hovered ? 0.8 : 0.38}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <CelestialEmbers color="#fb923c" count={28} radius={0.52} height={1.05} hovered={hovered} />
    </group>
  );
};

/* ================= 2. BAN SỰ KIỆN — THIÊN MÃ PHƯỢNG DỰC (CELESTIAL FLAME PEGASUS) ================= */
const PegasusWingsAndHorn: React.FC<{
  bones: Record<string, THREE.Object3D>;
  hovered: boolean;
}> = ({ bones, hovered }) => {
  const wingsHostRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const hornHostRef = useRef<THREE.Group>(null);

  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpHeadPos = useMemo(() => new THREE.Vector3(), []);
  const tmpHeadEndPos = useMemo(() => new THREE.Vector3(), []);
  const tmpForward = useMemo(() => new THREE.Vector3(), []);
  const tmpAim = useMemo(() => new THREE.Vector3(), []);
  const tmpRight = useMemo(() => new THREE.Vector3(), []);
  const tmpOrthoUp = useMemo(() => new THREE.Vector3(), []);
  const yUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const { primaryFeather, secondaryFeather, hornGeom } = useMemo(() => {
    return {
      primaryFeather: createSculptedFeatherGeometry(0.37, 0.08, 0.038),
      secondaryFeather: createSculptedFeatherGeometry(0.26, 0.068, 0.028),
      hornGeom: createSpiraledHornGeometry(0.195, 0.019),
    };
  }, []);

  useEffect(() => {
    return () => {
      primaryFeather.dispose();
      secondaryFeather.dispose();
      hornGeom.dispose();
    };
  }, [hornGeom, primaryFeather, secondaryFeather]);

  const wingFeathers = useMemo(
    () => [
      { x: 0.08, y: 0.04, z: -0.02, rz: -0.35, ry: -0.18, s: 0.82 },
      { x: 0.16, y: 0.08, z: -0.05, rz: -0.52, ry: -0.22, s: 0.98 },
      { x: 0.25, y: 0.11, z: -0.09, rz: -0.72, ry: -0.25, s: 1.12 },
      { x: 0.34, y: 0.12, z: -0.13, rz: -0.92, ry: -0.28, s: 1.18 },
      { x: 0.42, y: 0.10, z: -0.16, rz: -1.12, ry: -0.26, s: 1.06 },
      { x: 0.48, y: 0.06, z: -0.18, rz: -1.30, ry: -0.22, s: 0.9 },
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const parent = wingsHostRef.current?.parent;

    // Anchor wings seamlessly to the animated Torso2/Torso3 ribcage bone
    const torsoBone = bones['Torso2'] ?? bones['Torso3'] ?? bones['Torso'];
    if (torsoBone && wingsHostRef.current && parent) {
      torsoBone.getWorldPosition(tmpPos);
      parent.worldToLocal(tmpPos);
      wingsHostRef.current.position.set(tmpPos.x, tmpPos.y + 0.1, tmpPos.z - 0.015);
      wingsHostRef.current.rotation.y =
        -0.24 + Math.sin(t * 0.22 + 2.1) * 0.14 + Math.sin(t * 0.095 + 2.1 * 1.6) * 0.08;
    }

    // Anchor spiraled Kirin horn seamlessly to the animated Head bone
    const headBone = bones['Head'];
    const earL = bones['Ear1.L'];
    const earR = bones['Ear1.R'];
    if (headBone && hornHostRef.current && parent) {
      headBone.getWorldPosition(tmpHeadPos);
      parent.worldToLocal(tmpHeadPos);

      if (earL && earR) {
        earL.getWorldPosition(tmpPos);
        earR.getWorldPosition(tmpHeadEndPos);
        parent.worldToLocal(tmpPos);
        parent.worldToLocal(tmpHeadEndPos);
        // Midpoint between ears = exact crown of forehead!
        tmpHeadPos.lerpVectors(tmpPos, tmpHeadEndPos, 0.5);
        tmpRight.subVectors(tmpPos, tmpHeadEndPos).normalize();
        const neckBone = bones['Neck3'] ?? bones['Neck2'];
        if (neckBone) {
          neckBone.getWorldPosition(tmpForward);
          parent.worldToLocal(tmpForward);
          tmpForward.subVectors(tmpHeadPos, tmpForward).normalize();
        } else {
          tmpForward.set(0, 0.35, 0.94).normalize();
        }
        tmpOrthoUp.crossVectors(tmpForward, tmpRight).normalize();
        if (tmpOrthoUp.y < 0) tmpOrthoUp.negate();

        hornHostRef.current.position.set(
          tmpHeadPos.x + tmpForward.x * 0.035,
          tmpHeadPos.y + 0.026,
          tmpHeadPos.z + tmpForward.z * 0.035
        );
        // Map local +Y (exact horn axis) cleanly upward & heroically forward
        tmpAim.copy(tmpOrthoUp).multiplyScalar(0.74).addScaledVector(tmpForward, 0.67).normalize();
        hornHostRef.current.quaternion.setFromUnitVectors(yUp, tmpAim);
      } else {
        hornHostRef.current.position.set(tmpHeadPos.x, tmpHeadPos.y + 0.09, tmpHeadPos.z + 0.065);
      }
    }

    // Dreamy, slow celestial Phoenix wing breathing & soft hover flare
    const speed = hovered ? 1.9 : 0.95;
    const flap = Math.sin(t * speed) * (hovered ? 0.24 : 0.14) + (hovered ? 0.16 : 0.06);
    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = flap;
      leftWingRef.current.rotation.y = 0.28 + Math.cos(t * speed) * 0.06;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = -flap;
      rightWingRef.current.rotation.y = -0.28 - Math.cos(t * speed) * 0.06;
    }
  });

  const renderWingSide = (sign: 1 | -1) => (
    <group>
      {wingFeathers.map((f, idx) => (
        <group
          key={`pf-${sign}-${idx}`}
          position={[sign * f.x, f.y, f.z]}
          rotation={[0.18, sign * f.ry, sign * f.rz]}
          scale={f.s}
        >
          <mesh geometry={primaryFeather}>
            <meshPhysicalMaterial
              color={idx >= 4 ? '#fde047' : idx >= 2 ? '#f472b6' : '#c084fc'}
              emissive={idx >= 3 ? '#f59e0b' : '#d946ef'}
              emissiveIntensity={hovered ? 1.55 : 0.95}
              roughness={0.22}
              metalness={0.35}
              iridescence={0.95}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          {idx < 4 && (
            <mesh geometry={secondaryFeather} position={[sign * -0.02, -0.02, 0.022]} scale={0.82}>
              <meshPhysicalMaterial
                color="#f0abfc"
                emissive="#a855f7"
                emissiveIntensity={0.75}
                roughness={0.25}
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );

  return (
    <>
      {/* Sculpted Feathered Phoenix-Flame Wings tracking Torso bone */}
      <group ref={wingsHostRef} position={[0, 0.58, 0.03]} rotation={[0, -0.24, 0]} scale={0.82}>
        <group ref={rightWingRef} position={[0.08, 0, 0]}>
          {renderWingSide(1)}
        </group>
        <group ref={leftWingRef} position={[-0.08, 0, 0]}>
          {renderWingSide(-1)}
        </group>
      </group>

      {/* Spiraled Golden-Crystal Kirin Horn tracking Head bone */}
      <group ref={hornHostRef}>
        <mesh geometry={hornGeom}>
          <meshPhysicalMaterial
            color="#fef08a"
            emissive="#fbbf24"
            emissiveIntensity={hovered ? 2.1 : 1.35}
            metalness={0.65}
            roughness={0.14}
            clearcoat={1}
            iridescence={0.9}
          />
        </mesh>
      </group>
    </>
  );
};

const CelestialPegasusMascot: React.FC<{ hovered: boolean; furBump: THREE.CanvasTexture }> = ({
  hovered,
  furBump,
}) => {
  const resolveMaterial = useMemo(
    () => (_meshName: string, materialName: string): THREE.Material => {
      if (materialName === 'Eye_Black' || materialName === 'Eye_White') {
        return new THREE.MeshStandardMaterial({
          color: '#fef9c3',
          emissive: '#facc15',
          emissiveIntensity: 2.3,
          roughness: 0.08,
          toneMapped: false,
        });
      }
      if (materialName === 'Hair') {
        return createMythicalPBRMaterial({
          cacheKey: 'pegasus-mane',
          color: '#fde047',
          emissive: '#ec4899',
          emissiveIntensity: 1.05,
          roughness: 0.28,
          metalness: 0.32,
          sheen: 1.0,
          sheenColor: '#fef08a',
          iridescence: 0.92,
          bumpMap: furBump,
          bumpScale: 0.01,
          rimColor: '#fde047',
          rimPower: 2.1,
          rimStrength: 1.15,
        });
      }
      if (materialName === 'Hooves') {
        return new THREE.MeshPhysicalMaterial({
          color: '#fbbf24',
          emissive: '#d97706',
          emissiveIntensity: 0.48,
          metalness: 0.94,
          roughness: 0.16,
          clearcoat: 0.95,
        });
      }
      if (materialName === 'Main_Light') {
        return createMythicalPBRMaterial({
          cacheKey: 'pegasus-blaze',
          color: '#e9d5ff',
          emissive: '#a855f7',
          emissiveIntensity: 0.3,
          roughness: 0.36,
          metalness: 0.2,
          sheen: 0.9,
          sheenColor: '#fde047',
          iridescence: 0.75,
          rimColor: '#fde047',
          rimPower: 2.3,
          rimStrength: 0.9,
        });
      }
      if (materialName === 'Muzzle') {
        return createMythicalPBRMaterial({
          cacheKey: 'pegasus-muzzle',
          color: '#2c154a',
          roughness: 0.38,
          sheen: 0.9,
          sheenColor: '#f472b6',
          rimColor: '#f472b6',
          rimPower: 2.6,
          rimStrength: 0.72,
        });
      }
      return createMythicalPBRMaterial({
        cacheKey: 'pegasus-coat',
        color: '#3c1e66',
        emissive: '#220b42',
        emissiveIntensity: 0.24,
        roughness: 0.36,
        metalness: 0.22,
        sheen: 0.92,
        sheenColor: '#f472b6',
        clearcoat: 0.28,
        iridescence: 0.82,
        bumpMap: furBump,
        bumpScale: 0.006,
        rimColor: '#e879f9',
        rimPower: 2.4,
        rimStrength: 0.95,
      });
    },
    [furBump]
  );

  const behaviors = useMemo<BeastBehaviorStep[]>(
    () => [
      { clip: 'AnimalArmature|Idle', speed: 0.44, hold: 5.2, fade: 1.3 },
      { clip: 'AnimalArmature|Idle_2', speed: 0.48, hold: 5.0, fade: 1.25 },
      { clip: 'AnimalArmature|Idle_Headlow', speed: 0.45, hold: 4.8, fade: 1.25 },
      { clip: 'AnimalArmature|Walk', speed: 0.45, hold: 2.8, fade: 1.05 },
      { clip: 'AnimalArmature|Idle', speed: 0.43, hold: 4.6, fade: 1.3 },
      { clip: 'AnimalArmature|Eating', speed: 0.48, hold: 5.2, fade: 1.3 },
      { clip: 'AnimalArmature|Jump_toIdle', speed: 0.55, hold: 2.6, fade: 0.9, oneShot: true },
      { clip: 'AnimalArmature|Idle_2', speed: 0.46, hold: 4.8, fade: 1.25 },
    ],
    []
  );

  return (
    <group>
      <MythicalRiggedBeast
        url="/models/mascots/horse.glb"
        scale={0.2}
        baseRotationY={-0.24}
        phaseOffset={2.1}
        headScale={1.11}
        earScale={1.15}
        behaviors={behaviors}
        hoverClip="AnimalArmature|Jump_toIdle"
        hoverSpeed={0.62}
        hovered={hovered}
        furBump={furBump}
        resolveMaterial={resolveMaterial}
        renderAttachments={(bones) => <PegasusWingsAndHorn bones={bones} hovered={hovered} />}
      />

      <CelestialEmbers color="#f472b6" count={32} radius={0.56} height={1.2} hovered={hovered} />
    </group>
  );
};

/* ================= 3. BAN NHÂN SỰ — LINH HỒ NGỌC BÍCH (CELESTIAL EMERALD SPIRIT FOX) ================= */
const CelestialFoxMascot: React.FC<{ hovered: boolean; furBump: THREE.CanvasTexture }> = ({
  hovered,
  furBump,
}) => {
  const pearlRef = useRef<THREE.Group>(null);

  const resolveMaterial = useMemo(
    () => (_meshName: string, materialName: string): THREE.Material => {
      if (materialName === 'Eyes') {
        return new THREE.MeshStandardMaterial({
          color: '#ecfdf5',
          emissive: '#34d399',
          emissiveIntensity: 2.4,
          roughness: 0.08,
          toneMapped: false,
        });
      }
      if (materialName === 'Black') {
        return new THREE.MeshPhysicalMaterial({
          color: '#071a1f',
          roughness: 0.22,
          metalness: 0.25,
          clearcoat: 0.88,
        });
      }
      if (materialName === 'Main_Light') {
        return createMythicalPBRMaterial({
          cacheKey: 'fox-light',
          color: '#c7f9e5',
          emissive: '#10b981',
          emissiveIntensity: 0.36,
          roughness: 0.4,
          metalness: 0.12,
          sheen: 1.0,
          sheenColor: '#ffffff',
          iridescence: 0.45,
          bumpMap: furBump,
          bumpScale: 0.008,
          rimColor: '#a7f3d0',
          rimPower: 2.2,
          rimStrength: 1.05,
        });
      }
      if (materialName === 'Grey') {
        return createMythicalPBRMaterial({
          cacheKey: 'fox-trim',
          color: '#0b2d32',
          roughness: 0.42,
          sheen: 0.85,
          sheenColor: '#34d399',
          bumpMap: furBump,
          bumpScale: 0.008,
          rimColor: '#34d399',
          rimPower: 2.6,
          rimStrength: 0.72,
        });
      }
      return createMythicalPBRMaterial({
        cacheKey: 'fox-coat',
        color: '#0f5747',
        emissive: '#06332a',
        emissiveIntensity: 0.26,
        roughness: 0.42,
        metalness: 0.14,
        sheen: 0.96,
        sheenColor: '#6ee7b7',
        iridescence: 0.4,
        bumpMap: furBump,
        bumpScale: 0.009,
        rimColor: '#34d399',
        rimPower: 2.35,
        rimStrength: 0.98,
      });
    },
    [furBump]
  );

  const behaviors = useMemo<BeastBehaviorStep[]>(
    () => [
      { clip: 'AnimalArmature|Idle_2', speed: 0.46, hold: 4.8, fade: 1.25 },
      { clip: 'AnimalArmature|Eating', speed: 0.45, hold: 4.2, fade: 1.2 },
      { clip: 'AnimalArmature|Idle', speed: 0.44, hold: 5.0, fade: 1.3 },
      { clip: 'AnimalArmature|Jump_ToIdle', speed: 0.56, hold: 2.1, fade: 0.85, oneShot: true },
      { clip: 'AnimalArmature|Idle_2_HeadLow', speed: 0.46, hold: 4.8, fade: 1.25 },
      { clip: 'AnimalArmature|Walk', speed: 0.46, hold: 2.6, fade: 1.0 },
      { clip: 'AnimalArmature|Idle', speed: 0.43, hold: 4.8, fade: 1.3 },
      { clip: 'AnimalArmature|Idle_HitReact_Left', speed: 0.44, hold: 1.4, fade: 0.7, oneShot: true },
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pearlRef.current) {
      const orbitSpeed = hovered ? 1.25 : 0.68;
      pearlRef.current.position.set(
        Math.cos(t * orbitSpeed) * 0.38,
        1.5 + Math.sin(t * 1.45) * 0.05,
        Math.sin(t * orbitSpeed) * 0.38
      );
      pearlRef.current.rotation.y = t * 0.9;
    }
  });

  return (
    <group>
      <MythicalRiggedBeast
        url="/models/mascots/fox.glb"
        scale={0.29}
        baseRotationY={-0.25}
        phaseOffset={3.8}
        headScale={1.15}
        earScale={1.18}
        behaviors={behaviors}
        hoverClip="AnimalArmature|Jump_ToIdle"
        hoverSpeed={0.62}
        hovered={hovered}
        furBump={furBump}
        resolveMaterial={resolveMaterial}
      />

      {/* Orbiting Sacred Jade Spirit Pearl */}
      <group ref={pearlRef} position={[0.36, 1.5, 0.12]}>
        <mesh>
          <sphereGeometry args={[0.044, 20, 16]} />
          <meshPhysicalMaterial
            color="#a7f3d0"
            emissive="#34d399"
            emissiveIntensity={hovered ? 2.0 : 1.35}
            roughness={0.08}
            clearcoat={1}
            iridescence={0.9}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.6, 0.4, 0]}>
          <torusGeometry args={[0.08, 0.006, 10, 32]} />
          <meshBasicMaterial color="#6ee7b7" toneMapped={false} />
        </mesh>
      </group>

      <CelestialEmbers color="#34d399" count={28} radius={0.5} height={1.0} hovered={hovered} />
    </group>
  );
};

/* ================= 4. BAN TRUYỀN THÔNG — THẦN LỘC QUANG ẢNH (CELESTIAL SOVEREIGN STAG) ================= */
const StagCrownPrism: React.FC<{ bones: Record<string, THREE.Object3D>; hovered: boolean }> = ({
  bones,
  hovered,
}) => {
  const prismRef = useRef<THREE.Group>(null);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const hornNode = bones['Stag_Horns'] ?? bones['Head'];
    const parent = prismRef.current?.parent;

    if (hornNode && prismRef.current && parent) {
      hornNode.getWorldPosition(tmpPos);
      parent.worldToLocal(tmpPos);
      prismRef.current.position.set(tmpPos.x, tmpPos.y + 0.21 + Math.sin(t * 1.5) * 0.022, tmpPos.z + 0.015);
      prismRef.current.rotation.y += dt * (hovered ? 1.6 : 0.75);
    }
  });

  return (
    <group ref={prismRef} position={[0, 0.96, 0.2]}>
      <mesh>
        <octahedronGeometry args={[0.048, 0]} />
        <meshBasicMaterial color="#00F5FF" toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.098, 0.007, 10, 36]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.82} toneMapped={false} />
      </mesh>
    </group>
  );
};

const CelestialStagMascot: React.FC<{ hovered: boolean; furBump: THREE.CanvasTexture }> = ({
  hovered,
  furBump,
}) => {
  const resolveMaterial = useMemo(
    () => (meshName: string, materialName: string): THREE.Material => {
      // Branching 3,232-vertex antlers glow like radiant celestial cyan diamond crystal!
      if (meshName === 'Stag_Horns') {
        return createMythicalPBRMaterial({
          cacheKey: 'stag-crystal-horns',
          color: '#e0f2fe',
          emissive: '#00f5ff',
          emissiveIntensity: 1.25,
          roughness: 0.12,
          metalness: 0.35,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          iridescence: 0.95,
          sheen: 0.6,
          sheenColor: '#ffffff',
          rimColor: '#ffffff',
          rimPower: 2.0,
          rimStrength: 1.2,
        });
      }
      if (materialName === 'Material.011') {
        // Luminous electric-cyan friendly eyes
        return new THREE.MeshStandardMaterial({
          color: '#e0f2fe',
          emissive: '#00f5ff',
          emissiveIntensity: 2.5,
          roughness: 0.08,
          toneMapped: false,
        });
      }
      if (materialName === 'Material.003') {
        // Luminous ice-silver throat ruff & chest
        return createMythicalPBRMaterial({
          cacheKey: 'stag-chest',
          color: '#cce9ff',
          emissive: '#0284c7',
          emissiveIntensity: 0.34,
          roughness: 0.38,
          metalness: 0.16,
          sheen: 1.0,
          sheenColor: '#e0f2fe',
          iridescence: 0.55,
          bumpMap: furBump,
          bumpScale: 0.008,
          rimColor: '#38bdf8',
          rimPower: 2.2,
          rimStrength: 1.0,
        });
      }
      if (materialName === 'Material.001') {
        // Forged chrome-sapphire hooves & muzzle
        return new THREE.MeshPhysicalMaterial({
          color: '#1b365d',
          emissive: '#0369a1',
          emissiveIntensity: 0.25,
          metalness: 0.82,
          roughness: 0.2,
          clearcoat: 0.9,
        });
      }
      if (materialName === 'Material.010') {
        // Deep midnight cobalt lower legs & back trim
        return createMythicalPBRMaterial({
          cacheKey: 'stag-dark',
          color: '#0e2244',
          roughness: 0.42,
          sheen: 0.88,
          sheenColor: '#38bdf8',
          bumpMap: furBump,
          bumpScale: 0.008,
          rimColor: '#38bdf8',
          rimPower: 2.5,
          rimStrength: 0.78,
        });
      }
      // Primary royal sapphire velvety coat
      return createMythicalPBRMaterial({
        cacheKey: 'stag-coat',
        color: '#193866',
        emissive: '#0a2247',
        emissiveIntensity: 0.24,
        roughness: 0.4,
        metalness: 0.18,
        sheen: 0.95,
        sheenColor: '#7dd3fc',
        iridescence: 0.45,
        bumpMap: furBump,
        bumpScale: 0.008,
        rimColor: '#00f5ff',
        rimPower: 2.35,
        rimStrength: 0.98,
      });
    },
    [furBump]
  );

  const behaviors = useMemo<BeastBehaviorStep[]>(
    () => [
      { clip: 'AnimalArmature|Idle', speed: 0.43, hold: 5.4, fade: 1.3 },
      { clip: 'AnimalArmature|Idle_2', speed: 0.47, hold: 5.0, fade: 1.25 },
      { clip: 'AnimalArmature|Eating', speed: 0.52, hold: 6.0, fade: 1.35 },
      { clip: 'AnimalArmature|Idle_Headlow', speed: 0.45, hold: 4.8, fade: 1.25 },
      { clip: 'AnimalArmature|Walk', speed: 0.44, hold: 2.8, fade: 1.05 },
      { clip: 'AnimalArmature|Idle', speed: 0.42, hold: 4.8, fade: 1.3 },
      { clip: 'AnimalArmature|Jump_toIdle', speed: 0.54, hold: 2.4, fade: 0.9, oneShot: true },
      { clip: 'AnimalArmature|Idle_2', speed: 0.46, hold: 5.0, fade: 1.25 },
    ],
    []
  );

  return (
    <group>
      <MythicalRiggedBeast
        url="/models/mascots/stag.glb"
        scale={0.21}
        baseRotationY={0.26}
        phaseOffset={5.3}
        headScale={1.11}
        earScale={1.14}
        behaviors={behaviors}
        hoverClip="AnimalArmature|Jump_toIdle"
        hoverSpeed={0.6}
        hovered={hovered}
        furBump={furBump}
        resolveMaterial={resolveMaterial}
        renderAttachments={(bones) => <StagCrownPrism bones={bones} hovered={hovered} />}
      />

      <CelestialEmbers color="#38bdf8" count={30} radius={0.54} height={1.2} hovered={hovered} />
    </group>
  );
};

/* ================= 5. ROTATING 3D ARTIFACT: SOVEREIGN CROWN & ASTROLABE (BAN CHỦ NHIỆM) ================= */
const LeadershipCrownArtifact: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  const crownRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (crownRef.current) {
      crownRef.current.rotation.y += dt * (hovered ? 1.2 : 0.65);
      crownRef.current.position.y = 1.44 + Math.sin(t * 1.7) * 0.055;
      const targetScale = hovered ? 1.1 : 1.0;
      crownRef.current.scale.setScalar(THREE.MathUtils.lerp(crownRef.current.scale.x, targetScale, dt * 7));
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x += dt * 0.75;
      outerRingRef.current.rotation.y += dt * 0.45;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= dt * 0.95;
      innerRingRef.current.rotation.x -= dt * 0.4;
    }
  });

  return (
    <group ref={crownRef} position={[0, 1.44, 0]}>
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.026, 16, 40]} />
        <meshPhysicalMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.38}
          metalness={0.96}
          roughness={0.14}
          clearcoat={0.8}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.185, 0.165, 0.1, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#f59e0b"
          emissive="#fbbf24"
          emissiveIntensity={0.32}
          metalness={0.96}
          roughness={0.16}
          clearcoat={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({ length: 8 }).map((_, idx) => {
        const angle = (idx / 8) * Math.PI * 2;
        const rx = Math.cos(angle) * 0.175;
        const rz = Math.sin(angle) * 0.175;
        const isMain = idx % 2 === 0;
        const h = isMain ? 0.16 : 0.11;
        return (
          <group key={`spire-${idx}`} position={[rx, 0.06, rz]}>
            <mesh position={[0, h / 2, 0]}>
              <coneGeometry args={[0.028, h, 6]} />
              <meshPhysicalMaterial
                color="#fde047"
                emissive="#f59e0b"
                emissiveIntensity={0.42}
                metalness={0.96}
                roughness={0.14}
                clearcoat={0.85}
              />
            </mesh>
            <mesh position={[0, h + 0.018, 0]}>
              <octahedronGeometry args={[isMain ? 0.024 : 0.016, 0]} />
              <meshBasicMaterial color={isMain ? '#00F5FF' : '#fde047'} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.06, 0]}>
        <octahedronGeometry args={[0.065, 0]} />
        <meshBasicMaterial color="#00F5FF" toneMapped={false} />
      </mesh>
      <mesh ref={outerRingRef}>
        <torusGeometry args={[0.34, 0.011, 12, 48]} />
        <meshBasicMaterial color="#fbbf24" toneMapped={false} />
      </mesh>
      <mesh ref={innerRingRef}>
        <torusGeometry args={[0.28, 0.008, 12, 44]} />
        <meshBasicMaterial color="#00F5FF" toneMapped={false} />
      </mesh>
    </group>
  );
};

/* ================= HEROIC OBSIDIAN PEDESTAL + INTERACTIVE CONTROLLER ================= */
const DeptEmblemPedestal: React.FC<{
  cfg: DeptEmblemConfig;
  marbleMaps: { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
  furBump: THREE.CanvasTexture;
}> = ({ cfg, marbleMaps, metalMaps, furBump }) => {
  const { setHoveringInteractive, openExecutiveBoard } = useHeritageStore(
    useShallow((s) => ({
      setHoveringInteractive: s.setHoveringInteractive,
      openExecutiveBoard: s.openExecutiveBoard,
    }))
  );
  const [hovered, setHovered] = useState(false);

  const plaqueTex = useMemo(() => createEmblemPlaqueTexture(cfg), [cfg]);

  useEffect(() => {
    return () => {
      plaqueTex.dispose();
    };
  }, [plaqueTex]);

  const preview: HoverPreview = useMemo(
    () => ({
      title: cfg.title,
      badge: cfg.badge,
      summary: cfg.description,
      bullets: [cfg.subtitle, `Trực thuộc: ${cfg.dept} (${CURRENT_TERM})`],
      actionLabel: `Xem hồ sơ ${cfg.dept}`,
    }),
    [cfg]
  );

  const handleOpen = () => openExecutiveBoard(cfg.dept, CURRENT_TERM);

  // Refined proportional royal dais for our compact cute mythical companions
  const topRadius = cfg.isMascot ? 0.47 : 0.32;
  const colTopRadius = cfg.isMascot ? 0.38 : 0.27;
  const colBotRadius = cfg.isMascot ? 0.42 : 0.3;
  const baseRadius = cfg.isMascot ? 0.49 : 0.36;
  const ringInner = cfg.isMascot ? 0.51 : 0.36;
  const ringOuter = cfg.isMascot ? 0.58 : 0.42;
  const plaqueZ = cfg.isMascot ? 0.45 : 0.32;

  return (
    <group
      position={cfg.position}
      rotation={[0, cfg.rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        handleOpen();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setHoveringInteractive(true, `${cfg.title} — ${cfg.dept}`, handleOpen, preview);
      }}
      onPointerOut={() => {
        setHovered(false);
        setHoveringInteractive(false);
      }}
    >
      {/* Heroic Obsidian & Brushed-Metal Royal Pedestal with Lightweight Collider */}
      <RigidBody type="fixed" colliders={false} position={[0, 0.5, 0]}>
        <CylinderCollider args={[0.5, baseRadius]} />

        <mesh position={[0, -0.492, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ringInner, ringOuter, 44]} />
          <meshBasicMaterial
            color={cfg.accent}
            transparent
            opacity={hovered ? 0.94 : 0.52}
            toneMapped={false}
          />
        </mesh>

        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[baseRadius - 0.02, baseRadius + 0.02, 0.08, 36]} />
          <meshStandardMaterial
            color="#0a1222"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.9}
            roughness={0.22}
          />
        </mesh>

        <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[colTopRadius, colBotRadius, 0.88, 36]} />
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#111d34"
            roughness={0.26}
            metalness={0.44}
          />
        </mesh>

        <mesh position={[0, 0.47, 0]} receiveShadow>
          <cylinderGeometry args={[topRadius, topRadius - 0.03, 0.06, 40]} />
          <meshStandardMaterial color="#13213a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.501, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[topRadius - 0.11, topRadius - 0.025, 44]} />
          <meshBasicMaterial color={cfg.accent} toneMapped={false} />
        </mesh>
      </RigidBody>

      {/* Anti-Glare Front Nameplate Plaque */}
      <group position={[0, 0.54, plaqueZ]} rotation={[-0.22, 0, 0]}>
        <RoundedBox args={[0.58, 0.21, 0.022]} radius={0.01} smoothness={3}>
          <meshStandardMaterial
            color="#121e36"
            metalness={0.86}
            roughness={0.22}
            emissive={cfg.accent}
            emissiveIntensity={hovered ? 0.38 : 0.14}
          />
        </RoundedBox>
        <mesh position={[0, 0, 0.013]}>
          <planeGeometry args={[0.54, 0.178]} />
          <meshBasicMaterial map={plaqueTex} color={hovered ? '#ffffff' : '#dce8f8'} />
        </mesh>
      </group>

      {/* 4 Rigged Mythical Living Beasts OR Rotating Golden Leadership Artifact */}
      <Suspense fallback={null}>
        {cfg.kind === 'wolf' && <CelestialWolfMascot hovered={hovered} furBump={furBump} />}
        {cfg.kind === 'pegasus' && <CelestialPegasusMascot hovered={hovered} furBump={furBump} />}
        {cfg.kind === 'fox' && <CelestialFoxMascot hovered={hovered} furBump={furBump} />}
        {cfg.kind === 'stag' && <CelestialStagMascot hovered={hovered} furBump={furBump} />}
      </Suspense>
      {cfg.kind === 'crown' && <LeadershipCrownArtifact hovered={hovered} />}
    </group>
  );
};

export const DepartmentMascots3D: React.FC = () => {
  const marbleMaps = useMemo(() => createMarbleMaps(), []);
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);
  const furBump = useMemo(() => createMythicalFurBumpMap(), []);

  useEffect(() => {
    return () => {
      marbleMaps.map.dispose();
      marbleMaps.roughnessMap.dispose();
      marbleMaps.bumpMap.dispose();
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
      furBump.dispose();
    };
  }, [furBump, marbleMaps, metalMaps]);

  return (
    <group name="department-mascots-and-artifacts-3d">
      {DEPT_EMBLEMS.map((cfg) => (
        <DeptEmblemPedestal
          key={cfg.id}
          cfg={cfg}
          marbleMaps={marbleMaps}
          metalMaps={metalMaps}
          furBump={furBump}
        />
      ))}
    </group>
  );
};
