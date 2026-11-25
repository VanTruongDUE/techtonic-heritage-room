import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { CLUB_PROFILE } from '../../../data/heritageSeed';
import { useReducedMotionPreference } from '../Effects/AmbientMotion';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import type { ExhibitItem, HoverPreview } from '../../../types/heritage';

const JOURNEY_VIDEO_URL = '/assets/videos/techtonic-journey.mp4';

const MISSION_EXHIBIT: ExhibitItem = {
  id: 'mission-statement',
  title: 'Tầm Nhìn, Sứ Mệnh & Bản Sắc TechTonic Club',
  category: 'history',
  year: 'Thành lập 01/07/2024',
  highlight: `${CLUB_PROFILE.slogan} • ${CLUB_PROFILE.spirit}`,
  description: `${CLUB_PROFILE.affiliation}. Tầm nhìn: ${CLUB_PROFILE.vision} Sứ mệnh: ${CLUB_PROFILE.mission}`,
  metrics: CLUB_PROFILE.metrics,
  bullets: [
    'Lợi ích 1 — Anh chị tốt: Kết nối thế hệ trước & sau định hướng nghề nghiệp',
    'Lợi ích 2 — Cơ sở học thuật tốt: Tài liệu, phương pháp & khóa chia sẻ thực chiến',
    'Lợi ích 3 — Bạn bè cùng chí hướng: Đồng hành & sẻ chia trong học tập lẫn cuộc sống',
  ],
};

const MISSION_PREVIEW: HoverPreview = {
  title: 'Tầm Nhìn & Sứ Mệnh TechTonic Club',
  badge: 'DUE ĐÀ NẴNG • DREAM IT - CODE IT',
  summary: CLUB_PROFILE.vision,
  bullets: [
    '5 trụ cột sứ mệnh: Học thuật • Kết nối • Phát triển • Trải nghiệm • Chân thành',
    'Tinh thần sinh hoạt: Study Hard - Play Harder',
    'Ra mắt chính thức: 09/04/2025 (khởi xướng từ 01/07/2024)',
  ],
  actionLabel: 'Xem tuyên ngôn & 3 lợi ích cốt lõi',
};

const PLAY_CONSOLE_PREVIEW: HoverPreview = {
  title: 'Phim Hành Trình TechTonic Club',
  badge: 'GIANT 3D CINEMA TV • FULL HD',
  summary:
    'Biến bảng Dream it - Code it thành màn hình TV 3D khổng lồ và phát thước phim nhìn lại những dấu ấn TechTonic đã đi qua.',
  bullets: [
    'Tự động đưa góc nhìn về hàng ghế chính diện rạp chiếu 3D',
    'Dịu ánh sáng phòng triển lãm để thưởng thức trọn vẹn thước phim',
  ],
  actionLabel: 'Phát video trên màn hình TV khổng lồ',
};

