import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useScenario } from "@/features/scenarios/hooks";
import { GazeMonitor } from "@/features/scenarios/components/GazeMonitor";
import { GazePill } from "@/features/scenarios/components/GazePill";
import { ChoiceTile } from "@/features/scenarios/components/ChoiceTile";
import { useAudioOut } from "@/features/scenarios/hooks/useAudioOut";
import { useAudioIn } from "@/features/scenarios/hooks/useAudioIn";
import { useEvaluate } from "@/features/scenarios/hooks/useEvaluate";
import { useEvaluateChoice } from "@/features/scenarios/hooks/useEvaluateChoice";
import { useGaze } from "@/features/scenarios/hooks/useGaze";
import { SceneBackdrop } from "@/components/ui/SceneBackdrop";
import { HoovyMascot } from "@/components/ui/HoovyMascot";
import { StarBar } from "@/components/ui/StarBar";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { Emoji3D } from "@/components/ui/Emoji3D";
import type { Emoji3DName } from "@/components/ui/Emoji3D";
import type { SkillDomain, SessionRead, EvaluateResponse } from "@/features/scenarios/types";

// Visual composition for the scene area when there's no real scene_image_url.
// Same shape as ScenarioCard's recipe but tuned for the bigger 16:10 panel.
const SCENE_RECIPE: Record<SkillDomain, { bg: string; props: Emoji3DName[] }> = {
  communication: { bg: "from-sky-200 via-blue-200 to-indigo-200", props: ["babyGirl", "babyBoy"] },
  social:        { bg: "from-pink-200 via-rose-200 to-purple-200", props: ["babyGirl", "babyBoy"] },
  money:         { bg: "from-emerald-200 via-green-200 to-teal-200", props: ["shop", "moneyBag"] },
  time:          { bg: "from-amber-200 via-orange-200 to-yellow-200", props: ["clock", "sun"] },
  practical:     { bg: "from-fuchsia-200 via-pink-200 to-rose-200", props: ["house", "tree"] },
};

// ── Constants ──────────────────────────────────────────────────────────────
const MIN_BLOB_BYTES = 1024; // blobs smaller than this are "silent"

