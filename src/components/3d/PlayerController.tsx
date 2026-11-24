import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';
import { CapsuleCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { useHeritageStore } from '../../store/useHeritageStore';
import type { ModalType } from '../../types/heritage';

const SPEED_WALK = 4.6;
const SPEED_RUN = 7.4;
const JUMP_FORCE = 4.5;
const BASE_FOV = 65;
const SPRINT_FOV = 67.5;

function detectZone(x: number, z: number): string {
  if (z > 8.2) return 'Hành Lang Lối Vào';
  if (z > 0.2 && x < -4.2) return 'Đối Tác & Kết Nối';
  if (z > 0.2 && x > 4.2) return 'Cảm Nhận Thành Viên';
  if (x > 2.8 && z < -9.5) return 'Góc Truyền Thông & Lưu Bút';
  if (z < -10.2 && x < 4.2) return 'Vách Tâm Điểm';
  if (x > 4.5 && z >= -9.5) return 'Áo CLB & Ban Chủ Nhiệm';
  if (x < -4.5 && z >= -9.5) return 'Dòng Thời Gian & Hoạt Động';
  if (Math.hypot(x, z + 5) < 6.2) return 'Đảo Vinh Danh 360°';
  return 'Đại Sảnh Danh Dự';
}

interface PlayerControllerProps {
  initialPosition?: [number, number, number];
}

export const PlayerController: React.FC<PlayerControllerProps> = ({
  initialPosition = [0, 1.4, 13.5],
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const controlsRef = useRef<PointerLockControlsImpl | null>(null);
  const { forward, backward, left, right, shift, jump } = useKeyboardControls();
  const {
    isLocked,
    setLocked,
    activeModal,
    mouseSensitivity,
    setCurrentZone,
    teleportTarget,
    clearTeleportTarget,
    triggerHoveredInteraction,
  } = useHeritageStore();

  const frontVector = useRef(new THREE.Vector3());
  const sideVector = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const cameraEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const smoothVel = useRef({ x: 0, z: 0 });
  const bobPhase = useRef(0);
  const bobAmount = useRef(0);
  const prevModalRef = useRef<ModalType>(null);

  const handleLock = () => setLocked(true);
  const handleUnlock = () => setLocked(false);

  // Support [E] shortcut to inspect targeted 3D exhibit while walking in FPS mode
  useEffect(() => {
    const handleInteractKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && isLocked && !activeModal) {
        triggerHoveredInteraction();
      }
    };
    window.addEventListener('keydown', handleInteractKey);
    return () => window.removeEventListener('keydown', handleInteractKey);
  }, [isLocked, activeModal, triggerHoveredInteraction]);

  // Central logic: unlock when modal opens, re-lock when modal closes
  useEffect(() => {
    if (activeModal) {
      if (controlsRef.current?.isLocked) {
        controlsRef.current.unlock();
      }
      if (document.pointerLockElement) {
        try {
          document.exitPointerLock();
        } catch {
          // Ignore exitPointerLock errors when already unlocked
        }
      }
    } else if (prevModalRef.current !== null && activeModal === null) {
      const timer = setTimeout(() => {
        if (controlsRef.current && !controlsRef.current.isLocked) {
          try {
            controlsRef.current.lock();
          } catch {
            Promise.resolve(document.querySelector('canvas')?.requestPointerLock?.()).catch(() => {});
          }
        }
      }, 200);
      prevModalRef.current = activeModal;
      return () => clearTimeout(timer);
    }
    prevModalRef.current = activeModal;
  }, [activeModal]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    const dt = Math.min(delta, 0.05);

    // Handle quick teleport requests
    if (teleportTarget) {
      const [tx, ty, tz] = teleportTarget.position;
      const [lx, ly, lz] = teleportTarget.lookAt;
      rigidBodyRef.current.setTranslation({ x: tx, y: ty, z: tz }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      smoothVel.current = { x: 0, z: 0 };
      state.camera.position.set(tx, ty + 0.6, tz);
      state.camera.lookAt(lx, ly, lz);
      clearTeleportTarget();
      return;
    }

    const currentVelocity = rigidBodyRef.current.linvel();
    const pos = rigidBodyRef.current.translation();

    // Update active museum zone indicator
    setCurrentZone(detectZone(pos.x, pos.z));

    const damping = 1 - Math.exp(-14 * dt);

    if (!isLocked || activeModal) {
      smoothVel.current.x = THREE.MathUtils.lerp(smoothVel.current.x, 0, damping);
      smoothVel.current.z = THREE.MathUtils.lerp(smoothVel.current.z, 0, damping);
      bobAmount.current = THREE.MathUtils.lerp(bobAmount.current, 0, damping);

      rigidBodyRef.current.setLinvel(
        { x: smoothVel.current.x, y: currentVelocity.y, z: smoothVel.current.z },
        true
      );
      state.camera.position.set(pos.x, pos.y + 0.6, pos.z);
      return;
    }

    const speed = shift ? SPEED_RUN : SPEED_WALK;

    frontVector.current.set(0, 0, (backward ? 1 : 0) - (forward ? 1 : 0));
    sideVector.current.set((right ? 1 : 0) - (left ? 1 : 0), 0, 0);

    const hasInput = frontVector.current.z !== 0 || sideVector.current.x !== 0;

    direction.current.addVectors(frontVector.current, sideVector.current);
    if (direction.current.lengthSq() > 0) {
      direction.current.normalize().multiplyScalar(speed);
    }

    cameraEuler.current.setFromQuaternion(state.camera.quaternion);
    cameraEuler.current.x = 0;
    cameraEuler.current.z = 0;
    direction.current.applyEuler(cameraEuler.current);

    // Smooth exponential acceleration & deceleration
    smoothVel.current.x = THREE.MathUtils.lerp(smoothVel.current.x, direction.current.x, damping);
    smoothVel.current.z = THREE.MathUtils.lerp(smoothVel.current.z, direction.current.z, damping);

    let vy = currentVelocity.y;
    const isGrounded = Math.abs(currentVelocity.y) < 0.12;
    if (jump && isGrounded) {
      vy = JUMP_FORCE;
    }

    rigidBodyRef.current.setLinvel(
      { x: smoothVel.current.x, y: vy, z: smoothVel.current.z },
      true
    );

    // Subtle natural walk head-bob scaled by actual ground velocity
    const horizSpeed = Math.hypot(smoothVel.current.x, smoothVel.current.z);
    if (isGrounded && horizSpeed > 0.4) {
      bobPhase.current += dt * (shift ? 11.5 : 8.2);
      bobAmount.current = THREE.MathUtils.lerp(bobAmount.current, 0.018, damping);
    } else {
      bobAmount.current = THREE.MathUtils.lerp(bobAmount.current, 0, damping);
    }
    const headBobY = Math.sin(bobPhase.current) * bobAmount.current;
    state.camera.position.set(pos.x, pos.y + 0.6 + headBobY, pos.z);

    // Subtle smooth sprint FOV transition
    if (state.camera instanceof THREE.PerspectiveCamera) {
      const targetFov = hasInput && shift ? SPRINT_FOV : BASE_FOV;
      if (Math.abs(state.camera.fov - targetFov) > 0.02) {
        state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, 1 - Math.exp(-8 * dt));
        state.camera.updateProjectionMatrix();
      }
    }

    // Respawn if fallen below floor
    if (pos.y < -5) {
      rigidBodyRef.current.setTranslation(
        { x: initialPosition[0], y: initialPosition[1], z: initialPosition[2] },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      smoothVel.current = { x: 0, z: 0 };
    }
  });

  return (
    <>
      <PointerLockControls
        ref={controlsRef}
        enabled={!activeModal}
        pointerSpeed={mouseSensitivity}
        onLock={handleLock}
        onUnlock={handleUnlock}
      />
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        mass={1}
        type="dynamic"
        position={initialPosition}
        enabledRotations={[false, false, false]}
        canSleep={false}
      >
        <CapsuleCollider args={[0.55, 0.35]} />
      </RigidBody>
    </>
  );
};
