import React from 'react';
import { Film, Loader2, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useHeritageStore } from '../../store/useHeritageStore';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const CinemaControlsBar: React.FC = () => {
  const {
    isCenterWallCinemaActive,
    cinemaPhase,
    isCinemaPaused,
    isCinemaMuted,
    cinemaCurrentTime,
    cinemaDuration,
    toggleCinemaPause,
    toggleCinemaMute,
    requestCinemaSeek,
    stopCenterWallCinema,
  } = useHeritageStore(
    useShallow((s) => ({
      isCenterWallCinemaActive: s.isCenterWallCinemaActive,
      cinemaPhase: s.cinemaPhase,
      isCinemaPaused: s.isCinemaPaused,
      isCinemaMuted: s.isCinemaMuted,
      cinemaCurrentTime: s.cinemaCurrentTime,
      cinemaDuration: s.cinemaDuration,
      toggleCinemaPause: s.toggleCinemaPause,
      toggleCinemaMute: s.toggleCinemaMute,
      requestCinemaSeek: s.requestCinemaSeek,
      stopCenterWallCinema: s.stopCenterWallCinema,
    }))
  );

  if (!isCenterWallCinemaActive) return null;

  const isPlayingPhase = cinemaPhase === 'playing';
  const headerLabel =
    cinemaPhase === 'gliding'
      ? 'ĐANG LƯỚT TỚI HÀNG GHẾ VIP • CHUẨN BỊ PHIM...'
      : cinemaPhase === 'buffering'
        ? 'ĐANG ĐỆM THƯỚC PHIM HD...'
        : 'TV 3D KHỔNG LỒ • HÀNH TRÌNH TECHTONIC CLUB';

  return (
    <>
      {/* Subtle theatrical letterbox vignette bars framing the 3D Cinema glide & playback */}
      <div
        aria-hidden="true"
        className="fixed top-0 inset-x-0 h-14 z-20 pointer-events-none bg-gradient-to-b from-black/75 to-transparent transition-opacity duration-500"
      />
      <div
        aria-hidden="true"
        className="fixed bottom-0 inset-x-0 h-28 z-20 pointer-events-none bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-500"
      />

      <div
        role="region"
        aria-label="Điều khiển màn hình TV 3D TechTonic"
        className="fixed bottom-5 inset-x-0 z-30 flex justify-center px-4 pointer-events-none select-none"
      >
        <div className="pointer-events-auto w-full max-w-xl glass-panel-glow rounded-2xl px-4 py-3 border border-tech-cyan/45 flex flex-col gap-2 animate-panel-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {cinemaPhase === 'gliding' ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              ) : cinemaPhase === 'buffering' ? (
                <Loader2 className="w-3.5 h-3.5 text-tech-cyan animate-spin shrink-0" aria-hidden="true" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              )}
              <Film className="w-4 h-4 text-tech-cyan shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold text-white truncate">{headerLabel}</span>
            </div>

            <button
              type="button"
              onClick={stopCenterWallCinema}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-rose-500/25 border border-white/15 hover:border-rose-400/50 text-xs text-slate-100 font-medium transition-colors duration-150 cursor-pointer shrink-0"
              title="Tắt TV 3D và quay lại bảng Dream it - Code it (ESC)"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tắt TV (ESC)</span>
            </button>
          </div>

          <div
            className={`flex items-center gap-3 transition-opacity duration-300 ${
              isPlayingPhase ? 'opacity-100' : 'opacity-50 pointer-events-none'
            }`}
          >
            <button
              type="button"
              disabled={!isPlayingPhase}
              onClick={toggleCinemaPause}
              className="p-2 rounded-xl bg-tech-cyan text-slate-950 hover:bg-[#33f3ff] transition-colors duration-150 cursor-pointer shrink-0 disabled:cursor-default"
              aria-label={isCinemaPaused ? 'Tiếp tục phát video' : 'Tạm dừng video'}
            >
              {isCinemaPaused ? (
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              ) : (
                <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
              )}
            </button>

            <span className="text-[11px] font-mono text-slate-300 tabular-nums shrink-0">
              {formatTime(cinemaCurrentTime)}
            </span>

            <input
              type="range"
              aria-label="Tua thời gian video"
              disabled={!isPlayingPhase}
              min={0}
              max={cinemaDuration > 0 ? cinemaDuration : 1}
              step={0.2}
              value={Math.min(cinemaCurrentTime, cinemaDuration > 0 ? cinemaDuration : 1)}
              onChange={(e) => requestCinemaSeek(parseFloat(e.target.value))}
              className="flex-1 tech-slider"
            />

            <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
              {formatTime(cinemaDuration)}
            </span>

            <button
              type="button"
              disabled={!isPlayingPhase}
              onClick={toggleCinemaMute}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 transition-colors duration-150 cursor-pointer shrink-0 disabled:cursor-default"
              aria-label={isCinemaMuted ? 'Bật tiếng video' : 'Tắt tiếng video'}
            >
              {isCinemaMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4 text-tech-cyan" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
