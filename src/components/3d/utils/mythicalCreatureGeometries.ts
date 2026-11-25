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
 * Welds vertex normals across coincident (x, y, z) positions WITHOUT modifying vertex count,
 * index buffer, UVs, skinIndex, skinWeight, or morphAttributes.
 *
 * This converts flat-shaded / faceted low-poly SkinnedMesh animals into silky-smooth,
 * organic, muscular sculpted creatures while preserving 100% of skeletal bone rigging.
 */
export function smoothSkinnedGeometryNormals(
  sourceGeometry: THREE.BufferGeometry,
  quantizePrecision = 20000
): THREE.BufferGeometry {
  const geom = sourceGeometry.clone();
  const posAttr = geom.getAttribute('position');
  if (!posAttr) return geom;

  const count = posAttr.count;
  const accumMap = new Map<string, THREE.Vector3>();
  const vertKeys = new Array<string>(count);

  for (let i = 0; i < count; i += 1) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const key = `${Math.round(x * quantizePrecision)}_${Math.round(y * quantizePrecision)}_${Math.round(z * quantizePrecision)}`;
    vertKeys[i] = key;
    if (!accumMap.has(key)) {
      accumMap.set(key, new THREE.Vector3());
    }
  }

  const indexAttr = geom.getIndex();
  const triCount = indexAttr ? indexAttr.count / 3 : count / 3;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  for (let t = 0; t < triCount; t += 1) {
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    vA.fromBufferAttribute(posAttr, i0);
    vB.fromBufferAttribute(posAttr, i1);
    vC.fromBufferAttribute(posAttr, i2);

    // Area-weighted face normal (cross product without normalizing preserves area weighting)
    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    cb.cross(ab);

    accumMap.get(vertKeys[i0])!.add(cb);
    accumMap.get(vertKeys[i1])!.add(cb);
    accumMap.get(vertKeys[i2])!.add(cb);
  }

  const normals = new Float32Array(count * 3);
  accumMap.forEach((vec) => {
    if (vec.lengthSq() > 1e-12) {
      vec.normalize();
    } else {
      vec.set(0, 1, 0);
    }
  });

  for (let i = 0; i < count; i += 1) {
    const n = accumMap.get(vertKeys[i])!;
    normals[i * 3] = n.x;
    normals[i * 3 + 1] = n.y;
    normals[i * 3 + 2] = n.z;
  }

  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geom;
}

/**
 * Generates a fine, seamless directional fur / velvet micro-grain bumpMap (512x512)
 * so mythical beast coats catch realistic soft anisotropic sheen instead of looking plasticky.
 */
export function createMythicalFurBumpMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    const rand = makeRand(90210);

    for (let i = 0; i < 4200; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const len = 8 + rand() * 18;
      const drift = (rand() - 0.5) * 4;
      const bright = Math.floor(85 + rand() * 125);
      ctx.strokeStyle = `rgba(${bright},${bright},${bright},0.32)`;
      ctx.lineWidth = 0.8 + rand() * 1.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + drift * 0.5, y + len * 0.5, x + drift, y + len);
      ctx.stroke();
    }
  }

  return finalizeCrispTexture(canvas, { anisotropy: 4, srgb: false, repeatX: 4, repeatY: 4 });
}

export interface MythicalMaterialOptions {
  cacheKey: string;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  sheen?: number;
  sheenRoughness?: number;
  sheenColor?: string;
  clearcoat?: number;
  clearcoatRoughness?: number;
  iridescence?: number;
  iridescenceIOR?: number;
  bumpMap?: THREE.Texture;
  bumpScale?: number;
  rimColor?: string;
  rimPower?: number;
  rimStrength?: number;
}

/**
 * Creates a museum-grade MeshPhysicalMaterial enhanced with a GPU Fresnel celestial rim glow
 * via onBeforeCompile so mythical beasts radiate regal presence against the dark obsidian hall.
 */
export function createMythicalPBRMaterial(opts: MythicalMaterialOptions): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(opts.color),
    emissive: new THREE.Color(opts.emissive ?? '#000000'),
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    roughness: opts.roughness ?? 0.44,
    metalness: opts.metalness ?? 0.14,
    sheen: opts.sheen ?? 0.85,
    sheenRoughness: opts.sheenRoughness ?? 0.38,
    sheenColor: new THREE.Color(opts.sheenColor ?? opts.rimColor ?? '#ffffff'),
    clearcoat: opts.clearcoat ?? 0.15,
    clearcoatRoughness: opts.clearcoatRoughness ?? 0.35,
    iridescence: opts.iridescence ?? 0.25,
    iridescenceIOR: opts.iridescenceIOR ?? 1.38,
    bumpMap: opts.bumpMap ?? null,
    bumpScale: opts.bumpScale ?? 0.008,
  });

  if (opts.rimColor && (opts.rimStrength ?? 0) > 0) {
    const rimCol = new THREE.Color(opts.rimColor);
    const rimPow = opts.rimPower ?? 2.8;
    const rimStr = opts.rimStrength ?? 0.65;

    mat.customProgramCacheKey = () => `mythical-rim-${opts.cacheKey}`;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uMythRimColor = { value: rimCol };
      shader.uniforms.uMythRimPower = { value: rimPow };
      shader.uniforms.uMythRimStrength = { value: rimStr };

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
uniform vec3 uMythRimColor;
uniform float uMythRimPower;
uniform float uMythRimStrength;`
        )
        .replace(
          '#include <dithering_fragment>',
          `vec3 mythViewDir = normalize(vViewPosition);
float mythFresnel = pow(clamp(1.0 - abs(dot(normalize(normal), mythViewDir)), 0.0, 1.0), uMythRimPower);
gl_FragColor.rgb += uMythRimColor * mythFresnel * uMythRimStrength;
#include <dithering_fragment>`
        );
    };
  }

  return mat;
}

/**
 * Generates an organically curved, tapered avian feather blade (with gentle aerodynamic camber)
 * used for the Celestial Pegasus's radiant feathered energy wings.
 */
export function createSculptedFeatherGeometry(
  length = 0.32,
  width = 0.072,
  arch = 0.032
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.62, length * 0.22, width * 0.52, length * 0.75, 0, length);
  shape.bezierCurveTo(-width * 0.52, length * 0.75, -width * 0.62, length * 0.22, 0, 0);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.0022,
    bevelSegments: 2,
    curveSegments: 16,
  });

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp(y / Math.max(0.001, length), 0, 1);
    const bendZ = Math.sin(t * Math.PI) * arch - t * t * arch * 0.5;
    pos.setZ(i, pos.getZ(i) + bendZ);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/**
 * Generates a spiraled golden-crystal Kirin/Pegasus horn geometry.
 */
export function createSpiraledHornGeometry(length = 0.34, baseRadius = 0.026): THREE.BufferGeometry {
  const geom = new THREE.ConeGeometry(baseRadius, length, 20, 28);
  geom.translate(0, length / 2, 0);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = THREE.MathUtils.clamp(y / length, 0, 1);
    const angle = Math.atan2(z, x);
    const flute = 1 + Math.sin(angle * 3 + t * Math.PI * 10) * 0.14 * (1 - t * 0.65);
    // Gentle heroic backward/upward sweep
    const curveZ = -Math.sin(t * Math.PI * 0.5) * 0.028;
    pos.setXYZ(i, x * flute, y, z * flute + curveZ);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}
