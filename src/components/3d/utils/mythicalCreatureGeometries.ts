import * as THREE from 'three';
import { finalizeCrispTexture } from './textureUtils';

function makeRand(seedInit: number) {
  let s = seedInit;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates a smooth variable-radius organic tubular mesh along a 3D CatmullRomCurve3.
 * Used for anatomical necks, curved raptor beaks, mythical spirit fox tails, talons, and crests.
 */
export function createTaperedTubeGeometry(
  points: THREE.Vector3[],
  radiusFn: (t: number) => number,
  tubularSegments = 28,
  radialSegments = 14,
  scaleX = 1,
  scaleY = 1
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const vertex = new THREE.Vector3();
  const center = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i += 1) {
    const t = i / tubularSegments;
    curve.getPointAt(t, center);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = Math.max(0.001, radiusFn(t));

    for (let j = 0; j <= radialSegments; j += 1) {
      const v = (j / radialSegments) * Math.PI * 2;
      const cos = Math.cos(v) * scaleX;
      const sin = Math.sin(v) * scaleY;

      vertex.x = center.x + r * (cos * N.x + sin * B.x);
      vertex.y = center.y + r * (cos * N.y + sin * B.y);
      vertex.z = center.z + r * (cos * N.z + sin * B.z);

      positions.push(vertex.x, vertex.y, vertex.z);
      uvs.push(j / radialSegments, t);
    }
  }

  const stride = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Generates an organically curved, tapered avian feather blade (with gentle camber arc)
 * so Owl & Phoenix wings look like real layered mythical feathers instead of flat boxes.
 */
export function createSculptedFeatherGeometry(
  length = 0.24,
  width = 0.055,
  arch = 0.025
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.58, length * 0.2, width * 0.54, length * 0.72, 0, length);
  shape.bezierCurveTo(-width * 0.54, length * 0.72, -width * 0.58, length * 0.2, 0, 0);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.005,
    bevelEnabled: true,
    bevelThickness: 0.0025,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 14,
  });

  // Apply gentle natural aerodynamic feather camber along Y
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp(y / Math.max(0.001, length), 0, 1);
    const bendZ = Math.sin(t * Math.PI) * arch - t * t * arch * 0.55;
    pos.setZ(i, pos.getZ(i) + bendZ);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/**
 * Procedural scalloped Great Horned Owl plumage diffuse + bump maps (rich bronze/midnight indigo + warm gold barring)
 */
export function createOwlPlumageMaps(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
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
    const bg = dCtx.createLinearGradient(0, 0, 0, size);
    bg.addColorStop(0, '#1e2c45');
    bg.addColorStop(0.55, '#2b3954');
    bg.addColorStop(1, '#1a2438');
    dCtx.fillStyle = bg;
    dCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#787878';
    bCtx.fillRect(0, 0, size, size);

    const rand = makeRand(7331);
    const rows = 18;
    const cols = 14;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r += 1) {
      const offset = (r % 2) * (cellW * 0.5);
      for (let c = -1; c <= cols; c += 1) {
        const cx = c * cellW + offset;
        const cy = r * cellH;
        const shade = rand();
        const featherGrad = dCtx.createRadialGradient(cx, cy - cellH * 0.2, 2, cx, cy, cellW * 0.72);
        if (shade > 0.65) {
          featherGrad.addColorStop(0, '#3e4c6b');
          featherGrad.addColorStop(0.75, '#26344f');
          featherGrad.addColorStop(1, '#fb923c');
        } else {
          featherGrad.addColorStop(0, '#2d3c59');
          featherGrad.addColorStop(0.8, '#1b263c');
          featherGrad.addColorStop(1, '#d97706');
        }

        dCtx.fillStyle = featherGrad;
        dCtx.beginPath();
        dCtx.arc(cx, cy, cellW * 0.56, 0, Math.PI);
        dCtx.closePath();
        dCtx.fill();

        dCtx.strokeStyle = 'rgba(253, 186, 116, 0.35)';
        dCtx.lineWidth = 1.2;
        dCtx.stroke();

        // Matching scalloped feather bump relief
        const bGrad = bCtx.createRadialGradient(cx, cy - 3, 2, cx, cy, cellW * 0.65);
        bGrad.addColorStop(0, '#d8d8d8');
        bGrad.addColorStop(0.78, '#888888');
        bGrad.addColorStop(1, '#282828');
        bCtx.fillStyle = bGrad;
        bCtx.beginPath();
        bCtx.arc(cx, cy, cellW * 0.56, 0, Math.PI);
        bCtx.closePath();
        bCtx.fill();
      }
    }
  }

  return {
    map: finalizeCrispTexture(dCanvas, { anisotropy: 4, srgb: true, repeatX: 2, repeatY: 2 }),
    bumpMap: finalizeCrispTexture(bCanvas, { anisotropy: 4, srgb: false, repeatX: 2, repeatY: 2 }),
  };
}

