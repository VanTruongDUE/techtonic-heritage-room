import * as THREE from 'three';

export interface HiResCanvasResult {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
}

const MAX_CANVAS_EDGE = 1536;

/**
 * Creates a crisp backing canvas with an automatic VRAM-safe dimension cap so laptops
 * and integrated GPUs never stall on oversized 4K procedural textures while keeping
 * logical drawing coordinates 100% unchanged for all callers.
 */
export function createHiResCanvas(
  logicalWidth: number,
  logicalHeight: number,
  scale = 1.5
): HiResCanvasResult {
  const maxDim = Math.max(logicalWidth, logicalHeight);
  const cappedScale = Math.min(scale, MAX_CANVAS_EDGE / Math.max(1, maxDim));
  const finalScale = Math.max(0.75, cappedScale);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(logicalWidth * finalScale);
  canvas.height = Math.round(logicalHeight * finalScale);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(finalScale, finalScale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  return { canvas, ctx };
}

export interface CrispTextureOptions {
  anisotropy?: number;
  srgb?: boolean;
  repeatX?: number;
  repeatY?: number;
}

/**
 * Configures a CanvasTexture with full trilinear mipmapping, GPU-friendly anisotropic filtering
 * (capped at 4x for crisp oblique-angle text with minimal texture-fetch overhead), and sRGB color space.
 */
export function finalizeCrispTexture(
  canvas: HTMLCanvasElement,
  options: CrispTextureOptions = {}
): THREE.CanvasTexture {
  const { anisotropy = 4, srgb = true, repeatX, repeatY } = options;
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  if (repeatX !== undefined && repeatY !== undefined) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = Math.min(anisotropy, 4);
  tex.needsUpdate = true;
  return tex;
}
