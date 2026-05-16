import { useCallback, useEffect, useRef, useState } from "react";

interface UseAudioInOptions {
  /** Stop when this much continuous silence is detected after speech started. */
  silenceMs?: number;
  /** Don't trigger auto-stop until at least this many ms of speech captured. */
  minSpeechMs?: number;
  /** Absolute upper bound (safety cap). */
  maxRecordingMs?: number;
  /** RMS [0..1] above which a frame counts as "speech". 0.02 is a quiet room baseline. */
  speechRmsThreshold?: number;
}

interface UseAudioInReturn {
  start: () => void;
  stop: () => void;
  isRecording: boolean;
  blob: Blob | null;
  mimeType: string;
  error: string | null;
  /** Current normalized audio level [0..1] for UI feedback. */
  level: number;
}

function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

export function useAudioIn(opts: UseAudioInOptions = {}): UseAudioInReturn {
  const {
    silenceMs = 1500,
    minSpeechMs = 600,
    maxRecordingMs = 15000,
    speechRmsThreshold = 0.025,
  } = opts;

  const [isRecording, setIsRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const mimeType = useRef<string>(getSupportedMimeType());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // VAD state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const speechStartedAtRef = useRef<number | null>(null);
  const lastSpeechAtRef = useRef<number>(0);

  const teardownVad = useCallback(() => {
    if (vadRafRef.current !== null) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevel(0);
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    teardownVad();
  }, [teardownVad]);

  const start = useCallback(() => {
    setBlob(null);
    setError(null);
    chunksRef.current = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        const options = mimeType.current ? { mimeType: mimeType.current } : {};
        const recorder = new MediaRecorder(stream, options);
        recorderRef.current = recorder;
        mimeType.current = recorder.mimeType;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const recorded = new Blob(chunksRef.current, { type: mimeType.current });
          setBlob(recorded);
          setIsRecording(false);
          cleanupStream();
          teardownVad();
        };

        // ── Wire up VAD on the same MediaStream ────────────────────────────
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        analyserRef.current = analyser;

        const buf = new Float32Array(analyser.fftSize);
        startedAtRef.current = Date.now();
        speechStartedAtRef.current = null;
        lastSpeechAtRef.current = Date.now();

        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getFloatTimeDomainData(buf);
          // RMS
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const rms = Math.sqrt(sum / buf.length);
          setLevel(Math.min(1, rms * 3));

          const now = Date.now();
          if (rms > speechRmsThreshold) {
            if (speechStartedAtRef.current === null) speechStartedAtRef.current = now;
            lastSpeechAtRef.current = now;
          }

          const totalMs = now - startedAtRef.current;
          const speechMs = speechStartedAtRef.current
            ? now - speechStartedAtRef.current
            : 0;
          const silenceSince = now - lastSpeechAtRef.current;

          // Safety cap
          if (totalMs > maxRecordingMs) {
            console.log("[hoovy] VAD: hit max recording cap, stopping");
            stop();
            return;
          }
          // Auto-stop on long pause AFTER they've spoken enough
          if (speechMs > minSpeechMs && silenceSince > silenceMs) {
            console.log("[hoovy] VAD: silence detected, stopping", {
              speechMs,
              silenceSince,
            });
            stop();
            return;
          }

          vadRafRef.current = requestAnimationFrame(tick);
        };
        vadRafRef.current = requestAnimationFrame(tick);

        recorder.start();
        setIsRecording(true);
      })
      .catch(() => {
        setError("Microphone permission denied");
        setIsRecording(false);
        teardownVad();
      });
  }, [cleanupStream, teardownVad, stop, maxRecordingMs, minSpeechMs, silenceMs, speechRmsThreshold]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      cleanupStream();
      teardownVad();
    };
  }, [cleanupStream, teardownVad]);

  return { start, stop, isRecording, blob, mimeType: mimeType.current, error, level };
}
