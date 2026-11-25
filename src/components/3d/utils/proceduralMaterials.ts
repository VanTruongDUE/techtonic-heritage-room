import * as THREE from 'three';
import { createHiResCanvas, finalizeCrispTexture } from './textureUtils';

export interface MaterialMapSet {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

function makeSeededRand(initialSeed: number) {
  let seed = initialSeed;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function configureRepeatedTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  anisotropy = 16,
  srgb = true
): THREE.CanvasTexture {
  return finalizeCrispTexture(canvas, { repeatX, repeatY, anisotropy, srgb });
}

/**
 * Architectural terrazzo / honed stone slab floor diffuse, roughness, and bump maps.
 */
export function createFloorMaps(): MaterialMapSet {
  const size = 1024;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext('2d');

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d');

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d');

  if (dCtx && rCtx && bCtx) {
    dCtx.fillStyle = '#070c17';
    dCtx.fillRect(0, 0, size, size);

    // Sleek honed dark-tech obsidian terrazzo (~0.15 - 0.25 roughness) to mirror neon strips vividly
    rCtx.fillStyle = '#2c2c2c';
    rCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#8a8a8a';
    bCtx.fillRect(0, 0, size, size);

    const rand = makeSeededRand(1337);

    // Subtle stone tonal patches across slabs
    for (let sx = 0; sx < 4; sx++) {
      for (let sy = 0; sy < 4; sy++) {
        const tone = (rand() - 0.5) * 10;
        dCtx.fillStyle = tone > 0 ? 'rgba(38, 54, 82, 0.16)' : 'rgba(9, 14, 24, 0.16)';
        dCtx.fillRect(sx * 256, sy * 256, 256, 256);

        rCtx.fillStyle = rand() > 0.5 ? 'rgba(62, 62, 62, 0.25)' : 'rgba(84, 84, 84, 0.25)';
        rCtx.fillRect(sx * 256, sy * 256, 256, 256);
      }
    }

    // Fine terrazzo aggregate flecks
    for (let i = 0; i < 5200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 0.6 + rand() * 1.9;
      const shade = rand();
      dCtx.fillStyle =
        shade > 0.9
          ? 'rgba(148, 184, 226, 0.18)'
          : shade > 0.52
          ? 'rgba(38, 52, 78, 0.34)'
          : 'rgba(10, 14, 22, 0.3)';
      dCtx.beginPath();
      dCtx.arc(x, y, r, 0, Math.PI * 2);
      dCtx.fill();

      rCtx.fillStyle = shade > 0.72 ? 'rgba(52,52,52,0.28)' : 'rgba(130,130,130,0.2)';
      rCtx.fillRect(x, y, r * 1.4, r * 1.4);

      bCtx.fillStyle = shade > 0.65 ? '#9c9c9c' : '#767676';
      bCtx.fillRect(x, y, r, r);
    }

    // Recessed architectural slab grout lines (256px)
    const slab = 256;
    dCtx.strokeStyle = '#090e18';
    dCtx.lineWidth = 4;
    rCtx.strokeStyle = '#dcdcdc';
    rCtx.lineWidth = 5;
    bCtx.strokeStyle = '#242424';
    bCtx.lineWidth = 5;

    for (let i = 0; i <= size; i += slab) {
      [dCtx, rCtx, bCtx].forEach((ctx) => {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      });
    }

    // Subtle specular chamfer beside grout lines
    dCtx.strokeStyle = 'rgba(125, 211, 252, 0.08)';
    dCtx.lineWidth = 1.5;
    bCtx.strokeStyle = '#b6b6b6';
    bCtx.lineWidth = 1.5;
    for (let i = 3; i < size; i += slab) {
      [dCtx, bCtx].forEach((ctx) => {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      });
    }
  }

  return {
    map: configureRepeatedTexture(dCanvas, 6, 6, 16, true),
    roughnessMap: configureRepeatedTexture(rCanvas, 6, 6, 16, false),
    bumpMap: configureRepeatedTexture(bCanvas, 6, 6, 16, false),
  };
}

/**
 * Veined dark obsidian marble PBR map triplet for display plinths & podiums.
 */
export function createMarbleMaps(): MaterialMapSet {
  const size = 512;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext('2d');

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d');

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d');

  if (dCtx && rCtx && bCtx) {
    dCtx.fillStyle = '#151e30';
    dCtx.fillRect(0, 0, size, size);

    rCtx.fillStyle = '#4c4c4c'; // Polished stone base (~0.30 roughness)
    rCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#848484';
    bCtx.fillRect(0, 0, size, size);

    const rand = makeSeededRand(4099);

    for (let i = 0; i < 65; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 28 + rand() * 84;
      const g = dCtx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(38, 54, 82, 0.28)');
      g.addColorStop(1, 'rgba(21, 30, 48, 0)');
      dCtx.fillStyle = g;
      dCtx.fillRect(0, 0, size, size);

      rCtx.fillStyle = rand() > 0.5 ? 'rgba(64,64,64,0.2)' : 'rgba(92,92,92,0.18)';
      rCtx.beginPath();
      rCtx.arc(x, y, r * 0.45, 0, Math.PI * 2);
      rCtx.fill();
    }

    for (let v = 0; v < 18; v++) {
      const points: Array<[number, number]> = [];
      let x = rand() * size;
      let y = 0;
      points.push([x, y]);
      while (y < size) {
        y += 12 + rand() * 18;
        x += (rand() - 0.42) * 26;
        points.push([x, y]);
      }

      const lw = 0.7 + rand() * 1.7;
      dCtx.beginPath();
      rCtx.beginPath();
      bCtx.beginPath();
      points.forEach(([px, py], i) => {
        if (i === 0) {
          dCtx.moveTo(px, py);
          rCtx.moveTo(px, py);
          bCtx.moveTo(px, py);
        } else {
          dCtx.lineTo(px, py);
          rCtx.lineTo(px, py);
          bCtx.lineTo(px, py);
        }
      });

      dCtx.strokeStyle =
        v % 3 === 0 ? 'rgba(148, 197, 255, 0.16)' : 'rgba(226, 232, 240, 0.09)';
      dCtx.lineWidth = lw;
      dCtx.stroke();

      // Quartz mineral veins polish slightly glossier
      rCtx.strokeStyle = 'rgba(28, 28, 28, 0.7)';
      rCtx.lineWidth = lw * 1.3;
      rCtx.stroke();

      bCtx.strokeStyle = '#6c6c6c';
      bCtx.lineWidth = lw;
      bCtx.stroke();
    }
  }

  return {
    map: configureRepeatedTexture(dCanvas, 1, 1, 16, true),
    roughnessMap: configureRepeatedTexture(rCanvas, 1, 1, 8, false),
    bumpMap: configureRepeatedTexture(bCanvas, 1, 1, 8, false),
  };
}

export function createMarbleTexture(): THREE.CanvasTexture {
  return createMarbleMaps().map;
}

/**
 * Brushed anodized titanium / stainless steel grain for architectural trim and frames.
 */
export function createBrushedMetalMaps(): {
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 256;
  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d');

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d');

  if (rCtx && bCtx) {
    rCtx.fillStyle = '#404040';
    rCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    const rand = makeSeededRand(7919);
    for (let y = 0; y < size; y++) {
      const v = Math.floor(55 + rand() * 38);
      rCtx.fillStyle = `rgb(${v},${v},${v})`;
      rCtx.fillRect(0, y, size, 1);

      const bv = Math.floor(110 + rand() * 36);
      bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bCtx.fillRect(0, y, size, 1);
    }
  }

  return {
    roughnessMap: configureRepeatedTexture(rCanvas, 2, 2, 8, false),
    bumpMap: configureRepeatedTexture(bCanvas, 2, 2, 8, false),
  };
}

/**
 * Subtle matte architectural plaster wall panels with fine shadow seams.
 */
export function createArchitecturalWallMaps(): MaterialMapSet {
  const size = 512;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext('2d');

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d');

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d');

  if (dCtx && rCtx && bCtx) {
    dCtx.fillStyle = '#0d1422';
    dCtx.fillRect(0, 0, size, size);

    rCtx.fillStyle = '#b4b4b4';
    rCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#828282';
    bCtx.fillRect(0, 0, size, size);

    const rand = makeSeededRand(9973);
    for (let i = 0; i < 2400; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 2 + rand() * 5;
      const bright = rand() > 0.5;
      dCtx.fillStyle = bright ? 'rgba(34, 48, 72, 0.2)' : 'rgba(11, 16, 28, 0.2)';
      dCtx.fillRect(x, y, w, w);

      bCtx.fillStyle = bright ? '#8d8d8d' : '#767676';
      bCtx.fillRect(x, y, w, w);
    }

    // Subtle vertical architectural panel seams every 256px
    dCtx.strokeStyle = 'rgba(8, 12, 22, 0.65)';
    dCtx.lineWidth = 2;
    bCtx.strokeStyle = '#383838';
    bCtx.lineWidth = 3;
    for (let x = 0; x <= size; x += 256) {
      dCtx.beginPath();
      dCtx.moveTo(x, 0);
      dCtx.lineTo(x, size);
      dCtx.stroke();

      bCtx.beginPath();
      bCtx.moveTo(x, 0);
      bCtx.lineTo(x, size);
      bCtx.stroke();
    }
  }

  return {
    map: configureRepeatedTexture(dCanvas, 4, 2, 16, true),
    roughnessMap: configureRepeatedTexture(rCanvas, 4, 2, 8, false),
    bumpMap: configureRepeatedTexture(bCanvas, 4, 2, 8, false),
  };
}

/**
 * Fine pebbled grain for museum leather benches & hardcover guestbook bindings.
 */
export function createLeatherMaps(): {
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 256;
  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d');

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d');

  if (rCtx && bCtx) {
    rCtx.fillStyle = '#8c8c8c';
    rCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#707070';
    bCtx.fillRect(0, 0, size, size);

    const rand = makeSeededRand(5521);
    for (let i = 0; i < 3200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const rad = 1.2 + rand() * 1.8;
      bCtx.fillStyle = rand() > 0.35 ? '#9e9e9e' : '#565656';
      bCtx.beginPath();
      bCtx.arc(x, y, rad, 0, Math.PI * 2);
      bCtx.fill();

      rCtx.fillStyle = rand() > 0.5 ? '#787878' : '#a4a4a4';
      rCtx.fillRect(x, y, rad, rad);
    }
  }

  return {
    roughnessMap: configureRepeatedTexture(rCanvas, 2, 2, 8, false),
    bumpMap: configureRepeatedTexture(bCanvas, 2, 2, 8, false),
  };
}

/**
 * Micro-knit cotton pique fabric texture & bump map for the 3D Club Shirt.
 */
export function createFabricMaps(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext('2d');

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d');

  if (dCtx && bCtx) {
    dCtx.fillStyle = '#12213b';
    dCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    const step = 4;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const checker = (x / step + y / step) % 2 === 0;
        dCtx.fillStyle = checker ? 'rgba(32, 56, 94, 0.45)' : 'rgba(10, 19, 36, 0.45)';
        dCtx.fillRect(x, y, step - 1, step - 1);

        bCtx.fillStyle = checker ? '#bebebe' : '#464646';
        bCtx.fillRect(x, y, step - 1, step - 1);
      }
    }
  }

  return {
    map: configureRepeatedTexture(dCanvas, 5, 5, 16, true),
    bumpMap: configureRepeatedTexture(bCanvas, 5, 5, 16, false),
  };
}

