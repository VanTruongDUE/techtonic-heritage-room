import { useEffect, useState } from 'react';
import { useHeritageStore } from '../store/useHeritageStore';

export interface MovementKeys {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shift: boolean;
  jump: boolean;
}

const INITIAL_MOVEMENT: MovementKeys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  shift: false,
  jump: false,
};

export const useKeyboardControls = () => {
  const [movement, setMovement] = useState<MovementKeys>(INITIAL_MOVEMENT);
  const { hasEntered, controlMode, isLocked, activeModal } = useHeritageStore();
  const canMove = hasEntered && !activeModal && (controlMode === 'cursor' || isLocked);

  // Reset held keys whenever movement is disallowed so keys never stick
  useEffect(() => {
    if (!canMove) {
      setMovement(INITIAL_MOVEMENT);
    }
  }, [canMove]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement((m) => (m.forward ? m : { ...m, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement((m) => (m.backward ? m : { ...m, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement((m) => (m.left ? m : { ...m, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement((m) => (m.right ? m : { ...m, right: true }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setMovement((m) => (m.shift ? m : { ...m, shift: true }));
          break;
        case 'Space':
          setMovement((m) => (m.jump ? m : { ...m, jump: true }));
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement((m) => (m.forward ? { ...m, forward: false } : m));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement((m) => (m.backward ? { ...m, backward: false } : m));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement((m) => (m.left ? { ...m, left: false } : m));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement((m) => (m.right ? { ...m, right: false } : m));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setMovement((m) => (m.shift ? { ...m, shift: false } : m));
          break;
        case 'Space':
          setMovement((m) => (m.jump ? { ...m, jump: false } : m));
          break;
        default:
          break;
      }
    };

    const handleBlur = () => {
      setMovement(INITIAL_MOVEMENT);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return movement;
};
