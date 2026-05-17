import { useCallback, useEffect, useRef, useState } from "react";

const WEBGAZER_CDN_URL = "https://cdn.jsdelivr.net/npm/webgazer@3.3.0/dist/webgazer.min.js";

/** Inject the WebGazer CDN script once, resolve when window.webgazer exists. */
function loadWebGazerFromCdn(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as unknown as { webgazer?: any };
  if (w.webgazer) return Promise.resolve(w.webgazer);

  return new Promise<any>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-hoovy-webgazer]`,
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (w.webgazer) resolve(w.webgazer);
        else reject(new Error("webgazer script loaded but global not set"));
      });
      existing.addEventListener("error", () => reject(new Error("webgazer script error")));
      return;
    }
    const s = document.createElement("script");
    s.src = WEBGAZER_CDN_URL;
    s.async = true;
    s.dataset.hoovyWebgazer = "1";
    s.onload = () => {
      if (w.webgazer) resolve(w.webgazer);
      else reject(new Error("webgazer script loaded but global not set"));
    };
    s.onerror = () => reject(new Error("failed to fetch webgazer from CDN"));
    document.head.appendChild(s);
  });
}

// We're not trusting WebGazer's gaze coordinates — its 2-param linear regression
// can't hit sub-screen accuracy without per-user calibration we won't have.
// Instead we use it as a face-presence sensor: it fires a (non-null) sample
// every time its internal face tracker locks on. No sample for N seconds → the
// kid walked away or turned their head. Patient by design — autistic learners
// need processing time, not pestering.
const FACE_ABSENT_THRESHOLD_MS = 5000;
const REDIRECT_DEBOUNCE_MS = 12000;
const HEARTBEAT_TICK_MS = 1000;

export type GazeStatus = "pending" | "tracking" | "denied" | "failed";

export interface UseGazeOptions {
  enabled: boolean;
  onAttentionDrop: () => void;
}

export interface UseGazeReturn {
  isInitialized: boolean;
  status: GazeStatus;
  errorMessage: string | null;
  hasFirstSample: boolean;
  /** True when WebGazer's face tracker is currently producing predictions. */
  facePresent: boolean;
  /** Seconds since the face was last seen. 0 while present. */
  awaySeconds: number;
}

export function useGaze({ enabled, onAttentionDrop }: UseGazeOptions): UseGazeReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<GazeStatus>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasFirstSample, setHasFirstSample] = useState(false);
  const [facePresent, setFacePresent] = useState(true);
  const [awaySeconds, setAwaySeconds] = useState(0);

  const lastFaceSeenAtRef = useRef(Date.now());
  const lastRedirectAtRef = useRef(0);
  const onAttentionDropRef = useRef(onAttentionDrop);
  onAttentionDropRef.current = onAttentionDrop;
  const wgRef = useRef<any>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const initWebGazer = useCallback(async () => {
    try {
      const wg = await loadWebGazerFromCdn();
      wgRef.current = wg;

      // Configure regression + listener BEFORE begin() — show*() methods touch
      // DOM nodes that don't exist until begin() resolves.
      wg.setRegression("ridge").saveDataAcrossSessions(false);

      wg.setGazeListener((data: { x: number; y: number } | null) => {
        // We don't care WHERE the face is looking, only THAT a face exists.
        // A non-null sample means the internal face tracker is producing
        // predictions, which only happens when it has a face lock.
        if (!data) return;
        lastFaceSeenAtRef.current = Date.now();
        if (!hasFirstSample) {
          setHasFirstSample(true);
          setStatus("tracking");
        }
      });

      await wg.begin();

      try {
        wg.showVideoPreview(false)
          .showPredictionPoints(false)
          .showFaceOverlay(false)
          .showFaceFeedbackBox(false);
      } catch {
        // ignore — older versions don't have all show* methods
      }

      lastFaceSeenAtRef.current = Date.now();
      setIsInitialized(true);

      cleanupRef.current = () => {
        try {
          wg.clearGazeListener();
          wg.end();
        } catch {
          // best effort
        }
        wgRef.current = null;
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[useGaze] WebGazer init failed:", err);
      setErrorMessage(msg);
      const isDenied =
        /permission|denied|NotAllowed|notallowed/i.test(msg) ||
        (err instanceof DOMException && err.name === "NotAllowedError");
      setStatus(isDenied ? "denied" : "failed");
    }
  }, [hasFirstSample]);

  useEffect(() => {
    if (!enabled) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
        setIsInitialized(false);
        setFacePresent(true);
        setAwaySeconds(0);
      }
      return;
    }
    initWebGazer();
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Heartbeat tick: derive face-present + away-seconds from the last sample
  // timestamp. Trigger a debounced redirect when the kid has been away too long.
  useEffect(() => {
    if (!isInitialized) return;
    const id = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastFaceSeenAtRef.current;
      const present = elapsedMs < FACE_ABSENT_THRESHOLD_MS;
      setFacePresent(present);
      if (present) {
        setAwaySeconds(0);
      } else {
        setAwaySeconds(Math.floor(elapsedMs / 1000));
        if (now - lastRedirectAtRef.current >= REDIRECT_DEBOUNCE_MS) {
          lastRedirectAtRef.current = now;
          onAttentionDropRef.current();
        }
      }
    }, HEARTBEAT_TICK_MS);
    return () => clearInterval(id);
  }, [isInitialized]);

  return {
    isInitialized,
    status,
    errorMessage,
    hasFirstSample,
    facePresent,
    awaySeconds,
  };
}
