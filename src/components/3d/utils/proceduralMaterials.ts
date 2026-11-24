import * as THREE from 'three';

export interface MaterialMapPair {
  map: THREE.CanvasTexture;
  roughnessMap?: THREE.CanvasTexture;
  bumpMap?: THREE.CanvasTexture;
}

/**
 * Architectural terrazzo / micro-cement tile floor diffuse + roughness maps.
 */
export function createFloorMaps(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 1024;

  // Diffuse map
  const diffuseCanvas = document.createElement('canvas');
  diffuseCanvas.width = size;
  diffuseCanvas.height = size;
  const dCtx = diffuseCanvas.getContext('2d');

  // Roughness map (darker = glossier slabs, lighter = matte grout lines)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  if (dCtx && rCtx) {
    dCtx.fillStyle = '#141c2b';
    dCtx.fillRect(0, 0, size, size);

    rCtx.fillStyle = '#5c5c5c'; // ~0.36 base roughness (satin polished concrete)
    rCtx.fillRect(0, 0, size, size);

    // Subtle mineral terrazzo aggregate speckles (deterministic pseudo-random)
    let seed = 1337;
    const nextRand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 4200; i++) {
      const x = nextRand() * size;
      const y = nextRand() * size;
      const r = 0.6 + nextRand() * 1.8;
      const shade = nextRand();
      dCtx.fillStyle =
        shade > 0.88
          ? 'rgba(148, 178, 218, 0.14)'
          : shade > 0.5
          ? 'rgba(38, 52, 78, 0.35)'
          : 'rgba(10, 14, 22, 0.32)';
      dCtx.beginPath();
      dCtx.arc(x, y, r, 0, Math.PI * 2);
      dCtx.fill();

      rCtx.fillStyle = shade > 0.7 ? 'rgba(90,90,90,0.22)' : 'rgba(140,140,140,0.18)';
      rCtx.fillRect(x, y, r * 1.5, r * 1.5);
    }

    // Large architectural slab joints (256px grid)
    const slab = 256;
    dCtx.strokeStyle = '#0b101b';
    dCtx.lineWidth = 4;
    rCtx.strokeStyle = '#e0e0e0'; // matte grout
    rCtx.lineWidth = 5;

    for (let i = 0; i <= size; i += slab) {
      dCtx.beginPath();
      dCtx.moveTo(i, 0);
      dCtx.lineTo(i, size);
      dCtx.stroke();
      dCtx.beginPath();
      dCtx.moveTo(0, i);
      dCtx.lineTo(size, i);
      dCtx.stroke();

      rCtx.beginPath();
      rCtx.moveTo(i, 0);
      rCtx.lineTo(i, size);
      rCtx.stroke();
      rCtx.beginPath();
      rCtx.moveTo(0, i);
      rCtx.lineTo(size, i);
      rCtx.stroke();
    }

    // Subtle chamfer highlight next to joints
    dCtx.strokeStyle = 'rgba(125, 211, 252, 0.06)';
    dCtx.lineWidth = 1.5;
    for (let i = 3; i < size; i += slab) {
      dCtx.beginPath();
      dCtx.moveTo(i, 0);
      dCtx.lineTo(i, size);
      dCtx.stroke();
      dCtx.beginPath();
      dCtx.moveTo(0, i);
      dCtx.lineTo(size, i);
      dCtx.stroke();
    }
  }

  const map = new THREE.CanvasTexture(diffuseCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(6, 6);
  map.anisotropy = 16;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(6, 6);
  roughnessMap.anisotropy = 8;

  return { map, roughnessMap };
}

/**
 * Dark veined obsidian marble texture for display plinths & trophy bases.
 */
export function createMarbleTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#161f30';
    ctx.fillRect(0, 0, size, size);

    let seed = 4099;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Soft cloudy mineral mottling
    for (let i = 0; i < 60; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 30 + rand() * 80;
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(36, 51, 78, 0.25)');
      g.addColorStop(1, 'rgba(22, 31, 48, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }

    // Organic diagonal mineral veins
    for (let v = 0; v < 14; v++) {
      ctx.beginPath();
      let x = rand() * size;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < size) {
        y += 14 + rand() * 18;
        x += (rand() - 0.42) * 28;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle =
        v % 3 === 0 ? 'rgba(148, 197, 255, 0.14)' : 'rgba(226, 232, 240, 0.08)';
      ctx.lineWidth = 0.7 + rand() * 1.6;
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
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

    // Fine woven pique knit pattern
    const step = 4;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const checker = ((x / step) + (y / step)) % 2 === 0;
        dCtx.fillStyle = checker ? 'rgba(30, 52, 88, 0.45)' : 'rgba(10, 19, 36, 0.45)';
        dCtx.fillRect(x, y, step - 1, step - 1);

        bCtx.fillStyle = checker ? '#b8b8b8' : '#4a4a4a';
        bCtx.fillRect(x, y, step - 1, step - 1);
      }
    }
  }

  const map = new THREE.CanvasTexture(dCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 5);
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(5, 5);
  bumpMap.anisotropy = 8;

  return { map, bumpMap };
}

/**
 * Engraved brushed-metal nameplate texture for trophy pedestals.
 */
export function createPedestalPlaqueTexture(title: string, year: string, highlight?: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 224;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Brushed metallic dark plate
    const grad = ctx.createLinearGradient(0, 0, 768, 224);
    grad.addColorStop(0, '#162033');
    grad.addColorStop(0.5, '#1e2c45');
    grad.addColorStop(1, '#141d2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 768, 224);

    // Thin inner bevel border
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 748, 204);

    // Year + highlight line
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(highlight ? `${year}  •  ${highlight.toUpperCase()}` : year, 384, 64);

    // Title wrapping (max 2 lines)
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px Inter, sans-serif';
    const words = title.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (ctx.measureText(test).width > 680) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);

    const startY = lines.length > 1 ? 124 : 142;
    lines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, 384, startY + idx * 42);
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
}

/**
 * Framed printed honor certificate texture for certificate exhibit inside vitrine.
 */
export function createCertificateTexture(title: string, year: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 768, 1024);

    // Double classic border
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

    // Title
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

    // Gold Embossed Seal
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

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
}

/**
 * Open guestbook archival paper texture with subtle ruled lines and calligraphy header.
 */
export function createOpenBookPageTexture(side: 'left' | 'right'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 512, 640);

    // Subtle page gutter shadow
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

    // Ruled writing lines
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

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}
