import React, { useEffect, useRef } from 'react';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { TELEPORT_ZONES } from '../../../data/heritageSeed';
import {
  X,
  Compass,
  MapPin,
  Volume2,
  VolumeX,
  Gauge,
  Keyboard,
  Sparkles,
  Play,
  Square,
  CheckCircle2,
  Server,
} from 'lucide-react';

export const InstructionsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    currentZone,
    visitedZones,
    requestTeleport,
    isMuted,
    toggleMute,
    audioVolume,
    setAudioVolume,
    mouseSensitivity,
    setMouseSensitivity,
    graphicsQuality,
    setGraphicsQuality,
    isGuidedTourActive,
    toggleGuidedTour,
    apiHealth,
    storageMode,
    totalVisits,
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
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl glass-panel-glow overflow-hidden border border-tech-cyan/40 animate-panel-in"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-4.5 border-b border-tech-cyan/20 flex items-center justify-between bg-[#0c101c]/95">
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3
                id="teleport-heading"
                className="text-sm font-semibold text-white flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-tech-cyan" aria-hidden="true" />
                Lướt mượt tới khu vực trưng bày ({Math.min(visitedZones.length, TELEPORT_ZONES.length)}/{TELEPORT_ZONES.length})
              </h3>

              <button
                type="button"
                onClick={toggleGuidedTour}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isGuidedTourActive
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-tech-cyan/15 border border-tech-cyan/45 text-tech-cyan hover:bg-tech-cyan hover:text-slate-950'
                }`}
              >
                {isGuidedTourActive ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    <span>Dừng Tour tự động</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Bắt đầu Tour tự động (T)</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TELEPORT_ZONES.map((zone, idx) => {
                const isHere = currentZone === zone.label;
                const isVisited = visitedZones.includes(zone.label);
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
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/15 font-mono text-[10px] text-tech-cyan">
                          {idx + 1}
                        </kbd>
                        <span>{zone.label}</span>
                      </span>
                      {isHere ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-tech-cyan text-slate-950 font-semibold shrink-0">
                          ĐANG Ở ĐÂY
                        </span>
                      ) : isVisited ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-label="Đã khám phá" />
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{zone.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Controls, Audio & Graphics Settings */}
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
                Tùy chỉnh âm thanh & đồ họa
              </h3>

              {/* Audio toggle & volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-200">Âm lượng không gian & hiệu ứng</span>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-medium text-white transition cursor-pointer"
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                        Tắt tiếng
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-tech-cyan" aria-hidden="true" />
                        {Math.round(audioVolume * 100)}%
                      </>
                    )}
                  </button>
                </div>
                <input
                  id="audio-vol-range"
                  aria-label="Âm lượng âm thanh"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#00F0FF] cursor-pointer"
                />
              </div>

              {/* Mouse sensitivity */}
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

              {/* Graphics quality selector */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-tech-cyan" aria-hidden="true" />
                    Chất lượng đồ họa 3D
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGraphicsQuality('high')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      graphicsQuality === 'high'
                        ? 'bg-tech-cyan text-slate-950 border-tech-cyan font-semibold'
                        : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Cao (Sắc nét)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphicsQuality('balanced')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      graphicsQuality === 'balanced'
                        ? 'bg-tech-cyan text-slate-950 border-tech-cyan font-semibold'
                        : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Mượt (Tiết kiệm)
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e1422]/85 border border-white/10 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
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
                    <span>Xoay góc nhìn 360°</span>
                    <kbd className="font-mono text-tech-cyan">Nhấn giữ & kéo chuột</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Lướt nhanh 8 khu vực</span>
                    <kbd className="font-mono text-tech-cyan">Phím 1 – 8</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Sơ đồ 2D / Tour tự động</span>
                    <kbd className="font-mono text-tech-cyan">M / T</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Mở chi tiết vật phẩm</span>
                    <kbd className="font-mono text-tech-cyan">Click hoặc E</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Mở / Đóng cài đặt</span>
                    <kbd className="font-mono text-tech-cyan">H / ESC</kbd>
                  </div>
                </div>
              </div>

              {/* Backend System Status Pill */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  API {apiHealth?.version ? `v${apiHealth.version}` : 'Local'} ({storageMode})
                </span>
                <span className="font-mono text-tech-cyan tabular-nums">
                  {totalVisits} lượt tham quan
                </span>
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
