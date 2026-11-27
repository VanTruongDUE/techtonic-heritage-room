import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHeritageStore } from '../store/useHeritageStore';

export interface MovementKeys {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shift: boolean;
  jump: boolean;
}

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

/**
 * Zero-rerender keyboard ref tracker for smooth 60–144 FPS WASD / Sprint / Jump movement.
 * Returning a MutableRefObject avoids triggering React tree re-renders on every keydown/keyup.
 */
export const useKeyboardControls = () => {
  const keysRef = useRef<MovementKeys>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    shift: false,
    jump: false,
  });

  const { hasEntered, controlMode, isLocked, activeModal, showJourneyPrompt } = useHeritageStore(
    useShallow((s) => ({
      hasEntered: s.hasEntered,
      controlMode: s.controlMode,
      isLocked: s.isLocked,
      activeModal: s.activeModal,
      showJourneyPrompt: s.showJourneyPrompt,
    }))
  );

  const canMove =
    hasEntered && !activeModal && !showJourneyPrompt && (controlMode === 'cursor' || isLocked);

  // Reset held keys whenever movement is disallowed so keys never stick
  useEffect(() => {
    if (!canMove) {
      keysRef.current.forward = false;
      keysRef.current.backward = false;
      keysRef.current.left = false;
      keysRef.current.right = false;
      keysRef.current.shift = false;
      keysRef.current.jump = false;
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
        keysRef.current.jump = true;
        return;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.shift = true;
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
          keysRef.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.shift = false;
          break;
        case 'Space':
          keysRef.current.jump = false;
          break;
        default:
          break;
      }
    };

    const handleBlur = () => {
      keysRef.current.forward = false;
      keysRef.current.backward = false;
      keysRef.current.left = false;
      keysRef.current.right = false;
      keysRef.current.shift = false;
      keysRef.current.jump = false;
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

  return keysRef;
};
