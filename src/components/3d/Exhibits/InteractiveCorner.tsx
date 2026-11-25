import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import {
  createBrushedMetalMaps,
  createLeatherMaps,
  createMarbleMaps,
  createOpenBookPageTexture,
} from '../utils/proceduralMaterials';

export const InteractiveCorner: React.FC = () => {
  const { setHoveringInteractive, openModal, guestbookEntries } = useHeritageStore();
  const bookGroupRef = useRef<THREE.Group>(null);
  const penGroupRef = useRef<THREE.Group>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const lastDrawTimeRef = useRef(0);
  const [isBookHovered, setIsBookHovered] = useState(false);
  const [isScreenPaused, setIsScreenPaused] = useState(false);

  const marbleMaps = useMemo(() => createMarbleMaps(), []);
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);
  const leatherMaps = useMemo(() => createLeatherMaps(), []);
  const leftPageTex = useMemo(() => createOpenBookPageTexture('left'), []);
  const rightPageTex = useMemo(() => createOpenBookPageTexture('right'), []);

  const { leftPageGeom, rightPageGeom, penBodyGeom } = useMemo(() => {
    const buildPage = (isLeft: boolean) => {
      const shape = new THREE.Shape();
      const dir = isLeft ? -1 : 1;
      shape.moveTo(0, 0);
      shape.bezierCurveTo(dir * 0.08, 0.032, dir * 0.24, 0.036, dir * 0.34, 0.008);
      shape.lineTo(dir * 0.34, -0.018);
      shape.bezierCurveTo(dir * 0.24, 0.004, dir * 0.08, 0.004, 0, -0.022);
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: 0.44,
        bevelEnabled: false,
        curveSegments: 24,
      });
      geom.translate(0, 0, -0.22);
      geom.computeVertexNormals();
      return geom;
    };

    const penPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.004, 0.02),
      new THREE.Vector2(0.011, 0.05),
      new THREE.Vector2(0.012, 0.24),
      new THREE.Vector2(0.01, 0.27),
      new THREE.Vector2(0.0, 0.275),
    ];
    const pen = new THREE.LatheGeometry(penPts, 24);
    pen.computeVertexNormals();

    return {
      leftPageGeom: buildPage(true),
      rightPageGeom: buildPage(false),
      penBodyGeom: pen,
    };
  }, []);

  const videoTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    textureRef.current = tex;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      marbleMaps.map.dispose();
      marbleMaps.roughnessMap.dispose();
      marbleMaps.bumpMap.dispose();
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
      leatherMaps.roughnessMap.dispose();
      leatherMaps.bumpMap.dispose();
      leftPageTex.dispose();
      rightPageTex.dispose();
      leftPageGeom.dispose();
      rightPageGeom.dispose();
      penBodyGeom.dispose();
      videoTexture.dispose();
    };
  }, [
    marbleMaps,
    metalMaps,
    leatherMaps,
    leftPageTex,
    rightPageTex,
    leftPageGeom,
    rightPageGeom,
    penBodyGeom,
    videoTexture,
  ]);

  useFrame((state) => {
    if (penGroupRef.current) {
      const lift = isBookHovered ? 0.08 : 0;
      penGroupRef.current.position.y =
        0.11 + lift + Math.sin(state.clock.elapsedTime * 2.2) * 0.012;
      penGroupRef.current.rotation.z =
        -Math.PI / 3.2 + Math.sin(state.clock.elapsedTime * 1.4) * 0.04;
    }

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

        ctx.fillStyle = '#080e1a';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
        for (let y = 0; y < h; y += 8) {
          ctx.fillRect(0, y, w, 1);
        }

        ctx.lineWidth = 3;
        for (let wave = 0; wave < 3; wave++) {
          ctx.beginPath();
          ctx.strokeStyle = wave === 0 ? '#00F0FF' : wave === 1 ? '#3b82f6' : '#93c5fd';
          for (let x = 0; x < w; x += 10) {
            const freq = 0.014 + wave * 0.005;
            const y = h / 2 + Math.sin(x * freq + elapsed * 2.6 + wave) * (36 + wave * 20);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        const slideIndex = Math.floor(elapsed / 5.5) % 3;
        const slideTitles = [
          'TECHTONIC CLUB • DREAM IT - CODE IT',
          'CHUYÊN MÔN HẰNG TUẦN • FE • BE • AI & DATA',
          'CHUỖI SỰ KIỆN • TECHXPLORE • TECHWARE • ĐÔNG - XUÂN',
        ];
        const slideSubtitles = [
          '10+ Giải thưởng  •  100+ Thành viên  •  20+ Dự án  •  ĐH Kinh Tế - ĐH Đà Nẵng',
          'Product Team  •  Lớp CSLT & CSDL  •  Thi đấu ICPC-OLP & NCKH',
          'Mentor - Mentee (From Us To You)  •  Tech Threads  •  Happy Hour & Kiện toàn',
        ];

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 34px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slideTitles[slideIndex], w / 2, 82);

        ctx.fillStyle = isScreenPaused ? '#fbbf24' : '#38bdf8';
        ctx.font = '600 20px "JetBrains Mono", monospace';
        ctx.fillText(
          isScreenPaused
            ? 'TRẠNG THÁI: TẠM DỪNG • NHẤP ĐỂ TIẾP TỤC'
            : `SLIDE 0${slideIndex + 1}/03  •  RUNTIME ${elapsed.toFixed(1)}s`,
          w / 2,
          122
        );

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 21px Inter, sans-serif';
        ctx.fillText(slideSubtitles[slideIndex], w / 2, h - 56);

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
      {/* ================= 1. FRAMED ARCHITECTURAL LED CINEMA DISPLAY & SOUNDBAR ================= */}
      <RoundedBox position={[0, 3.05, -1.84]} args={[7.4, 4.35, 0.22]} radius={0.05} smoothness={6} castShadow>
        <meshStandardMaterial
          color="#1b263b"
          roughnessMap={metalMaps.roughnessMap}
          bumpMap={metalMaps.bumpMap}
          bumpScale={0.004}
          metalness={0.8}
          roughness={0.25}
        />
      </RoundedBox>
      {/* Subtle wall wash ambient rail behind screen */}
      <mesh position={[0, 3.05, -1.96]}>
        <planeGeometry args={[7.6, 4.55]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.14} />
      </mesh>
      <RoundedBox position={[0, 3.05, -1.73]} args={[7.08, 4.05, 0.04]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#0b101b" roughness={0.5} metalness={0.3} />
      </RoundedBox>

      {/* Architectural Soundbar Module beneath Display */}
      <RoundedBox position={[0, 0.72, -1.75]} args={[4.4, 0.22, 0.26]} radius={0.03} smoothness={4} castShadow>
        <meshStandardMaterial color="#182235" metalness={0.75} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.72, -1.61]}>
        <boxGeometry args={[4.0, 0.12, 0.015]} />
        <meshStandardMaterial color="#0a0f18" roughness={0.85} metalness={0.2} />
      </mesh>

      <mesh
        position={[0, 3.05, -1.7]}
        onClick={(e) => {
          e.stopPropagation();
          toggleScreen();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveringInteractive(
            true,
            isScreenPaused ? 'Tiếp tục trình chiếu LED' : 'Tạm dừng màn hình LED',
            toggleScreen,
            {
              title: 'Màn Hình Trình Chiếu TechTonic',
              badge: isScreenPaused ? 'ĐANG TẠM DỪNG' : 'ĐANG PHÁT TRỰC TIẾP',
              summary:
                'Trình chiếu tổng quan TechTonic Club: Tôn chỉ Dream it - Code it, các mảng chuyên môn FE/BE/AI & Data và chuỗi hoạt động nhiệm kỳ.',
              bullets: [
                'Slide 01: 10+ Giải thưởng • 100+ Thành viên • 20+ Dự án',
                'Slide 02: Chuyên môn hằng tuần FE, BE, AI & Data, Product Team',
                'Slide 03: TechXplore • TechWare • Tình nguyện Đông - Xuân',
              ],
              actionLabel: isScreenPaused ? 'Tiếp tục trình chiếu' : 'Tạm dừng màn hình',
            }
          );
        }}
        onPointerOut={() => setHoveringInteractive(false)}
      >
        <planeGeometry args={[6.8, 3.8]} />
        <meshBasicMaterial map={videoTexture} />
      </mesh>

      {[-2.2, 2.2].map((mx) => (
        <mesh key={`mount-${mx}`} position={[mx, 3.05, -2.1]}>
          <boxGeometry args={[0.22, 1.8, 0.45]} />
          <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.32} />
        </mesh>
      ))}

      {/* ================= 2. MUSEUM GUESTBOOK LECTERN & OPEN HARDCOVER BOOK ================= */}
      <RigidBody type="fixed" position={[-4, 0.46, 1.5]}>
        <RoundedBox position={[0, -0.4, 0]} args={[1.38, 0.1, 1.08]} radius={0.03} smoothness={4} receiveShadow>
          <meshStandardMaterial
            color="#475569"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.85}
            roughness={0.24}
          />
        </RoundedBox>

        <RoundedBox position={[0, -0.1, 0]} args={[1.08, 0.54, 0.78]} radius={0.04} smoothness={6} castShadow receiveShadow>
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#d8e3f4"
            roughness={0.34}
            metalness={0.3}
          />
        </RoundedBox>
        {/* Brushed steel pedestal neck column supporting the angled tray cleanly with zero intersection */}
        <mesh position={[0, 0.27, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.24, 0.28, 24]} />
          <meshStandardMaterial
            color="#475569"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.86}
            roughness={0.22}
          />
        </mesh>

        <group position={[0, 0.44, 0.02]} rotation={[0.46, 0, 0]}>
          <RoundedBox args={[1.36, 0.06, 1.04]} radius={0.02} smoothness={4} castShadow>
            <meshStandardMaterial
              color="#273654"
              roughnessMap={metalMaps.roughnessMap}
              roughness={0.28}
              metalness={0.72}
            />
          </RoundedBox>
          <RoundedBox position={[0, 0.04, 0.48]} args={[1.28, 0.04, 0.04]} radius={0.01} smoothness={4}>
            <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.2} />
          </RoundedBox>
        </group>
      </RigidBody>

      {/* Open Hardcover Leather Guestbook resting clearly angled toward standing visitor */}
      <group
        ref={bookGroupRef}
        position={[-4, 0.96, 1.54]}
        rotation={[0.46, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          openGuestbook();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsBookHovered(true);
          const latest = guestbookEntries[0];
          setHoveringInteractive(true, 'Ghi Lời chúc Sổ lưu bút', openGuestbook, {
            title: 'Sổ Lưu Bút Danh Dự TechTonic',
            badge: `${guestbookEntries.length} LỜI CHÚC ĐÃ LƯU`,
            summary:
              'Ghi lại dấu ấn và lời chúc gửi tới các thế hệ thành viên CLB TechTonic — dữ liệu được đồng bộ qua máy chủ API.',
            bullets: latest
              ? [
                  `Mới nhất (${latest.author}): "${latest.message.slice(0, 90)}${
                    latest.message.length > 90 ? '…' : ''
                  }"`,
                  `Đơn vị: ${latest.roleOrAffiliation}`,
                ]
              : ['Hãy là người đầu tiên viết lời chúc vào sổ lưu bút!'],
            actionLabel: 'Mở Sổ Lưu Bút để viết lời chúc',
          });
        }}
        onPointerOut={() => {
          setIsBookHovered(false);
          setHoveringInteractive(false);
        }}
      >
        <mesh position={[0, -0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.48, 24]} />
          <meshStandardMaterial
            color="#1e3a8a"
            roughnessMap={leatherMaps.roughnessMap}
            bumpMap={leatherMaps.bumpMap}
            bumpScale={0.012}
            roughness={0.58}
            metalness={0.18}
          />
        </mesh>

        <RoundedBox position={[-0.19, -0.025, 0]} args={[0.38, 0.024, 0.49]} radius={0.008} smoothness={4} castShadow>
          <meshStandardMaterial
            color="#1e3a8a"
            roughnessMap={leatherMaps.roughnessMap}
            bumpMap={leatherMaps.bumpMap}
            bumpScale={0.012}
            roughness={0.58}
            metalness={0.18}
          />
        </RoundedBox>
        <RoundedBox position={[0.19, -0.025, 0]} args={[0.38, 0.024, 0.49]} radius={0.008} smoothness={4} castShadow>
          <meshStandardMaterial
            color="#1e3a8a"
            roughnessMap={leatherMaps.roughnessMap}
            bumpMap={leatherMaps.bumpMap}
            bumpScale={0.012}
            roughness={0.58}
            metalness={0.18}
          />
        </RoundedBox>

        {/* 4 Brass Bookbinding Corner Guards */}
        {[
          [-0.365, -0.23],
          [-0.365, 0.23],
          [0.365, -0.23],
          [0.365, 0.23],
        ].map(([cx, cz], i) => (
          <mesh key={`book-corner-${i}`} position={[cx, -0.024, cz]}>
            <boxGeometry args={[0.035, 0.028, 0.035]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        <mesh geometry={leftPageGeom} position={[0, 0.008, 0]}>
          <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
        </mesh>
        <mesh geometry={rightPageGeom} position={[0, 0.008, 0]}>
          <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
        </mesh>

        <mesh position={[-0.175, 0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.31, 0.42]} />
          <meshStandardMaterial map={leftPageTex} roughness={0.85} />
        </mesh>
        <mesh position={[0.175, 0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.31, 0.42]} />
          <meshStandardMaterial map={rightPageTex} roughness={0.85} />
        </mesh>

        <mesh position={[0.02, 0.004, 0.27]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.018, 0.004, 0.14]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.5} />
        </mesh>

        <group ref={penGroupRef} position={[0.46, 0.11, 0.05]}>
          <mesh geometry={penBodyGeom} castShadow>
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.9}
              roughness={0.16}
              emissive="#38bdf8"
              emissiveIntensity={isBookHovered ? 0.35 : 0.08}
            />
          </mesh>
          {/* Gold fountain nib collar & pocket clip */}
          <mesh position={[0, 0.048, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.012, 16]} />
            <meshStandardMaterial color="#d4af37" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0.014, 0.19, 0]}>
            <boxGeometry args={[0.004, 0.08, 0.004]} />
            <meshStandardMaterial color="#d4af37" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.013, 0.013, 0.025, 16]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>

        <pointLight
          position={[0, 0.45, 0.15]}
          intensity={isBookHovered ? 5.5 : 3.2}
          distance={3.2}
          decay={1.2}
          color="#e0f2fe"
        />
      </group>
    </group>
  );
};
