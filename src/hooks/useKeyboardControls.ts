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

function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (el instanceof HTMLElement && el.isContentEditable)
  );
}

export const useKeyboardControls = () => {
  const [movement, setMovement] = useState<MovementKeys>(INITIAL_MOVEMENT);
  const { hasEntered, controlMode, isLocked, activeModal, showJourneyPrompt } = useHeritageStore();
  const canMove =
    hasEntered && !activeModal && !showJourneyPrompt && (controlMode === 'cursor' || isLocked);

  // Reset held keys whenever movement is disallowed so keys never stick
  useEffect(() => {
    if (!canMove) {
      setMovement(INITIAL_MOVEMENT);
    }
  }, [canMove]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useHeritageStore.getState();
      if (!state.hasEntered || state.activeModal || state.showJourneyPrompt) {
        return;
      }

      if (isEditableElement(document.activeElement)) {
        return;
      }

      // Prevent Spacebar from re-clicking any previously focused HUD button or scrolling
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (
          document.activeElement instanceof HTMLElement &&
          (document.activeElement.tagName === 'BUTTON' || document.activeElement.tagName === 'A')
        ) {
          document.activeElement.blur();
        }
        setMovement((m) => (m.jump ? m : { ...m, jump: true }));
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
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = useHeritageStore.getState();
      if (
        (e.code === 'Space' || e.key === ' ') &&
        state.hasEntered &&
        !state.activeModal &&
        !isEditableElement(document.activeElement)
      ) {
        // Buttons activate on Space keyup in browsers — block default activation cleanly
        e.preventDefault();
        if (
          document.activeElement instanceof HTMLElement &&
          (document.activeElement.tagName === 'BUTTON' || document.activeElement.tagName === 'A')
        ) {
          document.activeElement.blur();
        }
      }

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

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return movement;
};
