#!/usr/bin/env python
"""qwen_tts.py — Qwen3-TTS-12Hz on CPU.

Uses the `qwen-tts` package with natural-language `instruct` for emotion + pacing.

Usage (run from repo root with backend venv active):
    python scripts/qwen_tts.py vo.txt
    python scripts/qwen_tts.py vo.txt --speaker Vivian --out hoovy_vo.wav
"""
from __future__ import annotations

import argparse
import re
import sys
import time
from pathlib import Path

PARAGRAPH_PAUSE_S = 0.7

MODEL_ID = "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"

INSTRUCT = (
    "Speak slowly and warmly, like a gentle cinematic narrator for a children's "
    "documentary. Use real pauses at ellipses. Convey hope, tenderness, and "
    "quiet conviction. Soft, emotional, unhurried."
)


def split_paragraphs(text: str) -> list[str]:
    paras = re.split(r"\n\s*\n", text.strip())
    return [p.strip() for p in paras if p.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(description="Qwen3-TTS-12Hz (CPU).")
    parser.add_argument("text_file", type=Path, help="Path to a .txt file (blank-line separated paragraphs)")
    parser.add_argument("--language", default="English")
    parser.add_argument("--instruct", default=INSTRUCT, help="Natural-language voice/emotion control")
    parser.add_argument("--out", default="hoovy_vo.wav")
    parser.add_argument("--model", default=MODEL_ID)
    args = parser.parse_args()

    if not args.text_file.exists():
        sys.exit(f"file not found: {args.text_file}")

    text = args.text_file.read_text(encoding="utf-8")
    paragraphs = split_paragraphs(text)
    print(f"loaded {len(paragraphs)} paragraphs from {args.text_file}")

    print(f"loading {args.model} on CPU…", flush=True)
    import numpy as np
    import soundfile as sf
    import torch
    from qwen_tts import Qwen3TTSModel

    t0 = time.time()
    model = Qwen3TTSModel.from_pretrained(
        args.model,
        device_map="cpu",
        dtype=torch.float32,
    )
    print(f"model loaded in {time.time() - t0:.1f}s", flush=True)

    chunks: list = []
    sample_rate: int | None = None

    for i, para in enumerate(paragraphs, 1):
        t = time.time()
        print(f"[{i}/{len(paragraphs)}] {len(para)} chars …", flush=True)
        wavs, sr = model.generate_voice_design(
            text=para,
            language=args.language,
            instruct=args.instruct,
        )
        audio = np.asarray(wavs[0], dtype=np.float32)
        if sample_rate is None:
            sample_rate = sr
        chunks.append(audio)
        chunks.append(np.zeros(int(PARAGRAPH_PAUSE_S * sample_rate), dtype=np.float32))
        print(f"  → {len(audio) / sample_rate:.1f}s audio in {time.time() - t:.1f}s", flush=True)

    full = np.concatenate(chunks, axis=0)
    out_path = Path(args.out).resolve()
    sf.write(out_path, full, sample_rate, subtype="PCM_16")
    print(f"\nwrote {out_path} ({len(full) / sample_rate:.1f}s @ {sample_rate} Hz)")


if __name__ == "__main__":
    main()
