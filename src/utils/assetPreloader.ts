/**
 * Preloads & decodes critical local museum images into browser memory while the LoadingScreen
 * is visible so all 37 photo pedestals, tunnel frames, and team photos appear instantly
 * with ZERO mid-walk pop-in or frame-drop spikes.
 */
const CRITICAL_GALLERY_ASSETS: string[] = [
  '/assets/techtonic-logo.svg',
  '/assets/images/gallery/btt_team.jpg',
  '/assets/images/gallery/bcm_team.jpg',
  '/assets/images/gallery/CSLT7_1.webp',
  '/assets/images/gallery/CSLT3_1.webp',
  '/assets/images/gallery/mm2.webp',
  '/assets/images/gallery/mm6.webp',
  '/assets/images/gallery/mm8.webp',
  '/assets/images/gallery/mm9.webp',
  '/assets/images/gallery/ntnm2.webp',
  '/assets/images/gallery/ntnm3.webp',
  '/assets/images/gallery/tw10.webp',
  '/assets/images/gallery/tw3.webp',
  '/assets/images/gallery/tw4.webp',
  '/assets/images/gallery/tw6.webp',
  '/assets/images/gallery/tx2.webp',
  '/assets/images/gallery/tx3.webp',
  '/assets/images/gallery/tx4.webp',
  '/assets/images/activity/cshd.webp',
  '/assets/images/activity/mentor_mentee.webp',
  '/assets/images/activity/ntn_mis.webp',
  '/assets/images/activity/olp_icpc.webp',
  '/assets/images/activity/techware.webp',
  '/assets/images/achievement/mgm_technology.webp',
  '/assets/images/achievement/vtc_academy.webp',
  '/assets/images/tunnel/cslt_1.webp',
  '/assets/images/tunnel/mentor_mentee_ss1.webp',
  '/assets/images/tunnel/mentor_mentee_ss2.webp',
  '/assets/images/tunnel/mm1.webp',
  '/assets/images/tunnel/nckh_s1.webp',
  '/assets/images/tunnel/ntnm1.webp',
  '/assets/images/tunnel/tech_x_plore.webp',
  '/assets/images/tunnel/techware_ss1.webp',
  '/assets/images/tunnel/tw1.webp',
  '/assets/images/tunnel/tx1.webp',
];

const CRITICAL_MASCOT_MODELS: string[] = [
  '/models/mascots/wolf.glb',
  '/models/mascots/horse.glb',
  '/models/mascots/fox.glb',
  '/models/mascots/stag.glb',
];

function preloadBinaryModel(url: string): Promise<void> {
  return fetch(url, { cache: 'force-cache' })
    .then((res) => (res.ok ? res.arrayBuffer() : undefined))
    .then(() => undefined)
    .catch(() => undefined);
}

function preloadSingleImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    const done = () => resolve();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    };
    img.onerror = done;
    img.src = url;
  });
}

/**
 * Concurrently preloads all local museum assets in smooth batches of 6,
 * calling onProgress(0..1) after each image settles, with a guaranteed safety timeout
 * so slow networks never stall the entrance screen.
 */
export function preloadMuseumAssets(
  onProgress: (ratio: number) => void,
  timeoutMs = 5200
): Promise<void> {
  const total = CRITICAL_GALLERY_ASSETS.length + CRITICAL_MASCOT_MODELS.length;
  let completed = 0;
  let settled = false;

  return new Promise((resolve) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      onProgress(1);
      resolve();
    };

    const safetyTimer = window.setTimeout(finish, timeoutMs);

    const runBatches = async () => {
      // Kick off the 4 rigged mythical mascot GLB models concurrently first so GPU parse starts early
      const modelPromises = CRITICAL_MASCOT_MODELS.map(async (url) => {
        await preloadBinaryModel(url);
        completed += 1;
        if (!settled) {
          onProgress(Math.min(1, completed / total));
        }
      });

      const batchSize = 6;
      for (let i = 0; i < CRITICAL_GALLERY_ASSETS.length; i += batchSize) {
        if (settled) return;
        const slice = CRITICAL_GALLERY_ASSETS.slice(i, i + batchSize);
        await Promise.all(
          slice.map(async (url) => {
            await preloadSingleImage(url);
            completed += 1;
            if (!settled) {
              onProgress(Math.min(1, completed / total));
            }
          })
        );
      }

      await Promise.all(modelPromises);
      window.clearTimeout(safetyTimer);
      finish();
    };

    void runBatches();
  });
}
