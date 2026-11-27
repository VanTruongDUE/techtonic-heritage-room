import * as THREE from 'three';

export const JOURNEY_VIDEO_URL = '/assets/videos/techtonic-journey.mp4?v=2';

interface CinemaPoolState {
  video: HTMLVideoElement | null;
  texture: THREE.VideoTexture | null;
  preloaded: boolean;
}

const pool: CinemaPoolState = {
  video: null,
  texture: null,
  preloaded: false,
};

function ensurePoolInitialized(): { video: HTMLVideoElement; texture: THREE.VideoTexture } {
  if (!pool.video) {
    const video = document.createElement('video');
    video.src = JOURNEY_VIDEO_URL;
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.preload = 'auto';
    video.loop = false;
    pool.video = video;
  }

  if (!pool.texture) {
    const tex = new THREE.VideoTexture(pool.video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    pool.texture = tex;
  }

  return { video: pool.video, texture: pool.texture };
}

/**
 * Lazily creates the singleton HTMLVideoElement & VideoTexture and triggers
 * silent HTTP pre-buffering while paused at frame 0 so Cinema launches smoothly.
 */
export function preloadCinemaVideo(): HTMLVideoElement {
  const { video } = ensurePoolInitialized();
  if (!pool.preloaded) {
    pool.preloaded = true;
    try {
      video.pause();
      video.load();
    } catch {
      // Ignore browser load errors when offline
    }
  }
  return video;
}

export function getCinemaMedia(): { video: HTMLVideoElement; texture: THREE.VideoTexture } {
  const media = ensurePoolInitialized();
  if (!pool.preloaded) {
    preloadCinemaVideo();
  }
  return media;
}

export function isCinemaVideoBuffered(): boolean {
  return Boolean(pool.video && pool.video.readyState >= 3);
}

export function pauseAndResetCinemaVideo(): void {
  if (!pool.video) return;
  try {
    pool.video.pause();
    pool.video.currentTime = 0;
  } catch {
    // Ignore transient seek before metadata ready
  }
}
