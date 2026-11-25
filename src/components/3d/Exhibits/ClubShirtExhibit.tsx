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
 * Tailored 3D Club Polo Shirt mounted on a brushed-metal mannequin & veined marble turntable.
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

  // Sculpted organic shirt torso geometry with curved shoulders, waist taper, and rounded hem
  const torsoGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.44, -0.58);
    shape.bezierCurveTo(-0.43, -0.25, -0.45, 0.05, -0.48, 0.28);
    shape.bezierCurveTo(-0.47, 0.44, -0.34, 0.56, -0.17, 0.62);
    shape.bezierCurveTo(-0.08, 0.52, 0.08, 0.52, 0.17, 0.62);
    shape.bezierCurveTo(0.34, 0.56, 0.47, 0.44, 0.48, 0.28);
    shape.bezierCurveTo(0.45, 0.05, 0.43, -0.25, 0.44, -0.58);
    shape.bezierCurveTo(0.18, -0.62, -0.18, -0.62, -0.44, -0.58);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.085,
      bevelSize: 0.055,
      bevelSegments: 14,
      curveSegments: 32,
    });
    geom.center();
    geom.computeVertexNormals();
    return geom;
  }, []);

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
      chestBadgeTex.dispose();
      backPrintTex.dispose();
    };
  }, [
    fabricMaps,
    marbleMaps,
    metalMaps,
    plaqueMap,
    torsoGeometry,
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
      {/* Dedicated soft warm-cool fill light for shirt plaque & knit texture */}
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

        {/* Brushed titanium top collar */}
        <mesh position={[0, 0.43, 0]}>
          <cylinderGeometry args={[1.42, 1.4, 0.05, 64]} />
          <meshStandardMaterial
            color="#64748b"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.88}
            roughness={0.22}
          />
        </mesh>

        {/* Subtle recessed cyan rim ring */}
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
      {/* Taut architectural barrier rail between shirt stanchions */}
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

      {/* ================= TAILORED 3D SHIRT ON MANNEQUIN STAND ================= */}
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
        {/* Mannequin Neck Cap Finial */}
        <mesh position={[0, 1.98, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.11, 0.14, 36]} />
          <meshStandardMaterial color="#334155" metalness={0.68} roughness={0.32} />
        </mesh>
        <mesh position={[0, 2.06, 0]}>
          <sphereGeometry args={[0.095, 32, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.74} roughness={0.28} />
        </mesh>

        {/* Tailored Shirt Torso */}
        <group position={[0, 1.26, 0]}>
          <mesh geometry={torsoGeometry} castShadow receiveShadow>
            <meshStandardMaterial
              map={fabricMaps.map}
              bumpMap={fabricMaps.bumpMap}
              bumpScale={0.015}
              color="#1b3157"
              roughness={0.78}
              metalness={0.08}
              emissive="#0b2247"
              emissiveIntensity={hovered ? 0.35 : 0.12}
            />
          </mesh>

          {/* Left & Right Seamless Shoulder Caps joining Sleeves to Torso */}
          {[-0.42, 0.42].map((sx) => (
            <mesh key={`shoulder-cap-${sx}`} position={[sx, 0.36, 0]} scale={[1.1, 0.9, 1.1]}>
              <sphereGeometry args={[0.165, 24, 20]} />
              <meshStandardMaterial
                map={fabricMaps.map}
                bumpMap={fabricMaps.bumpMap}
                bumpScale={0.015}
                color="#1b3157"
                roughness={0.78}
                metalness={0.08}
              />
            </mesh>
          ))}

          {/* Left Tailored Sleeve + Ribbed Cuff */}
          <group position={[-0.54, 0.24, 0]} rotation={[0, 0, -Math.PI / 4.2]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.155, 0.175, 0.44, 36]} />
              <meshStandardMaterial
                map={fabricMaps.map}
                bumpMap={fabricMaps.bumpMap}
                bumpScale={0.015}
                color="#1b3157"
                roughness={0.78}
                metalness={0.08}
              />
            </mesh>
            <mesh position={[0, -0.21, 0]}>
              <cylinderGeometry args={[0.158, 0.158, 0.035, 36]} />
              <meshStandardMaterial color="#38bdf8" roughness={0.5} metalness={0.15} />
            </mesh>
            <mesh position={[0, -0.226, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.145, 32]} />
              <meshStandardMaterial color="#090e1a" roughness={0.9} />
            </mesh>
          </group>

          {/* Right Tailored Sleeve + Ribbed Cuff */}
          <group position={[0.54, 0.24, 0]} rotation={[0, 0, Math.PI / 4.2]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.155, 0.175, 0.44, 36]} />
              <meshStandardMaterial
                map={fabricMaps.map}
                bumpMap={fabricMaps.bumpMap}
                bumpScale={0.015}
                color="#1b3157"
                roughness={0.78}
                metalness={0.08}
              />
            </mesh>
            <mesh position={[0, -0.21, 0]}>
              <cylinderGeometry args={[0.158, 0.158, 0.035, 36]} />
              <meshStandardMaterial color="#38bdf8" roughness={0.5} metalness={0.15} />
            </mesh>
            <mesh position={[0, -0.226, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.145, 32]} />
              <meshStandardMaterial color="#090e1a" roughness={0.9} />
            </mesh>
          </group>

          {/* Ribbed Polo Collar Ring + Left/Right Folded Collar Wings */}
          <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.155, 0.038, 20, 48]} />
            <meshStandardMaterial color="#0f1d36" roughness={0.7} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.64, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.158, 0.01, 16, 48]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.4} metalness={0.2} />
          </mesh>
          {[-0.085, 0.085].map((cx) => (
            <RoundedBox
              key={`collar-wing-${cx}`}
              position={[cx, 0.56, 0.175]}
              rotation={[0.32, cx > 0 ? -0.22 : 0.22, cx > 0 ? 0.32 : -0.32]}
              args={[0.13, 0.09, 0.024]}
              radius={0.008}
              smoothness={4}
            >
              <meshStandardMaterial color="#10203d" roughness={0.68} />
            </RoundedBox>
          ))}

          {/* Front Polo Placket & Metallic Snap Buttons */}
          <mesh position={[0, 0.42, 0.195]}>
            <boxGeometry args={[0.07, 0.28, 0.022]} />
            <meshStandardMaterial color="#101f3a" roughness={0.7} />
          </mesh>
          {[0.49, 0.39].map((btnY, i) => (
            <mesh key={`btn-${i}`} position={[0, btnY, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.008, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.18} />
            </mesh>
          ))}

          {/* Bottom Tailored Hem Double Stitch Rim */}
          <mesh position={[0, -0.585, 0]}>
            <boxGeometry args={[0.88, 0.022, 0.32]} />
            <meshStandardMaterial color="#0e1b33" roughness={0.75} />
          </mesh>

          {/* Subtle Vertical Technical Seam Accent */}
          <mesh position={[0, -0.14, 0.196]}>
            <boxGeometry args={[0.018, 0.84, 0.008]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.4} metalness={0.3} />
          </mesh>

          {/* Chest Embroidered Club Crest */}
          <mesh position={[0.21, 0.24, 0.2]}>
            <planeGeometry args={[0.16, 0.16]} />
            <meshStandardMaterial map={chestBadgeTex} transparent roughness={0.5} />
          </mesh>

          {/* Upper Back Printed Typography */}
          <mesh position={[0, 0.26, -0.2]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.62, 0.19]} />
            <meshStandardMaterial map={backPrintTex} transparent roughness={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
