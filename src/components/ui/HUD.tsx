import React, { useState } from 'react';
import { useHeritageStore } from '../../store/useHeritageStore';
import { TELEPORT_ZONES } from '../../data/heritageSeed';
import {
  ExternalLink,
  Volume2,
  VolumeX,
  HelpCircle,
  Compass,
  SlidersHorizontal,
  MapPin,
  MousePointerClick,
  MousePointer2,
  Crosshair as CrosshairIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const HUD: React.FC = () => {
  const {
    hasEntered,
    controlMode,
    setControlMode,
    isLocked,
    isMuted,
    toggleMute,
    openModal,
    activeModal,
    currentZone,
    requestTeleport,
    isHoveringInteractive,
    hoverPreview,
  } = useHeritageStore();
  const [showControlsHint, setShowControlsHint] = useState(true);
  const [showTeleportBar, setShowTeleportBar] = useState(true);

  const handleToggleControlMode = () => {
    if (controlMode === 'cursor') {
      setControlMode('fps');
      const canvas = document.querySelector('canvas');
      if (canvas) {
        Promise.resolve(canvas.requestPointerLock?.()).catch(() => {});
      }
    } else {
      setControlMode('cursor');
    }
  };

  const handleResumeLock = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      Promise.resolve(canvas.requestPointerLock?.()).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto gap-4">
        {/* Top Left: Exit to Main Website Button (Mandatory Requirement) */}
        <a
          href="https://www.techtonic-club.id.vn/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center space-x-2.5 px-4 py-2.5 rounded-xl glass-panel text-slate-100 hover:text-tech-cyan hover:border-tech-cyan/60 transition-all duration-200"
          title="Trở về website chính thức của TechTonic Club"
        >
          <ExternalLink
            className="w-4 h-4 text-tech-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            aria-hidden="true"
          />
          <span className="text-xs md:text-sm font-semibold tracking-wide">
            VỀ WEBSITE CHÍNH (TECHTONIC-CLUB.ID.VN)
          </span>
        </a>

        {/* Top Right: Utility Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleToggleControlMode}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl glass-panel transition-all text-xs font-medium cursor-pointer ${
              controlMode === 'cursor'
                ? 'text-tech-cyan border-tech-cyan/50'
                : 'text-amber-300 border-amber-400/50'
            }`}
            title={
              controlMode === 'cursor'
                ? 'Đang bật Con trỏ tự do (luôn hiện chuột). Nhấp để chuyển sang Khóa FPS'
                : 'Đang dùng Khóa FPS. Nhấp để bật lại Con trỏ tự do'
            }
          >
            {controlMode === 'cursor' ? (
              <>
                <MousePointer2 className="w-4 h-4 text-tech-cyan" aria-hidden="true" />
                <span className="hidden lg:inline">Con trỏ tự do</span>
              </>
            ) : (
              <>
                <CrosshairIcon className="w-4 h-4 text-amber-300" aria-hidden="true" />
                <span className="hidden lg:inline">Chế độ FPS</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => openModal('instructions')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-panel text-slate-200 hover:text-tech-cyan hover:border-tech-cyan/50 transition-all text-xs font-medium cursor-pointer"
            aria-label="Mở bản đồ di chuyển nhanh và cài đặt"
            title="Di chuyển nhanh & Cài đặt (H)"
          >
            <SlidersHorizontal className="w-4 h-4 text-tech-cyan" aria-hidden="true" />
            <span className="hidden md:inline">Bản đồ & Cài đặt</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/15 font-mono text-[10px] text-slate-300">
              H
            </kbd>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-2.5 rounded-xl glass-panel text-slate-200 hover:text-white hover:border-tech-cyan/50 transition-all cursor-pointer"
            aria-label={isMuted ? 'Bật âm thanh nền' : 'Tắt âm thanh nền'}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4 text-tech-cyan" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowControlsHint((prev) => !prev)}
            className={`p-2.5 rounded-xl glass-panel transition-all cursor-pointer ${
              showControlsHint
                ? 'text-tech-cyan border-tech-cyan/45'
                : 'text-slate-200 hover:text-white hover:border-tech-cyan/50'
            }`}
            aria-label={showControlsHint ? 'Ẩn bảng phím điều khiển' : 'Hiện bảng phím điều khiển'}
            title="Ẩn/Hiện hướng dẫn phím"
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Middle/Left: Controls Guide */}
      {showControlsHint && hasEntered && !activeModal && (
        <aside
          aria-label="Hướng dẫn điều khiển 3D"
          className="self-start glass-panel p-3.5 rounded-xl w-64 mt-4 pointer-events-auto animate-fade-in text-xs border border-tech-cyan/25"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-mono font-bold text-tech-cyan uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" aria-hidden="true" /> Điều khiển 3D
            </span>
            <button
              type="button"
              onClick={() => setShowControlsHint(false)}
              className="text-slate-300 hover:text-white text-[11px] px-1.5 py-0.5 rounded hover:bg-white/10 transition cursor-pointer"
              aria-label="Ẩn hướng dẫn điều khiển"
            >
              Ẩn
            </button>
          </div>
          <div className="space-y-1.5 text-slate-200 font-sans">
            <div className="flex justify-between items-center">
              <span>Di chuyển:</span>
              <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded font-mono text-[10px] text-tech-cyan">
                W A S D
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Xoay góc nhìn:</span>
              <span className="text-[11px] font-mono text-tech-cyan">
                {controlMode === 'cursor' ? 'Kéo chuột' : 'Di chuột'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Chạy nhanh:</span>
              <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded font-mono text-[10px] text-tech-cyan">
                Shift
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Xem chi tiết:</span>
              <span className="text-[11px] font-mono text-tech-cyan">Click / E</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Bản đồ nhanh:</span>
              <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded font-mono text-[10px] text-tech-cyan">
                H
              </kbd>
            </div>
          </div>
        </aside>
      )}

      {/* Right Edge: Rich Live Hover Preview Card BEFORE clicking (non-blocking) */}
      {isHoveringInteractive && hoverPreview && !activeModal && (
        <aside
          aria-live="polite"
          className="fixed right-6 top-20 w-80 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-13rem)] overflow-hidden pointer-events-none z-30 glass-panel-glow rounded-2xl p-4 animate-panel-in"
        >
          {hoverPreview.badge && (
            <div className="text-[11px] font-mono text-tech-cyan font-semibold mb-1.5">
              {hoverPreview.badge}
            </div>
          )}
          <h3 className="text-sm font-bold text-white leading-snug mb-2">
            {hoverPreview.title}
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed mb-2.5">
            {hoverPreview.summary}
          </p>

          {hoverPreview.metrics && hoverPreview.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {hoverPreview.metrics.slice(0, 4).map((m) => (
                <div
                  key={m.label}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300">{m.label}</span>
                  <span className="font-bold text-tech-cyan tabular-nums">{m.value}</span>
                </div>
              ))}
            </div>
          )}

          {hoverPreview.bullets && hoverPreview.bullets.length > 0 && (
            <ul className="space-y-1.5 mb-3 pt-2 border-t border-white/10">
              {hoverPreview.bullets.slice(0, 4).map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-200 leading-snug">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tech-cyan shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-tech-cyan">
            [Click chuột / E] {hoverPreview.actionLabel ?? 'Xem toàn bộ chi tiết'}
          </div>
        </aside>
      )}

      {/* Bottom-docked Quick-Teleport Bar (always clickable with free console cursor) */}
      {hasEntered && !activeModal && (controlMode === 'cursor' || !isLocked) && (
        <div className="mt-auto mb-3 self-center glass-panel px-4 py-2.5 rounded-2xl border border-tech-cyan/30 pointer-events-auto max-w-5xl w-full animate-panel-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-tech-cyan shrink-0" aria-hidden="true" />
              <span className="text-xs text-white font-medium">
                {controlMode === 'cursor'
                  ? 'Con trỏ tự do đang bật: Di chuột & click trực tiếp để xem • Giữ chuột kéo để xoay góc nhìn'
                  : 'Đang tạm mở con trỏ • Chọn khu vực dịch chuyển hoặc nhấn tiếp tục FPS'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {controlMode === 'fps' && !isLocked && (
                <button
                  type="button"
                  onClick={handleResumeLock}
                  className="px-3 py-1 rounded-lg bg-tech-cyan text-slate-950 font-semibold text-xs hover:bg-[#33f3ff] transition cursor-pointer"
                >
                  Khóa góc nhìn FPS
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowTeleportBar((prev) => !prev)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                aria-expanded={showTeleportBar}
              >
                {showTeleportBar ? (
                  <>
                    <span>Thu gọn</span>
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span>Dịch chuyển nhanh</span>
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>

          {showTeleportBar && (
            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/10">
              {TELEPORT_ZONES.map((zone) => {
                const isActive = currentZone === zone.label;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => requestTeleport(zone.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/60'
                        : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-tech-cyan/40'
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-tech-cyan" aria-hidden="true" />
                    <span>{zone.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom Bar */}
      <div className="flex items-end justify-between w-full pointer-events-auto gap-4">
        {/* Bottom Left: Dynamic Location / Zone Indicator */}
        <div
          aria-live="polite"
          className="glass-panel px-4 py-2.5 rounded-xl flex items-center space-x-3"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-tech-cyan shrink-0" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-300">Vị trí hiện tại</div>
            <div className="text-xs md:text-sm font-bold text-white">{currentZone}</div>
          </div>
        </div>

        {/* Bottom Right: TechTonic Logo statically positioned (Mandatory Requirement) */}
        <div className="relative pointer-events-auto">
          <a
            href="https://www.techtonic-club.id.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-transform duration-200 hover:scale-[1.03]"
            title="TechTonic Club Official"
          >
            <div className="glass-panel px-4 py-2 rounded-2xl border border-tech-cyan/30 flex items-center space-x-3 hover:border-tech-cyan/65 transition-colors">
              <img
                src="/assets/techtonic-logo.svg"
                alt="TechTonic Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