const SLAT_POSITIONS = [-6.95, -6.55, -6.15, 6.15, 6.55, 6.95];

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxW: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, y);
      line = w;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function buildPlayConsoleTexture(isPlaying: boolean, isHovered: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(1280, 148, 2);
  if (ctx) {
    ctx.clearRect(0, 0, 1280, 148);

    // Sleek dark-obsidian glass pill body (exact rounded capsule silhouette, zero boxy overflow)
    const bgGrad = ctx.createLinearGradient(0, 0, 1280, 148);
    if (isPlaying) {
      bgGrad.addColorStop(0, '#160920');
      bgGrad.addColorStop(0.5, '#240d34');
      bgGrad.addColorStop(1, '#160920');
    } else if (isHovered) {
      bgGrad.addColorStop(0, '#061a30');
      bgGrad.addColorStop(0.5, '#0b2c4c');
      bgGrad.addColorStop(1, '#061a30');
    } else {
      bgGrad.addColorStop(0, '#040a16');
      bgGrad.addColorStop(0.5, '#081529');
      bgGrad.addColorStop(1, '#040a16');
    }

    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(10, 10, 1260, 128, 64);
    ctx.fill();

    // Subtle top specular glass sheen
    const sheen = ctx.createLinearGradient(0, 10, 0, 74);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.roundRect(14, 12, 1252, 62, 60);
    ctx.fill();

    // Hair-thin silky luminous neon rim border
    const rimGrad = ctx.createLinearGradient(0, 0, 1280, 0);
    if (isPlaying) {
      rimGrad.addColorStop(0, 'rgba(244, 114, 182, 0.65)');
      rimGrad.addColorStop(0.5, '#fb7185');
      rimGrad.addColorStop(1, 'rgba(244, 114, 182, 0.65)');
    } else {
      rimGrad.addColorStop(0, 'rgba(0, 245, 255, 0.65)');
      rimGrad.addColorStop(0.5, isHovered ? '#80fbff' : '#00F5FF');
      rimGrad.addColorStop(1, 'rgba(184, 77, 255, 0.65)');
    }
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = isHovered ? 4.4 : 3.2;
    ctx.beginPath();
    ctx.roundRect(10, 10, 1260, 128, 64);
    ctx.stroke();

    // Jewel-like circular Play / Stop medallion on left
    const cx = 78;
    const cy = 74;
    const iconGrad = ctx.createRadialGradient(cx - 8, cy - 10, 4, cx, cy, 42);
    if (isPlaying) {
      iconGrad.addColorStop(0, '#fda4af');
      iconGrad.addColorStop(1, '#e11d48');
    } else {
      iconGrad.addColorStop(0, '#a5f3fc');
      iconGrad.addColorStop(1, '#00d4ff');
    }
    ctx.fillStyle = iconGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#040a14';
    if (isPlaying) {
      ctx.beginPath();
      ctx.roundRect(cx - 12, cy - 12, 24, 24, 5);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 15);
      ctx.lineTo(cx + 17, cy);
      ctx.lineTo(cx - 8, cy + 15);
      ctx.closePath();
      ctx.fill();
    }

    // Crisp single-line minimalist primary title
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 38px Inter, sans-serif';
    ctx.fillText(
      isPlaying ? 'ĐANG PHÁT PHIM HÀNH TRÌNH • NHẤN ĐỂ TẮT' : 'XEM HÀNH TRÌNH TECHTONIC',
      146,
      76
    );

    // Sleek minimalist right-side badge pill
    const badgeW = isPlaying ? 186 : 168;
    const badgeX = 1244 - badgeW;
    ctx.fillStyle = isPlaying ? 'rgba(251, 113, 133, 0.16)' : 'rgba(0, 240, 255, 0.14)';
    ctx.strokeStyle = isPlaying ? 'rgba(251, 113, 133, 0.55)' : 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(badgeX, 42, badgeW, 64, 32);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = isPlaying ? '#fecdd3' : '#7dd3fc';
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.fillText(isPlaying ? '● ON AIR' : 'TV 3D ▶', badgeX + badgeW / 2, 75);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}

