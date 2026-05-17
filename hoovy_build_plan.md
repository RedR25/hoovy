# Hoovy — Build Plan

**For the Gemma 4 Impact Hackathon.**
Special-education web app for Vietnamese students with intellectual disabilities. Powered by Gemma 4 E2B on Ollama (audio + text), Kokoro TTS, Gemini 2.5 Flash Image (Nano Banana), and WebGazer.js. Architecture: monolith. Demo runs in English (see §0.1); Vietnamese is a Piper TTS swap. Goal: 7 vertical slices, each testable end-to-end.

---

## 0. Reality check on the stack (v1.1, post-audio verification)

| Component | Verdict | Recommendation |
|---|---|---|
| Gemma 4 E2B text in/out (Ollama) | ✅ Real | Primary reasoning brain |
| Gemma 4 E2B **audio input** via Ollama `images` field | ✅ Verified working | The mmproj projector handles both vision and audio encoders for E-series. Audio bytes ride on the `images` channel. **One Gemma call now does STT + evaluation + response generation in a single round-trip.** |
| Kokoro TTS (`remsky/Kokoro-FastAPI`) | ✅ Real, 82M params, Apache | Local Docker service; OpenAI-compatible `/v1/audio/speech` endpoint |
| Kokoro Vietnamese voice support | ⚠ "Coming soon" per upstream | **Decision needed** — see §0.1 below |
| Nano Banana (Gemini 2.5 Flash Image) | ✅ Real | Pre-generate all assets before demo, cache to disk |
| WebGazer.js for gaze | ✅ Real | Browser-only, MIT license |

**Architecture win:** the audio-in trick collapses what used to be three services (STT + LLM + TTS) into two (Gemma for everything except speech synthesis, plus Kokoro for output). One Gemma call handles transcription, evaluation, and response generation. This is a stronger demo story *and* a cleaner architecture.

### 0.1 Language decision — LOCKED: English-first demo

**Decision (May 13):** demo in English using Kokoro v1.0. Pitch positions the product as "Vietnamese-first by design, demoed in English for international judges." Vietnamese path becomes post-hackathon work using Piper TTS.

**What this means in practice:**

| Surface | Language | Voice/source |
|---|---|---|
| Teacher voice (Kokoro TTS) | English | `af_bella` (warm, clear) at speed 0.9 |
| Scenario JSON `teacher_prompt` | English primary, Vietnamese kept as `_vi` field for the story | author both |
| Gemma evaluation prompt | English | system prompt in English, expects English audio |
| Speech bubble | English | matches what the teacher speaks |
| App UI chrome (buttons, headers) | English | "Playground" not "Sân chơi" |
| Avatar names | English-friendly | "Ms. Linh" works, "Cô Linh" reserved for v2 |
| Product name | **Hoovy** | distinctive, short, easy to say internationally |

**The pitch frame, restated for English demo:**
> "Hoovy is an AI learning companion designed for Vietnamese students with intellectual disabilities. We're demoing in English so you can experience the interaction directly. The same system runs in Vietnamese with a Piper TTS swap — one file change."

That positioning is honest, it's specific, and it turns the language choice into a deliberate design decision rather than a workaround.

### 0.2 What you DON'T do because of this decision

- ❌ Don't write any Vietnamese teacher prompts that have to be demoed live (only `_vi` fields kept for the "look, we have it bilingually" moment in the pitch)
- ❌ Don't waste time configuring Vietnamese voices in Kokoro
- ❌ Don't worry about Vietnamese STT accuracy in Gemma — only English audio paths get tested
- ❌ Don't generate Vietnamese-text overlays on images via Nano Banana (English text or no text)

### 0.3 What you ADD because of this decision

- ✅ One Vietnamese-language scenario kept in the codebase (not demoed live) so you can pull it up if a judge asks "show me the Vietnamese version"
- ✅ A `LANG=en` / `LANG=vi` env var in the backend that switches Kokoro voice + system prompts — proves the bilingual claim with a flag flip, no code change

**Bottom line:** Gemma 4 E2B does all reasoning + audio understanding. Kokoro speaks. Browser handles audio capture + gaze. Three services total. Clean.

---