/**
 * Engraved brushed-metal nameplate texture for trophy & exhibit pedestals.
 */
export function createPedestalPlaqueTexture(
  title: string,
  year: string,
  highlight?: string
): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(768, 224, 2);

  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 768, 224);
    grad.addColorStop(0, '#09101f');
    grad.addColorStop(0.5, '#111d34');
    grad.addColorStop(1, '#080e1c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 768, 224);

    // Double crisp neon-cyan & chrome metallic border
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.72)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 748, 204);

    ctx.strokeStyle = 'rgba(184, 77, 255, 0.38)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, 732, 188);

    // Corner engraved mounting screw heads
    [
      [28, 28],
      [740, 28],
      [28, 196],
      [740, 196],
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 23px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(highlight ? `${year}  •  ${highlight.toUpperCase()}` : year, 384, 66);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 29px Inter, sans-serif';
    const words = title.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (ctx.measureText(test).width > 660) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);

    const startY = lines.length > 1 ? 124 : 142;
    lines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, 384, startY + idx * 40);
    });
  }

  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}

/**
 * Framed printed honor certificate texture for certificate exhibit inside vitrine.
 */
export function createCertificateTexture(title: string, year: string): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(768, 1024, 1.5);

  if (ctx) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 768, 1024);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 10;
    ctx.strokeRect(32, 32, 704, 960);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.strokeRect(52, 52, 664, 920);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillText('TECHTONIC CLUB HERITAGE', 384, 150);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 50px Inter, sans-serif';
    ctx.fillText('BẰNG KHEN', 384, 240);

    ctx.fillStyle = '#334155';
    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillText('VINH DANH THÀNH TÍCH XUẤT SẮC', 384, 295);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, 345);
    ctx.lineTo(608, 345);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 34px Inter, sans-serif';
    const words = title.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (ctx.measureText(test).width > 560) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    lines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, 384, 440 + i * 48);
    });

    ctx.fillStyle = '#475569';
    ctx.font = '400 24px Inter, sans-serif';
    ctx.fillText(`Niên khóa vinh danh: ${year}`, 384, 650);

    ctx.beginPath();
    ctx.arc(384, 790, 62, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#b45309';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillText('TT', 384, 799);
  }

  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}

