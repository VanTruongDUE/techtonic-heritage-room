import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';

export const InteractiveCorner: React.FC = () => {
  const { setHoveringInteractive, openModal } = useHeritageStore();
  const bookRef = useRef<THREE.Group>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const lastDrawTimeRef = useRef(0);
  const [isBookHovered, setIsBookHovered] = useState(false);
  const [isScreenPaused, setIsScreenPaused] = useState(false);

  const videoTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    textureRef.current = tex;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      videoTexture.dispose();
    };
  }, [videoTexture]);

  useFrame((state) => {
    if (bookRef.current) {
      const hoverLift = isBookHovered ? 0.12 : 0;
      bookRef.current.position.y =
        1.35 + hoverLift + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      bookRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }

    // Throttle LED canvas redraws (~22 FPS) to reduce CPU/GPU texture upload overhead
    const elapsed = state.clock.elapsedTime;
    if (
      canvasRef.current &&
      textureRef.current &&
      (!isScreenPaused || lastDrawTimeRef.current === 0) &&
      elapsed - lastDrawTimeRef.current >= 0.045
    ) {
      lastDrawTimeRef.current = elapsed;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const w = 1024;
        const h = 576;

        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(0, 240, 255, 0.03)';
        for (let y = 0; y < h; y += 8) {
          ctx.fillRect(0, y, w, 1);
        }

        ctx.lineWidth = 3;
        for (let wave = 0; wave < 3; wave++) {
          ctx.beginPath();
          ctx.strokeStyle = wave === 0 ? '#00F0FF' : wave === 1 ? '#0066FF' : '#FF0055';
          for (let x = 0; x < w; x += 10) {
            const freq = 0.015 + wave * 0.005;
            const y = h / 2 + Math.sin(x * freq + elapsed * 3 + wave) * (40 + wave * 25);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TECHTONIC PROMO REEL • VIRTUAL EXHIBIT', w / 2, 80);

        ctx.fillStyle = isScreenPaused ? '#FFD700' : '#00F0FF';
        ctx.font = '600 20px JetBrains Mono, monospace';
        ctx.fillText(
          isScreenPaused
            ? 'TRẠNG THÁI: TẠM DỪNG • NHẤP ĐỂ TIẾP TỤC'
            : `SYSTEM RUNTIME: ${elapsed.toFixed(1)}s • LIVE SIGNAL`,
          w / 2,
          120
        );

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '300 18px Inter, sans-serif';
        ctx.fillText('Pioneering the Next Generation of Digital Builders', w / 2, h - 60);

        textureRef.current.needsUpdate = true;
      }
    }
  });

  const openGuestbook = () => openModal('guestbook');
  const toggleScreen = () => {
    lastDrawTimeRef.current = 0;
    setIsScreenPaused((prev) => !prev);
  };

  return (
    <group position={[9.5, 0, -16]}>
      {/* ================= 1. VIDEO SCREEN ================= */}
      <mesh position={[0, 3, -1.8]}>
        <boxGeometry args={[7.2, 4.2, 0.2]} />
        <meshStandardMaterial color="#0b0e17" metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh
        position={[0, 3, -1.69]}
        onClick={(e) => {
          e.stopPropagation();
          toggleScreen();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveringInteractive(
            true,
            isScreenPaused ? 'Tiếp tục trình chiếu LED' : 'Tạm dừng màn hình LED',
            toggleScreen
          );
        }}
        onPointerOut={() => setHoveringInteractive(false)}
      >
        <planeGeometry args={[6.8, 3.8]} />
        <meshBasicMaterial map={videoTexture} />
      </mesh>

      <mesh position={[0, 5.05, -1.68]}>
        <planeGeometry args={[7, 0.04]} />
        <meshBasicMaterial color="#00F0FF" />
      </mesh>
      <mesh position={[0, 0.95, -1.68]}>
        <planeGeometry args={[7, 0.04]} />
        <meshBasicMaterial color="#0066FF" />
      </mesh>

      {/* ================= 2. GUESTBOOK INTERACTIVE KIOSK ================= */}
      <RigidBody type="fixed" position={[-4, 0.55, 1.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 1.1, 0.9]} />
          <meshStandardMaterial color="#0e1320" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 6, 0, 0]}>
          <boxGeometry args={[1.3, 0.05, 1.0]} />
          <meshStandardMaterial color="#141a29" metalness={0.9} roughness={0.1} />
        </mesh>
      </RigidBody>

      <group
        ref={bookRef}
        position={[-4, 1.35, 1.5]}
        onClick={(e) => {
          e.stopPropagation();
          openGuestbook();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsBookHovered(true);
          setHoveringInteractive(true, 'Ghi Lời chúc Sổ lưu bút', openGuestbook);
        }}
        onPointerOut={() => {
          setIsBookHovered(false);
          setHoveringInteractive(false);
        }}
      >
        <mesh position={[-0.22, 0, 0]} rotation={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.42, 0.04, 0.55]} />
          <meshStandardMaterial color="#0066FF" metalness={0.6} roughness={0.3} />
        </mesh>

        <mesh position={[0.22, 0, 0]} rotation={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.42, 0.04, 0.55]} />
          <meshStandardMaterial color="#0066FF" metalness={0.6} roughness={0.3} />
        </mesh>

        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.78, 0.02, 0.5]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#00F0FF"
            emissiveIntensity={isBookHovered ? 1.1 : 0.5}
            roughness={0.2}
          />
        </mesh>

        <mesh position={[0.3, 0.2, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.015, 0.015, 0.35, 12]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>

        <pointLight
          position={[0, 0.3, 0]}
          intensity={isBookHovered ? 2.2 : 1.5}
          distance={3.2}
          color="#00F0FF"
        />
      </group>
    </group>
  );
};
