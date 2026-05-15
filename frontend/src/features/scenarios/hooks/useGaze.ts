import { useCallback, useEffect, useRef, useState } from "react";

const THROTTLE_MS = 250; // ~4 Hz
const OFF_SCREEN_THRESHOLD_MS = 3000;
const REDIRECT_DEBOUNCE_MS = 8000;
const DEFAULT_MARGIN_PX = 40;

export interface UseGazeOptions {
  enabled: boolean;
  onAttentionDrop: () => void;
  viewportMarginPx?: number;
}

export interface UseGazeReturn {
  isInitialized: boolean;
  isCalibrated: boolean;
  gazePosition: { x: number; y: number } | null;
  currentlyOnScreen: boolean;
  offScreenSeconds: number;
}

export function useGaze({
  enabled,
  onAttentionDrop,
  viewportMarginPx = DEFAULT_MARGIN_PX,
}: UseGazeOptions): UseGazeReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCalibrated] = useState(
    () => localStorage.getItem("hoovy_gaze_calibrated") === "true",
  );
  const [gazePosition, setGazePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [currentlyOnScreen, setCurrentlyOnScreen] = useState(true);
  const [offScreenSeconds, setOffScreenSeconds] = useState(0);

  // Refs for timing — avoid stale closures in gaze listener
  const lastThrottleRef = useRef(0);
  const lastOnScreenAtRef = useRef(Date.now());
  const lastRedirectAtRef = useRef(0);
  const offScreenAccRef = useRef(0); // accumulated off-screen ms
  const onAttentionDropRef = useRef(onAttentionDrop);
  onAttentionDropRef.current = onAttentionDrop;

  const cleanupRef = useRef<(() => void) | null>(null);

  const initWebGazer = useCallback(async () => {
    try {
      const wg = (await import("webgazer")).default;

      wg.saveDataAcrossSessions(false)
        .showVideoPreview(false)
        .showPredictionPoints(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false);

      wg.setGazeListener(
        (data: { x: number; y: number } | null, _ts: number) => {
          const now = Date.now();
          // Throttle to ~4 Hz
          if (now - lastThrottleRef.current < THROTTLE_MS) return;
          lastThrottleRef.current = now;

          if (!data) return;

          const { x, y } = data;
          setGazePosition({ x, y });

          const margin = viewportMarginPx;
          const onScreen =
            x >= margin &&
            x <= window.innerWidth - margin &&
            y >= margin &&
            y <= window.innerHeight - margin;

          setCurrentlyOnScreen(onScreen);

          if (onScreen) {
            lastOnScreenAtRef.current = now;
          } else {
            // Accumulate off-screen time
            const elapsed = now - lastOnScreenAtRef.current;
            if (elapsed > OFF_SCREEN_THRESHOLD_MS) {
              offScreenAccRef.current += THROTTLE_MS;
              setOffScreenSeconds(Math.floor(offScreenAccRef.current / 1000));

              // Fire redirect with debounce
              if (now - lastRedirectAtRef.current >= REDIRECT_DEBOUNCE_MS) {
                lastRedirectAtRef.current = now;
                onAttentionDropRef.current();
              }
            }
          }
        },
      );

      await wg.begin();
      setIsInitialized(true);

      cleanupRef.current = () => {
        try {
          wg.clearGazeListener();
          wg.end();
        } catch {
          // best effort
        }
      };
    } catch (err) {
      // Camera denied or webgazer failed — fail silently
      console.warn("[useGaze] WebGazer init failed:", err);
    }
  }, [viewportMarginPx]);

  useEffect(() => {
    if (!enabled) {
      // Clean up if previously running
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
        setIsInitialized(false);
        setGazePosition(null);
        setCurrentlyOnScreen(true);
        setOffScreenSeconds(0);
        offScreenAccRef.current = 0;
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

  return {
    isInitialized,
    isCalibrated,
    gazePosition,
    currentlyOnScreen,
    offScreenSeconds,
  };
}
