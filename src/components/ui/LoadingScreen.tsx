import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useHeritageStore } from '../../store/useHeritageStore';
import { Monitor, Sparkles, AlertTriangle } from 'lucide-react';

interface LoadingScreenProps {
  onEnter: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onEnter }) => {
  const { progress, active } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const { isLocked } = useHeritageStore();

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
    const target = active ? Math.max(progress, 30) : 100;
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
    }, 30);

    return () => window.clearInterval(timer);
  }, [progress, active]);

  const handleEnterClick = () => {
    if (!isReady) return;
    setHasEntered(true);
    onEnter();
  };

  if (hasEntered || (isLocked && isReady)) {
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070a]/95 backdrop-blur-xl transition-opacity duration-500 select-none">
      <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto px-6 text-center animate-panel-in">
        {/* Title */}
        <h1 className="text-2xl md:text-[32px] font-extrabold tracking-tight text-white mb-3 whitespace-nowrap leading-tight">
          Phòng Truyền Thống TechTonic
        </h1>
        <p className="text-sm md:text-base text-slate-300 mb-7 max-w-lg leading-relaxed">
          Trường Đại học Kinh tế - Đại học Đà Nẵng • Dream it - Code it. Khám phá hành trình, giá trị cốt lõi và thành tựu TechTonic Club trong không gian 3D.
        </p>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-label="Tiến độ tải không gian 3D"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={roundedProgress}
          className="w-full max-w-md bg-slate-900/90 rounded-full h-2.5 p-0.5 border border-white/10 mb-3 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-tech-cyan transition-all duration-200 ease-out"
            style={{ width: `${roundedProgress}%` }}
          />
        </div>
        <div className="flex justify-between w-full max-w-md text-xs font-mono text-slate-300 mb-7 tabular-nums">
          <span>
            {roundedProgress >= 100
              ? 'Không gian 3D đã sẵn sàng'
              : 'Đang khởi tạo mô hình & ánh sáng 3D...'}
          </span>
          <span className="text-tech-cyan font-bold">{roundedProgress}%</span>
        </div>

        {/* Mandatory User Requirement Notice */}
        <div className="glass-panel p-4 rounded-xl text-left mb-7 max-w-lg">
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
          className={`px-8 py-3.5 rounded-xl font-semibold tracking-wide transition-colors duration-200 flex items-center justify-center space-x-2.5 text-sm md:text-base whitespace-nowrap ${
            isReady
              ? 'bg-tech-cyan text-slate-950 hover:bg-[#33f3ff] cursor-pointer'
              : 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Bước Vào Phòng Truyền Thống</span>
        </button>

        <p className="text-xs text-slate-300 mt-5">
          W A S D để di chuyển • Chuột để nhìn 360° • E hoặc Chuột trái để tương tác • ESC mở chuột
        </p>
      </div>
    </div>
  );
};
