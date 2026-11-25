import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useHeritageStore } from '../../store/useHeritageStore';
import { Monitor, Sparkles, AlertTriangle, Eye, Layers, Users } from 'lucide-react';

interface LoadingScreenProps {
  onEnter: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onEnter }) => {
  const { progress, active } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const {
    hasEntered: storeHasEntered,
    isLocked,
    totalVisits,
    exhibitItems,
    executiveMembers,
  } = useHeritageStore();

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024 || 'ontouchstart' in window;
      setIsMobileDevice(isMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const target = active ? Math.max(progress, 32) : 100;
    const timer = window.setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= target) {
          if (target >= 100) {
            setIsReady(true);
          }
          return target;
        }
        return Math.min(prev + 10, target);
      });
    }, 28);

    return () => window.clearInterval(timer);
  }, [progress, active]);

  const handleEnterClick = () => {
    if (!isReady || isExiting) return;
    setIsExiting(true);
    onEnter();
    window.setTimeout(() => {
      setHasEntered(true);
    }, 360);
  };

  if (hasEntered || (storeHasEntered && !isExiting) || (isLocked && isReady)) {
    return null;
  }

  if (isMobileDevice) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070a] p-6 text-center select-none">
        <AlertTriangle className="w-10 h-10 mb-4 text-amber-400" aria-hidden="true" />
        <h1 className="text-xl font-bold text-white mb-2.5 tracking-tight">
          Yêu Cầu Thiết Bị Máy Tính (Desktop Only)
        </h1>
        <p className="text-sm text-slate-300 max-w-md leading-relaxed mb-5">
          Không gian 3D Phòng Truyền Thống TechTonic sử dụng cơ chế điều khiển góc nhìn thứ nhất (FPS 360° với phím WASD và chuột máy tính) và chỉ hỗ trợ trải nghiệm trên máy tính để bàn hoặc laptop.
        </p>
        <p className="px-4 py-3 bg-[#0d121d] rounded-xl text-xs text-slate-300">
          Vui lòng mở lại trang web này trên trình duyệt máy tính của bạn.
        </p>
      </div>
    );
  }

  const roundedProgress = Math.round(displayProgress);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050811]/95 loading-grid-bg backdrop-blur-xl transition-all duration-300 select-none ${
        isExiting ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle architectural ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(0,240,255,0.12),transparent_56%)]"
      />

      <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto px-6 text-center animate-panel-in">
        {/* Official Club Crest Badge */}
        <div className="mb-5 px-4 py-2 rounded-2xl glass-panel border border-tech-cyan/30 flex items-center gap-3">
          <img
            src="/assets/techtonic-logo.svg"
            alt="TechTonic Club"
            className="h-9 w-auto object-contain"
          />
          <div className="text-left border-l border-white/15 pl-3">
            <div className="text-[11px] font-mono uppercase tracking-widest text-tech-cyan">
              DUE • HỘI SINH VIÊN
            </div>
            <div className="text-xs text-slate-200 font-medium">
              Triển lãm 3D tương tác thế hệ mới
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-[36px] font-extrabold tracking-tight text-white mb-3 whitespace-nowrap leading-tight">
          Phòng Truyền Thống TechTonic
        </h1>
        <p className="text-sm md:text-base text-slate-300 mb-6 max-w-xl leading-relaxed">
          Trường Đại học Kinh tế - Đại học Đà Nẵng • Dream it - Code it. Trải nghiệm không gian bảo tàng 3D sống động lưu giữ hành trình, con người và thành tựu của TechTonic Club.
        </p>

        {/* Live Telemetry Strip */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-md mb-6">
          <div className="glass-panel rounded-xl px-3 py-2.5 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Eye className="w-3.5 h-3.5 text-tech-cyan" aria-hidden="true" />
              <span>Lượt ghé</span>
            </div>
            <div className="text-base font-bold text-white tabular-nums mt-0.5">{totalVisits}</div>
          </div>
          <div className="glass-panel rounded-xl px-3 py-2.5 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Layers className="w-3.5 h-3.5 text-tech-cyan" aria-hidden="true" />
              <span>Hiện vật 3D</span>
            </div>
            <div className="text-base font-bold text-white tabular-nums mt-0.5">
              {exhibitItems.length}+
            </div>
          </div>
          <div className="glass-panel rounded-xl px-3 py-2.5 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Users className="w-3.5 h-3.5 text-tech-cyan" aria-hidden="true" />
              <span>Nhân sự</span>
            </div>
            <div className="text-base font-bold text-white tabular-nums mt-0.5">
              {executiveMembers.length}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-label="Tiến độ tải không gian 3D"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={roundedProgress}
          className="w-full max-w-md bg-slate-900/90 rounded-full h-2.5 p-0.5 border border-white/15 mb-2.5 overflow-hidden"
        >
          <div
            className="relative h-full rounded-full bg-tech-cyan transition-all duration-200 ease-out overflow-hidden progress-shimmer"
            style={{ width: `${roundedProgress}%` }}
          />
        </div>
        <div className="flex justify-between w-full max-w-md text-xs font-mono text-slate-300 mb-6 tabular-nums">
          <span>
            {roundedProgress >= 100
              ? 'Ánh sáng, phản chiếu & mô hình 3D đã sẵn sàng'
              : 'Đang khởi tạo ánh sáng sân khấu & không gian 3D...'}
          </span>
          <span className="text-tech-cyan font-bold">{roundedProgress}%</span>
        </div>

        {/* Mandatory User Requirement Notice */}
        <div className="glass-panel p-4 rounded-xl text-left mb-6 max-w-lg border border-tech-cyan/20">
          <div className="flex items-start space-x-3">
            <Monitor className="w-5 h-5 text-tech-cyan shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
              Để có trải nghiệm tốt nhất, vui lòng giảm độ tương phản màn hình và sử dụng máy tính. Website chỉ tương thích với máy tính.
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handleEnterClick}
          disabled={!isReady}
          className={`px-8 py-3.5 rounded-xl font-semibold tracking-wide transition-all duration-200 flex items-center justify-center space-x-2.5 text-sm md:text-base whitespace-nowrap ${
            isReady
              ? 'bg-tech-cyan text-slate-950 hover:bg-[#33f3ff] hover:scale-[1.015] active:scale-[0.99] cursor-pointer shadow-[0_8px_28px_rgba(0,240,255,0.28)]'
              : 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Bước Vào Phòng Truyền Thống</span>
        </button>

        <p className="text-xs text-slate-300 mt-5">
          W A S D di chuyển • Giữ kéo chuột xoay 360° • Click hoặc E tương tác • Phím 1–8 lướt nhanh • M mở sơ đồ
        </p>
      </div>
    </div>
  );
};