## 1. Final architecture (monolith, v1.1)

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (laptop / phone)                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  React + Vite + TypeScript + Tailwind                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐            │  │
│  │  │ Playground│ │ Scenario │ │ Author (admin)  │            │  │
│  │  └──────────┘ └──────────┘ └─────────────────┘            │  │
│  │                                                           │  │
│  │  Browser APIs (capture + tracking only):                  │  │
│  │   • MediaRecorder (capture kid's audio → upload)          │  │
│  │   • <audio> element (play TTS bytes from backend)         │  │
│  │   • WebGazer.js (gaze detection)                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                       │  HTTP / JSON
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI backend (single process)                               │
│  ┌─────────────────────────────────────────────────┐            │
│  │  /api/scenarios     scenario library            │            │
│  │  /api/sessions      sessions + trials           │            │
│  │  /api/evaluate      audio in → Gemma → response │  ← core    │
│  │  /api/tts           text in → Kokoro audio out  │            │
│  │  /api/images        Nano Banana proxy + cache   │            │
│  │  /api/author        scenario generator (Gemma)  │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
       │                          │                         │
       ▼                          ▼                         ▼
┌──────────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│ Ollama           │    │ Kokoro-FastAPI      │    │ SQLite (file)    │
│  gemma4:e2b      │    │  (Docker)           │    │  sessions, trials│
│  audio + text    │    │  /v1/audio/speech   │    │  attention_logs  │
│  :11434          │    │  :8880              │    │                  │
└──────────────────┘    └─────────────────────┘    └──────────────────┘
       │
       └─→ Gemini 2.5 Flash Image API (Nano Banana, cloud, cached locally)

Scenario library: /scenarios/*.json (version-controlled, not in DB)
```

**The audio flow (the heart of it):**
```
Kid taps mic → MediaRecorder captures WAV
            → POST /api/evaluate (multipart: audio + step_id + session_id)
            → backend base64-encodes audio
            → ONE Ollama call: gemma4:e2b with audio in `images` field
              ├─ transcribes the audio
              ├─ evaluates against expected response
              └─ generates praise OR hint as response text
            → backend POST /api/tts with that response text
            → Kokoro returns audio bytes
            → backend returns {transcript, correct, teacher_text, teacher_audio_url}
            → browser plays teacher_audio_url
```

Three services. One Gemma call per kid response. Clean.

**Why monolith:** the backend-architecture reference explicitly recommends monoliths for "startups, MVPs, small teams, unclear domain boundaries." That is exactly your situation. Microservices would burn 6 hours on plumbing you don't need.

---

## 2. File structure

```
hoovy/
├── README.md                    # quickstart
├── Makefile                     # make up, make test, make seed
├── docker-compose.yml           # ollama + backend (optional, can run native)
├── .env.example
│
├── backend/
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py              # FastAPI entry
│   │   ├── config.py            # pydantic-settings, .env loader
│   │   ├── db.py                # sqlite + sqlmodel
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── scenarios.py     # GET list, GET one
│   │   │   ├── sessions.py      # POST session, POST trial, GET progress
│   │   │   ├── evaluate.py      # POST audio → Gemma → response (the core)
│   │   │   ├── tts.py           # POST text → Kokoro audio bytes
│   │   │   ├── images.py        # POST /images/generate
│   │   │   └── author.py        # POST /author/scenario
│   │   ├── services/
│   │   │   ├── ollama_client.py # gemma4:e2b wrapper (audio + text)
│   │   │   ├── kokoro_client.py # Kokoro-FastAPI TTS wrapper
│   │   │   ├── image_gen.py     # Nano Banana wrapper + disk cache
│   │   │   ├── scenario_io.py   # load/save JSON files
│   │   │   └── ebp.py           # trial scoring, prompt fade logic
│   │   ├── models/
│   │   │   ├── scenario.py      # Pydantic models matching JSON schema
│   │   │   ├── session.py       # SQLModel for DB
│   │   │   └── trial.py         # SQLModel for DB
│   │   └── prompts/             # system prompts for Gemma (one file each)
│   │       ├── evaluate_response.txt
│   │       ├── encourage.txt
│   │       └── author_scenario.txt
│   └── tests/
│       ├── test_health.py
│       ├── test_scenarios.py
│       ├── test_chat.py
│       ├── test_ebp.py
│       └── test_author.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/
│   │   │   ├── Playground.tsx   # scenario picker
│   │   │   ├── Scenario.tsx     # the trial runner
│   │   │   └── Author.tsx       # admin
│   │   ├── components/
│   │   │   ├── VirtualTeacher.tsx
│   │   │   ├── SpeechBubble.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── ResponseInput.tsx
│   │   │   ├── ScenarioCard.tsx
│   │   │   └── GazeMonitor.tsx
│   │   ├── hooks/
│   │   │   ├── useTeacher.ts    # orchestrates a step's lifecycle
│   │   │   ├── useAudioOut.ts   # plays TTS audio from backend
│   │   │   ├── useAudioIn.ts    # MediaRecorder wrapper, returns WAV blob
│   │   │   ├── useGaze.ts       # wraps WebGazer
│   │   │   └── useSession.ts    # backend session API
│   │   ├── lib/
│   │   │   ├── api.ts           # fetch wrapper, typed
│   │   │   └── types.ts         # shared TS types (mirror backend models)
│   │   └── styles/
│   │       └── index.css        # Tailwind base + kid-friendly tokens
│   └── tests/
│       └── ... (Vitest, optional)
│
└── scenarios/                   # the scenario library
    ├── greet-teacher.json
    ├── count-change-5k.json
    ├── ...
    └── _images/                 # cached image gen outputs
        └── greet-teacher/
            ├── step-1.png
            └── step-2.png
```

Three top-level directories. One backend, one frontend, one data folder. Anyone on your team can navigate this in 2 minutes.

---

## 3. The Scenario JSON schema (the heart of the system)

Every scenario is one JSON file. Author tool generates them, the runtime consumes them. Schema is intentionally tiny.

```jsonc
{
  "id": "greet-teacher",
  "title": "Greeting the teacher",
  "title_vi": "Chào cô giáo",                  // kept for the bilingual story
  "skill_domain": "communication",              // money | time | social | practical | communication
  "difficulty": 1,                              // 1..3
  "thumbnail_url": "/static/images/greet-teacher/thumb.png",
  "estimated_minutes": 3,

  "language": "en",                             // demo language; "vi" for Piper path

  "steps": [
    {
      "id": "step-1",
      "order": 1,

      "teacher_prompt": "Hi there! My name is Ms. Linh. Can you say hello back to me?",
      "teacher_prompt_vi": "Chào con! Cô tên là Linh. Con hãy chào cô đi.",

      "scene_image_url": "/static/images/greet-teacher/step-1.png",
      "scene_image_prompt": "A friendly kindergarten teacher waving warmly, soft warm pastel colors, cartoon kid-friendly illustration, plain pastel background, diverse appearance, no text",

      "response_type": "voice_or_choice",        // voice | choice | tap | voice_or_choice
      "choices": [
        { "id": "a", "text": "Hi Ms. Linh!", "is_correct": true },
        { "id": "b", "text": "Goodbye!", "is_correct": false },
        { "id": "c", "text": "(say nothing)", "is_correct": false }
      ],
      "voice_accepts": ["hi", "hello", "hi ms linh", "hello ms linh", "hey"],

      "hint_on_wrong": "When you meet a teacher, you say 'Hi' or 'Hello'. Try again.",
      "hint_image_url": "/static/images/greet-teacher/step-1-hint.png",

      "praise_on_correct": "Great job! That was a very nice greeting.",

      "max_attempts": 3
    }
  ]
}
```

Key principles:
- **English primary, Vietnamese kept in `_vi` fields** — the demo runs on English; Vietnamese fields exist so you can show "this same scenario, one flag flip, runs in Vietnamese"
- **Voice + choice both accepted by default** — kid can speak OR tap, whichever works for them
- **No nested complexity** — flat steps, no branching trees. Branching is a v2 feature.
- **Image URLs point to cached local files** — generated once, served from disk
- **`voice_accepts` is generous** — many ways to say "hi" all count; Gemma is the final arbiter for edge cases

---

## 4. Data model (SQLite)

Three tables. That's it.

```python
# backend/app/models/session.py
class Session(SQLModel, table=True):
    id: str = Field(default_factory=lambda: uuid4().hex, primary_key=True)
    scenario_id: str
    kid_name: str | None = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: datetime | None = None

# backend/app/models/trial.py
class Trial(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: str = Field(foreign_key="session.id")
    step_id: str
    attempt_number: int                     # 1, 2, 3...
    response_value: str                     # "Hi Ms. Linh" or choice id "a"
    response_type: str                      # voice | choice | tap
    is_correct: bool
    was_prompted: bool                      # did kid get a hint before answering?
    latency_ms: int                         # cue→response time
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# backend/app/models/attention.py
class AttentionLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: str = Field(foreign_key="session.id")
    step_id: str
    on_screen_pct: float                    # % of step time looking at screen
    off_screen_seconds: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

That's the whole event log. From these three tables you can derive every progress metric the EBP framework cares about.

---

## 5. The 7 vertical slices

Each slice is a working end-to-end demo. Each has a test gate. Move on only when the gate passes.

---

### SLICE 0 — Foundation (3 hours, pre-hackathon)

**Goal:** Every service runs, every health check passes.

**Tasks:**
- Initialize backend with `uv init` or `poetry init`
- Initialize frontend with `npm create vite@latest frontend -- --template react-ts`
- Install Ollama, run `ollama pull gemma4:e2b` (~3.4GB download)
- Backend: `/api/health` returns `{"status": "ok", "ollama": "ok"}` (ollama check pings :11434)
- Frontend: blank page rendering "Hoovy" header
- Makefile with `make up`, `make backend`, `make frontend`, `make test`
- README with 3-command quickstart

**Test gate (acceptance criteria):**
```bash
make up                          # starts everything
curl localhost:8000/api/health   # → 200, {"status":"ok","ollama":"ok"}
open http://localhost:5173       # sees "Hoovy" title
```

**Files touched:** ~15 files, mostly boilerplate.

---

### SLICE 1 — Static Playground (3 hours)

**Goal:** Kid can pick a scenario from the playground and see step 1 render (no AI yet, everything hardcoded).

**Tasks:**
- Write `scenarios/greet-teacher.json` by hand using the schema above
- Backend `GET /api/scenarios` returns list of scenarios (reads `scenarios/*.json`)
- Backend `GET /api/scenarios/{id}` returns full scenario
- Frontend Playground route shows scenario cards in a grid
- Frontend Scenario route renders step 1: scene image (placeholder), teacher prompt as text, choice buttons
- Tailwind kid-friendly tokens: large rounded buttons, generous spacing, friendly font (Quicksand or Nunito)

**Test gate:**
```bash
# Backend
curl localhost:8000/api/scenarios            # → [{"id":"greet-teacher", ...}]
curl localhost:8000/api/scenarios/greet-teacher  # → full scenario JSON

# Frontend
# Open / → see "Greeting the teacher" card
# Click card → URL becomes /scenario/greet-teacher
# See step 1: teacher prompt text + 3 large choice buttons
```

**Pytest:** `tests/test_scenarios.py` — load JSON, return correct shape.

---

### SLICE 2 — Talking Teacher via Kokoro (4 hours)

**Goal:** Virtual teacher visibly "speaks" each step using Kokoro TTS, with speech bubble showing what's said.

**Tasks:**
- Run Kokoro-FastAPI in Docker: `docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest`
- `services/kokoro_client.py`:
  ```python
  async def synthesize(text: str, voice: str = "af_bella") -> bytes:
      r = await httpx.AsyncClient().post(
          "http://localhost:8880/v1/audio/speech",
          json={"model": "kokoro", "input": text, "voice": voice,
                "response_format": "mp3", "speed": 0.9}
      )
      return r.content
  ```
- Backend `POST /api/tts`: body `{text, voice?}`, returns `audio/mpeg` bytes
- Frontend `useAudioOut.ts` hook: takes text, calls `/api/tts`, plays returned blob via `<audio>`
- `VirtualTeacher.tsx` — friendly avatar PNG + animated mouth (CSS class toggle while audio plays)
- `SpeechBubble.tsx` — text appears character-by-character timed to audio duration
- `ProgressBar.tsx` — X of N steps, large and friendly
- On scenario open: auto-call `/api/tts` for step 1's `teacher_prompt`, play it
- Manual "Next" button (no scoring yet) advances to step 2

**Test gate:**
```
docker ps  # kokoro-fastapi running on :8880
curl -X POST localhost:8000/api/tts -d '{"text":"Hello!"}' > test.mp3
open test.mp3  # plays kid-friendly voice

Open /scenario/greet-teacher
→ Backend calls Kokoro, plays audio
→ Speech bubble shows text as it plays
→ Click Next → step 2 begins
→ Progress bar reflects position
```

**Note on voice choice:** Kokoro ships with multiple voices. `af_bella` is warm and clear, `af_sarah` is more measured. For ID kids, **slow speed (0.85–0.9) + warm voice + short sentences** is the EBP-grounded choice. **Pick `af_bella` at speed 0.9 as the default and commit it** — don't make this a decision during the hackathon. Test 2–3 voices Wednesday night, lock the choice. For the Vietnamese production path, swap Kokoro for Piper TTS via the same OpenAI-compatible endpoint shape — `kokoro_client.py` becomes the only file that changes.

---

### SLICE 3 — Kid Speaks, Gemma Evaluates (6 hours) ← **CORE SLICE**

**Goal:** Kid taps mic, speaks a response. Gemma 4 E2B transcribes + evaluates + responds in ONE call. Correct → praise + advance. Wrong → hint + retry. Every trial logged.

**This slice merges what was originally Slices 3 + 4** because the audio-via-images trick lets Gemma do STT and evaluation in a single round-trip.

**Tasks:**

1. **Frontend audio capture (`useAudioIn.ts`):**
   ```ts
   const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
   // record on mic-button-down, stop on mic-button-up
   // returns Blob
   ```

2. **`ResponseInput.tsx`** — big mic button. Tap-to-record-tap-to-stop. Visual pulsing-red feedback during recording. Tap-to-play playback so kid can hear what they said.

3. **Backend `services/ollama_client.py`** — the audio-in pattern:
   ```python
   import base64, httpx, json

   async def evaluate_audio_response(audio_bytes: bytes, step: ScenarioStep,
                                      attempt: int) -> EvaluationResult:
       audio_b64 = base64.b64encode(audio_bytes).decode()
       
       system = load_prompt("evaluate_response.txt").format(
           expected=step.voice_accepts,
           teacher_prompt=step.teacher_prompt,
           attempt=attempt,
       )
       
       resp = await httpx.AsyncClient(timeout=60).post(
           "http://localhost:11434/api/chat",
           json={
               "model": "gemma4:e2b",
               "messages": [
                   {"role": "system", "content": system},
                   {"role": "user",
                    "content": "Evaluate the child's audio response.",
                    "images": [audio_b64]},   # ← audio rides here
               ],
               "format": "json",
               "stream": False,
           }
       )
       
       data = json.loads(resp.json()["message"]["content"])
       return EvaluationResult(**data)
   ```

4. **`prompts/evaluate_response.txt`** (the system prompt):
   ```
   You evaluate a child's spoken response in a learning scenario for students
   with intellectual disabilities. Be warm, simple, and brief.
   
   Context:
   - The child was asked: "{teacher_prompt}"
   - Accepted responses (any variation or partial match counts): {expected}
   - This is attempt #{attempt} of 3
   
   You will receive the child's audio. Listen carefully. Be generous —
   accept partial, malformed, or shy responses if the intent is clear.
   
   Return STRICT JSON, no other text:
   {
     "transcript": "<what you heard the child say>",
     "is_correct": true|false,
     "confidence": 0.0-1.0,
     "feedback": "<max 20 words. If correct, warm praise. If wrong, 
                     a gentle hint that points toward the right answer 
                     without giving it away>"
   }
   ```

5. **Backend `POST /api/evaluate`:**
   - Multipart: audio file + step_id + session_id + attempt_number
   - Calls `evaluate_audio_response()`
   - Logs Trial to SQLite (transcript, is_correct, attempt, latency)
   - Calls `/api/tts` internally with `feedback`, gets audio bytes back
   - Returns `{transcript, is_correct, feedback, teacher_audio_url}`

6. **Frontend flow in `useTeacher.ts`:**
   - Step loads → call /api/tts(teacher_prompt) → play teacher audio
   - Audio ends → enable mic button
   - Kid records + submits → POST /api/evaluate
   - Response in → speech bubble shows feedback, play teacher_audio_url
   - If correct: 1.5s celebration animation → next step
   - If wrong & attempts < 3: show hint image, replay teacher prompt → mic enabled again
   - If wrong & attempts == 3: gentle "let's try the next one" → next step (don't trap kid)

7. **Add `kid_name` to session** via simple modal on first-load (stored in localStorage).

**Test gate:**
```bash
# Backend
pytest tests/test_evaluate.py
# 10+ fixtures: WAV files saying "hi", "hello", "hi Ms Linh", "goodbye",
# silence, garbled noise, English variations — verify is_correct decisions.

# E2E
1. Open greet-teacher scenario
2. Hear teacher say prompt
3. Tap mic, say "Hi Ms. Linh", release
4. Within 3 seconds: speech bubble shows transcript, teacher praises in audio
5. Auto-advance to next step
6. Tap mic, say "goodbye" (wrong)
7. Teacher hints in audio + hint image appears
8. Try again with "hi" → success → advance
9. After completion: SQLite shows session + N trials with transcripts
```

After this slice you have a **working AI educational app**. Everything else amplifies.

**Latency budget:** 
- Audio capture: instant (kid-controlled)
- Upload + base64: <500ms for a 3-second clip
- Gemma 4 E2B audio + reasoning: 2–4 seconds on M4 Mac, 4–8s on older hardware
- Kokoro TTS: <1s for a 20-word response
- **Total kid-perceived latency: 3–6 seconds.** Acceptable for this user population (they expect a thoughtful teacher, not a fast one). Show a friendly "Teacher is listening..." animation with a soft pulsing avatar while waiting.

---

### SLICE 4 — Choice Fallback + UX Hardening (3 hours)

**Goal:** Tap-to-choose alternative for kids who can't or won't speak. Hardening for demo reliability.

This slice is shorter because the old Slice 4 (Gemma evaluation) merged into Slice 3 via the audio-in trick. Use the recovered time on UX robustness.

**Tasks:**

1. **Choice mode UI** for steps where `response_type` is `choice` or `voice_or_choice`:
   - Large rounded tap buttons (min height 80px on mobile, 100px on laptop)
   - Each button has English text + small icon/emoji
   - Tap → POST /api/evaluate with `{type:"choice", choice_id: "a"}` instead of audio
   - Backend recognizes choice payload, scores against `choices[].is_correct` directly (no Gemma needed for choice — faster)

2. **`voice_or_choice` UI:** mic button + 3 small "or pick one" buttons below. Whichever the kid uses, the evaluator routes it.

3. **Demo-safety features:**
   - **Mock mode toggle** (`MOCK_AI=true` env var): canned correct/wrong responses for when Ollama or Kokoro is misbehaving — lets you keep demo-ing while debugging
   - **Pre-warm Gemma** on backend startup: send a dummy 1-second silent WAV through evaluate_audio_response so model is loaded into RAM before kid uses the app (first call after cold start can take 15s, subsequent calls 3–4s)
   - **Pre-warm Kokoro** similarly with one short string

4. **Error states for the kid:**
   - Network/Gemma timeout → teacher says "Cô không nghe rõ, con thử lại nhé" + reset mic
   - Mic permission denied → modal asking to allow + fallback to choice mode
   - No response captured (silence) → don't punish; teacher gently re-prompts

5. **Session resume:** if browser refreshes mid-scenario, return to the same step (session_id in localStorage).

**Test gate:**
```bash
pytest tests/test_evaluate_choice.py    # choice path scores correctly
pytest tests/test_mock_mode.py          # MOCK_AI=true returns canned responses

# E2E
Open scenario → use choice mode → works
Open scenario → use voice mode → works  
Open scenario → switch between → works
Kill ollama mid-scenario → teacher says "try again" instead of crashing
Refresh browser → resume same step
```

**Why this matters:** demo day, the network will be flaky, the venue lighting will be off, the laptop will be hot. Mock mode + pre-warm + clean error states are the difference between a smooth demo and a panicked one.

---

### SLICE 5 — Gaze Attention (4 hours)

**Goal:** Track whether the kid is looking at the screen. If off-screen too long, virtual teacher gently calls them back.

**Tasks:**
- Add WebGazer.js (CDN import: `https://webgazer.cs.brown.edu/webgazer.js` — or vendor it)
- `useGaze.ts` hook:
  - Initialize WebGazer on Scenario mount, destroy on unmount
  - One-shot calibration screen on first scenario load (5-point click calibration)
  - Sample gaze coordinates at 4 Hz
  - Maintain rolling "on-screen / off-screen" state (screen bounds = viewport, with margin)
- `GazeMonitor.tsx`:
  - Invisible at runtime; small dev-mode overlay shows current gaze dot
  - Emits `onAttentionDrop` event when off-screen > 3 seconds
- On attention drop: teacher says one of a few gentle redirects ("Nhìn cô đây nhé con", "Cùng học tiếp nào")
- Backend `POST /api/sessions/{id}/attention` logs per-step attention stats at step end

**Test gate:**
```
Run a scenario
Look at screen normally → no interruption
Look away from camera for 4 seconds → teacher's voice gently says "Look here"
At step end, attention_log row written to SQLite with on_screen_pct
```

**Risk note:** WebGazer accuracy depends on lighting, webcam quality, and calibration. Have a fallback: a teacher/parent button to disable gaze if it misfires during the demo. Don't let gaze be a single-point-of-failure for the demo.

---

### SLICE 6 — Image Generation (4 hours)

**Goal:** Each scenario step has a real, kid-friendly AI-generated illustration. Images cached on disk after first generation.

**Tasks:**
- `services/image_gen.py`:
  - Wraps Gemini 2.5 Flash Image API (Google AI Studio key)
  - `generate(prompt: str, style_preset: str) -> bytes`
  - Style preset baked in: "kid-friendly cartoon illustration, soft warm pastel colors, simple rounded shapes, diverse characters, plain neutral background, no text, no logos, age 6-10 picture-book style"
  - Saves to `scenarios/_images/{scenario_id}/{step_id}.png`
- Backend `POST /api/images/generate`:
  - Body: `{scenario_id, step_id, prompt}`
  - Checks if cached file exists, returns URL if yes
  - Otherwise generates, caches, returns URL
- CLI script `scripts/regen_images.py {scenario_id}`:
  - Loops through scenario steps, generates each `scene_image_url` and `hint_image_url`
  - Run once after authoring a scenario
- Frontend Scenario route already references `scene_image_url` — just point to the cached file

**Test gate:**
```bash
python scripts/regen_images.py greet-teacher
# → see new PNGs in scenarios/_images/greet-teacher/

# Run scenario → see AI-generated teacher illustration on step 1
```

**Note on style consistency:** Nano Banana is good at maintaining style if you pass the same style preset string + a few reference image hashes. For hackathon, just keep the preset string identical across all calls and accept some variation.

---

### SLICE 7 — Scenario Authoring (5 hours)

**Goal:** Type a one-line skill description, get a fully-formed scenario JSON back, with images auto-generated.

**Tasks:**
- `prompts/author_scenario.txt`: long system prompt teaching Gemma the schema, EBP principles, and the English-demo / Vietnamese-fallback bilingual structure. Has 1–2 few-shot examples.
- Backend `POST /api/author/scenario`:
  - Body: `{skill_domain, brief, difficulty, num_steps}`
  - Calls Gemma 4 E2B with structured output (Pydantic schema)
  - Validates the returned JSON against Pydantic model
  - On validation failure, re-prompts once with errors as feedback
  - Saves to `scenarios/{generated-slug}.json`
  - Kicks off background image generation
  - Returns scenario object
- Frontend `/author` route (gated by `?admin=1` query param for hackathon — no real auth):
  - Form: domain dropdown, brief textarea, difficulty slider, num_steps slider
  - Submit → show streaming progress (generating scenario... generating images...)
  - Preview the generated scenario in a card
  - "Play" button drops you into the scenario

**Test gate:**
```
Open /author?admin=1
Fill in: "communication", "Teach kid to say goodbye politely to grandma", 1, 3
Click Generate
Wait ~60s
→ new scenario appears in /playground
→ Play through it end-to-end
```

**Gemma authoring quality:** E2B is small. For better authoring quality, the *fallback* is to use a stronger model (Gemma 4 E4B if you can run it, or call Gemini 2.5 Pro via API for authoring only). The runtime stays on E2B (privacy + speed). Authoring is a one-time admin action, latency is acceptable. **Pick this fallback in advance and have the API key ready.**

---

## 6. Hackathon timeline (mapped to dates)

Today is **Wed May 13**. Hackathon is **Fri May 15 → Sun May 17**.

### Pre-hackathon: Wed evening + Thu (12–14 hours total)

| Block | Task | Hours |
|---|---|---|
| Wed 8pm–11pm | Slice 0 (Foundation) | 3 |
| Thu morning | Slice 1 (Static Playground) | 3 |
| Thu afternoon | Slice 2 (Talking Teacher) | 4 |
| Thu evening | Buffer + sleep | — |

By Thu night you have: kid can open playground, click a hardcoded scenario, hear teacher speak through it. No real intelligence yet, but the UX shape is there.

### Hackathon Day 1: Fri May 15 (10–12 hours)

| Block | Task | Hours |
|---|---|---|
| Morning | Slice 3 (Kid speaks, Gemma evaluates — the core) | 6 |
| Afternoon | Slice 4 (Choice fallback + UX hardening) | 3 |
| Evening | Manually author 2–3 more scenarios (money, time, social) | 3 |

End of Day 1: **MVP demo-able.** Kid can play 3 scenarios end-to-end with Gemma 4 E2B doing real audio understanding + evaluation in one call. This is your safety net — if Slices 5–7 fail, you still have a complete demo.

### Hackathon Day 2: Sat May 16 (10–12 hours)

| Block | Task | Hours |
|---|---|---|
| Morning | Slice 5 (Gaze Attention) | 4 |
| Afternoon | Slice 6 (Image Generation) | 4 |
| Evening | Polish: kid-friendly UI, animations, sound effects, calibration UX | 3 |

End of Day 2: looks and feels like a real product. Gaze detection working. Real illustrations.

### Hackathon Day 3: Sun May 17 (8–10 hours)

| Block | Task | Hours |
|---|---|---|
| Morning | Slice 7 (Authoring tool) | 5 |
| Early afternoon | Author 5 more scenarios using the new tool | 1 |
| Mid afternoon | Record demo video (3 min) | 2 |
| Late afternoon | Write submission (devpost description, README) | 1 |
| Submit | — | — |

---

## 7. Risks & fallbacks

| Risk | Probability | Mitigation |
|---|---|---|
| Gemma 4 E2B audio-in (image-field trick) doesn't work on your specific Ollama build | Low (you tested) | Re-verify in Slice 0; fallback is faster-whisper or AssemblyAI as a separate STT call |
| Gemma 4 E2B audio reasoning too slow (>8s) on hackathon laptop | Medium | Show "Teacher is listening..." animation; pre-warm on startup; switch to E4B if hardware allows |
| Kokoro voice mismatch / no Vietnamese | Known | Plan §0.1 decision: English-first demo for hackathon; Piper TTS for production Vietnamese |
| WebGazer calibration unreliable in venue lighting | Medium | Disable button visible in dev mode; gaze becomes "nice-to-have" not "required" |
| Image generation rate-limited | Low | Pre-generate all images before demo, commit cache to repo |
| Network failure at venue | Medium | Everything offline except Nano Banana for new scenarios; pre-generate images |
| Gemma authoring produces invalid JSON | High | Pydantic validation + re-prompt + fallback to Gemma 4 E4B or Gemini 2.5 Pro for authoring |
| Demo machine doesn't have webcam | Low | Gaze is feature-flagged off; everything else works |
| Mic permission denied on demo machine | Low | Choice mode fallback (Slice 4); always test mic on demo hardware before pitching |

---

## 8. Setup commands (copy-paste)

### One-time install
```bash
# Ollama (Mac/Linux)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull gemma4:e2b
# Note: official gemma4:e2b tag advertises text+image; audio rides on
# the images field thanks to the unified vision+audio mmproj.

# Optional: stronger model for authoring
ollama pull gemma4:e4b   # 5GB if you have RAM

# Kokoro TTS (Docker)
docker run -d --name kokoro -p 8880:8880 \
  ghcr.io/remsky/kokoro-fastapi-cpu:latest
# Test: curl -X POST localhost:8880/v1/audio/speech \
#   -d '{"model":"kokoro","input":"Hello!","voice":"af_bella"}' > test.mp3

# Backend
cd backend
uv venv && source .venv/bin/activate
uv pip install fastapi uvicorn sqlmodel pydantic-settings httpx pytest
uv pip install pillow python-multipart  # multipart for audio upload

# Frontend
cd ../frontend
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Run dev
```bash
make up
# starts: ollama, fastapi (port 8000), vite (port 5173)
```

### Test
```bash
make test   # pytest backend + vitest frontend
```

### Author a scenario manually (slice 1 era)
```bash
cp scenarios/greet-teacher.json scenarios/new-skill.json
# edit
python scripts/regen_images.py new-skill
```

---

## 9. Code-quality principles to enforce

1. **One responsibility per file.** If a component does two things, split it.
2. **Hooks for behavior, components for view.** No `useEffect` chains inside JSX components beyond setup/teardown.
3. **Types live in `lib/types.ts`** and mirror backend Pydantic models. Single source of truth.
4. **No magic numbers.** Constants like `OFF_SCREEN_THRESHOLD_SECONDS = 3` go in a `constants.ts` file.
5. **Backend always returns Pydantic-validated responses.** No raw dicts.
6. **System prompts are files, not strings in code.** `app/prompts/*.txt`, loaded at startup.
7. **All AI calls have a `mock_mode` env var.** When `MOCK_AI=true`, return canned responses. Speeds up frontend dev when LLM is slow.
8. **Trial logging never blocks the UI.** Fire-and-forget POST; if it fails, queue locally and retry.
9. **No frameworks for things one function can do.** Don't add Redux, don't add a state management lib. React's `useState` + a context for session is enough.
10. **Every PR-equivalent commit ends with the slice's test gate passing.** No half-merged states.

---

## 10. What ships at the end

A web app demonstrable in 3 minutes:

1. **Intro (15s):** "Hoovy is an AI learning companion designed for Vietnamese students with intellectual disabilities. We're demoing in English so you can experience the interaction directly. The same system runs in Vietnamese with a one-file Piper TTS swap. Everything runs on-device on Gemma 4 E2B via Ollama."
2. **Playground (15s):** Show the scenario grid. Click "Greeting the teacher."
3. **Scenario playthrough (60s):** You play the kid. Teacher speaks through Kokoro TTS (warm `af_bella` voice at 0.9 speed). You tap the mic and respond. Wrong answer triggers a hint with an image. Correct triggers praise. Mid-scenario, look away from camera → teacher gently calls you back. Then run a second scenario (money: "Make change for $5") to prove the engine is general.
4. **Show the architecture moment (20s):** "Watch this." Open browser DevTools network tab. Show: ONE call to Ollama running Gemma 4 E2B does the transcription, the evaluation, AND generates the teacher's response. Audio in, text out, one model. The image-field trick that makes this possible is the technical centerpiece.
5. **Authoring tool (45s):** Open /author. Type "Teach kid to ask for help when stuck." Click Generate. Watch a new scenario appear with AI-generated images. Click Play and run through it.
6. **Bilingual moment (15s):** Flip the `LANG=vi` flag, open the same scenario — speech bubble and TTS now in Vietnamese (using a stored Piper sample). "One flag, no code change. Vietnamese-first by design, demoed in English for accessibility."
7. **Closing (25s):** "Built in 48 hours. Gemma 4 E2B on Ollama handles audio understanding and reasoning in a single round-trip. Kokoro TTS gives the teacher a warm voice. This is what AI for special education looks like when it's built on systematic instruction, not just content delivery."

---

*Plan version 1.3 — Hoovy, for the Gemma 4 Impact Hackathon.*  
*Changes from v1.2: renamed product Đồng Hành → Hoovy throughout. Retargeted hackathon: IBM Bob → Gemma 4 Impact Hackathon. Updated header, repo folder, demo intro, and Slice 0 test gate accordingly.*  
*Changes from v1.1: locked English-first demo decision (§0.1). Updated scenario schema, slice test gates, Slice 4 choice UI, Slice 6 image style preset, Slice 7 author prompt, risks table, and demo script to consistently use English content. Vietnamese kept in `_vi` fields and as the bilingual pitch moment in the demo.*  
*Changes from v1.0: confirmed Gemma 4 E2B audio-in via Ollama `images` field works (your tests). Replaced browser SpeechSynthesis/SpeechRecognition with Kokoro TTS output + Gemma audio-in input. Collapsed old Slices 3+4 into the new Slice 3 (one Gemma call does STT + eval + response). New Slice 4 is choice fallback + UX hardening.*