/**
 * Open guestbook archival paper texture with subtle ruled lines and calligraphy header.
 */
export function createOpenBookPageTexture(side: 'left' | 'right'): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(512, 640, 2);

  if (ctx) {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 512, 640);

    const gutter = ctx.createLinearGradient(
      side === 'left' ? 450 : 0,
      0,
      side === 'left' ? 512 : 62,
      0
    );
    if (side === 'left') {
      gutter.addColorStop(0, 'rgba(15,23,42,0)');
      gutter.addColorStop(1, 'rgba(15,23,42,0.22)');
    } else {
      gutter.addColorStop(0, 'rgba(15,23,42,0.22)');
      gutter.addColorStop(1, 'rgba(15,23,42,0)');
    }
    ctx.fillStyle = gutter;
    ctx.fillRect(0, 0, 512, 640);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.5;
    for (let y = 140; y <= 570; y += 38) {
      ctx.beginPath();
      ctx.moveTo(46, y);
      ctx.lineTo(466, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(side === 'left' ? 'SỔ LƯU BÚT' : 'TECHTONIC HERITAGE', 46, 76);

    ctx.fillStyle = '#334155';
    ctx.font = 'italic 18px Inter, sans-serif';
    if (side === 'left') {
      ctx.fillText('"Thắp lửa đam mê,', 46, 132);
      ctx.fillText('Tiên phong công nghệ."', 46, 170);
      ctx.fillText('— TechTonic Club', 46, 246);
    } else {
      ctx.fillText('Gửi lại lời chúc của bạn', 46, 132);
      ctx.fillText('trong hành trình khám phá...', 46, 170);
    }
  }

  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}
