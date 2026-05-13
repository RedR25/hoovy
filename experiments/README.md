# experiments/

Sandbox scripts. Each one stands alone — don't import from `app/`.

## talk_to_gemma.py

Voice REPL against `gemma4:e2b` via local Ollama.

### One-time setup
```powershell
cd experiments
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
ollama pull gemma4:e2b
```

### Run
```powershell
.\.venv\Scripts\python talk_to_gemma.py
```

Flow: **ENTER** → record → **ENTER** → send → printed (and spoken, if `pyttsx3` installed) reply. Ctrl-C to quit.

### Env overrides
- `MODEL` — defaults to `gemma4:e2b`. Try `gemma4:e4b` for quality, knowing it's heavier.
- `OLLAMA_HOST` — defaults to `http://localhost:11434`.
- `KOKORO_VOICE` — defaults to `af_heart`. See [Kokoro voices](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) — try `af_bella`, `am_michael`, `bf_emma`, etc.

### Notes
- Gemma 4 audio encoder expects 16 kHz mono PCM WAV, ≤ ~60 s per clip.
- Ollama currently exposes audio through the chat `images` field (same channel as vision). When/if a dedicated `audios` field lands, swap it in `GemmaVoiceClient.reply_to_audio`.
- TTS chain: **Kokoro → Windows SAPI → pyttsx3**. The first one that loads wins. Kokoro downloads its ~325 MB weights from HuggingFace on first run; subsequent runs are instant.
- To disable TTS entirely: uninstall all three (`pip uninstall kokoro pyttsx3`) — the script will detect no backend and print replies only.
