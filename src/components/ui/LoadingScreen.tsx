import React, { useCallback, useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useShallow } from 'zustand/react/shallow';
import { useHeritageStore } from '../../store/useHeritageStore';
import { preloadMuseumAssets } from '../../utils/assetPreloader';
import {
  Monitor,
  Sparkles,
  AlertTriangle,
  Eye,
  Layers,
  Users,
  ArrowRight,
  Compass,
  Trophy,
  Box,
  Film,
  MousePointerClick,
  Move,
  Map as MapIcon,
  Keyboard,
} from 'lucide-react';

interface LoadingScreenProps {
  onEnter: () => void;
}

const EXHIBITION_HIGHLIGHTS = [
  {
    icon: Trophy,
    title: 'Đảo Vinh Danh 360°',
    desc: 'Cúp OLP–ICPC, NCKH & biểu tượng CLB',
    color: 'text-amber-300',
    border: 'border-amber-400/25',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Users,
    title: '5 Ban Chuyên Trách',
    desc: 'Tứ Linh Thần Thú 3D, chân dung & lời chia sẻ',
    color: 'text-fuchsia-300',
    border: 'border-fuchsia-400/25',
    bg: 'bg-fuchsia-400/10',
  },
  {
    icon: Box,
    title: '37 Bục Ảnh & 4 Tủ Kính',
    desc: 'Website, Facebook, Drive & Live Puzzle',
    color: 'text-tech-cyan',
    border: 'border-tech-cyan/25',
    bg: 'bg-tech-cyan/10',
  },
  {
    icon: Film,
    title: 'Rạp Phim & Nhạc Nền',
    desc: 'Phim hành trình 3D & playlist TechTonic',
    color: 'text-emerald-300',
    border: 'border-emerald-400/25',
    bg: 'bg-emerald-400/10',
  },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onEnter }) => {
  const { progress, active } = useProgress();
  const [assetRatio, setAssetRatio] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const {
    hasEntered: storeHasEntered,
    isLocked,
    totalVisits,
    exhibitItemsCount,
    executiveMembersCount,
    sceneWarmupProgress,
  } = useHeritageStore(
    useShallow((s) => ({
      hasEntered: s.hasEntered,
      isLocked: s.isLocked,
      totalVisits: s.totalVisits,
      exhibitItemsCount: s.exhibitItems.length,
      executiveMembersCount: s.executiveMembers.length,
      sceneWarmupProgress: s.sceneWarmupProgress,
    }))
  );

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024 || 'ontouchstart' in window;
      setIsMobileDevice(isMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Phase 1: Concurrently preload & decode all gallery images + 4 GLB beasts into RAM
  useEffect(() => {
    if (isMobileDevice) return;
    let activeRun = true;
    void preloadMuseumAssets((ratio) => {
      if (activeRun) setAssetRatio(ratio);
    }, 5200);
    return () => {
      activeRun = false;
    };
  }, [isMobileDevice]);

  // Phase 2: Combine real image decode progress (0..62%) + real WebGL shader & GPU warmup (62..100%)
  useEffect(() => {
    const dreiRatio = active ? Math.min(1, progress / 100) : 1;
    const warmupRatio = Math.min(1, sceneWarmupProgress / 100);
    const combinedTarget = Math.round(assetRatio * 62 + warmupRatio * 30 + dreiRatio * 8);

    const timer = window.setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= combinedTarget) {
          if (combinedTarget >= 100 && assetRatio >= 1 && sceneWarmupProgress >= 100) {
            setIsReady(true);
          }
          return combinedTarget;
        }
        return Math.min(prev + 3, combinedTarget);
      });
    }, 24);

    return () => window.clearInterval(timer);
  }, [progress, active, assetRatio, sceneWarmupProgress]);

  const handleEnterClick = useCallback(() => {
    if (!isReady || isExiting) return;
    setIsExiting(true);
    onEnter();
    window.setTimeout(() => {
      setHasEntered(true);
    }, 360);
  }, [isReady, isExiting, onEnter]);

  // Allow pressing Enter when 3D scene is ready
  useEffect(() => {
    if (!isReady || isExiting || hasEntered || storeHasEntered || isMobileDevice) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEnterClick();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isReady, isExiting, hasEntered, storeHasEntered, isMobileDevice, handleEnterClick]);

  if (hasEntered || (storeHasEntered && !isExiting) || (isLocked && isReady)) {
    return null;
  }

  if (isMobileDevice) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#02050c] p-6 text-center select-none overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,245,255,0.12),transparent_55%)]"
        />
        <div className="relative z-10 max-w-md w-full glass-panel-glow rounded-2xl p-6 border border-tech-cyan/30">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-400" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2.5 tracking-tight">
            Yêu Cầu Thiết Bị Máy Tính (Desktop Only)
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            Không gian 3D Phòng Truyền Thống TechTonic sử dụng cơ chế điều khiển góc nhìn thứ nhất (FPS 360° với phím WASD và chuột máy tính) và chỉ hỗ trợ trải nghiệm trên máy tính để bàn hoặc laptop.
          </p>
          <p className="px-4 py-3 bg-[#091224] border border-white/10 rounded-xl text-xs text-slate-300">
            Vui lòng mở lại trang web này trên trình duyệt máy tính của bạn.
          </p>
        </div>
      </div>
    );
  }

  const roundedProgress = Math.round(displayProgress);
  const total3DExhibitsCount = Math.max(41, exhibitItemsCount + 37);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#02040a] transition-[transform,opacity] duration-300 ease-out select-none overflow-hidden ${
        isExiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Layered Cosmic Architectural Background (Zero-cost GPU gradients + masked blueprint grid + slow orbital rings) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 loading-grid-bg opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_26%,rgba(0,245,255,0.14),transparent_46%),radial-gradient(circle_at_82%_74%,rgba(168,85,247,0.14),transparent_48%),radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.09),transparent_42%)]" />

        {/* Subtle slow-orbiting architectural blueprint rings */}
        <div className="portal-orbit-cw will-change-transform absolute left-1/2 top-1/2 w-[780px] h-[780px] rounded-full border border-dashed border-tech-cyan/[0.08]" />
        <div className="portal-orbit-ccw will-change-transform absolute left-1/2 top-1/2 w-[1080px] h-[1080px] rounded-full border border-fuchsia-400/[0.06]" />
      </div>

      {/* 2. Top Subtle Exhibition Masthead Strip */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-10 pt-5 flex items-center justify-between text-[11px] font-mono tracking-wider text-slate-400">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-2 w-2 rounded-full bg-tech-cyan shadow-[0_0_8px_#00F5FF]" />
          <span className="text-slate-300 font-semibold">TECHTONIC HERITAGE ARCHIVE</span>
          <span className="hidden sm:inline text-slate-600">/</span>
          <span className="hidden sm:inline text-slate-400">EST. 07/2024</span>
        </div>
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-tech-cyan/80" aria-hidden="true" />
          <span>DUE • ĐẠI HỌC ĐÀ NẴNG</span>
        </div>
      </header>

      {/* 3. Main 2-Column Cyber-Museum Entrance Pavilion */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-10 my-auto py-4">
        <div className="relative rounded-3xl border border-tech-cyan/25 bg-gradient-to-br from-[#070f20]/90 via-[#040915]/94 to-[#080d1e]/92 backdrop-blur-md shadow-[0_28px_80px_rgba(0,0,0,0.82),0_0_40px_rgba(0,245,255,0.08)] overflow-hidden animate-panel-in">
          {/* Top prismatic neon hairline edge */}
          <div
            aria-hidden="true"
            className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00F5FF] to-[#c026d3]"
          />

          {/* Crisp architectural corner reticles */}
          <span aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3.5 w-3.5 h-3.5 border-t border-l border-tech-cyan/60" />
          <span aria-hidden="true" className="pointer-events-none absolute top-3.5 right-3.5 w-3.5 h-3.5 border-t border-r border-fuchsia-400/60" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-3.5 left-3.5 w-3.5 h-3.5 border-b border-l border-tech-cyan/40" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-3.5 right-3.5 w-3.5 h-3.5 border-b border-r border-fuchsia-400/40" />

          <div className="grid grid-cols-1 lg:grid-cols-[1.18fr_0.82fr] gap-7 lg:gap-9 p-7 lg:p-10 items-center">
            {/* LEFT COLUMN: Brand Identity, Editorial Title, Live Metrics & Entry Dock */}
            <div className="flex flex-col text-left">
              {/* Official Club Crest Pill */}
              <div className="inline-flex items-center gap-3 self-start px-3.5 py-2 rounded-2xl bg-[#091326]/90 border border-tech-cyan/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] mb-5">
                <img
                  src="/assets/techtonic-logo.svg"
                  alt="TechTonic Club"
                  className="h-8 w-auto object-contain"
                />
                <div className="border-l border-white/15 pl-3">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-tech-cyan">
                    DUE • HỘI SINH VIÊN
                  </div>
                  <div className="text-xs text-slate-200 font-medium">
                    Triển lãm 3D tương tác thế hệ mới
                  </div>
                </div>
              </div>

              {/* Hero Display Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-[1.1] mb-3 text-balance">
                Phòng Truyền Thống
                <span className="block text-tech-cyan mt-0.5">
                  TechTonic Club
                </span>
              </h1>

              <p className="text-sm lg:text-[15px] text-slate-300/95 leading-relaxed max-w-xl mb-6 text-pretty">
                Trường Đại học Kinh tế - Đại học Đà Nẵng •{' '}
                <span className="text-tech-cyan font-semibold">Dream it – Code it.</span> Khám phá
                không gian bảo tàng 3D sống động lưu giữ hành trình, con người, dự án và dấu ấn của
                các thế hệ TechTonic.
              </p>

              {/* Live Telemetry Cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="relative rounded-2xl bg-[#060d1c]/90 border border-tech-cyan/20 px-4 py-3 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-tech-cyan/80 to-transparent" />
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <Eye className="w-3.5 h-3.5 text-tech-cyan shrink-0" aria-hidden="true" />
                    <span>Lượt ghé</span>
                  </div>
                  <div className="text-xl font-extrabold text-white tabular-nums mt-1">
                    {totalVisits}
                  </div>
                </div>

                <div className="relative rounded-2xl bg-[#060d1c]/90 border border-fuchsia-400/20 px-4 py-3 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-fuchsia-400/80 to-transparent" />
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <Layers className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" aria-hidden="true" />
                    <span>Hiện vật 3D</span>
                  </div>
                  <div className="text-xl font-extrabold text-white tabular-nums mt-1">
                    {total3DExhibitsCount}+
                  </div>
                </div>

                <div className="relative rounded-2xl bg-[#060d1c]/90 border border-emerald-400/20 px-4 py-3 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400/80 to-transparent" />
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>Nhân sự</span>
                  </div>
                  <div className="text-xl font-extrabold text-white tabular-nums mt-1">
                    {executiveMembersCount}+
                  </div>
                </div>
              </div>

              {/* Illuminated Progress Bar + Status */}
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs font-mono mb-2 tabular-nums">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        isReady
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : 'bg-tech-cyan animate-pulse shadow-[0_0_8px_#00F5FF]'
                      }`}
                    />
                    {isReady
                      ? 'Sẵn sàng! Không gian 3D, Tứ Linh Thần Thú & 37+ tư liệu đã tối ưu'
                      : roundedProgress < 40
                      ? 'Đang tải & giải mã 37 ảnh tư liệu và kết cấu PBR...'
                      : roundedProgress < 75
                      ? 'Đang khởi tạo Tứ Linh Thần Thú 3D & 4 Tủ kính hệ sinh thái...'
                      : 'Đang biên dịch Shader WebGL & tối ưu mượt 60 FPS...'}
                  </span>
                  <span className="text-tech-cyan font-bold">{roundedProgress}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Tiến độ tải không gian 3D"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={roundedProgress}
                  className="w-full bg-[#040914] rounded-full h-2.5 p-[2px] border border-tech-cyan/25 overflow-hidden shadow-inner"
                >
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-[#00F5FF] via-[#38bdf8] to-[#c026d3] transition-[width] duration-200 ease-out overflow-hidden progress-shimmer shadow-[0_0_16px_rgba(0,245,255,0.65)]"
                    style={{ width: `${roundedProgress}%` }}
                  />
                </div>
              </div>

              {/* Primary CTA Button */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleEnterClick}
                  disabled={!isReady}
                  className={`group relative overflow-hidden px-7 py-3.5 rounded-2xl font-bold tracking-wide transition-[transform,filter,background-color,box-shadow] duration-200 inline-flex items-center justify-center gap-2.5 text-sm lg:text-[15px] whitespace-nowrap ${
                    isReady
                      ? 'bg-gradient-to-r from-[#00F5FF] via-[#38bdf8] to-[#60a5fa] text-slate-950 hover:brightness-110 hover:scale-[1.015] active:scale-[0.98] cursor-pointer shadow-[0_10px_34px_rgba(0,245,255,0.34),inset_0_1px_0_rgba(255,255,255,0.65)]'
                      : 'bg-[#0b1528] border border-tech-cyan/25 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Sparkles
                    className={`w-[18px] h-[18px] shrink-0 ${isReady ? 'text-slate-950' : 'text-tech-cyan animate-pulse'}`}
                    aria-hidden="true"
                  />
                  <span>
                    {isReady
                      ? 'Bước Vào Phòng Truyền Thống'
                      : `Đang tải không gian 3D (${roundedProgress}%)`}
                  </span>
                  {isReady && (
                    <ArrowRight
                      className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  )}
                </button>

                {isReady && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    hoặc nhấn
                    <kbd className="keycap-chip px-2 py-0.5 rounded-md text-[11px] text-tech-cyan font-semibold">
                      Enter
                    </kbd>
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Exhibition Highlights, Keycap Controls & Mandatory Desktop Notice */}
            <div className="flex flex-col gap-4 rounded-2xl bg-[#040a17]/85 border border-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              {/* Highlights Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-tech-cyan">
                  Điểm nhấn triển lãm 3D
                </span>
                <span className="text-[11px] font-mono text-slate-400">8 phân khu</span>
              </div>

              {/* 2x2 Feature Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {EXHIBITION_HIGHLIGHTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-xl bg-[#081224]/90 border border-white/[0.08] p-3 hover:border-tech-cyan/30 transition-colors"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg ${item.bg} border ${item.border} flex items-center justify-center mb-2`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${item.color}`} aria-hidden="true" />
                      </div>
                      <div className="text-xs font-bold text-white leading-snug">{item.title}</div>
                      <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tactile Controls Keycaps */}
              <div className="rounded-xl bg-[#071020]/90 border border-white/[0.08] p-3.5 space-y-2.5">
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-tech-cyan" aria-hidden="true" />
                  <span>Điều khiển nhanh</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <kbd className="keycap-chip px-1.5 py-0.5 rounded text-[10px] font-mono text-tech-cyan font-semibold shrink-0">
                      WASD
                    </kbd>
                    <span className="flex items-center gap-1 truncate">
                      <Move className="w-3 h-3 text-slate-500 shrink-0" aria-hidden="true" />
                      Di chuyển
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="keycap-chip px-1.5 py-0.5 rounded text-[10px] font-mono text-tech-cyan font-semibold shrink-0">
                      Kéo chuột
                    </kbd>
                    <span className="truncate">Xoay 360°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="keycap-chip px-1.5 py-0.5 rounded text-[10px] font-mono text-fuchsia-300 font-semibold shrink-0">
                      Click / E
                    </kbd>
                    <span className="flex items-center gap-1 truncate">
                      <MousePointerClick className="w-3 h-3 text-slate-500 shrink-0" aria-hidden="true" />
                      Tương tác
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="keycap-chip px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-300 font-semibold shrink-0">
                      1–8 / M
                    </kbd>
                    <span className="flex items-center gap-1 truncate">
                      <MapIcon className="w-3 h-3 text-slate-500 shrink-0" aria-hidden="true" />
                      Lướt & Sơ đồ
                    </span>
                  </div>
                </div>
              </div>

              {/* Mandatory Desktop Notice (Sleek Grounded Callout) */}
              <div className="rounded-xl bg-gradient-to-r from-tech-cyan/[0.08] via-[#081326]/90 to-fuchsia-500/[0.06] border border-tech-cyan/25 px-3.5 py-3">
                <div className="flex items-start gap-2.5">
                  <Monitor className="w-4 h-4 text-tech-cyan shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-[11.5px] text-slate-200/95 leading-relaxed text-pretty">
                    Để có trải nghiệm tốt nhất, vui lòng giảm độ tương phản màn hình và sử dụng máy
                    tính. Website chỉ tương thích với máy tính.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Subtle Status Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-10 pb-4 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>TECHTONIC CLUB • KHOA HỆ THỐNG THÔNG TIN QUẢN LÝ</span>
        <span className="hidden sm:inline text-slate-400">
          Study Hard – Play Harder • 3D WebGL Experience
        </span>
      </footer>
    </div>
  );
};