/**
 * Procedural Celestial Phoenix iridescent flame-feather maps (royal violet -> magenta -> molten gold barbs)
 */
export function createPhoenixPlumageMaps(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
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
    const bg = dCtx.createLinearGradient(0, 0, 0, size);
    bg.addColorStop(0, '#581c87');
    bg.addColorStop(0.5, '#9333ea');
    bg.addColorStop(1, '#db2777');
    dCtx.fillStyle = bg;
    dCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#7a7a7a';
    bCtx.fillRect(0, 0, size, size);

    const rows = 20;
    const cols = 16;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r += 1) {
      const offset = (r % 2) * (cellW * 0.5);
      for (let c = -1; c <= cols; c += 1) {
        const cx = c * cellW + offset;
        const cy = r * cellH;
        const grad = dCtx.createLinearGradient(cx, cy - cellH, cx, cy + cellH * 0.6);
        grad.addColorStop(0, '#4c1d95');
        grad.addColorStop(0.55, '#c026d3');
        grad.addColorStop(0.88, '#fb7185');
        grad.addColorStop(1, '#fde047');

        dCtx.fillStyle = grad;
        dCtx.beginPath();
        dCtx.moveTo(cx - cellW * 0.48, cy);
        dCtx.quadraticCurveTo(cx, cy + cellH * 1.15, cx + cellW * 0.48, cy);
        dCtx.closePath();
        dCtx.fill();

        // Central golden feather rachis (shaft)
        dCtx.strokeStyle = 'rgba(254, 240, 138, 0.55)';
        dCtx.lineWidth = 1.1;
        dCtx.beginPath();
        dCtx.moveTo(cx, cy - cellH * 0.15);
        dCtx.lineTo(cx, cy + cellH * 0.72);
        dCtx.stroke();

        bCtx.fillStyle = '#c8c8c8';
        bCtx.beginPath();
        bCtx.moveTo(cx - cellW * 0.44, cy);
        bCtx.quadraticCurveTo(cx, cy + cellH * 1.05, cx + cellW * 0.44, cy);
        bCtx.closePath();
        bCtx.fill();
        bCtx.strokeStyle = '#303030';
        bCtx.lineWidth = 1.5;
        bCtx.stroke();
      }
    }
  }

  return {
    map: finalizeCrispTexture(dCanvas, { anisotropy: 4, srgb: true, repeatX: 2, repeatY: 2 }),
    bumpMap: finalizeCrispTexture(bCanvas, { anisotropy: 4, srgb: false, repeatX: 2, repeatY: 2 }),
  };
}

/**
 * Procedural plush Spirit Fox fur stroke diffuse + bump maps (emerald-jade & silver-ivory velvet fur)
 */
export function createFoxFurMaps(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
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
    const bg = dCtx.createLinearGradient(0, 0, 0, size);
    bg.addColorStop(0, '#0f766e');
    bg.addColorStop(0.5, '#14b8a6');
    bg.addColorStop(1, '#0d5e58');
    dCtx.fillStyle = bg;
    dCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    const rand = makeRand(9187);
    // Thousands of fine directional velvet fur hairs
    for (let i = 0; i < 4200; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const len = 10 + rand() * 18;
      const sway = (rand() - 0.5) * 4;
      const tone = rand();

      dCtx.strokeStyle =
        tone > 0.82
          ? 'rgba(167, 243, 208, 0.48)'
          : tone > 0.45
          ? 'rgba(45, 212, 191, 0.42)'
          : 'rgba(13, 74, 70, 0.48)';
      dCtx.lineWidth = 1.2 + rand() * 1.1;
      dCtx.beginPath();
      dCtx.moveTo(x, y);
      dCtx.lineTo(x + sway, y + len);
      dCtx.stroke();

      bCtx.strokeStyle = tone > 0.5 ? 'rgba(210,210,210,0.45)' : 'rgba(55,55,55,0.45)';
      bCtx.lineWidth = 1.2;
      bCtx.beginPath();
      bCtx.moveTo(x, y);
      bCtx.lineTo(x + sway, y + len);
      bCtx.stroke();
    }
  }

  return {
    map: finalizeCrispTexture(dCanvas, { anisotropy: 4, srgb: true, repeatX: 2, repeatY: 2 }),
    bumpMap: finalizeCrispTexture(bCanvas, { anisotropy: 4, srgb: false, repeatX: 2, repeatY: 2 }),
  };
}
