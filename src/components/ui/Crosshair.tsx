import React from 'react';
import { useHeritageStore } from '../../store/useHeritageStore';

export const Crosshair: React.FC = () => {
  const { isLocked, isHoveringInteractive, hoverTooltip, activeModal } = useHeritageStore();

  if (!isLocked || activeModal) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center"
    >
      <div className="relative flex items-center justify-center">
        {/* Center dot */}
        <div
          className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
            isHoveringInteractive
              ? 'bg-tech-cyan scale-150 shadow-[0_0_10px_#00F0FF]'
              : 'bg-white/85 scale-100'
          }`}
        />

        {/* Reticle ring when targeting interactive exhibit */}
        <div
          className={`absolute rounded-full border border-tech-cyan/75 transition-all duration-200 pointer-events-none ${
            isHoveringInteractive ? 'w-10 h-10 scale-100 opacity-100' : 'w-6 h-6 scale-50 opacity-0'
          }`}
        />

        {/* Outer targeting cross ticks */}
        <div
          className={`absolute w-8 h-8 transition-all duration-150 ${
            isHoveringInteractive ? 'scale-110 opacity-90' : 'scale-90 opacity-45'
          }`}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-tech-cyan" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-tech-cyan" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-tech-cyan" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-tech-cyan" />
        </div>

        {/* Interactive Tooltip Hint */}
        {isHoveringInteractive && hoverTooltip && (
          <div className="absolute top-8 px-3.5 py-1.5 rounded-lg bg-[#090d16]/90 border border-tech-cyan/50 backdrop-blur-md text-xs font-medium text-tech-cyan whitespace-nowrap shadow-[0_8px_20px_rgba(0,0,0,0.65)] animate-fade-in">
            <span className="font-mono text-white mr-1.5">[Chuột trái / E]</span>
            {hoverTooltip}
          </div>
        )}
      </div>
    </div>
  );
};
