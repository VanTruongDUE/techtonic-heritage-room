import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';
import { CapsuleCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { TELEPORT_ZONES } from '../../data/heritageSeed';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { soundFx } from '../../hooks/useAudio';
import { useHeritageStore } from '../../store/useHeritageStore';
import type { ModalType } from '../../types/heritage';

const SPEED_WALK = 4.9;
const SPEED_RUN = 7.8;
const JUMP_FORCE = 4.5;
const BASE_FOV = 65;
const SPRINT_FOV = 68.2;
const MIN_ZOOM_FOV = 50;
const MAX_ZOOM_FOV = 70;
const DRAG_THRESHOLD_PX = 4;
const GLIDE_DURATION_SEC = 0.88;
const GUIDED_TOUR_INTERVAL_MS = 7200;

function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

function detectZone(x: number, z: number): string {
  if (z > 8.2) return 'Hành Lang Lối Vào';
  if (z > 0.2 && x < -4.2) return 'Đối Tác & Kết Nối';
  if (z > 0.2 && x > 4.2) return 'Cảm Nhận Thành Viên';
  if (x < -7.2 && z < -10.5) return 'Sự Kiện Động & Lưu Bút';
  if (z < -8.2 && x >= -7.2 && x <= 7.8) return 'Vách Tâm Điểm';
  if (x > 4.5 && z >= -11.5) return 'Áo CLB & Ban Chủ Nhiệm';
  if (x < -4.2 && z >= -10.5) return 'Dòng Thời Gian & Giá Trị';
  if (Math.abs(x) <= 4.2 && z >= -8.2 && z <= 4.2) return 'Đảo Vinh Danh 360°';
  return 'Đại Sảnh Danh Dự';
}

interface GlideState {
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startQuat: THREE.Quaternion;
  endQuat: THREE.Quaternion;
  elapsed: number;
  duration: number;
}

interface PlayerControllerProps {
  initialPosition?: [number, number, number];
}

export const PlayerController: React.FC<PlayerControllerProps> = ({
  initialPosition = [0, 1.4, 25.8],
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const controlsRef = useRef<PointerLockControlsImpl | null>(null);
  const { camera, gl } = useThree();
  const keysRef = useKeyboardControls();
  const {
    hasEntered,
    controlMode,
    isLocked,
    activeModal,
    mouseSensitivity,
    teleportTarget,
    isGuidedTourActive,
    isHoveringInteractive,
  } = useHeritageStore(
    useShallow((s) => ({
      hasEntered: s.hasEntered,
      controlMode: s.controlMode,
      isLocked: s.isLocked,
      activeModal: s.activeModal,
      mouseSensitivity: s.mouseSensitivity,
      teleportTarget: s.teleportTarget,
      isGuidedTourActive: s.isGuidedTourActive,
      isHoveringInteractive: s.isHoveringInteractive,
    }))
  );
  const setLocked = useHeritageStore((s) => s.setLocked);
  const setDraggingCamera = useHeritageStore((s) => s.setDraggingCamera);
  const setCurrentZone = useHeritageStore((s) => s.setCurrentZone);
  const setPlayerPose = useHeritageStore((s) => s.setPlayerPose);
  const clearTeleportTarget = useHeritageStore((s) => s.clearTeleportTarget);
  const requestTeleport = useHeritageStore((s) => s.requestTeleport);
  const stopGuidedTour = useHeritageStore((s) => s.stopGuidedTour);
  const triggerHoveredInteraction = useHeritageStore((s) => s.triggerHoveredInteraction);

  const frontVector = useRef(new THREE.Vector3());
  const sideVector = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const cameraEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const smoothVel = useRef({ x: 0, z: 0 });
  const camSmoothPos = useRef(
    new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2])
  );
  const camRollRef = useRef(0);
  const zoomFovOffsetRef = useRef(0);
  const lastZoneRef = useRef<string>('');
  const bobPhase = useRef(0);
  const bobAmount = useRef(0);
  const prevModalRef = useRef<ModalType>(null);
  const prevHoverRef = useRef(false);

  // Smooth inertial drag-to-look angular targets
  const dragVelocityRef = useRef({ yaw: 0, pitch: 0 });
  const glideRef = useRef<GlideState | null>(null);
  const lastPoseEmitRef = useRef(0);
  const tourIndexRef = useRef(1);
  const tempMatrix = useRef(new THREE.Matrix4());
  const tempUp = useRef(new THREE.Vector3(0, 1, 0));
  const tempEye = useRef(new THREE.Vector3());
  const tempTarget = useRef(new THREE.Vector3());
  const tempPos = useRef(new THREE.Vector3());

  // Drag-to-look state for Free-Cursor mode
  const isPointerDownRef = useRef(false);
  const pointerDownButtonRef = useRef<number>(0);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const pointerLastRef = useRef({ x: 0, y: 0 });
  const dragExceededRef = useRef(false);
  const suppressNextClickRef = useRef(false);

  const handleLock = () => setLocked(true);
  const handleUnlock = () => setLocked(false);

  // Subtle hover micro-tick sound when targeting interactive 3D exhibits
  useEffect(() => {
    if (isHoveringInteractive && !prevHoverRef.current && hasEntered && !activeModal) {
      soundFx.playHoverTick();
    }
    prevHoverRef.current = isHoveringInteractive;
  }, [isHoveringInteractive, hasEntered, activeModal]);

  // Guided Auto-Tour scheduler
  useEffect(() => {
    if (!isGuidedTourActive || !hasEntered || activeModal) return;

    const currentLabel = useHeritageStore.getState().currentZone;
    const foundIdx = TELEPORT_ZONES.findIndex((z) => z.label === currentLabel);
    tourIndexRef.current = foundIdx >= 0 ? (foundIdx + 1) % TELEPORT_ZONES.length : 1;

    // Immediately glide to first highlight stop
    requestTeleport(TELEPORT_ZONES[tourIndexRef.current].id, { fromTour: true });

    const interval = window.setInterval(() => {
      tourIndexRef.current = (tourIndexRef.current + 1) % TELEPORT_ZONES.length;
      requestTeleport(TELEPORT_ZONES[tourIndexRef.current].id, { fromTour: true });
    }, GUIDED_TOUR_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [isGuidedTourActive, hasEntered, activeModal, requestTeleport]);

  // Support [E] shortcut to inspect targeted 3D exhibit in both Free-Cursor and FPS modes
  useEffect(() => {
    const handleInteractKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && hasEntered && !activeModal) {
        triggerHoveredInteraction();
      }
    };
    window.addEventListener('keydown', handleInteractKey);
    return () => window.removeEventListener('keydown', handleInteractKey);
  }, [hasEntered, activeModal, triggerHoveredInteraction]);

  // Drag-to-look on WebGL canvas with smooth inertial impulse while keeping OS cursor visible
  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return;

    const resetDrag = () => {
      if (dragExceededRef.current) {
        suppressNextClickRef.current = true;
        window.setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 80);
      }
      isPointerDownRef.current = false;
      dragExceededRef.current = false;
      setDraggingCamera(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!hasEntered || activeModal || controlMode !== 'cursor') return;
      if (e.button !== 0 && e.button !== 2) return;
      isPointerDownRef.current = true;
      pointerDownButtonRef.current = e.button;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      pointerLastRef.current = { x: e.clientX, y: e.clientY };
      dragExceededRef.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current || !hasEntered || activeModal || controlMode !== 'cursor') return;
      const totalDist = Math.hypot(
        e.clientX - pointerStartRef.current.x,
        e.clientY - pointerStartRef.current.y
      );
      if (!dragExceededRef.current && totalDist > DRAG_THRESHOLD_PX) {
        dragExceededRef.current = true;
        glideRef.current = null;
        stopGuidedTour();
        setDraggingCamera(true);
      }

      if (dragExceededRef.current) {
        const dx = e.clientX - pointerLastRef.current.x;
        const dy = e.clientY - pointerLastRef.current.y;
        const sensitivity = 0.0029 * mouseSensitivity;

        // Add to damped angular target deltas for silky smooth gimbal feel
        dragVelocityRef.current.yaw -= dx * sensitivity;
        dragVelocityRef.current.pitch -= dy * sensitivity;
      }

      pointerLastRef.current = { x: e.clientX, y: e.clientY };
    };

    const onClickCapture = (e: MouseEvent) => {
      if (suppressNextClickRef.current || dragExceededRef.current) {
        e.stopImmediatePropagation();
        e.preventDefault();
        suppressNextClickRef.current = false;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (controlMode === 'cursor' && (dragExceededRef.current || pointerDownButtonRef.current === 2)) {
        e.preventDefault();
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!hasEntered || activeModal) return;
      zoomFovOffsetRef.current = THREE.MathUtils.clamp(
        zoomFovOffsetRef.current + Math.sign(e.deltaY) * 2.2,
        MIN_ZOOM_FOV - BASE_FOV,
        MAX_ZOOM_FOV - BASE_FOV
      );
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', resetDrag);
    window.addEventListener('blur', resetDrag);
    dom.addEventListener('click', onClickCapture, true);
    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', resetDrag);
      window.removeEventListener('blur', resetDrag);
      dom.removeEventListener('click', onClickCapture, true);
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('wheel', onWheel);
    };
  }, [gl, camera, hasEntered, activeModal, controlMode, mouseSensitivity, setDraggingCamera, stopGuidedTour]);

  // Unlock pointer when modal opens; only re-lock automatically if user explicitly chose FPS mode
  useEffect(() => {
    if (activeModal) {
      if (controlsRef.current?.isLocked) {
        controlsRef.current.unlock();
      }
      if (document.pointerLockElement && document.exitPointerLock) {
        try {
          document.exitPointerLock();
        } catch {
          // Ignore exitPointerLock errors when already unlocked
        }
      }
    } else if (
      controlMode === 'fps' &&
      prevModalRef.current !== null &&
      activeModal === null
    ) {
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
  }, [activeModal, controlMode]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    const dt = Math.min(delta, 0.05);
    const pos = rigidBodyRef.current.translation();

    // Start silky cinematic glide whenever a teleportTarget is queued
    if (teleportTarget) {
      const [tx, ty, tz] = teleportTarget.position;
      const [lx, ly, lz] = teleportTarget.lookAt;

      tempEye.current.set(tx, ty + 0.6, tz);
      tempTarget.current.set(lx, ly, lz);
      tempMatrix.current.lookAt(tempEye.current, tempTarget.current, tempUp.current);
      const endQuat = new THREE.Quaternion().setFromRotationMatrix(tempMatrix.current);

      const dist = Math.hypot(tx - pos.x, tz - pos.z);
      const duration = THREE.MathUtils.clamp(0.45 + dist * 0.022, 0.55, GLIDE_DURATION_SEC);

      glideRef.current = {
        startPos: new THREE.Vector3(pos.x, pos.y, pos.z),
        endPos: new THREE.Vector3(tx, ty, tz),
        startQuat: state.camera.quaternion.clone(),
        endQuat,
        elapsed: 0,
        duration,
      };

      dragVelocityRef.current = { yaw: 0, pitch: 0 };
      smoothVel.current = { x: 0, z: 0 };
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      soundFx.playGlideWhoosh();
      clearTeleportTarget();
    }

    const { forward, backward, left, right, shift, jump } = keysRef.current;
    const hasMoveKey = forward || backward || left || right || jump;
    if (hasMoveKey && (glideRef.current || isGuidedTourActive)) {
      glideRef.current = null;
      stopGuidedTour();
    }

    // Active cinematic glide interpolation
    if (glideRef.current) {
      const g = glideRef.current;
      g.elapsed += dt;
      const rawT = Math.min(1, g.elapsed / g.duration);
      const eased = easeInOutQuint(rawT);

      tempPos.current.lerpVectors(g.startPos, g.endPos, eased);
      // Subtle graceful arc in eye height during longer glides
      const arcLift = Math.sin(rawT * Math.PI) * 0.09;

      rigidBodyRef.current.setTranslation(
        { x: tempPos.current.x, y: tempPos.current.y, z: tempPos.current.z },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      camSmoothPos.current.copy(tempPos.current);

      state.camera.position.set(
        tempPos.current.x,
        tempPos.current.y + 0.6 + arcLift,
        tempPos.current.z
      );
      state.camera.quaternion.slerpQuaternions(g.startQuat, g.endQuat, eased);

      if (rawT >= 1) {
        glideRef.current = null;
      }

      // Only dispatch Zustand zone update when actually crossing into a new zone
      const nextZone = detectZone(tempPos.current.x, tempPos.current.z);
      if (nextZone !== lastZoneRef.current) {
        lastZoneRef.current = nextZone;
        setCurrentZone(nextZone);
      }
      const nowMs = state.clock.elapsedTime * 1000;
      if (nowMs - lastPoseEmitRef.current > 85) {
        cameraEuler.current.setFromQuaternion(state.camera.quaternion, 'YXZ');
        setPlayerPose(tempPos.current.x, tempPos.current.z, cameraEuler.current.y);
        lastPoseEmitRef.current = nowMs;
      }
      return;
    }

    // Apply smooth damped drag-to-look inertia in cursor mode
    if (controlMode === 'cursor' && hasEntered && !activeModal) {
      const { yaw, pitch } = dragVelocityRef.current;
      if (Math.abs(yaw) > 0.00005 || Math.abs(pitch) > 0.00005) {
        const angularStep = 1 - Math.exp(-19 * dt);
        const applyYaw = yaw * angularStep;
        const applyPitch = pitch * angularStep;

        cameraEuler.current.setFromQuaternion(state.camera.quaternion, 'YXZ');
        cameraEuler.current.y += applyYaw;
        cameraEuler.current.x = THREE.MathUtils.clamp(
          cameraEuler.current.x + applyPitch,
          -1.35,
          1.35
        );
        cameraEuler.current.z = camRollRef.current;
        state.camera.quaternion.setFromEuler(cameraEuler.current);

        dragVelocityRef.current.yaw -= applyYaw;
        dragVelocityRef.current.pitch -= applyPitch;
      } else if (isGuidedTourActive) {
        // Gentle museum pan sway while admiring each zone during Guided Tour
        cameraEuler.current.setFromQuaternion(state.camera.quaternion, 'YXZ');
        cameraEuler.current.y += Math.sin(state.clock.elapsedTime * 0.55) * 0.0014;
        cameraEuler.current.z = 0;
        state.camera.quaternion.setFromEuler(cameraEuler.current);
      }
    }

    const currentVelocity = rigidBodyRef.current.linvel();

    // Update active museum zone indicator only when crossing zone boundaries (0 wasted store calls/frame)
    const detectedZone = detectZone(pos.x, pos.z);
    if (detectedZone !== lastZoneRef.current) {
      lastZoneRef.current = detectedZone;
      setCurrentZone(detectedZone);
    }

    // Emit throttled MiniMap pose (~11fps)
    const nowMs = state.clock.elapsedTime * 1000;
    if (nowMs - lastPoseEmitRef.current > 90) {
      cameraEuler.current.setFromQuaternion(state.camera.quaternion, 'YXZ');
      setPlayerPose(pos.x, pos.z, cameraEuler.current.y);
      lastPoseEmitRef.current = nowMs;
    }

    const camFollow = 1 - Math.exp(-26 * dt);
    const canExplore = hasEntered && !activeModal && (controlMode === 'cursor' || isLocked);

    if (!canExplore) {
      const decel = 1 - Math.exp(-10 * dt);
      smoothVel.current.x = THREE.MathUtils.lerp(smoothVel.current.x, 0, decel);
      smoothVel.current.z = THREE.MathUtils.lerp(smoothVel.current.z, 0, decel);
      bobAmount.current = THREE.MathUtils.lerp(bobAmount.current, 0, decel);
      camRollRef.current = THREE.MathUtils.lerp(camRollRef.current, 0, decel);

      rigidBodyRef.current.setLinvel(
        { x: smoothVel.current.x, y: currentVelocity.y, z: smoothVel.current.z },
        true
      );
      camSmoothPos.current.set(
        THREE.MathUtils.lerp(camSmoothPos.current.x, pos.x, camFollow),
        THREE.MathUtils.lerp(camSmoothPos.current.y, pos.y, camFollow),
        THREE.MathUtils.lerp(camSmoothPos.current.z, pos.z, camFollow)
      );
      state.camera.position.set(camSmoothPos.current.x, camSmoothPos.current.y + 0.6, camSmoothPos.current.z);
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

    cameraEuler.current.setFromQuaternion(state.camera.quaternion, 'YXZ');
    cameraEuler.current.x = 0;
    cameraEuler.current.z = 0;
    direction.current.applyEuler(cameraEuler.current);

    // Asymmetric silky acceleration vs buttery museum-glider coast-to-stop
    const velLambda = hasInput ? 12.5 : 8.4;
    const velDamping = 1 - Math.exp(-velLambda * dt);
    smoothVel.current.x = THREE.MathUtils.lerp(smoothVel.current.x, direction.current.x, velDamping);
    smoothVel.current.z = THREE.MathUtils.lerp(smoothVel.current.z, direction.current.z, velDamping);

    // Subtle kinematic strafe banking (barely perceptible cinema steadicam feel)
    const targetRoll = controlMode === 'cursor' ? -sideVector.current.x * 0.0075 : 0;
    camRollRef.current = THREE.MathUtils.lerp(camRollRef.current, targetRoll, 1 - Math.exp(-9 * dt));
    if (controlMode === 'cursor' && Math.abs(camRollRef.current) > 0.0001) {
      cameraEuler.current.setFromQuaternion(state.camera.quaternion, 'YXZ');
      cameraEuler.current.z = camRollRef.current;
      state.camera.quaternion.setFromEuler(cameraEuler.current);
    }

    let vy = currentVelocity.y;
    const isGrounded = Math.abs(currentVelocity.y) < 0.12;
    if (jump && isGrounded) {
      vy = JUMP_FORCE;
    }

    rigidBodyRef.current.setLinvel(
      { x: smoothVel.current.x, y: vy, z: smoothVel.current.z },
      true
    );

    const horizSpeed = Math.hypot(smoothVel.current.x, smoothVel.current.z);
    if (isGrounded && horizSpeed > 0.35) {
      bobPhase.current += dt * (shift ? 10.6 : 7.6);
      bobAmount.current = THREE.MathUtils.lerp(bobAmount.current, 0.015, velDamping);
    } else {
      bobAmount.current = THREE.MathUtils.lerp(bobAmount.current, 0, velDamping);
    }
    const headBobY = Math.sin(bobPhase.current) * bobAmount.current;

    // Frame-rate-independent sub-frame camera eye interpolation (zero physics substep judder!)
    if (Math.hypot(pos.x - camSmoothPos.current.x, pos.z - camSmoothPos.current.z) > 3.5) {
      camSmoothPos.current.set(pos.x, pos.y, pos.z);
    } else {
      camSmoothPos.current.x = THREE.MathUtils.lerp(camSmoothPos.current.x, pos.x, camFollow);
      camSmoothPos.current.y = THREE.MathUtils.lerp(camSmoothPos.current.y, pos.y, camFollow);
      camSmoothPos.current.z = THREE.MathUtils.lerp(camSmoothPos.current.z, pos.z, camFollow);
    }
    state.camera.position.set(
      camSmoothPos.current.x,
      camSmoothPos.current.y + 0.6 + headBobY,
      camSmoothPos.current.z
    );

    if (state.camera instanceof THREE.PerspectiveCamera) {
      const targetFov = THREE.MathUtils.clamp(
        (hasInput && shift ? SPRINT_FOV : BASE_FOV) + zoomFovOffsetRef.current,
        MIN_ZOOM_FOV,
        MAX_ZOOM_FOV + 3
      );
      if (Math.abs(state.camera.fov - targetFov) > 0.02) {
        state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, 1 - Math.exp(-9 * dt));
        state.camera.updateProjectionMatrix();
      }
    }

    if (pos.y < -5) {
      rigidBodyRef.current.setTranslation(
        { x: initialPosition[0], y: initialPosition[1], z: initialPosition[2] },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      camSmoothPos.current.set(initialPosition[0], initialPosition[1], initialPosition[2]);
      smoothVel.current = { x: 0, z: 0 };
    }
  });

  return (
    <>
      {controlMode === 'fps' && (
        <PointerLockControls
          ref={controlsRef}
          enabled={!activeModal}
          pointerSpeed={mouseSensitivity}
          onLock={handleLock}
          onUnlock={handleUnlock}
        />
      )}
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
