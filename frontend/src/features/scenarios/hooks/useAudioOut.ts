import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

interface UseAudioOutReturn {
  play: (text: string) => void;
  /** Play a base64-encoded WAV (no data: prefix). Returns a Promise that resolves when playback ends. */
  playDataUrl: (b64: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  /** Duration of the loaded audio clip in seconds (0 until loaded). */
  duration: number;
  error: string | null;
}

export function useAudioOut(): UseAudioOutReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    revokeObjectUrl();
    setIsPlaying(false);
    setDuration(0);
  }, []);

  const play = useCallback(
    (text: string) => {
      // Cancel any in-flight request and reset playback
      stop();

      if (!text.trim()) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);

      axios
        .post(
          "/api/v1/tts",
          { text },
          { responseType: "arraybuffer", signal: controller.signal },
        )
        .then((res) => {
          const blob = new Blob([res.data], { type: "audio/wav" });
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;

          const audio = new Audio(url);
          audioRef.current = audio;

          audio.addEventListener("loadedmetadata", () => {
            setDuration(audio.duration);
          });

          audio.addEventListener("play", () => setIsPlaying(true));
          audio.addEventListener("ended", () => {
            setIsPlaying(false);
            revokeObjectUrl();
          });
          audio.addEventListener("pause", () => setIsPlaying(false));
          audio.addEventListener("error", () => {
            setIsPlaying(false);
            setError("Audio playback error");
            revokeObjectUrl();
          });

          audio.play().catch((err: unknown) => {
            if ((err as Error)?.name !== "AbortError") {
              setError("Failed to play audio");
            }
            setIsPlaying(false);
          });
        })
        .catch((err: unknown) => {
          if (axios.isCancel(err)) return;
          setError("Failed to fetch audio");
          setIsPlaying(false);
        });
    },
    [stop],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      revokeObjectUrl();
    };
  }, []);

  const playDataUrl = useCallback(
    (b64: string): Promise<void> => {
      stop();
      return new Promise((resolve, reject) => {
        const dataUrl = `data:audio/wav;base64,${b64}`;
        const audio = new Audio(dataUrl);
        audioRef.current = audio;

        audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
        audio.addEventListener("play", () => setIsPlaying(true));
        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          resolve();
        });
        audio.addEventListener("pause", () => setIsPlaying(false));
        audio.addEventListener("error", () => {
          setIsPlaying(false);
          setError("Audio playback error");
          reject(new Error("playback error"));
        });

        audio.play().catch((err: unknown) => {
          setIsPlaying(false);
          reject(err);
        });
      });
    },
    [stop],
  );

  return { play, playDataUrl, stop, isPlaying, duration, error };
}
