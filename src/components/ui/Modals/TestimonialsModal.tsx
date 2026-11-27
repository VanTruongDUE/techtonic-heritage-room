import React, { useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MessageSquareQuote, Quote, Sparkles, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { CLUB_PROFILE } from '../../../data/heritageSeed';
import { useHeritageStore } from '../../../store/useHeritageStore';

export const TestimonialsModal: React.FC = () => {
  const { activeModal, closeModal, selectedTestimonialId, setSelectedTestimonialId } =
    useHeritageStore(
      useShallow((s) => ({
        activeModal: s.activeModal,
        closeModal: s.closeModal,
        selectedTestimonialId: s.selectedTestimonialId,
        setSelectedTestimonialId: s.setSelectedTestimonialId,
      }))
    );
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const items = CLUB_PROFILE.testimonials;
  const activeIdx = Math.max(
    0,
    items.findIndex((t) => t.id === selectedTestimonialId)
  );
  const current = items[activeIdx] ?? items[0];

  const goRelative = useCallback(
    (delta: number) => {
      const nextIdx = (activeIdx + delta + items.length) % items.length;
      setSelectedTestimonialId(items[nextIdx].id);
    },
    [activeIdx, items, setSelectedTestimonialId]
  );

  useEffect(() => {
    if (activeModal !== 'testimonials') return;
    const timer = window.setTimeout(() => closeBtnRef.current?.focus(), 40);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goRelative(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goRelative(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeModal, goRelative]);

  if (activeModal !== 'testimonials' || !current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="testimonials-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-[#02050c]/82 backdrop-blur-sm animate-fade-in select-none cursor-default"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl glass-panel-glow overflow-hidden border border-tech-cyan/40 animate-panel-in"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-tech-cyan/20 flex items-center justify-between bg-[#070c18]/95">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tech-cyan/15 border border-tech-cyan/35">
              <MessageSquareQuote className="w-5 h-5 text-tech-cyan" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="testimonials-modal-title"
                className="text-lg md:text-xl font-bold text-white tracking-tight text-balance"
              >
                THÀNH VIÊN NÓI GÌ VỀ TECHTONIC
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 text-pretty">
                Tiếng nói chân thật từ Co-Founders, Ban Chủ Nhiệm & Mentor TechTonic Club
                <span className="font-mono text-tech-cyan ml-2 tabular-nums">
                  ({activeIdx + 1}/{items.length})
                </span>
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeModal}
            className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-[transform,background-color,color] duration-150 cursor-pointer shrink-0"
            aria-label="Đóng lời chia sẻ thành viên"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#050a14]/90">
          {/* Featured Member Story Card */}
          <div
            className="relative rounded-2xl p-5 md:p-6 bg-[#0a1326]/95 border transition-colors"
            style={{
              borderColor: `${current.accent}66`,
              boxShadow: `0 12px 36px rgba(0,0,0,0.45), 0 0 28px ${current.accent}1a`,
            }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Member Avatar with Neon Halo */}
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-1 rounded-2xl blur-md opacity-45"
                  style={{ background: current.accent }}
                  aria-hidden="true"
                />
                <img
                  src={current.avatar}
                  alt={current.name}
                  className="relative h-24 w-24 md:h-28 md:w-28 rounded-2xl object-cover img-crisp-outline border-2 bg-[#070d1b]"
                  style={{ borderColor: current.accent }}
                />
              </div>

              {/* Member Meta */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold mb-2 border"
                  style={{
                    color: current.accent,
                    borderColor: `${current.accent}55`,
                    backgroundColor: `${current.accent}18`,
                  }}
                >
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  {current.tag}
                </span>
                <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  {current.name}
                </h3>
                <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
                  {current.role}
                </p>
              </div>
            </div>

            {/* Full Quote */}
            <div className="relative mt-5 pt-5 border-t border-white/10">
              <Quote
                className="w-7 h-7 mb-2 opacity-60"
                style={{ color: current.accent }}
                aria-hidden="true"
              />
              <blockquote className="text-sm md:text-[15px] text-slate-100 leading-7 font-normal italic">
                “{current.quote}”
              </blockquote>
            </div>
          </div>

          {/* 4-Member Quick Selector Strip */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5">
              Chọn thành viên để đọc lời chia sẻ
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {items.map((item) => {
                const isSelected = item.id === current.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedTestimonialId(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left active:scale-[0.98] transition-[transform,background-color,border-color,box-shadow] duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0e1b33] text-white'
                        : 'bg-[#081020]/85 border-white/10 text-slate-300 hover:bg-[#0d182e] hover:border-white/25'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: `${item.accent}aa`,
                            boxShadow: `0 0 18px ${item.accent}24`,
                          }
                        : undefined
                    }
                  >
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="h-11 w-11 rounded-xl object-cover shrink-0 border"
                      style={{ borderColor: isSelected ? item.accent : 'rgba(255,255,255,0.16)' }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate">{item.name}</div>
                      <div
                        className="text-[11px] font-mono truncate"
                        style={{ color: isSelected ? item.accent : '#94a3b8' }}
                      >
                        {item.tag}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 bg-[#070b15] border-t border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goRelative(-1)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium transition cursor-pointer"
              aria-label="Lời chia sẻ trước"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              Trước
            </button>
            <button
              type="button"
              onClick={() => goRelative(1)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium transition cursor-pointer"
              aria-label="Lời chia sẻ tiếp theo"
            >
              Sau
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

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
