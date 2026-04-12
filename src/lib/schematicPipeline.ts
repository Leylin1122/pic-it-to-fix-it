/**
 * Turns a photo into a high-contrast B&W "blueprint" (Sobel-style edges).
 * Runs on a downscaled copy so the UI stays responsive on phones.
 */

const MAX_PROCESS_WIDTH = 960;

function grayscale(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const g = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    g[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return g;
}

function sobelMagnitude(g: Float32Array, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sx = 0;
      let sy = 0;
      let k = 0;
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const v = g[(y + j) * w + (x + i)];
          sx += v * gx[k];
          sy += v * gy[k];
          k++;
        }
      }
      out[y * w + x] = Math.hypot(sx, sy);
    }
  }
  return out;
}

function normalizeAndThreshold(
  mag: Float32Array,
  w: number,
  h: number,
): Uint8ClampedArray {
  let max = 0;
  for (let i = 0; i < mag.length; i++) {
    if (mag[i] > max) max = mag[i];
  }
  const out = new Uint8ClampedArray(w * h * 4);
  const t = max > 0 ? max * 0.12 : 1;
  for (let i = 0; i < mag.length; i++) {
    const v = max > 0 ? Math.min(255, (mag[i] / max) * 400) : 0;
    const b = v > t ? 255 : 0;
    const j = i * 4;
    out[j] = b;
    out[j + 1] = b;
    out[j + 2] = b;
    out[j + 3] = 255;
  }
  return out;
}

export function imageDataUrlToSchematicDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_PROCESS_WIDTH / img.naturalWidth);
        const w = Math.max(2, Math.round(img.naturalWidth * scale));
        const h = Math.max(2, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas unsupported"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const src = ctx.getImageData(0, 0, w, h);
        const gray = grayscale(src.data, w, h);
        const mag = sobelMagnitude(gray, w, h);
        const bw = normalizeAndThreshold(mag, w, h);
        const out = ctx.createImageData(w, h);
        out.data.set(bw);
        ctx.putImageData(out, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = dataUrl;
  });
}
