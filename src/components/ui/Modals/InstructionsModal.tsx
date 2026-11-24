import React, { useEffect, useRef } from 'react';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { TELEPORT_ZONES } from '../../../data/heritageSeed';
import { X, Compass, MapPin, Volume2, VolumeX, Gauge, Keyboard } from 'lucide-react';

export const InstructionsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    currentZone,
    requestTeleport,
    isMuted,
    toggleMute,
    mouseSensitivity,
    setMouseSensitivity,
  } = useHeritageStore();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeModal === 'instructions') {
      const timer = window.setTimeout(() => closeBtnRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    }
  }, [activeModal]);

  if (activeModal !== 'instructions') return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-modal-title"
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
        className="relative w-full max-w-3xl max-h-[86vh] flex flex-col rounded-2xl glass-panel-glow overflow-hidden border border-tech-cyan/40 animate-panel-in"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-tech-cyan/20 flex items-center justify-between bg-[#0c101c]/95">
          <div className="flex items-center space-x-3">
            <Compass className="w-6 h-6 text-tech-cyan shrink-0" aria-hidden="true" />
            <div>
              <h2
                id="instructions-modal-title"
                className="text-xl md:text-2xl font-bold text-white tracking-tight"
              >
                BẢN ĐỒ DỊCH CHUYỂN & CÀI ĐẶT
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Vị trí hiện tại: <span className="text-tech-cyan font-semibold">{currentZone}</span>
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeModal}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng bản đồ và cài đặt"
            title="Đóng (ESC)"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Teleport Section */}
          <section aria-labelledby="teleport-heading">
            <h3
              id="teleport-heading"
              className="text-sm font-semibold text-white mb-3 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-tech-cyan" aria-hidden="true" />
              Dịch chuyển nhanh tới khu vực trưng bày
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TELEPORT_ZONES.map((zone) => {
                const isHere = currentZone === zone.label;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => requestTeleport(zone.id)}
                    className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                      isHere
                        ? 'bg-tech-cyan/15 border-tech-cyan/60'
                        : 'bg-[#0e1422]/85 border-white/10 hover:border-tech-cyan/45 hover:bg-[#121a2c]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{zone.label}</span>
                      {isHere && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-tech-cyan text-slate-950 font-semibold">
                          ĐANG Ở ĐÂY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{zone.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Controls & Audio Settings */}
          <section
            aria-labelledby="settings-heading"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10"
          >
            <div className="p-4 rounded-xl bg-[#0e1422]/85 border border-white/10 space-y-4">
              <h3
                id="settings-heading"
                className="text-sm font-semibold text-white flex items-center gap-2"
              >
                <Gauge className="w-4 h-4 text-tech-cyan" aria-hidden="true" />
                Tùy chỉnh trải nghiệm
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-200">Âm thanh không gian nền</span>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-medium text-white transition cursor-pointer"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                      Đang tắt
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-tech-cyan" aria-hidden="true" />
                      Đang bật
                    </>
                  )}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="mouse-sens-range" className="text-slate-200">
                    Độ nhạy xoay chuột
                  </label>
                  <span className="font-mono text-tech-cyan tabular-nums">
                    {mouseSensitivity.toFixed(1)}x
                  </span>
                </div>
                <input
                  id="mouse-sens-range"
                  type="range"
                  min={0.4}
                  max={1.8}
                  step={0.1}
                  value={mouseSensitivity}
                  onChange={(e) => setMouseSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-[#00F0FF] cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1422]/85 border border-white/10 space-y-2.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-tech-cyan" aria-hidden="true" />
                Phím tắt điều khiển
              </h3>
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="flex justify-between">
                  <span>Đi bộ / Điều hướng</span>
                  <kbd className="font-mono text-tech-cyan">W A S D / Mũi tên</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Chạy nhanh / Nhảy</span>
                  <kbd className="font-mono text-tech-cyan">Shift / Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Mở chi tiết vật phẩm</span>
                  <kbd className="font-mono text-tech-cyan">Chuột trái hoặc E</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Mở / Đóng bản đồ này</span>
                  <kbd className="font-mono text-tech-cyan">H</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Mở con trỏ chuột</span>
                  <kbd className="font-mono text-tech-cyan">ESC</kbd>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0a0d14] border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-5 py-2 rounded-xl bg-tech-cyan text-slate-950 font-semibold text-xs hover:bg-[#33f3ff] transition cursor-pointer"
          >
            Quay lại không gian 3D
          </button>
        </div>
      </div>
    </div>
  );
};
