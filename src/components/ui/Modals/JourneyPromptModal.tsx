import React, { useEffect, useRef } from 'react';
import { Film, Play, Sparkles, X, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useShallow } from 'zustand/react/shallow';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { soundFx } from '../../../hooks/useAudio';

export const JourneyPromptModal: React.FC = () => {
  const { showJourneyPrompt, startCenterWallCinema, dismissJourneyPrompt } = useHeritageStore(
    useShallow((s) => ({
      showJourneyPrompt: s.showJourneyPrompt,
      startCenterWallCinema: s.startCenterWallCinema,
      dismissJourneyPrompt: s.dismissJourneyPrompt,
    }))
  );
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showJourneyPrompt) return;
    soundFx.playSuccessChord();
    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.58 },
      colors: ['#00F0FF', '#fbbf24', '#a855f7', '#38bdf8'],
    });
    const timer = window.setTimeout(() => primaryBtnRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [showJourneyPrompt]);

  if (!showJourneyPrompt) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="journey-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none cursor-default"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          dismissJourneyPrompt();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl glass-panel-glow border border-amber-400/45 overflow-hidden animate-panel-in"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div
          aria-hidden="true"
          className="h-1 w-full bg-gradient-to-r from-tech-cyan via-amber-400 to-purple-400"
        />

        <div className="p-6 text-center">
          <button
            type="button"
            onClick={dismissJourneyPrompt}
            className="absolute top-3.5 right-3.5 h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-[transform,background-color,color] duration-150 cursor-pointer"
            aria-label="Đóng lời mời"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Celebratory Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-semibold mb-4">
            <Award className="w-3.5 h-3.5" aria-hidden="true" />
            HOÀN THÀNH 8/8 KHU VỰC PHÒNG TRUYỀN THỐNG
          </div>

          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-tech-cyan/15 border border-tech-cyan/40 flex items-center justify-center">
            <Film className="w-7 h-7 text-tech-cyan" aria-hidden="true" />
          </div>

          <h2
            id="journey-prompt-title"
            className="text-xl md:text-2xl font-extrabold text-white tracking-tight mb-2.5 text-balance"
          >
            Bạn có muốn xem những gì TechTonic đã đi qua?
          </h2>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-6 max-w-md mx-auto text-pretty">
            Chúc mừng bạn đã trải nghiệm trọn vẹn toàn bộ phòng truyền thống! Bảng{' '}
            <span className="text-tech-cyan font-semibold">DREAM IT - CODE IT</span> sẽ biến thành một màn hình TV 3D khổng lồ để trình chiếu thước phim hành trình của TechTonic Club.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={startCenterWallCinema}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-tech-cyan text-slate-950 font-bold text-sm hover:bg-[#33f3ff] hover:scale-[1.02] active:scale-[0.98] transition-[transform,background-color] duration-150 inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_24px_rgba(0,240,255,0.3)]"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Có, chiếu ngay lên TV 3D!</span>
            </button>

            <button
              type="button"
              onClick={dismissJourneyPrompt}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-medium text-sm transition cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span>Để sau</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