function buildRedirectPhrase(): string {
  const phrases = [
    "I'm right here when you're ready.",
    "Take your time. The picture is waiting.",
    "Whenever you're ready, friend.",
    "It's okay. We can take a little break.",
    "Look at the picture when you can.",
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

interface Feedback {
  text: string;
  isCorrect: boolean;
}

export function ScenarioPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { data: scenario, isLoading, isError } = useScenario(scenarioId ?? "");

  // ── Session + progress state — fresh on every scenario open ─────────────
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [attempt, setAttempt] = useState(1);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [micUnavailable, setMicUnavailable] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Gaze tracking — always on, no calibration step, no toggle ────────────
  const gazeEnabled = true;
  const redirectCountRef = useRef(0);
  const stepStartRef = useRef(Date.now());

  const { play, playDataUrl, stop, isPlaying } = useAudioOut();
  const { start, stop: stopRec, isRecording, blob, mimeType, error: micError } =
    useAudioIn();
  const { evaluate, isEvaluating: isVoiceEvaluating } = useEvaluate();
  const { evaluateChoice, isEvaluating: isChoiceEvaluating } =
    useEvaluateChoice();

  const isEvaluating = isVoiceEvaluating || isChoiceEvaluating;

  // Refs so the gaze callback always sees current playback/eval/record state
  // without needing to re-subscribe the gaze listener.
  const isPlayingRef = useRef(false);
  const isEvaluatingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const feedbackRef = useRef<Feedback | null>(null);
  isPlayingRef.current = isPlaying;
  isEvaluatingRef.current = isEvaluating;
  isRecordingRef.current = isRecording;
  feedbackRef.current = feedback;

  const handleAttentionDrop = useCallback(() => {
    // Never interrupt: Hoovy speaking, backend evaluating, kid recording, or
    // a feedback chip being shown (advance timer is about to fire).
    // The gaze loop will retry on the next debounce tick.
    if (
      isPlayingRef.current ||
      isEvaluatingRef.current ||
      isRecordingRef.current ||
      feedbackRef.current
    ) {
      return;
    }
    redirectCountRef.current += 1;
    const phrase = buildRedirectPhrase();
    play(phrase);
  }, [play]);

  const {
    status: gazeStatus,
    errorMessage: gazeError,
    hasFirstSample: gazeHasSample,
    facePresent,
    awaySeconds,
  } = useGaze({
    enabled: gazeEnabled,
    onAttentionDrop: handleAttentionDrop,
  });

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = scenario?.steps[currentStep];

  // ── Session creation: fresh on every scenario open ──────────────────────
  useEffect(() => {
    if (!scenarioId) return;

    let createdId: string | null = null;

    axios
      .post<SessionRead>("/api/v1/sessions", {
        scenario_id: scenarioId,
        language: "en",
      })
      .then((res) => {
        createdId = res.data.id;
        setSessionId(res.data.id);
        console.log("[hoovy] session created", res.data.id);
      })
      .catch((err) => {
        console.error("[hoovy] session create failed", err);
        showToast("Could not start session. Check your connection.");
      });

    return () => {
      if (createdId) {
        axios.post(`/api/v1/sessions/${createdId}/end`).catch(() => {});
      }
    };
  }, [scenarioId]);

  const postAttentionLog = useCallback(
    (stepId: string, onScreenPct: number, offSec: number, redirects: number) => {
      if (!sessionId || !gazeEnabled) return;
      axios
        .post(`/api/v1/sessions/${sessionId}/attention`, {
          step_id: stepId,
          on_screen_pct: onScreenPct,
          off_screen_seconds: offSec,
          redirects_triggered: redirects,
        })
        .catch(() => {});
    },
    [sessionId, gazeEnabled],
  );

  useEffect(() => {
    if (step?.id && gazeEnabled) {
      const elapsed = (Date.now() - stepStartRef.current) / 1000;
      const presentPct = elapsed > 0
        ? Math.max(0, 1 - awaySeconds / elapsed)
        : 1;
      postAttentionLog(
        step.id,
        Math.round(presentPct * 100) / 100,
        awaySeconds,
        redirectCountRef.current,
      );
    }
    redirectCountRef.current = 0;
    stepStartRef.current = Date.now();

    setAttempt(1);
    setFeedback(null);
    setShowHint(false);
    setMicEnabled(false);
    if (step?.teacher_prompt) {
      play(step.teacher_prompt);
    }
    return () => {
      stop();
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, step?.teacher_prompt]);

  useEffect(() => {
    if (!isPlaying && !isEvaluating && !feedback) {
      setMicEnabled(true);
    }
  }, [isPlaying, isEvaluating, feedback]);

  const autoStartedRef = useRef(false);
  useEffect(() => {
    autoStartedRef.current = false;
  }, [currentStep, attempt]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (isPlaying || isEvaluating || isRecording || feedback) return;
    if (!step || !sessionId || micUnavailable) return;
    if (step.response_type === "tap" || step.response_type === "choice") return;

    autoStartedRef.current = true;
    const t = setTimeout(() => {
      console.log("[hoovy] auto-starting mic");
      start();
    }, 400);
    return () => clearTimeout(t);
  }, [isPlaying, isEvaluating, isRecording, feedback, step, sessionId, micUnavailable, start]);

  useEffect(() => {
    if (micError) setMicUnavailable(true);
  }, [micError]);

  const handleEvaluateResult = useCallback(
    async (result: EvaluateResponse) => {
      setFeedback({ text: result.feedback, isCorrect: result.is_correct });
      if (!result.is_correct) setShowHint(true);

      await playDataUrl(result.feedback_audio_b64);

      if (result.advance) {
        advanceTimerRef.current = setTimeout(() => {
          const isLast = currentStep === (scenario?.steps.length ?? 1) - 1;
          if (isLast) {
            navigate("/episodes");
          } else {
            setCurrentStep((s) => s + 1);
          }
        }, 1500);
      } else {
        setAttempt((a) => a + 1);
        setFeedback(null);
        setShowHint(false);
        setMicEnabled(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStep, scenario?.steps.length],
  );

  useEffect(() => {
    if (!blob || !sessionId || !step || isEvaluating) return;

    console.log("[hoovy] blob ready", { size: blob.size, mimeType });

    if (blob.size < MIN_BLOB_BYTES) {
      console.warn("[hoovy] blob too small, ignoring", blob.size);
      showToast("I didn't hear anything. Try once more.");
      setMicEnabled(true);
      return;
    }

    const run = async () => {
      setMicEnabled(false);
      try {
        const result = await evaluate({
          sessionId,
          scenarioId: scenarioId ?? "",
          stepId: step.id,
          attempt,
          blob,
          mimeType,
        });
        await handleEvaluateResult(result);
      } catch (err) {
        console.error("[hoovy] eval failed", err);
        showToast("Teacher didn't catch that. Let's try again.");
        setMicEnabled(true);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  const handleChoice = useCallback(
    async (choiceId: string) => {
      if (!sessionId || !step || isEvaluating) return;
      setMicEnabled(false);
      try {
        const result = await evaluateChoice({
          sessionId,
          scenarioId: scenarioId ?? "",
          stepId: step.id,
          attempt,
          choiceId,
        });
        await handleEvaluateResult(result);
      } catch {
        showToast("Something went wrong. Please try again.");
        setMicEnabled(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, step, attempt, isEvaluating, scenarioId],
  );

  const handleMicToggle = () => {
    if (isRecording) stopRec();
    else start();
  };

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const effectiveResponseType =
    micUnavailable && step?.response_type === "voice"
      ? "choice"
      : micUnavailable && step?.response_type === "voice_or_choice"
        ? "choice"
        : (step?.response_type ?? "voice");

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SceneBackdrop variant="soft">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-hoovy-blue border-t-transparent animate-spin" />
        </div>
      </SceneBackdrop>
    );
  }

  if (isError || !scenario || !step) {
    return (
      <SceneBackdrop variant="soft">
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-red-500 font-semibold text-lg">Episode not found.</p>
          <button
            onClick={() => navigate("/episodes")}
            className="px-6 py-3 bg-hoovy-blue text-white font-bold rounded-2xl hover:bg-blue-500 transition-colors"
          >
            Back to Episodes
          </button>
        </div>
      </SceneBackdrop>
    );
  }

  const totalSteps = scenario.steps.length;
  const starsFilled = currentStep + (feedback?.isCorrect ? 1 : 0);
  const sayLine = step.voice_accepts?.[0] ?? null;
  const showMic =
    effectiveResponseType === "voice" || effectiveResponseType === "voice_or_choice";
  const showChoices =
    (effectiveResponseType === "choice" || effectiveResponseType === "voice_or_choice") &&
    (step.choices?.length ?? 0) > 0;

  return (
    <SceneBackdrop variant="soft">
      {/* Dev gaze HUD */}
      <GazeMonitor facePresent={facePresent} awaySeconds={awaySeconds} />

      {micUnavailable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-xl">
            <p className="text-2xl mb-2">🎤</p>
            <h2 className="font-extrabold text-gray-800 text-lg mb-2">
              Microphone not available
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              We couldn't access your microphone. You can still pick an answer
              using the buttons below.
            </p>
            <button
              onClick={() => setMicUnavailable(false)}
              className="px-6 py-3 bg-hoovy-blue text-white font-bold rounded-2xl hover:opacity-90 transition-all"
            >
              OK, I'll pick an answer
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-100 border border-yellow-300 text-yellow-800 font-semibold text-sm px-5 py-3 rounded-2xl shadow-md max-w-xs text-center">
          {toast}
        </div>
      )}

      <div className="h-dvh max-w-md mx-auto flex flex-col px-3 pt-3 pb-3 gap-2 overflow-hidden">
        {/* Header: back / star progress / score */}
        <header className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate("/episodes")}
            className="w-11 h-11 rounded-full bg-white border-[4px] border-white shadow-[0_4px_0_rgba(0,0,0,0.1)] flex items-center justify-center text-hoovy-skyDeep active:translate-y-[4px] active:!shadow-none transition-all flex-shrink-0"
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 flex justify-center">
            <StarBar filled={starsFilled} total={Math.min(5, totalSteps)} size="md" />
          </div>
          <ScoreBadge score={12} />
        </header>

        {/* Title + gaze pill */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h1 className="font-extrabold text-sm text-hoovy-navy/80 truncate" style={{ fontFamily: 'Fredoka' }}>
            {scenario.title}
          </h1>
          <GazePill
            status={gazeStatus}
            hasSample={gazeHasSample}
            facePresent={facePresent}
            awaySeconds={awaySeconds}
            errorMessage={gazeError}
          />
        </div>

        {/* Scene image — flex-1 fills available space, min height keeps mascot visible */}
        {(() => {
          const recipe = SCENE_RECIPE[scenario.skill_domain];
          return (
            <div
              className={`relative w-full flex-1 min-h-[160px] rounded-3xl overflow-hidden border-[5px] border-white shadow-[0_6px_0_rgba(0,0,0,0.1),inset_0_6px_15px_rgba(0,0,0,0.15)] ${
                step.scene_image_url ? "" : `bg-gradient-to-br ${recipe.bg}`
              }`}
              style={
                step.scene_image_url
                  ? {
                      backgroundImage: `url(${step.scene_image_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              {!step.scene_image_url && (
                <>
                  {/* 3D sun */}
                  <div
                    className="absolute top-3 right-4 w-10 h-10 rounded-full"
                    style={{
                      background: "linear-gradient(135deg,#FFF599 0%,#FFD833 50%,#FF9800 100%)",
                      boxShadow: "0 0 20px rgba(255,216,51,0.5), inset -3px -3px 8px #CC7A00",
                    }}
                  />
                  {/* Hill foreground */}
                  <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0 w-full h-2/5">
                    <path d="M0 35 Q25 15 50 30 Q75 45 100 25 L100 50 L0 50 Z" fill="rgba(255,255,255,0.55)" />
                    <path d="M0 42 Q30 28 60 38 Q85 46 100 36 L100 50 L0 50 Z" fill="rgba(110,205,108,0.6)" />
                  </svg>
                  {/* Scene actors */}
                  {recipe.props[0] && (
                    <div className="absolute bottom-4 left-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)]">
                      <Emoji3D name={recipe.props[0]} size={96} />
                    </div>
                  )}
                  {recipe.props[1] && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)]">
                      <Emoji3D name={recipe.props[1]} size={74} />
                    </div>
                  )}
                </>
              )}
              {/* Hoovy in the corner */}
              <div className="absolute bottom-2 right-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]">
                <HoovyMascot size={92} speaking={isPlaying} pose="wave" />
              </div>

              {/* Speech bubble out of Hoovy's mouth — only when there's a say-line */}
              {sayLine && !feedback && (
                <div className="absolute bottom-9 right-[100px] max-w-[60%] z-10">
                  <div className="relative bg-hoovy-yellow rounded-3xl px-4 py-2 border-[4px] border-white shadow-[0_4px_0_#D98A1C] text-center">
                    {/* Tail — white outer + yellow inner, pointing RIGHT toward Hoovy's mouth */}
                    <span className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[14px] border-l-white" />
                    <span className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[9px] border-l-hoovy-yellow" />

                    <p className="font-extrabold text-hoovy-navy leading-tight whitespace-nowrap">
                      <span className="text-hoovy-yellowDeep text-xs">Try saying:</span>{" "}
                      <span className="text-base">"{sayLine}"</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Hint image — small inline */}
        {showHint && step.hint_image_url && (
          <div className="w-full max-h-20 rounded-xl overflow-hidden border-[3px] border-hoovy-yellow shadow-[0_3px_0_#D98A1C] flex-shrink-0">
            <img src={step.hint_image_url} alt="hint" className="w-full h-20 object-cover" />
          </div>
        )}

        {/* Speech bubble — 3D, compact */}
        <div className="relative bg-white rounded-2xl px-3 py-2 flex items-start gap-2 border-[4px] border-hoovy-sky shadow-[0_4px_0_#1C86D9] flex-shrink-0">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-hoovy-sky text-white flex-shrink-0 border-[2px] border-white"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="white">
              <path d="M3 10v4a1 1 0 0 0 1 1h3l5 4V5L7 9H4a1 1 0 0 0-1 1z" />
              <path d="M16 8a4 4 0 0 1 0 8" fill="none" stroke="white" strokeWidth="2" />
            </svg>
          </span>
          <p className="font-extrabold text-hoovy-navy text-sm leading-snug pt-0.5 line-clamp-3">
            {feedback ? feedback.text : step.teacher_prompt}
          </p>
        </div>


        {/* Feedback chip */}
        {feedback && (
          <div
            className={`px-4 py-1.5 rounded-full font-extrabold text-sm text-center self-center border-[3px] border-white flex-shrink-0 ${
              feedback.isCorrect
                ? "bg-hoovy-green text-white shadow-[0_3px_0_#2A9038]"
                : "bg-hoovy-yellow text-hoovy-navy shadow-[0_3px_0_#D98A1C]"
            }`}
          >
            {feedback.isCorrect ? "Great job!" : "Keep trying!"}
          </div>
        )}

        {/* Choice tiles — horizontal scroll, fixed height */}
        {showChoices && !isEvaluating && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 flex-shrink-0">
            {step.choices.map((choice) => (
              <ChoiceTile
                key={choice.id}
                choice={choice}
                disabled={!micEnabled || isPlaying || isEvaluating}
                onSelect={handleChoice}
              />
            ))}
          </div>
        )}

        {/* Evaluating indicator */}
        {isEvaluating && (
          <div className="flex items-center justify-center gap-2 py-2 rounded-full bg-hoovy-purple/15 border-[3px] border-hoovy-purple text-hoovy-purple font-extrabold text-xs flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-hoovy-purple animate-ping" />
            Teacher is listening...
          </div>
        )}

        {/* "I want to say it!" mic button — 3D green, compact */}
        {showMic && !isEvaluating && (
          <button
            onClick={handleMicToggle}
            disabled={!micEnabled || isPlaying}
            className={[
              "w-full rounded-full py-3 px-4 font-extrabold text-base text-white flex-shrink-0",
              "border-[4px] border-white transition-all duration-100",
              "flex items-center justify-center gap-2",
              "active:translate-y-[5px] active:!shadow-none",
              isRecording
                ? "bg-hoovy-pink shadow-[0_5px_0_#D93D55] animate-pulse"
                : "bg-hoovy-green shadow-[0_5px_0_#2A9038]",
              (!micEnabled || isPlaying) ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/25 border-[2px] border-white/50"
            >
              {isRecording ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                  <rect x="9" y="3" width="6" height="12" rx="3" />
                  <path d="M5 11v1a7 7 0 0 0 14 0v-1" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </span>
            {isRecording ? "Tap to stop" : "I want to say it!"}
          </button>
        )}

        {/* Tap-only fallback */}
        {effectiveResponseType === "tap" && (
          <button
            onClick={() => {
              const isLast = currentStep === scenario.steps.length - 1;
              if (isLast) navigate("/episodes");
              else setCurrentStep((s) => s + 1);
            }}
            disabled={isPlaying}
            className="w-full py-3 bg-hoovy-sky text-white font-extrabold text-base rounded-full border-[4px] border-white shadow-[0_5px_0_#1C86D9] active:translate-y-[5px] active:!shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
          >
            {currentStep === scenario.steps.length - 1 ? "Finish!" : "Next"}
          </button>
        )}
      </div>
    </SceneBackdrop>
  );
}
