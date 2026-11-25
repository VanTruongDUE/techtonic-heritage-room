import React from 'react';
import { Map, X } from 'lucide-react';
import { TELEPORT_ZONES } from '../../data/heritageSeed';
import { useHeritageStore } from '../../store/useHeritageStore';

// World bounds: X in [-18, 18], Z in [-20, 29]
const MAP_W = 180;
const MAP_H = 212;

function toSvgX(worldX: number): number {
  return ((worldX + 18) / 36) * MAP_W;
}

function toSvgY(worldZ: number): number {
  return ((worldZ + 20) / 49) * MAP_H;
}

const DEPARTMENT_STAGES: Array<{
  id: string;
  label: string;
  color: string;
  x: number;
  z: number;
  glidePos: [number, number, number];
  glideLook: [number, number, number];
}> = [
  {
    id: 'dept-cm',
    label: 'Ban Chuyên Môn',
    color: '#f97316',
    x: -16.5,
    z: -15.1,
    glidePos: [-11.4, 1.4, -15.1],
    glideLook: [-16.5, 2.7, -15.1],
  },
  {
    id: 'dept-sk',
    label: 'Ban Sự Kiện',
    color: '#a855f7',
    x: 16.5,
    z: -15.1,
    glidePos: [11.4, 1.4, -15.1],
    glideLook: [16.5, 2.7, -15.1],
  },
  {
    id: 'dept-tt',
    label: 'Ban Truyền Thông',
    color: '#00E5FF',
    x: -5.8,
    z: 8.05,
    glidePos: [-5.8, 1.4, 3.0],
    glideLook: [-5.8, 2.7, 8.05],
  },
  {
    id: 'dept-ns',
    label: 'Ban Nhân Sự',
    color: '#10b981',
    x: 4.4,
    z: 8.05,
    glidePos: [4.4, 1.4, 3.0],
    glideLook: [4.4, 2.7, 8.05],
  },
  {
    id: 'dept-bcn',
    label: 'Ban Chủ Nhiệm',
    color: '#fbbf24',
    x: 14.8,
    z: 8.05,
    glidePos: [14.8, 1.4, 3.0],
    glideLook: [14.8, 2.7, 8.05],
  },
];

