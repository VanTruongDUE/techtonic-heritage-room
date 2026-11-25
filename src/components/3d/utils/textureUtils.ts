import * as THREE from 'three';

export interface HiResCanvasResult {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
}

/**
 * Creates a high-resolution backing canvas scaled cleanly by `scale` while letting callers
 * draw in logical coordinates for razor-sharp typography and crisp photographic detail.
 */
export function createHiResCanvas(
  logicalWidth: number,
  logicalHeight: number,
  scale = 2
): HiResCanvasResult {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(logicalWidth * scale);
  canvas.height = Math.round(logicalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(scale, scale);
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
 * Configures a CanvasTexture with full trilinear mipmapping, high anisotropic filtering
 * (prevents oblique-angle blur/aliasing on wall boards), and accurate sRGB color space.
 */
export function finalizeCrispTexture(
  canvas: HTMLCanvasElement,
  options: CrispTextureOptions = {}
): THREE.CanvasTexture {
  const { anisotropy = 16, srgb = true, repeatX, repeatY } = options;
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
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}
