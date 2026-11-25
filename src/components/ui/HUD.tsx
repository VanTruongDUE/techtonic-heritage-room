import React, { useState } from 'react';
import { countOfficialVisitedZones, useHeritageStore } from '../../store/useHeritageStore';
import { TELEPORT_ZONES } from '../../data/heritageSeed';
import { MiniMap } from './MiniMap';
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
  Play,
  Square,
  Map as MapIcon,
  Eye,
  Film,
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
    visitedZones,
    totalVisits,
    requestTeleport,
    isHoveringInteractive,
    hoverPreview,
    isGuidedTourActive,
    toggleGuidedTour,
    showMiniMap,
    toggleMiniMap,
    isCenterWallCinemaActive,
    startCenterWallCinema,
    stopCenterWallCinema,
    showJourneyPrompt,
  } = useHeritageStore();
  const [showControlsHint, setShowControlsHint] = useState(false);
  const [showTeleportBar, setShowTeleportBar] = useState(true);

  const visitedCount = countOfficialVisitedZones(visitedZones);
  const visitedPct = Math.round((visitedCount / TELEPORT_ZONES.length) * 100);
  const completedAllZones = visitedCount >= TELEPORT_ZONES.length;

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
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-5 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto gap-3">
        {/* Top Left: Exit to Main Website Button (Mandatory Requirement) + Live Visit Counter */}
        <div className="flex items-center gap-2.5 min-w-0">
          <a
            href="https://www.techtonic-club.id.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center space-x-2.5 px-4 py-2.5 rounded-xl glass-panel text-slate-100 hover:text-tech-cyan hover:border-tech-cyan/60 transition-all duration-200 shrink-0"
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

          {hasEntered && (
            <div
              className="hidden xl:flex items-center gap-2 px-3 py-2.5 rounded-xl glass-panel text-xs text-slate-200"
              title="Tổng lượt tham quan phòng truyền thống"
            >
              <Eye className="w-3.5 h-3.5 text-tech-cyan shrink-0" aria-hidden="true" />
              <span className="font-mono font-semibold text-white tabular-nums">{totalVisits}</span>
              <span className="text-slate-400">lượt ghé</span>
            </div>
          )}
        </div>

        {/* Top Right: Utility Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {hasEntered && (
            <button
              type="button"
              onClick={isCenterWallCinemaActive ? stopCenterWallCinema : startCenterWallCinema}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-xs cursor-pointer ${
                isCenterWallCinemaActive
                  ? 'bg-amber-400 border border-amber-300 text-slate-950 font-bold hover:bg-amber-300 shadow-[0_6px_20px_rgba(251,191,36,0.35)]'
                  : completedAllZones
                  ? 'glass-panel text-amber-300 border-amber-400/60 hover:bg-amber-400/15 font-medium'
                  : 'glass-panel text-slate-200 hover:text-tech-cyan hover:border-tech-cyan/50 font-medium'
              }`}
              title="Biến bảng Dream it - Code it thành TV 3D chiếu phim hành trình TechTonic"
            >
              <Film className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">
                {isCenterWallCinemaActive ? 'Tắt TV 3D' : 'Phim hành trình'}
              </span>
            </button>
          )}

          {hasEntered && (
            <button
              type="button"
              onClick={toggleGuidedTour}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-xs cursor-pointer ${
                isGuidedTourActive
                  ? 'bg-tech-cyan border border-tech-cyan text-slate-950 font-bold hover:bg-[#33f3ff] shadow-[0_6px_20px_rgba(0,240,255,0.35)]'
                  : 'glass-panel text-slate-200 hover:text-tech-cyan hover:border-tech-cyan/50 font-medium'
              }`}
              title="Bật/Tắt chế độ tham quan tự động (T)"
            >
              {isGuidedTourActive ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span className="hidden lg:inline">Dừng Tour</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-tech-cyan" aria-hidden="true" />
                  <span className="hidden lg:inline">Tour tự động</span>
                </>
              )}
            </button>
          )}

          {hasEntered && (
            <button
              type="button"
              onClick={toggleMiniMap}
              className={`p-2.5 rounded-xl glass-panel transition-all cursor-pointer ${
                showMiniMap
                  ? 'text-tech-cyan border-tech-cyan/45'
                  : 'text-slate-200 hover:text-white hover:border-tech-cyan/50'
              }`}
              aria-label={showMiniMap ? 'Ẩn bản đồ 2D' : 'Hiện bản đồ 2D'}
              title="Sơ đồ 2D (M)"
            >
              <MapIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

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
                <span className="hidden xl:inline">Con trỏ tự do</span>
              </>
            ) : (
              <>
                <CrosshairIcon className="w-4 h-4 text-amber-300" aria-hidden="true" />
                <span className="hidden xl:inline">Chế độ FPS</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => openModal('instructions')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-panel text-slate-200 hover:text-tech-cyan hover:border-tech-cyan/50 transition-all text-xs font-medium cursor-pointer"
            aria-label="Mở bản đồ di chuyển nhanh và cài đặt"
            title="Bản đồ & Cài đặt (H)"
          >
            <SlidersHorizontal className="w-4 h-4 text-tech-cyan" aria-hidden="true" />
            <span className="hidden md:inline">Cài đặt</span>
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

      {/* Left Rail: Interactive 2D MiniMap + Optional Controls Guide */}
      <div className="flex flex-col items-start gap-3 mt-3">
        <MiniMap />

        {showControlsHint && hasEntered && !activeModal && (
          <aside
            aria-label="Hướng dẫn điều khiển 3D"
            className="self-start glass-panel p-3.5 rounded-xl w-60 pointer-events-auto animate-fade-in text-xs border border-tech-cyan/25"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-tech-cyan uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" aria-hidden="true" /> Phím điều khiển
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
                <span>Xoay 360° / Zoom:</span>
                <span className="text-[11px] font-mono text-tech-cyan">
                  {controlMode === 'cursor' ? 'Kéo / Cuộn' : 'Chuột / Cuộn'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Lướt nhanh khu vực:</span>
                <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded font-mono text-[10px] text-tech-cyan">
                  1 – 8
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Tour tự động / Sơ đồ:</span>
                <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded font-mono text-[10px] text-tech-cyan">
                  T / M
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Xem chi tiết:</span>
                <span className="text-[11px] font-mono text-tech-cyan">Click / E</span>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Right Edge: Rich Live Hover Preview Card BEFORE clicking (non-blocking) */}
      {isHoveringInteractive && hoverPreview && !activeModal && (
        <aside
          aria-live="polite"
          className="fixed right-5 top-20 w-80 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-13rem)] overflow-hidden pointer-events-none z-30 glass-panel-glow rounded-2xl p-4 animate-panel-in"
        >
          <div className="h-0.5 w-14 rounded-full bg-tech-cyan mb-2.5" aria-hidden="true" />
          {hoverPreview.badge && (
            <div className="text-[11px] font-mono text-tech-cyan font-semibold mb-1">
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

      {/* Bottom-docked Quick-Teleport Bar (hidden cleanly during Cinema TV mode or Journey Prompt) */}
      {hasEntered &&
        !activeModal &&
        !showJourneyPrompt &&
        !isCenterWallCinemaActive &&
        (controlMode === 'cursor' || !isLocked) && (
        <div className="mt-auto mb-2.5 self-center glass-panel px-3.5 py-2 rounded-2xl border border-tech-cyan/28 pointer-events-auto max-w-[840px] w-full animate-panel-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-tech-cyan shrink-0" aria-hidden="true" />
              <span className="text-xs text-white font-medium">
                {isGuidedTourActive
                  ? 'Đang chạy Tour tự động qua các phân khu • Nhấn WASD hoặc kéo chuột để tự điều khiển'
                  : controlMode === 'cursor'
                  ? 'Con trỏ tự do đang bật: Di chuột & click trực tiếp để xem • Giữ kéo chuột để xoay 360°'
                  : 'Đang tạm mở con trỏ • Chọn khu vực để lướt mượt hoặc khóa lại góc nhìn FPS'}
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
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/10">
              {TELEPORT_ZONES.map((zone, idx) => {
                const isActive = currentZone === zone.label;
                const isVisited = visitedZones.includes(zone.label);
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => requestTeleport(zone.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/60'
                        : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-tech-cyan/40'
                    }`}
                    title={`${zone.label} (Phím ${idx + 1})`}
                  >
                    <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                      {idx + 1}
                    </span>
                    <MapPin
                      className={`w-3 h-3 ${isActive || isVisited ? 'text-tech-cyan' : 'text-slate-400'}`}
                      aria-hidden="true"
                    />
                    <span>{zone.shortLabel}</span>
                    {isVisited && !isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                        aria-label="Đã khám phá"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom Bar */}
      <div className="flex items-end justify-between w-full pointer-events-auto gap-4">
        {/* Bottom Left: Dynamic Location + Exploration Progress Indicator */}
        <div
          aria-live="polite"
          className="glass-panel px-4 py-2.5 rounded-xl flex items-center space-x-3 min-w-[230px]"
        >
          <span
            className="w-2.5 h-2.5 rounded-full bg-tech-cyan shrink-0 shadow-[0_0_10px_rgba(0,245,255,0.85)]"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 text-[11px] text-slate-300">
              <span>Vị trí hiện tại</span>
              <span className="font-mono text-tech-cyan tabular-nums">
                {visitedCount}/{TELEPORT_ZONES.length} ({visitedPct}%)
              </span>
            </div>
            <div className="text-xs md:text-sm font-bold text-white truncate">{currentZone}</div>
            <div className="mt-1 h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00F5FF] to-[#b84dff] shadow-[0_0_8px_rgba(0,245,255,0.6)] transition-all duration-300"
                style={{ width: `${visitedPct}%` }}
              />
            </div>
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
