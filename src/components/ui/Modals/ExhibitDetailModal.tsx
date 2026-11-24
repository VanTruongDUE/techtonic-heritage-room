import React, { useCallback, useEffect, useRef } from 'react';
import { useHeritageStore } from '../../../store/useHeritageStore';
import {
  X,
  Trophy,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import type { ExhibitCategory, ExhibitItem } from '../../../types/heritage';

const CATEGORY_LABELS: Record<ExhibitCategory, string> = {
  trophy: 'Cúp & Thành tích',
  certificate: 'Chứng nhận & Danh hiệu',
  activity: 'Hoạt động & Chuyên môn',
  history: 'Dấu ấn & Bản sắc CLB',
};

export const ExhibitDetailModal: React.FC = () => {
  const { activeModal, closeModal, modalData, exhibitItems, openModal } = useHeritageStore();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const item: ExhibitItem | null = activeModal === 'exhibit' ? modalData : null;
  const currentIndex = item ? exhibitItems.findIndex((ex) => ex.id === item.id) : -1;
  const canNavigate = currentIndex !== -1 && exhibitItems.length > 1;

  const goToRelative = useCallback(
    (offset: number) => {
      if (!canNavigate) return;
      const nextIdx = (currentIndex + offset + exhibitItems.length) % exhibitItems.length;
      openModal('exhibit', exhibitItems[nextIdx]);
    },
    [canNavigate, currentIndex, exhibitItems, openModal]
  );

  useEffect(() => {
    if (activeModal !== 'exhibit') return;
    const timer = window.setTimeout(() => closeBtnRef.current?.focus(), 40);

    const handleArrows = (e: KeyboardEvent) => {
      if (!canNavigate) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToRelative(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToRelative(1);
      }
    };
    window.addEventListener('keydown', handleArrows);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleArrows);
    };
  }, [activeModal, canNavigate, goToRelative]);

  if (activeModal !== 'exhibit' || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exhibit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none cursor-default"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[86vh] flex flex-col rounded-2xl glass-panel-glow overflow-hidden border border-tech-cyan/40 animate-panel-in"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-tech-cyan/20 flex items-center justify-between bg-[#0c101c]/95">
          <div className="flex items-center space-x-3">
            {item.category === 'trophy' ? (
              <Trophy className="w-6 h-6 text-amber-400 shrink-0" aria-hidden="true" />
            ) : item.category === 'history' ? (
              <History className="w-6 h-6 text-tech-cyan shrink-0" aria-hidden="true" />
            ) : (
              <Award className="w-6 h-6 text-tech-cyan shrink-0" aria-hidden="true" />
            )}
            <div>
              <h2
                id="exhibit-modal-title"
                className="text-lg md:text-xl font-bold text-white tracking-tight"
              >
                CHI TIẾT TRƯNG BÀY TECHTONIC
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {CATEGORY_LABELS[item.category]}
                {canNavigate && (
                  <span className="font-mono text-tech-cyan ml-2 tabular-nums">
                    ({currentIndex + 1}/{exhibitItems.length})
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeModal}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng chi tiết trưng bày"
            title="Đóng (ESC)"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0a0d14]/85">
          {item.highlight && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-tech-cyan/15 border border-tech-cyan/35 text-tech-cyan">
              {item.highlight}
            </div>
          )}

          <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
            {item.title}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-mono tabular-nums">
              <Calendar className="w-3.5 h-3.5 text-tech-cyan" aria-hidden="true" />
              Mốc thời gian: {item.year}
            </span>
            <span aria-hidden="true">•</span>
            <span>Phân loại: {CATEGORY_LABELS[item.category]}</span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed bg-[#121824]/75 p-4 rounded-xl border border-white/10">
            {item.description}
          </p>

          {/* Optional Metrics Strip */}
          {item.metrics && item.metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {item.metrics.map((m) => (
                <div
                  key={m.label}
                  className="p-3 rounded-xl bg-[#0e1422] border border-white/10 text-center"
                >
                  <div className="text-lg font-extrabold text-tech-cyan tabular-nums">
                    {m.value}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Optional Structured Bullets */}
          {item.bullets && item.bullets.length > 0 && (
            <ul className="space-y-2 bg-[#0e1422]/75 p-4 rounded-xl border border-white/10">
              {item.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-200 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-tech-cyan shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Optional Official External Links */}
          {item.links && item.links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {item.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121a2c] border border-tech-cyan/30 hover:border-tech-cyan text-xs font-medium text-tech-cyan hover:text-white transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0a0d14] border-t border-white/10 flex items-center justify-between gap-3">
          {canNavigate ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToRelative(-1)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium transition cursor-pointer"
                aria-label="Hiện vật trước"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Trước
              </button>
              <button
                type="button"
                onClick={() => goToRelative(1)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium transition cursor-pointer"
                aria-label="Hiện vật tiếp theo"
              >
                Sau
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Nhấn ESC để quay lại tham quan 3D</span>
          )}

          <button
            type="button"
            onClick={closeModal}
            className="px-5 py-2 rounded-xl bg-tech-cyan text-slate-950 font-semibold text-xs hover:bg-[#33f3ff] transition cursor-pointer"
          >
            Tiếp tục tham quan
          </button>
        </div>
      </div>
    </div>
  );
};