export const CenterWall: React.FC = () => {
  const {
    setHoveringInteractive,
    openModal,
    activityHighlights,
    isCenterWallCinemaActive,
    isCinemaPaused,
    isCinemaMuted,
    cinemaSeekRequest,
    audioVolume,
    isMuted,
    startCenterWallCinema,
    stopCenterWallCinema,
    setCinemaProgress,
    clearCinemaSeek,
    pushToast,
  } = useHeritageStore();
  const reducedMotion = useReducedMotionPreference();
  const emblemRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const playBtnGroupRef = useRef<THREE.Group>(null);
  const [isEmblemHovered, setIsEmblemHovered] = useState(false);
  const [isPlayBtnHovered, setIsPlayBtnHovered] = useState(false);

  // True sculpted 3D capsule/pill chassis geometry (zero square corners sticking out!)
  const playPillGeom = useMemo(() => {
    const w = 3.12;
    const h = 0.35;
    const r = h / 2;
    const hw = w / 2 - r;
    const shape = new THREE.Shape();
    shape.absarc(-hw, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
    shape.lineTo(hw, -r);
    shape.absarc(hw, 0, r, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-hw, r);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 8,
      curveSegments: 32,
    });
    geom.center();
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Giant 3D Cinema TV HTMLVideoElement + THREE.VideoTexture state
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const [videoTex, setVideoTex] = useState<THREE.VideoTexture | null>(null);
  const [videoAspect, setVideoAspect] = useState<number>(16 / 9);
  const lastProgressReportRef = useRef<number>(0);

  // Create & manage HTML5 video stream only when Cinema TV mode is active
  useEffect(() => {
    if (!isCenterWallCinemaActive) {
      if (videoElRef.current) {
        videoElRef.current.pause();
        videoElRef.current.removeAttribute('src');
        videoElRef.current.load();
        videoElRef.current = null;
      }
      setVideoTex((prev) => {
        prev?.dispose();
        return null;
      });
      return;
    }

    const video = document.createElement('video');
    video.src = JOURNEY_VIDEO_URL;
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.preload = 'auto';
    video.loop = false;
    video.muted = useHeritageStore.getState().isCinemaMuted;
    video.volume = useHeritageStore.getState().isMuted
      ? 0
      : Math.max(0.25, useHeritageStore.getState().audioVolume);
    videoElRef.current = video;

    const handleLoadedMetadata = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoAspect(video.videoWidth / video.videoHeight);
      }
      setCinemaProgress(0, Number.isFinite(video.duration) ? video.duration : 0);
    };

    const handleEnded = () => {
      pushToast(
        'Đã phát xong thước phim hành trình TechTonic',
        'Cảm ơn bạn đã đồng hành cùng Phòng Truyền Thống 3D!',
        'success'
      );
      stopCenterWallCinema();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    setVideoTex(tex);

    // Start playback; if browser autoplay blocks with sound, retry muted cleanly
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.pause();
      video.removeAttribute('src');
      video.load();
      tex.dispose();
      videoElRef.current = null;
      setVideoTex(null);
    };
  }, [isCenterWallCinemaActive, setCinemaProgress, stopCenterWallCinema, pushToast]);

  // Sync Play/Pause state from HUD Cinema Controls
  useEffect(() => {
    const video = videoElRef.current;
    if (!video || !isCenterWallCinemaActive) return;
    if (isCinemaPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isCinemaPaused, isCenterWallCinemaActive]);

  // Sync Mute & Volume state
  useEffect(() => {
    const video = videoElRef.current;
    if (!video) return;
    video.muted = isCinemaMuted || isMuted;
    video.volume = isMuted ? 0 : Math.min(1, Math.max(0.15, audioVolume));
  }, [isCinemaMuted, isMuted, audioVolume]);

  // Handle Scrub / Seek requests from HUD Cinema Bar
  useEffect(() => {
    const video = videoElRef.current;
    if (!video || cinemaSeekRequest === null) return;
    try {
      video.currentTime = cinemaSeekRequest;
      setCinemaProgress(cinemaSeekRequest, Number.isFinite(video.duration) ? video.duration : 0);
    } catch {
      // Ignore transient seek before metadata ready
    }
    clearCinemaSeek();
  }, [cinemaSeekRequest, clearCinemaSeek, setCinemaProgress]);

  const { outerHexGeom, innerHexGeom } = useMemo(() => {
    const makeHexRing = (outerR: number, innerR: number, depth: number) => {
      const outer = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x = outerR * Math.cos(a);
        const y = outerR * Math.sin(a);
        if (i === 0) outer.moveTo(x, y);
        else outer.lineTo(x, y);
      }
      outer.closePath();

      const hole = new THREE.Path();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x = innerR * Math.cos(a);
        const y = innerR * Math.sin(a);
        if (i === 0) hole.moveTo(x, y);
        else hole.lineTo(x, y);
      }
      hole.closePath();
      outer.holes.push(hole);

      const geom = new THREE.ExtrudeGeometry(outer, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.015,
        bevelSegments: 6,
      });
      geom.center();
      geom.computeVertexNormals();
      return geom;
    };

    return {
      outerHexGeom: makeHexRing(0.68, 0.56, 0.06),
      innerHexGeom: makeHexRing(0.5, 0.42, 0.04),
    };
  }, []);

  // Detailed side-by-side Vision & Mission texture directly readable before clicking
  const textTexture = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(2048, 1024, 1.5);
    if (ctx) {
      ctx.clearRect(0, 0, 2048, 1024);

      ctx.fillStyle = '#00F5FF';
      ctx.font = 'bold 54px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '8px';
      ctx.fillText('DREAM IT - CODE IT', 1024, 298);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 30px Inter, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('KHƠI NGUỒN ĐAM MÊ • KIẾN TẠO TƯƠNG LAI CÔNG NGHỆ', 1024, 348);

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText(
        'HỘI SINH VIÊN TRƯỜNG ĐẠI HỌC KINH TẾ - ĐẠI HỌC ĐÀ NẴNG  •  RA MẮT 09/04/2025',
        1024,
        390
      );

      ctx.textAlign = 'left';

      // Left box: TẦM NHÌN (Dark-tech obsidian glass + electric cyan neon trim)
      ctx.fillStyle = 'rgba(7, 13, 27, 0.92)';
      ctx.fillRect(140, 424, 840, 250);
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.58)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(140, 424, 840, 250);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(140, 424, 840, 4);

      ctx.fillStyle = '#00F5FF';
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillText('TẦM NHÌN (VISION)', 174, 468);

      ctx.fillStyle = '#eef6ff';
      ctx.font = '400 23px Inter, sans-serif';
      drawWrappedText(ctx, CLUB_PROFILE.vision, 174, 514, 772, 34);

      // Right box: SỨ MỆNH (Dark-tech obsidian glass + electric cyber-violet trim)
      ctx.fillStyle = 'rgba(7, 13, 27, 0.92)';
      ctx.fillRect(1068, 424, 840, 250);
      ctx.strokeStyle = 'rgba(184, 77, 255, 0.58)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1068, 424, 840, 250);
      ctx.fillStyle = '#b84dff';
      ctx.fillRect(1068, 424, 840, 4);

      ctx.fillStyle = '#d896ff';
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillText('SỨ MỆNH (OUR MISSION)', 1102, 468);

      ctx.fillStyle = '#eef6ff';
      ctx.font = '400 21px Inter, sans-serif';
      drawWrappedText(ctx, CLUB_PROFILE.mission, 1102, 510, 772, 31);

      // Bottom keywords bar
      ctx.textAlign = 'center';
      ctx.fillStyle = '#67f9ff';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText(
        'STUDY HARD - PLAY HARDER   •   HỌC THUẬT  •  KẾT NỐI  •  PHÁT TRIỂN  •  TRẢI NGHIỆM  •  CHÂN THÀNH',
        1024,
        724
      );
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  // Crisp 3D Play Console Button Texture (mounted directly below Dream It - Code It!)
  const playConsoleTex = useMemo(
    () => buildPlayConsoleTexture(isCenterWallCinemaActive, isPlayBtnHovered),
    [isCenterWallCinemaActive, isPlayBtnHovered]
  );

  // Back-right wing panel (right of Dream It - Code It): 6 Key Term Events & Activities
  const eventsWingTexture = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(1520, 1100, 2);
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1520, 1100);

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.42)';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 1472, 1052);

      ctx.fillStyle = '#c084fc';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('CHUỖI SỰ KIỆN TRỌNG TÂM • MỖI NHIỆM KỲ', 68, 84);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('6 CHƯƠNG TRÌNH & SỰ KIỆN CLB', 68, 138);

      activityHighlights.slice(0, 6).forEach((ev, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 68 + col * 704;
        const y = 178 + row * 276;
        const w = 676;
        const h = 250;

        ctx.fillStyle = '#121b2e';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = ev.color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = ev.color;
        ctx.font = '600 17px "JetBrains Mono", monospace';
        ctx.fillText(`[ ${ev.tag} • ${ev.year} ]`, x + 24, y + 38);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 25px Inter, sans-serif';
        ctx.fillText(ev.title, x + 24, y + 76, w - 48);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 19px Inter, sans-serif';
        drawWrappedText(ctx, ev.summary, x + 24, y + 114, w - 48, 26);

        if (ev.goal) {
          ctx.fillStyle = '#7dd3fc';
          ctx.font = '500 17px Inter, sans-serif';
          ctx.fillText(`Mục tiêu: ${ev.goal}`, x + 24, y + h - 24, w - 48);
        }
      });

      ctx.fillStyle = '#e879f9';
      ctx.font = '500 21px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để xem chi tiết 6 sự kiện & lộ trình TechXplore', 68, 1034);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, [activityHighlights]);

  useEffect(() => {
    return () => {
      outerHexGeom.dispose();
      innerHexGeom.dispose();
      playPillGeom.dispose();
      textTexture.dispose();
      eventsWingTexture.dispose();
    };
  }, [outerHexGeom, innerHexGeom, playPillGeom, textTexture, eventsWingTexture]);

  useEffect(() => {
    return () => {
      playConsoleTex.dispose();
    };
  }, [playConsoleTex]);

  useFrame((state, delta) => {
    // Silky smooth spring scale on the slim 3D Play Pill Button
    if (playBtnGroupRef.current) {
      const targetS = isPlayBtnHovered ? 1.045 : 1.0;
      playBtnGroupRef.current.scale.lerp(
        new THREE.Vector3(targetS, targetS, targetS),
        1 - Math.exp(-12 * Math.min(delta, 0.05))
      );
    }

    if (!isCenterWallCinemaActive) {
      if (!reducedMotion && emblemRef.current) {
        emblemRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
        emblemRef.current.position.y = 5.05 + Math.sin(state.clock.elapsedTime * 1.1) * 0.03;
        const targetScale = isEmblemHovered ? 1.08 : 1;
        emblemRef.current.scale.lerp(
          new THREE.Vector3(targetScale, targetScale, targetScale),
          0.12
        );
      }
      if (!reducedMotion && haloRef.current) {
        haloRef.current.rotation.x += delta * 0.18;
        haloRef.current.rotation.y += delta * 0.24;
      }
    } else if (videoElRef.current) {
      const now = state.clock.elapsedTime;
      if (now - lastProgressReportRef.current > 0.25) {
        const v = videoElRef.current;
        setCinemaProgress(v.currentTime || 0, Number.isFinite(v.duration) ? v.duration : 0);
        lastProgressReportRef.current = now;
      }
    }
  });

  const eventsWingExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'center-events-wing',
      title: 'Chuỗi Hoạt Động Trọng Tâm & Sự Kiện CLB',
      category: 'activity',
      year: 'Mỗi nhiệm kỳ',
      highlight: '6 Sự Kiện Cố Định • Không Thu Phí Thành Viên',
      description:
        'Các chương trình kết nối tân sinh viên, tuyển thành viên TechXplore và chuỗi sự kiện gắn kết cộng đồng TechTonic Club.',
      bullets: activityHighlights.map(
        (a) =>
          `${a.title} (${a.tag}): ${a.summary}${a.goal ? ` — Mục tiêu: ${a.goal}.` : ''}${
            a.audience ? ` Đối tượng: ${a.audience}.` : ''
          }`
      ),
    }),
    [activityHighlights]
  );

  const eventsWingPreview: HoverPreview = useMemo(
    () => ({
      title: 'Chuỗi 6 Sự Kiện Trọng Tâm',
      badge: 'TECHXPLORE • MENTOR-MENTEE • TECHWARE',
      summary: '6 chương trình hoạt động cố định mỗi nhiệm kỳ tại TechTonic Club.',
      bullets: activityHighlights.slice(0, 3).map((a) => `${a.title} (${a.tag})`),
      actionLabel: 'Xem chi tiết 6 sự kiện trọng tâm',
    }),
    [activityHighlights]
  );

  const handleOpenMission = () => openModal('exhibit', MISSION_EXHIBIT);
  const handleOpenEvents = () => openModal('exhibit', eventsWingExhibit);
  const handleToggleCinema = () => {
    if (isCenterWallCinemaActive) {
      stopCenterWallCinema();
    } else {
      startCenterWallCinema();
    }
  };

  // Compute aspect-locked Giant TV screen dimensions cleanly fitting inside the 13.4 x 5.05 cinema bezel
  const maxTvW = 13.4;
  const maxTvH = 5.02;
  let screenW = maxTvW;
  let screenH = screenW / Math.max(0.5, videoAspect);
  if (screenH > maxTvH) {
    screenH = maxTvH;
    screenW = screenH * videoAspect;
  }

  return (
    <group position={[0, 0, -18.42]}>
      {/* Main Back Wall Structural Frame / Giant TV Chassis */}
      <RoundedBox
        position={[0, 3.35, -0.05]}
        args={[14.6, 5.5, 0.14]}
        radius={0.04}
        smoothness={4}
        receiveShadow
      >
        <meshStandardMaterial
          color={isCenterWallCinemaActive ? '#05080f' : '#0e1524'}
          roughness={isCenterWallCinemaActive ? 0.25 : 0.42}
          metalness={isCenterWallCinemaActive ? 0.65 : 0.38}
        />
      </RoundedBox>

      {!isCenterWallCinemaActive &&
        SLAT_POSITIONS.map((sx) => (
          <RoundedBox
            key={`slat-${sx}`}
            position={[sx, 3.35, 0.05]}
            args={[0.16, 5.1, 0.1]}
            radius={0.02}
            smoothness={4}
            castShadow
          >
            <meshStandardMaterial color="#1c273d" roughness={0.5} metalness={0.3} />
          </RoundedBox>
        ))}

      {/* Top & Bottom Neon Bezel Bars (shift to royal cinema glow while TV is on) */}
      <mesh position={[0, 6.08, 0.04]}>
        <boxGeometry args={[14.4, 0.064, 0.085]} />
        <meshStandardMaterial
          color={isCenterWallCinemaActive ? '#fbbf24' : '#00F5FF'}
          emissive={isCenterWallCinemaActive ? '#f59e0b' : '#00F5FF'}
          emissiveIntensity={1.9}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.62, 0.04]}>
        <boxGeometry args={[14.4, 0.064, 0.085]} />
        <meshStandardMaterial
          color={isCenterWallCinemaActive ? '#00F5FF' : '#00e5ff'}
          emissive={isCenterWallCinemaActive ? '#00F5FF' : '#00e5ff'}
          emissiveIntensity={1.55}
          toneMapped={false}
        />
      </mesh>

      {/* ================= GIANT 3D CINEMA TV MODE ================= */}
      {isCenterWallCinemaActive ? (
        <group position={[0, 3.35, 0.05]}>
          {/* Ultra-Slim Brushed Titanium OLED TV Bezel Backing */}
          <RoundedBox position={[0, 0, -0.02]} args={[14.1, 5.34, 0.06]} radius={0.05} smoothness={4}>
            <meshStandardMaterial color="#070b14" metalness={0.85} roughness={0.22} />
          </RoundedBox>

          {/* True Aspect-Locked Live Video Screen Surface */}
          {videoTex && (
            <mesh position={[0, 0, 0.03]}>
              <planeGeometry args={[screenW, screenH]} />
              <meshBasicMaterial map={videoTex} toneMapped={false} />
            </mesh>
          )}

          {/* Subtle Red/Emerald Live ON-AIR Power LED on TV bottom-right corner */}
          <mesh position={[6.72, -2.56, 0.03]}>
            <circleGeometry args={[0.045, 24]} />
            <meshBasicMaterial color={isCinemaPaused ? '#fbbf24' : '#22c55e'} toneMapped={false} />
          </mesh>

          {/* Subtle Cinema Screen Bounce Light onto the Reflective Museum Floor */}
          <pointLight
            position={[0, -0.4, 3.2]}
            intensity={12}
            distance={14}
            decay={2}
            color="#bae6fd"
          />
        </group>
      ) : (
        <>
          {/* Wireframe Geometric Halo around Emblem */}
          <mesh ref={haloRef} position={[0, 5.05, 0.12]}>
            <icosahedronGeometry args={[0.88, 0]} />
            <meshBasicMaterial
              color="#38bdf8"
              wireframe
              transparent
              opacity={isEmblemHovered ? 0.26 : 0.11}
            />
          </mesh>

          {/* Sculpted Beveled 3D Hexagonal TechTonic Emblem */}
          <group
            ref={emblemRef}
            position={[0, 5.05, 0.2]}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenMission();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setIsEmblemHovered(true);
              setHoveringInteractive(
                true,
                'Xem Tầm nhìn & Sứ mệnh',
                handleOpenMission,
                MISSION_PREVIEW
              );
            }}
            onPointerOut={() => {
              setIsEmblemHovered(false);
              setHoveringInteractive(false);
            }}
          >
            <mesh geometry={outerHexGeom} castShadow>
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={isEmblemHovered ? 0.95 : 0.45}
                metalness={0.85}
                roughness={0.18}
              />
            </mesh>

            <mesh geometry={innerHexGeom} position={[0, 0, 0.03]}>
              <meshStandardMaterial
                color="#cbd5e1"
                emissive="#3b82f6"
                emissiveIntensity={isEmblemHovered ? 0.9 : 0.4}
                metalness={0.9}
                roughness={0.16}
              />
            </mesh>

            <mesh position={[0, 0, 0.06]}>
              <sphereGeometry args={[0.19, 48, 32]} />
              <meshPhysicalMaterial
                color="#e0f2fe"
                emissive="#38bdf8"
                emissiveIntensity={isEmblemHovered ? 0.85 : 0.45}
                metalness={0.2}
                roughness={0.08}
                clearcoat={1}
              />
            </mesh>
          </group>

          {/* Vision & Mission Graphic Plane centered cleanly inside Dream It - Code It */}
          <mesh
            position={[0, 2.55, 0.06]}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenMission();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveringInteractive(
                true,
                'Xem Tầm nhìn & Sứ mệnh',
                handleOpenMission,
                MISSION_PREVIEW
              );
            }}
            onPointerOut={() => setHoveringInteractive(false)}
          >
            <planeGeometry args={[13.6, 6.6]} />
            <meshStandardMaterial
              map={textTexture}
              transparent
              emissive="#ffffff"
              emissiveMap={textTexture}
              emissiveIntensity={0.58}
              roughness={0.42}
              metalness={0.05}
            />
          </mesh>
        </>
      )}

      {/* ================= SLEEK SLIM SCULPTED 3D PLAY PILL RIGHT BELOW DREAM IT - CODE IT ================= */}
      <group ref={playBtnGroupRef} position={[0, 0.34, 0.14]}>
        <mesh
          geometry={playPillGeom}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleCinema();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setIsPlayBtnHovered(true);
            setHoveringInteractive(
              true,
              isCenterWallCinemaActive
                ? 'Tắt TV 3D & quay lại Dream it - Code it'
                : 'Phát phim hành trình TechTonic trên TV 3D',
              handleToggleCinema,
              PLAY_CONSOLE_PREVIEW
            );
          }}
          onPointerOut={() => {
            setIsPlayBtnHovered(false);
            setHoveringInteractive(false);
          }}
        >
          <meshPhysicalMaterial
            color="#0b1629"
            metalness={0.86}
            roughness={0.18}
            clearcoat={0.9}
            clearcoatRoughness={0.12}
            emissive={isCenterWallCinemaActive ? '#f472b6' : '#00F0FF'}
            emissiveIntensity={isPlayBtnHovered ? 0.28 : 0.1}
          />
        </mesh>
        <mesh
          position={[0, 0, 0.036]}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleCinema();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setIsPlayBtnHovered(true);
            setHoveringInteractive(
              true,
              isCenterWallCinemaActive
                ? 'Tắt TV 3D & quay lại Dream it - Code it'
                : 'Phát phim hành trình TechTonic trên TV 3D',
              handleToggleCinema,
              PLAY_CONSOLE_PREVIEW
            );
          }}
          onPointerOut={() => {
            setIsPlayBtnHovered(false);
            setHoveringInteractive(false);
          }}
        >
          <planeGeometry args={[3.14, 0.365]} />
          <meshBasicMaterial map={playConsoleTex} transparent toneMapped={false} />
        </mesh>
      </group>

      {/* Back-Right Wing: Framed 6 Chương Trình & Sự Kiện CLB cleanly to the right of Dream It - Code It */}
      <group position={[11.75, 3.25, 0.04]}>
        <RoundedBox position={[0, 0, -0.05]} args={[7.0, 4.35, 0.1]} radius={0.04} smoothness={4} castShadow>
          <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.22} />
        </RoundedBox>
        <mesh position={[0, 2.15, 0.005]}>
          <boxGeometry args={[6.75, 0.024, 0.02]} />
          <meshBasicMaterial color="#c084fc" toneMapped={false} />
        </mesh>
        {[
          [-3.36, 2.04],
          [3.36, 2.04],
          [-3.36, -2.04],
          [3.36, -2.04],
        ].map(([bx, by], i) => (
          <mesh key={`ev-bolt-${i}`} position={[bx, by, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.035, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.18} />
          </mesh>
        ))}
        <mesh
          position={[0, 0, 0.01]}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEvents();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveringInteractive(
              true,
              'Xem Chuỗi 6 Sự kiện trọng tâm',
              handleOpenEvents,
              eventsWingPreview
            );
          }}
          onPointerOut={() => setHoveringInteractive(false)}
        >
          <planeGeometry args={[6.65, 4.02]} />
          <meshStandardMaterial
            map={eventsWingTexture}
            emissive="#ffffff"
            emissiveMap={eventsWingTexture}
            emissiveIntensity={0.34}
            roughness={0.44}
            metalness={0.04}
          />
        </mesh>
      </group>
    </group>
  );
};
