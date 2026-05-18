#!/usr/bin/env python
"""tts.py — paste text in, get one WAV out.

Usage (run from repo root with backend venv active):
    python scripts/tts.py "Hi there! I'm Hoovy. Want to play?"
    python scripts/tts.py --voice af_bella --speed 0.9 --out hello.wav "..."
    echo "long text" | python scripts/tts.py --stdin

Pacing/emotion comes from Kokoro reading punctuation (. , ! ? ...) naturally,
plus a short pause inserted between sentences. Pick an expressive voice for
warmer delivery — af_bella (default) and af_sky are the friendliest.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "backend"))

SAMPLE_RATE = 24_000
INTER_SENTENCE_PAUSE_S = 0.25


def split_sentences(text: str) -> list[str]:
    """Split on sentence-ending punctuation, keeping the punctuation attached."""
    parts = re.split(r'(?<=[.!?…])["”’\'"]?\s+', text.strip())
    return [p for p in parts if p]


def synthesize(text: str, voice: str, speed: float) -> "np.ndarray":
    from kokoro import KPipeline
    import numpy as np

    pipeline = KPipeline(lang_code="a")  # 'a' = American English
    pause = np.zeros(int(INTER_SENTENCE_PAUSE_S * SAMPLE_RATE), dtype=np.float32)

    chunks: list = []
    for sentence in split_sentences(text):
        for _, _, audio in pipeline(sentence, voice=voice, speed=speed):
            if audio is None:
                continue
            arr = audio.numpy() if hasattr(audio, "numpy") else np.asarray(audio)
            chunks.append(arr.astype(np.float32))
        chunks.append(pause)

    if not chunks:
        return np.zeros(int(0.3 * SAMPLE_RATE), dtype=np.float32)
    return np.concatenate(chunks, axis=0)


def main() -> None:
    parser = argparse.ArgumentParser(description="Kokoro TTS — text in, WAV out.")
    parser.add_argument("text", nargs="?", help="Text to speak (omit with --stdin)")
    parser.add_argument("--stdin", action="store_true", help="Read text from stdin")
    parser.add_argument("--voice", default="af_bella", help="Kokoro voice (default: af_bella)")
    parser.add_argument("--speed", type=float, default=0.95, help="Speech speed (default: 0.95)")
    parser.add_argument("--out", default="out.wav", help="Output WAV path (default: out.wav)")
    args = parser.parse_args()

    if args.stdin:
        text = sys.stdin.read()
    elif args.text:
        text = args.text
    else:
        parser.error("provide text as an argument or use --stdin")

    text = text.strip()
    if not text:
        parser.error("empty input")

    print(f"synthesizing {len(text)} chars (voice={args.voice}, speed={args.speed})…")
    audio = synthesize(text, voice=args.voice, speed=args.speed)

    import soundfile as sf
    out_path = Path(args.out).resolve()
    sf.write(out_path, audio, SAMPLE_RATE, subtype="PCM_16")
    print(f"wrote {out_path} ({len(audio) / SAMPLE_RATE:.1f}s)")


if __name__ == "__main__":
    main()
