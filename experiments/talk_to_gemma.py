"""Talk to gemma4:e2b via Ollama.

Push-to-talk REPL:
    1. Press ENTER  -> start recording from the mic
    2. Press ENTER  -> stop recording, send to Ollama, print + speak reply
    3. Ctrl-C       -> quit

Gemma 4 expects 16 kHz mono PCM WAV, clips up to ~30-60 seconds.
Ollama accepts audio through the chat `images` field (same channel as vision)
as either a file path or a base64 string. We send a file path for simplicity.

Setup (one-time, from the experiments/ folder):
    python -m venv .venv
    .venv\\Scripts\\pip install -r requirements.txt
    ollama pull gemma4:e2b
"""
from __future__ import annotations

import os
import queue
import sys
import tempfile
import threading
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import sounddevice as sd
from ollama import Client

# ---------- config ---------------------------------------------------------

MODEL = os.getenv("MODEL", "gemma4:e2b")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
SAMPLE_RATE = 16_000  # gemma audio encoder expects 16 kHz mono
CHANNELS = 1
DTYPE = "int16"
# A single user instruction sent alongside the audio. Tweak to taste.
SYSTEM_PROMPT = (
    "You are a friendly voice assistant. Listen to the user's audio and "
    "reply briefly in plain, spoken English. Do not transcribe — converse."
)


# ---------- audio capture --------------------------------------------------


@dataclass
class Recording:
    samples: np.ndarray
    sample_rate: int

    @property
    def duration_s(self) -> float:
        return self.samples.size / self.sample_rate

    def write_wav(self, path: Path) -> None:
        with wave.open(str(path), "wb") as w:
            w.setnchannels(CHANNELS)
            w.setsampwidth(2)  # int16
            w.setframerate(self.sample_rate)
            w.writeframes(self.samples.tobytes())


def record_until_enter() -> Recording:
    """Stream from the default input device until the user hits ENTER."""
    print("   [REC] speak now... press ENTER to stop", flush=True)
    q: queue.Queue[np.ndarray] = queue.Queue()
    stop = threading.Event()

    def _callback(indata, _frames, _time, status):
        if status:
            print(f"   audio status: {status}", file=sys.stderr)
        q.put(indata.copy())

    def _wait_for_enter():
        try:
            input()
        except EOFError:
            pass
        stop.set()

    waiter = threading.Thread(target=_wait_for_enter, daemon=True)
    waiter.start()

    chunks: list[np.ndarray] = []
    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        dtype=DTYPE,
        callback=_callback,
    ):
        while not stop.is_set():
            try:
                chunks.append(q.get(timeout=0.1))
            except queue.Empty:
                continue
        # drain anything still in the queue
        while not q.empty():
            chunks.append(q.get_nowait())

    samples = (
        np.concatenate(chunks, axis=0).flatten()
        if chunks
        else np.zeros(0, dtype=np.int16)
    )
    return Recording(samples=samples, sample_rate=SAMPLE_RATE)


# ---------- ollama call ----------------------------------------------------


class GemmaVoiceClient:
    """Thin wrapper around the Ollama chat API for audio messages."""

    def __init__(self, host: str = OLLAMA_HOST, model: str = MODEL) -> None:
        self.client = Client(host=host)
        self.model = model

    def reply_to_audio(self, wav_path: Path) -> str:
        response = self.client.chat(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": "Here is my voice message:",
                    # Ollama funnels audio through `images`. File path or base64
                    # both work; the client base64-encodes the file for us.
                    "images": [str(wav_path)],
                },
            ],
            options={"temperature": 0.4},
        )
        return response["message"]["content"].strip()


# ---------- optional TTS reply --------------------------------------------


KOKORO_VOICE = os.getenv("KOKORO_VOICE", "af_heart")
KOKORO_SAMPLE_RATE = 24_000  # Kokoro outputs 24 kHz float32 mono


def _try_load_tts():
    """Return a speak(text) callable, or None if no TTS backend is available.

    Preference order:
      1. Kokoro (neural, 24 kHz) — high quality, loads once
      2. Windows SAPI            — stateless system fallback
      3. pyttsx3                 — last-resort cross-platform fallback
    """
    speak = _load_kokoro() or _load_sapi() or _load_pyttsx3()
    return speak


def _load_kokoro():
    try:
        from kokoro import KPipeline  # type: ignore
    except ImportError:
        return None

    print(f"   loading Kokoro TTS (voice={KOKORO_VOICE})...", flush=True)
    try:
        pipeline = KPipeline(lang_code="a")  # 'a' = American English
    except Exception as exc:  # missing weights, no network, etc.
        print(f"   kokoro init failed: {exc}; falling back")
        return None

    def _speak(text: str) -> None:
        for _, _, audio in pipeline(text, voice=KOKORO_VOICE, speed=1):
            # Kokoro returns a torch.Tensor; sounddevice prefers numpy.
            if hasattr(audio, "cpu"):
                audio = audio.cpu().numpy()
            sd.play(np.asarray(audio, dtype=np.float32),
                    samplerate=KOKORO_SAMPLE_RATE)
            sd.wait()

    return _speak


def _load_sapi():
    if sys.platform != "win32":
        return None
    try:
        import win32com.client  # type: ignore
    except ImportError:
        return None
    sapi = win32com.client.Dispatch("SAPI.SpVoice")
    sapi.Rate = 1  # range -10..10

    def _speak(text: str) -> None:
        sapi.Speak(text, 0)  # 0 = synchronous

    return _speak


def _load_pyttsx3():
    try:
        import pyttsx3  # type: ignore
    except ImportError:
        return None

    def _speak(text: str) -> None:
        # Re-init per call — pyttsx3 reuses badly after the first runAndWait.
        engine = pyttsx3.init()
        engine.setProperty("rate", 185)
        engine.say(text)
        engine.runAndWait()
        engine.stop()

    return _speak


# ---------- repl -----------------------------------------------------------


def main() -> None:
    print(f"talking to {MODEL} via {OLLAMA_HOST}")
    print("press ENTER to start recording, ENTER again to send. Ctrl-C to quit.\n")

    speak = _try_load_tts()
    if speak is None:
        print("(pyttsx3 not installed -> replies will be printed only)\n")

    client = GemmaVoiceClient()

    while True:
        try:
            input("[ENTER to record] ")
        except (EOFError, KeyboardInterrupt):
            print("\nbye.")
            return

        rec = record_until_enter()
        if rec.duration_s < 0.3:
            print("   (nothing captured, try again)\n")
            continue

        print(f"   captured {rec.duration_s:.1f}s, asking {MODEL}...", flush=True)

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            wav_path = Path(tmp.name)
        try:
            rec.write_wav(wav_path)
            try:
                reply = client.reply_to_audio(wav_path)
            except Exception as exc:  # network, model missing, etc.
                print(f"   ollama error: {exc}\n")
                continue
        finally:
            wav_path.unlink(missing_ok=True)

        print(f"\n<< {reply}\n")
        if speak:
            speak(reply)


if __name__ == "__main__":
    main()
