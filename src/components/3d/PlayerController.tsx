import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';
import { CapsuleCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { useHeritageStore } from '../../store/useHeritageStore';
import type { ModalType } from '../../types/heritage';

const SPEED_WALK = 4.5;
const SPEED_RUN = 7.5;
const JUMP_FORCE = 4.5;

function detectZone(x: number, z: number): string {
  if (z > 8.2) return 'Hành Lang Lối Vào';
  if (z < -12 && Math.abs(x) < 6) return 'Vách Tâm Điểm';
  if (x > 4 && z < -9.5) return 'Góc Truyền Thông & Lưu Bút';
  if (x > 8.5 && z >= -9.5) return 'Khu Vực Ban Chủ Nhiệm';
  if (x < -8.5) return 'Dòng Thời Gian & Kỷ Yếu';
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
            document.querySelector('canvas')?.requestPointerLock?.();
          }
        }
      }, 200);
      prevModalRef.current = activeModal;
      return () => clearTimeout(timer);
    }
    prevModalRef.current = activeModal;
  }, [activeModal]);

  useFrame((state) => {
    if (!rigidBodyRef.current) return;

    // Handle quick teleport requests from HUD / Instructions Modal
    if (teleportTarget) {
      const [tx, ty, tz] = teleportTarget.position;
      const [lx, ly, lz] = teleportTarget.lookAt;
      rigidBodyRef.current.setTranslation({ x: tx, y: ty, z: tz }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      state.camera.position.set(tx, ty + 0.6, tz);
      state.camera.lookAt(lx, ly, lz);
      clearTeleportTarget();
      return;
    }

    const currentVelocity = rigidBodyRef.current.linvel();
    const pos = rigidBodyRef.current.translation();

    // Attach camera to player head position
    state.camera.position.set(pos.x, pos.y + 0.6, pos.z);

    // Update active museum zone indicator (store deduplicates unchanged values)
    setCurrentZone(detectZone(pos.x, pos.z));

    // If pointer is unlocked or modal is open, decelerate smoothly
    if (!isLocked || activeModal) {
      rigidBodyRef.current.setLinvel(
        { x: currentVelocity.x * 0.8, y: currentVelocity.y, z: currentVelocity.z * 0.8 },
        true
      );
      return;
    }

    const speed = shift ? SPEED_RUN : SPEED_WALK;

    frontVector.current.set(0, 0, (backward ? 1 : 0) - (forward ? 1 : 0));
    sideVector.current.set((right ? 1 : 0) - (left ? 1 : 0), 0, 0);

    direction.current
      .addVectors(frontVector.current, sideVector.current)
      .normalize()
      .multiplyScalar(speed);

    cameraEuler.current.setFromQuaternion(state.camera.quaternion);
    cameraEuler.current.x = 0;
    cameraEuler.current.z = 0;
    direction.current.applyEuler(cameraEuler.current);

    let vy = currentVelocity.y;
    if (jump && Math.abs(currentVelocity.y) < 0.1) {
      vy = JUMP_FORCE;
    }

    rigidBodyRef.current.setLinvel(
      { x: direction.current.x, y: vy, z: direction.current.z },
      true
    );

    // Respawn if fallen below floor
    if (pos.y < -5) {
      rigidBodyRef.current.setTranslation(
        { x: initialPosition[0], y: initialPosition[1], z: initialPosition[2] },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
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
