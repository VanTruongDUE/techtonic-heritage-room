import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHeritageStore } from '../../store/useHeritageStore';

export const Crosshair: React.FC = () => {
  const {
    hasEntered,
    controlMode,
    isLocked,
    isDraggingCamera,
    isHoveringInteractive,
    hoverTooltip,
    activeModal,
  } = useHeritageStore(
    useShallow((s) => ({
      hasEntered: s.hasEntered,
      controlMode: s.controlMode,
      isLocked: s.isLocked,
      isDraggingCamera: s.isDraggingCamera,
      isHoveringInteractive: s.isHoveringInteractive,
      hoverTooltip: s.hoverTooltip,
      activeModal: s.activeModal,
    }))
  );

  const cursorFollowRef = useRef<HTMLDivElement>(null);
  const cursorVisibleRef = useRef(false);
  const [cursorVisible, setCursorVisible] = useState(false);

  // Track real mouse coordinates directly via DOM transform for smooth 60–144fps cursor reticle
  useEffect(() => {
    if (!hasEntered || controlMode !== 'cursor' || activeModal) {
      cursorVisibleRef.current = false;
      setCursorVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!cursorVisibleRef.current) {
        cursorVisibleRef.current = true;
        setCursorVisible(true);
      }
      if (cursorFollowRef.current) {
        cursorFollowRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handleMouseLeave = () => {
      cursorVisibleRef.current = false;
      setCursorVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasEntered, controlMode, activeModal]);

  if (activeModal) {
    return null;
  }

  // Optional FPS lock mode: center targeting crosshair
  if (controlMode === 'fps') {
    if (!isLocked) return null;
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center"
      >
        <div className="relative flex items-center justify-center">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-[transform,background-color,box-shadow] duration-150 ${
              isHoveringInteractive
                ? 'bg-tech-cyan scale-150 shadow-[0_0_10px_#00F0FF]'
                : 'bg-white/85 scale-100'
            }`}
          />
          <div
            className={`absolute rounded-full border border-tech-cyan/75 transition-[transform,opacity,width,height] duration-150 pointer-events-none ${
              isHoveringInteractive ? 'w-10 h-10 scale-100 opacity-100' : 'w-6 h-6 scale-50 opacity-0'
            }`}
          />
          <div
            className={`absolute w-8 h-8 transition-[transform,opacity] duration-150 ${
              isHoveringInteractive ? 'scale-110 opacity-90' : 'scale-90 opacity-45'
            }`}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-tech-cyan" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-tech-cyan" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-tech-cyan" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-tech-cyan" />
          </div>
          {isHoveringInteractive && hoverTooltip && (
            <div className="absolute top-8 px-3.5 py-1.5 rounded-lg bg-[#050a15]/95 border border-tech-cyan/50 text-xs font-medium text-tech-cyan whitespace-nowrap shadow-[0_8px_24px_rgba(0,0,0,0.75)] animate-fade-in">
              <span className="font-mono text-white mr-1.5">[Chuột trái / E]</span>
              {hoverTooltip}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default Free Console Cursor mode: subtle tech reticle + click prompt orbiting the real visible pointer
  if (!hasEntered || !cursorVisible) {
    return null;
  }

  return (
    <div
      ref={cursorFollowRef}
      aria-hidden="true"
      className="fixed top-0 left-0 pointer-events-none z-40 will-change-transform"
    >
      {/* Crisp halo ring around real pointer tip */}
      <div
        className={`-translate-x-1/2 -translate-y-1/2 rounded-full border transition-[transform,border-color,background-color,box-shadow,width,height] duration-150 ${
          isDraggingCamera
            ? 'w-8 h-8 border-tech-cyan/80 bg-tech-cyan/10 scale-95'
            : isHoveringInteractive
            ? 'w-9 h-9 border-tech-cyan shadow-[0_0_14px_rgba(0,240,255,0.45)] scale-100'
            : 'w-5 h-5 border-sky-300/35 scale-100'
        }`}
      />

      {/* Solid obsidian tooltip without expensive per-frame backdrop-blur over WebGL */}
      {isHoveringInteractive && hoverTooltip && !isDraggingCamera && (
        <div className="ml-5 mt-3 px-3 py-1.5 rounded-lg bg-[#050a15]/95 border border-tech-cyan/50 text-xs font-medium text-tech-cyan whitespace-nowrap shadow-[0_8px_24px_rgba(0,0,0,0.75)]">
          <span className="font-mono text-white mr-1.5">[Click / E]</span>
          {hoverTooltip}
        </div>
      )}
    </div>
  );
};
