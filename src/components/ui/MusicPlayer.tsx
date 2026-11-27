import React, { useEffect, useId, useRef, useState } from 'react';
import { Music2, X } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { TECHTONIC_PLAYLIST } from '../../data/musicPlaylist';
import { useHeritageStore } from '../../store/useHeritageStore';
import { emitPlayerEvent, subscribePlayerEvent } from '../../utils/playerEvents';
import { PLAYER_EVENTS } from '../../types/playerEvents';

interface MusicPlayerProps {
  show: boolean;
}

/**
 * Floating TechTonic Music Player widget (ported from techtonic-website MusicPlayer)
 * — auto-starts playlist when entering the site, keeps audio mounted across UI states,
 * and smoothly fades out / resumes when the Giant 3D Cinema TV is playing.
 */
export const MusicPlayer: React.FC<MusicPlayerProps> = ({ show }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackTitle, setTrackTitle] = useState<string>('');
  const widgetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const isCenterWallCinemaActive = useHeritageStore((s) => s.isCenterWallCinemaActive);
  const isPanelOpen = show && isOpen;

  const closePanel = () => {
    setIsOpen(false);
    triggerRef.current?.blur();
  };

  useEffect(() => {
    if (!show) setIsOpen(false);
  }, [show]);

  // Smoothly duck background music while Giant 3D Cinema TV is active, and resume cleanly after
  const wasDuckedForCinema = useRef(false);
  useEffect(() => {
    if (isCenterWallCinemaActive && !wasDuckedForCinema.current) {
      wasDuckedForCinema.current = true;
      emitPlayerEvent(PLAYER_EVENTS.DUCK_START);
    } else if (!isCenterWallCinemaActive && wasDuckedForCinema.current) {
      wasDuckedForCinema.current = false;
      emitPlayerEvent(PLAYER_EVENTS.DUCK_END);
    }
  }, [isCenterWallCinemaActive]);

  useEffect(() => {
    if (!isPanelOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !widgetRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        closePanel();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPanelOpen]);

  useEffect(() => {
    const publishPanelState = () =>
      emitPlayerEvent(isPanelOpen ? PLAYER_EVENTS.UI_OPEN : PLAYER_EVENTS.UI_CLOSE);
    publishPanelState();
    return subscribePlayerEvent(PLAYER_EVENTS.REQUEST_STATE, publishPanelState);
  }, [isPanelOpen]);

  useEffect(() => {
    const unsubscribe = subscribePlayerEvent(PLAYER_EVENTS.STATE, ({ detail }) => {
      setIsPlaying(detail.isPlaying);
      setTrackTitle(detail.track.title ?? '');
    });
    emitPlayerEvent(PLAYER_EVENTS.REQUEST_STATE);
    return unsubscribe;
  }, []);

  return (
    <div
      ref={widgetRef}
      aria-hidden={!show}
      style={{ pointerEvents: show ? 'auto' : 'none' }}
      className={`fixed bottom-[5.5rem] right-5 z-30 select-none transition-[transform,opacity] duration-300 ease-out ${
        show ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      }`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="Trình phát nhạc TechTonic"
        aria-expanded={isPanelOpen}
        aria-controls={panelId}
        title={
          isOpen
            ? 'Thu gọn trình phát nhạc'
            : trackTitle && isPlaying
            ? `Đang phát: ${trackTitle} • Nhấn để mở`
            : 'Mở trình phát nhạc TechTonic'
        }
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-[#00F5FF] via-[#38bdf8] to-[#b84dff] text-slate-950 shadow-[0_0_20px_rgba(0,245,255,0.42)] hover:scale-105 hover:shadow-[0_0_28px_rgba(0,245,255,0.68)] active:scale-95 transition-[transform,box-shadow] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
      >
        {isPlaying && (
          <span
            className="absolute -inset-1 -z-10 rounded-full border border-tech-cyan/45 opacity-75 pointer-events-none"
            aria-hidden="true"
          />
        )}
        {isPlaying ? (
          <div
            className="flex h-5 w-5 items-end justify-center gap-[2.5px] pb-0.5"
            aria-hidden="true"
          >
            <span className="w-[2.5px] rounded-full bg-slate-950 music-eq-1" />
            <span className="w-[2.5px] rounded-full bg-slate-950 music-eq-2" />
            <span className="w-[2.5px] rounded-full bg-slate-950 music-eq-3" />
            <span className="w-[2.5px] rounded-full bg-slate-950 music-eq-4" />
          </div>
        ) : (
          <Music2 className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {/* Keep audio mounted when the widget is hidden or panel is collapsed */}
      <div
        id={panelId}
        role="region"
        aria-label="Bảng điều khiển nhạc TechTonic"
        hidden={!isPanelOpen}
        className="absolute bottom-full right-0 mb-3.5 max-h-[calc(100dvh-11rem)] w-[280px] max-w-[calc(100vw-3rem)] overflow-y-auto overscroll-contain rounded-[24px] glass-panel-glow text-white"
      >
        <div className="flex items-center justify-between gap-2 px-3.5 pt-2.5">
          <span className="pl-0.5 text-xs font-mono font-bold uppercase tracking-wider text-tech-cyan">
            Trình phát nhạc
          </span>
          <button
            ref={closeRef}
            type="button"
            aria-label="Thu gọn trình phát nhạc"
            onClick={closePanel}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-white/10 hover:text-white active:scale-95 transition-[transform,background-color,color] duration-150 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <AudioPlayer playlist={TECHTONIC_PLAYLIST} autoPlay defaultShuffle />
      </div>
    </div>
  );
};