export const MiniMap: React.FC = () => {
  const {
    hasEntered,
    activeModal,
    showMiniMap,
    toggleMiniMap,
    playerPose,
    currentZone,
    visitedZones,
    requestTeleport,
    requestCustomGlide,
  } = useHeritageStore();

  if (!hasEntered || activeModal || !showMiniMap) return null;

  const px = toSvgX(playerPose.x);
  const py = toSvgY(playerPose.z);
  // In Three.js camera forward with yaw=0 points toward -Z (upward on SVG).
  // Rotating clockwise in SVG matches -yaw in radians.
  const headingDeg = (-playerPose.yaw * 180) / Math.PI;

  const hallX = toSvgX(-17);
  const hallY = toSvgY(-19);
  const hallW = toSvgX(17) - hallX;
  const hallH = toSvgY(8.5) - hallY;

  const tunnelX = toSvgX(-2.6);
  const tunnelY = toSvgY(8.5);
  const tunnelW = toSvgX(2.6) - tunnelX;
  const tunnelH = toSvgY(28.5) - tunnelY;

  const islandCx = toSvgX(0);
  const islandCy = toSvgY(-5);

  return (
    <aside
      aria-label="Bản đồ radar 2D phòng trưng bày"
      className="self-start glass-panel rounded-2xl p-3 w-[206px] pointer-events-auto animate-panel-in border border-tech-cyan/25"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] font-bold text-tech-cyan uppercase tracking-wider flex items-center gap-1.5">
          <Map className="w-3.5 h-3.5" aria-hidden="true" />
          Sơ đồ 2D
        </span>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1 py-0.5 rounded bg-black/50 border border-white/15 font-mono text-[9px] text-slate-300">
            M
          </kbd>
          <button
            type="button"
            onClick={toggleMiniMap}
            className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Thu gọn bản đồ radar"
            title="Ẩn sơ đồ (M)"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[#070d18]/90 border border-white/10 p-1.5 overflow-hidden">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="w-full h-auto block"
          role="img"
          aria-label="Sơ đồ vị trí người tham quan trong phòng truyền thống TechTonic"
        >
          <defs>
            <radialGradient id="fovConeGrad" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.02" />
            </radialGradient>
          </defs>

          {/* Main Exhibition Hall */}
          <rect
            x={hallX}
            y={hallY}
            width={hallW}
            height={hallH}
            rx={5}
            fill="#0d1729"
            stroke="#2a4368"
            strokeWidth={1.2}
          />

          {/* Entrance Tunnel */}
          <rect
            x={tunnelX}
            y={tunnelY}
            width={tunnelW}
            height={tunnelH}
            rx={3}
            fill="#0b1424"
            stroke="#263c5e"
            strokeWidth={1.1}
          />

          {/* Back Hero Wall Highlight */}
          <line
            x1={toSvgX(-7.5)}
            y1={toSvgY(-18.6)}
            x2={toSvgX(7.5)}
            y2={toSvgY(-18.6)}
            stroke="#00F0FF"
            strokeWidth={2.2}
            strokeLinecap="round"
          />

          {/* Central Trophy Island 360° */}
          <circle
            cx={islandCx}
            cy={islandCy}
            r={16}
            fill="rgba(251, 191, 36, 0.1)"
            stroke="rgba(251, 191, 36, 0.55)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />

          {/* 5 Color-Coded Department Stage Dots (clickable to glide!) */}
          {DEPARTMENT_STAGES.map((dept) => {
            const dx = toSvgX(dept.x);
            const dy = toSvgY(dept.z);
            return (
              <g
                key={dept.id}
                onClick={() => requestCustomGlide(dept.glidePos, dept.glideLook, dept.label)}
                className="cursor-pointer"
              >
                <title>{`Lướt tới ${dept.label}`}</title>
                <circle cx={dx} cy={dy} r={4.2} fill={dept.color} fillOpacity={0.25} />
                <circle cx={dx} cy={dy} r={2.2} fill={dept.color} />
              </g>
            );
          })}

          {/* Clickable Teleport Zone Markers */}
          {TELEPORT_ZONES.map((zone) => {
            const zx = toSvgX(zone.position[0]);
            const zy = toSvgY(zone.position[2]);
            const isActive = currentZone === zone.label;
            const isVisited = visitedZones.includes(zone.label);
            return (
              <g
                key={zone.id}
                onClick={() => requestTeleport(zone.id)}
                className="cursor-pointer"
              >
                <title>{`${zone.label} — Nhấn để lướt tới`}</title>
                <circle
                  cx={zx}
                  cy={zy}
                  r={isActive ? 4.6 : 3.2}
                  fill={isActive ? '#00F0FF' : isVisited ? '#38bdf8' : '#475569'}
                  fillOpacity={isActive ? 0.95 : 0.72}
                  stroke="#050811"
                  strokeWidth={1}
                />
              </g>
            );
          })}

          {/* Live Player FOV Cone & Beacon */}
          <g transform={`translate(${px}, ${py}) rotate(${headingDeg})`}>
            <path d="M 0 0 L -13 -24 A 27 27 0 0 1 13 -24 Z" fill="url(#fovConeGrad)" />
            <circle cx={0} cy={0} r={5.4} fill="#00F0FF" fillOpacity={0.22} />
            <circle cx={0} cy={0} r={3.2} fill="#ffffff" stroke="#00F0FF" strokeWidth={1.6} />
          </g>
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-300">
        <span>Nhấn điểm để lướt tới</span>
        <span className="font-mono text-tech-cyan tabular-nums">
          {Math.min(visitedZones.length, TELEPORT_ZONES.length)}/{TELEPORT_ZONES.length} khu
        </span>
      </div>
    </aside>
  );
};
