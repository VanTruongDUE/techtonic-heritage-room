import React, { useEffect, useRef, useState } from 'react';
import {
  Pause,
  Play,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useHeritageStore } from '../../store/useHeritageStore';
import { emitPlayerEvent, subscribePlayerEvent } from '../../utils/playerEvents';
import { PLAYER_EVENTS, type AudioTrack } from '../../types/playerEvents';

export interface AudioPlayerProps {
  src?: string;
  cover?: string;
  title?: string;
  playlist?: readonly AudioTrack[];
  autoPlay?: boolean;
  defaultShuffle?: boolean;
}

const formatTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  return `${minutes}:${Math.floor(safeSeconds % 60).toString().padStart(2, '0')}`;
};

const controlClassName =
  'flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

function PlaylistPlayer({
  tracks,
  autoPlay,
  defaultShuffle,
}: {
  tracks: readonly AudioTrack[];
  autoPlay?: boolean;
  defaultShuffle?: boolean;
}) {
  const globalMuted = useHeritageStore((s) => s.isMuted);
  const globalAudioVolume = useHeritageStore((s) => s.audioVolume);

  const audioRef = useRef<HTMLAudioElement>(null);
  const resumeOnTrackChange = useRef(false);
  const playRequest = useRef(0);
  const autoplayCleanup = useRef<(() => void) | null>(null);
  const [allowAutoplay, setAllowAutoplay] = useState(true);

  const [order] = useState(() => {
    const initialOrder = tracks.map((_, index) => index);
    if (defaultShuffle && initialOrder.length > 1) {
      for (let index = initialOrder.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [initialOrder[index], initialOrder[randomIndex]] = [
          initialOrder[randomIndex],
          initialOrder[index],
        ];
      }
    }
    return initialOrder;
  });

  const [position, setPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [volume, setVolume] = useState(0.55);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.55);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const volumeRef = useRef(0.55);

  const effectiveVolume = (localVol: number, localMuted: boolean, hudMuted: boolean, hudVol: number) => {
    if (localMuted || hudMuted || localVol <= 0) return 0;
    // Scale gently with master HUD audio volume setting
    const masterScale = Math.min(1, Math.max(0.2, hudVol / 0.5));
    return Math.min(1, Math.max(0, localVol * masterScale));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextVol = effectiveVolume(volume, isMuted, globalMuted, globalAudioVolume);
    audio.volume = nextVol;
    volumeRef.current = nextVol;
  }, [volume, isMuted, globalMuted, globalAudioVolume]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    const nextVol = effectiveVolume(newVolume, newVolume === 0, globalMuted, globalAudioVolume);
    volumeRef.current = nextVol;
    if (audioRef.current) {
      audioRef.current.volume = nextVol;
    }
  };

  const toggleMute = () => {
    if (isMuted || volume === 0) {
      const restored = prevVolume > 0 ? prevVolume : 0.55;
      setIsMuted(false);
      setVolume(restored);
      const nextVol = effectiveVolume(restored, false, globalMuted, globalAudioVolume);
      volumeRef.current = nextVol;
      if (audioRef.current) audioRef.current.volume = nextVol;
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
      volumeRef.current = 0;
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const trackIndex = order[position];
  const track = tracks[trackIndex];
  const hasPlaylist = tracks.length > 1;
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const playAudio = async (audio: HTMLAudioElement) => {
    const request = ++playRequest.current;
    setError(null);
    try {
      if (audio.error) audio.load();
      await audio.play();
    } catch (cause) {
      if (request !== playRequest.current) return;
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setIsPlaying(false);
      setError('Không thể phát bài nhạc. Vui lòng thử lại.');
    }
  };

  const cancelInteractionAutoplay = () => {
    setAllowAutoplay(false);
    if (audioRef.current) audioRef.current.autoplay = false;
    autoplayCleanup.current?.();
    autoplayCleanup.current = null;
  };

  // Autoplay immediately on first user click / keydown / tap (exact Web TechTonic behavior)
  useEffect(() => {
    if (!autoPlay || !allowAutoplay) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    const playOnInteraction = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (!audio.paused) {
        cancelInteractionAutoplay();
        return;
      }

      const request = ++playRequest.current;
      setError(null);
      if (audio.error) audio.load();
      audio.volume = volumeRef.current;

      audio
        .play()
        .then(() => {
          cancelInteractionAutoplay();
        })
        .catch((cause) => {
          if (request !== playRequest.current) return;
          if (cause instanceof DOMException && cause.name === 'AbortError') return;

          cancelInteractionAutoplay();
          setIsPlaying(false);
          setError('Không thể phát bài nhạc. Vui lòng thử lại.');
        });
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0]?.clientX ?? 0;
      touchStartY = e.touches[0]?.clientY ?? 0;
      isSwiping = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentX = e.touches[0]?.clientX ?? touchStartX;
      const currentY = e.touches[0]?.clientY ?? touchStartY;
      if (Math.abs(currentX - touchStartX) > 10 || Math.abs(currentY - touchStartY) > 10) {
        isSwiping = true;
      }
    };

    const handleTouchEnd = () => {
      if (isSwiping) return;
      playOnInteraction();
    };

    window.addEventListener('click', playOnInteraction);
    window.addEventListener('keydown', playOnInteraction);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    const cleanup = () => {
      window.removeEventListener('click', playOnInteraction);
      window.removeEventListener('keydown', playOnInteraction);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
    autoplayCleanup.current = cleanup;

    return () => {
      cleanup();
      autoplayCleanup.current = null;
    };
  }, [autoPlay, allowAutoplay]);

  const fadeIntervalRef = useRef<number | null>(null);
  const wasPlayingBeforeDucking = useRef(false);

  const clearFadeInterval = () => {
    if (fadeIntervalRef.current !== null) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const unsubscribePlay = subscribePlayerEvent(PLAYER_EVENTS.PLAY, () => {
      cancelInteractionAutoplay();
      clearFadeInterval();
      wasPlayingBeforeDucking.current = false;
      const audio = audioRef.current;
      if (audio) audio.volume = volumeRef.current;
      if (audio?.paused) void playAudio(audio);
    });

    const unsubscribePause = subscribePlayerEvent(PLAYER_EVENTS.PAUSE, () => {
      cancelInteractionAutoplay();
      clearFadeInterval();
      wasPlayingBeforeDucking.current = false;
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        playRequest.current += 1;
        audio.pause();
      }
    });

    // Smooth fade-out & pause when Giant 3D Cinema TV plays
    const unsubscribeDuckStart = subscribePlayerEvent(PLAYER_EVENTS.DUCK_START, () => {
      const audio = audioRef.current;
      if (!audio) return;

      clearFadeInterval();

      if (!audio.paused) {
        wasPlayingBeforeDucking.current = true;
        const startVolume = audio.volume || volumeRef.current || 0.55;
        const steps = 14;
        const step = startVolume / steps;

        fadeIntervalRef.current = window.setInterval(() => {
          if (!audioRef.current) return;
          if (audioRef.current.volume > step) {
            audioRef.current.volume = Math.max(0, audioRef.current.volume - step);
          } else {
            audioRef.current.volume = 0;
            audioRef.current.pause();
            clearFadeInterval();
          }
        }, 45);
      } else {
        wasPlayingBeforeDucking.current = false;
      }
    });

    // Smooth fade-in & resume when Giant 3D Cinema TV stops
    const unsubscribeDuckEnd = subscribePlayerEvent(PLAYER_EVENTS.DUCK_END, () => {
      const audio = audioRef.current;
      if (!audio) return;

      clearFadeInterval();

      if (wasPlayingBeforeDucking.current) {
        wasPlayingBeforeDucking.current = false;
        audio.volume = 0;
        void playAudio(audio).then(() => {
          const targetVolume = volumeRef.current;
          if (targetVolume > 0) {
            const steps = 18;
            const step = targetVolume / steps;

            fadeIntervalRef.current = window.setInterval(() => {
              if (!audioRef.current) return;
              if (audioRef.current.volume < targetVolume - step) {
                audioRef.current.volume = Math.min(targetVolume, audioRef.current.volume + step);
              } else {
                audioRef.current.volume = targetVolume;
                clearFadeInterval();
              }
            }, 45);
          }
        });
      }
    });

    return () => {
      clearFadeInterval();
      unsubscribePlay();
      unsubscribePause();
      unsubscribeDuckStart();
      unsubscribeDuckEnd();
    };
  }, []);

  useEffect(() => {
    const publishState = () =>
      emitPlayerEvent(PLAYER_EVENTS.STATE, { isPlaying, track, progress, currentTime, duration });
    publishState();
    return subscribePlayerEvent(PLAYER_EVENTS.REQUEST_STATE, publishState);
  }, [isPlaying, track, progress, currentTime, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setError(null);
    if (audio && resumeOnTrackChange.current) {
      resumeOnTrackChange.current = false;
      void playAudio(audio);
    }
    return () => {
      playRequest.current += 1;
      if (audio && !audio.paused) audio.pause();
    };
  }, [track.src, trackIndex]);

  const updateTime = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : 0);
    setDuration(Number.isFinite(audio.duration) ? Math.max(0, audio.duration) : 0);
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = (Math.min(100, Math.max(0, value)) / 100) * audio.duration;
    updateTime();
  };

  const changeTrack = (nextPosition: number, resume: boolean) => {
    resumeOnTrackChange.current = resume;
    setPosition(nextPosition);
  };

  const skipTrack = (direction: -1 | 1) => {
    cancelInteractionAutoplay();
    const audio = audioRef.current;
    changeTrack(
      (position + direction + order.length) % order.length,
      Boolean(audio && !audio.paused)
    );
  };

  const handleEnded = () => {
    if (isRepeat) return;
    setIsPlaying(false);
    changeTrack((position + 1) % order.length, true);
  };

  const playRandomTrack = () => {
    if (!hasPlaylist) return;
    cancelInteractionAutoplay();
    const offset = 1 + Math.floor(Math.random() * (order.length - 1));
    changeTrack((position + offset) % order.length, true);
  };

  return (
    <div
      role="group"
      aria-label="Trình phát nhạc"
      className="relative mx-auto flex w-full max-w-full flex-col overflow-hidden bg-transparent p-4 pt-2 animate-panel-in"
    >
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        autoPlay={autoPlay && allowAutoplay}
        loop={isRepeat}
        onLoadedMetadata={updateTime}
        onDurationChange={updateTime}
        onTimeUpdate={updateTime}
        onPlay={(event) => {
          cancelInteractionAutoplay();
          setIsPlaying(!event.currentTarget.paused);
        }}
        onPause={(event) => setIsPlaying(!event.currentTarget.paused)}
        onEnded={handleEnded}
        onError={() => {
          setIsPlaying(false);
          setError('Không thể tải bài nhạc. Kiểm tra kết nối hoặc thử lại.');
        }}
        className="hidden"
      />

      {track.cover && (
        <div className="relative mb-3.5 mt-1 h-[168px] w-full shrink-0">
          <div
            className={`absolute inset-0 scale-95 rounded-2xl bg-gradient-to-tr from-[#00F5FF]/40 to-[#b84dff]/35 blur-xl transition-opacity duration-700 ${
              isPlaying ? 'opacity-75' : 'opacity-20'
            }`}
            aria-hidden="true"
          />
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-tech-cyan/25 bg-[#050a14] shadow-inner">
            <img
              src={track.cover}
              alt={track.title ? `Ảnh bìa ${track.title}` : 'Ảnh bìa bài nhạc'}
              className={`h-full w-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
          </div>
        </div>
      )}

      <div className="flex w-full flex-col gap-y-3">
        {track.title && (
          <div className="flex items-center justify-center gap-2 px-1">
            <h3
              className="truncate text-center text-sm font-bold text-white"
              aria-live="polite"
              title={track.title}
            >
              {track.title}
            </h3>
            {isPlaying && (
              <div className="flex h-3 items-end gap-[2px] opacity-90 shrink-0" aria-hidden="true">
                <span className="w-[3px] rounded-t-sm bg-[#00F5FF] music-eq-1" />
                <span className="w-[3px] rounded-t-sm bg-[#38bdf8] music-eq-2" />
                <span className="w-[3px] rounded-t-sm bg-[#b84dff] music-eq-3" />
              </div>
            )}
          </div>
        )}

        {hasPlaylist && (
          <p className="text-center text-[11px] font-mono font-medium text-cyan-200/60 uppercase tracking-widest">
            Bài {position + 1} / {tracks.length}
          </p>
        )}

        {/* Scrubbable Neon Progress Bar */}
        <div className="flex flex-col gap-y-1">
          <div className="group relative flex h-6 items-center">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 shadow-inner"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00F5FF] via-[#38bdf8] to-[#b84dff] shadow-[0_0_10px_rgba(0,245,255,0.55)] transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progress}
              disabled={duration <= 0}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="Tiến độ phát nhạc"
              aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:opacity-0 group-hover:[&::-moz-range-thumb]:opacity-100 [&::-moz-range-thumb]:transition-opacity [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.85)] [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:transition-opacity"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider tabular-nums text-white/55">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="mx-auto flex max-w-full items-center justify-center gap-1 rounded-[1.25rem] bg-white/[0.04] p-2 shadow-inner border border-white/10">
          <button
            type="button"
            aria-label="Phát ngẫu nhiên"
            title={
              hasPlaylist
                ? 'Phát một bài ngẫu nhiên khác'
                : 'Phát ngẫu nhiên cần ít nhất hai bài nhạc'
            }
            disabled={!hasPlaylist}
            onClick={playRandomTrack}
            className={controlClassName}
          >
            <Shuffle className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Bài trước"
            title={hasPlaylist ? 'Bài trước' : 'Danh sách hiện chỉ có một bài nhạc'}
            disabled={!hasPlaylist}
            onClick={() => skipTrack(-1)}
            className={controlClassName}
          >
            <SkipBack className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="px-1">
            <button
              type="button"
              aria-label={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
              title={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
              onClick={() => {
                cancelInteractionAutoplay();
                const audio = audioRef.current;
                if (!audio) return;
                if (audio.paused) {
                  void playAudio(audio);
                } else {
                  playRequest.current += 1;
                  audio.pause();
                }
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#00F5FF] via-[#38bdf8] to-[#b84dff] text-slate-950 shadow-[0_0_18px_rgba(0,245,255,0.45)] hover:shadow-[0_0_28px_rgba(0,245,255,0.7)] hover:scale-105 active:scale-95 transition-[transform,box-shadow] duration-150 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" aria-hidden="true" />
              )}
            </button>
          </div>

          <button
            type="button"
            aria-label="Bài tiếp theo"
            title={hasPlaylist ? 'Bài tiếp theo' : 'Danh sách hiện chỉ có một bài nhạc'}
            disabled={!hasPlaylist}
            onClick={() => skipTrack(1)}
            className={controlClassName}
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Lặp bài nhạc"
            title={`${isRepeat ? 'Tắt' : 'Bật'} lặp bài đang nghe`}
            aria-pressed={isRepeat}
            onClick={() => setIsRepeat((repeat) => !repeat)}
            className={`${controlClassName} ${
              isRepeat
                ? 'text-[#00F5FF] bg-[#00F5FF]/15 hover:text-[#67f9ff] hover:bg-[#00F5FF]/20'
                : ''
            }`}
          >
            <Repeat1 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Status & Volume Footer */}
        <div className="flex items-center justify-between px-1 text-xs text-white/60">
          <p role="status">Lặp bài nhạc: {isRepeat ? 'Bật' : 'Tắt'}</p>

          <div
            className="relative flex items-center gap-1.5"
            onMouseEnter={() => setIsVolumeOpen(true)}
            onMouseLeave={() => setIsVolumeOpen(false)}
          >
            <div
              className={`overflow-hidden flex items-center transition-[width,opacity] duration-200 ${
                isVolumeOpen ? 'w-[68px] opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted || globalMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                aria-label="Âm lượng nhạc nền"
                className="h-1 w-[64px] cursor-pointer appearance-none rounded-full bg-white/20 accent-[#00F5FF] focus:outline-none"
              />
            </div>

            <button
              type="button"
              aria-label={isMuted || globalMuted ? 'Bật âm lượng nhạc' : 'Tắt âm lượng nhạc'}
              title={`Âm lượng: ${Math.round((isMuted || globalMuted ? 0 : volume) * 100)}%`}
              onClick={() => {
                if (!isVolumeOpen) {
                  setIsVolumeOpen(true);
                } else {
                  toggleMute();
                }
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || globalMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-rose-400" aria-hidden="true" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-4 w-4 text-[#00F5FF]" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4 text-[#00F5FF]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-center text-xs text-rose-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  cover,
  title,
  playlist,
  autoPlay,
  defaultShuffle,
}) => {
  const tracks = playlist?.length ? playlist : src ? [{ src, cover, title }] : [];
  const playableTracks = tracks.filter((track) => track.src.trim());

  if (playableTracks.length === 0) return null;

  return (
    <PlaylistPlayer
      key={JSON.stringify(playableTracks.map((track) => track.src))}
      tracks={playableTracks}
      autoPlay={autoPlay}
      defaultShuffle={defaultShuffle}
    />
  );
};
