import { useCallback, useEffect, useRef, useState } from "react";

interface UseAudioInReturn {
  start: () => void;
  stop: () => void;
  isRecording: boolean;
  blob: Blob | null;
  mimeType: string;
  error: string | null;
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

export function useAudioIn(): UseAudioInReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mimeType = useRef<string>(getSupportedMimeType());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

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
        };

        recorder.start();
        setIsRecording(true);
      })
      .catch(() => {
        setError("Microphone permission denied");
        setIsRecording(false);
      });
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      cleanupStream();
    };
  }, []);

  return { start, stop, isRecording, blob, mimeType: mimeType.current, error };
}
