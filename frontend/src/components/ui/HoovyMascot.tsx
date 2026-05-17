import { useEffect, useState } from "react";
import hoovyImg from "@/images/hoovy_base.png";

interface Props {
  size?: number;
  speaking?: boolean;
  pose?: "idle" | "wave" | "cheer";
  className?: string;
}

interface BBox {
  L: number; T: number; R: number; B: number; // visible bounds in image px
  W: number; H: number;                       // image natural size
}

// Detect the bounding box of non-transparent pixels once, cache the promise.
let bboxPromise: Promise<BBox | null> | null = null;
function detectBBox(): Promise<BBox | null> {
  if (bboxPromise) return bboxPromise;
  bboxPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Downscale for fast scan; bbox is then mapped back to natural coords.
        const MAX = 256;
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        const sw = W > H ? MAX : Math.round(MAX * (W / H));
        const sh = H >= W ? MAX : Math.round(MAX * (H / W));
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, sw, sh);
        const { data } = ctx.getImageData(0, 0, sw, sh);
        let minX = sw, minY = sh, maxX = -1, maxY = -1;
        const ALPHA_MIN = 16;
        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            if (data[(y * sw + x) * 4 + 3] > ALPHA_MIN) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0) { resolve(null); return; }
        // Map back to natural-image coordinates.
        const fx = W / sw, fy = H / sh;
        resolve({
          L: Math.floor(minX * fx),
          T: Math.floor(minY * fy),
          R: Math.ceil((maxX + 1) * fx),
          B: Math.ceil((maxY + 1) * fy),
          W,
          H,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = hoovyImg;
  });
  return bboxPromise;
}

/**
 * Hoovy mascot — renders hoovy_base.png cropped to its visible silhouette so
 * the `size` prop maps to the otter, not the transparent padding around it.
 * `speaking` adds a subtle bob.
 */
export function HoovyMascot({
  size = 200,
  speaking = false,
  pose: _pose = "idle",
  className = "",
}: Props) {
  const [bbox, setBbox] = useState<BBox | null>(null);
  useEffect(() => {
    let cancelled = false;
    detectBBox().then((b) => { if (!cancelled) setBbox(b); });
    return () => { cancelled = true; };
  }, []);

  const inner: React.CSSProperties = bbox
    ? (() => {
        const { L, T, R, B, W, H } = bbox;
        const bw = R - L;
        const bh = B - T;
        // Object-contain semantics for the visible silhouette.
        const scale = Math.min(size / bw, size / bh);
        const bgW = W * scale;
        const bgH = H * scale;
        const posX = size / 2 - ((L + R) / 2) * scale;
        const posY = size / 2 - ((T + B) / 2) * scale;
        return {
          backgroundImage: `url(${hoovyImg})`,
          backgroundSize: `${bgW}px ${bgH}px`,
          backgroundPosition: `${posX}px ${posY}px`,
          backgroundRepeat: "no-repeat",
          filter: "drop-shadow(0 8px 10px rgba(11, 61, 138, 0.25))",
        };
      })()
    : {
        // Pre-detection fallback: plain contain. Render is replaced once bbox resolves.
        backgroundImage: `url(${hoovyImg})`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };

  return (
    <div
      className={`relative inline-block ${speaking ? "animate-[hoovy-bob_1.6s_ease-in-out_infinite]" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-label="Hoovy"
      role="img"
    >
      <div className="w-full h-full" style={inner} />
      <style>{`
        @keyframes hoovy-bob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-6px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}
