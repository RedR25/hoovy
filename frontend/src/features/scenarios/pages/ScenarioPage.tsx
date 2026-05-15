import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useScenario } from "@/features/scenarios/hooks";
import { VirtualTeacher } from "@/features/scenarios/components/VirtualTeacher";
import { SpeechBubble } from "@/features/scenarios/components/SpeechBubble";
import { ProgressBar } from "@/features/scenarios/components/ProgressBar";
import { KidNameModal } from "@/features/scenarios/components/KidNameModal";
import { ResponseInput } from "@/features/scenarios/components/ResponseInput";
import { GazeCalibration } from "@/features/scenarios/components/GazeCalibration";
import { GazeMonitor } from "@/features/scenarios/components/GazeMonitor";
import { useAudioOut } from "@/features/scenarios/hooks/useAudioOut";
import { useAudioIn } from "@/features/scenarios/hooks/useAudioIn";
import { useEvaluate } from "@/features/scenarios/hooks/useEvaluate";
import { useEvaluateChoice } from "@/features/scenarios/hooks/useEvaluateChoice";
import { useGaze } from "@/features/scenarios/hooks/useGaze";
import type { SessionRead, EvaluateResponse } from "@/features/scenarios/types";

// ── Constants ──────────────────────────────────────────────────────────────
const RESUME_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_BLOB_BYTES = 1024; // blobs smaller than this are "silent"

const REDIRECT_PHRASES = [
  "Look at me, please.",
  "Eyes here, friend.",
  "Let's keep going together.",
  "Hey, I'm over here!",
  "Come back, we're almost done!",
];

interface ResumeState {
  scenarioId: string;
  sessionId: string;
  stepIndex: number;
  attempt: number;
  timestamp: number;
}

function loadResume(scenarioId: string): ResumeState | null {
  try {
    const raw = localStorage.getItem("hoovy_active_scenario");
    if (!raw) return null;
    const parsed: ResumeState = JSON.parse(raw);
    if (
      parsed.scenarioId === scenarioId &&
      Date.now() - parsed.timestamp < RESUME_TTL_MS
    ) {
      return parsed;
    }
  } catch {
    // ignore malformed
  }
  return null;
}

function saveResume(state: Omit<ResumeState, "timestamp">) {
  localStorage.setItem(
    "hoovy_active_scenario",
    JSON.stringify({ ...state, timestamp: Date.now() }),
  );
}

function clearResume() {
  localStorage.removeItem("hoovy_active_scenario");
}

interface Feedback {
  text: string;
  isCorrect: boolean;
}

export function ScenarioPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { data: scenario, isLoading, isError } = useScenario(scenarioId ?? "");

  // ── Persisted state (session resume) ──────────────────────────────────────
  const resumeRef = useRef<ResumeState | null>(
    scenarioId ? loadResume(scenarioId) : null,
  );

  const [sessionId, setSessionId] = useState<string | null>(
    resumeRef.current?.sessionId ?? null,
  );
  const [currentStep, setCurrentStep] = useState(
    resumeRef.current?.stepIndex ?? 0,
  );
  const [attempt, setAttempt] = useState(resumeRef.current?.attempt ?? 1);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [micUnavailable, setMicUnavailable] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(
    !localStorage.getItem("hoovy_kid_name"),
  );

  // ── Gaze tracking state ───────────────────────────────────────────────────
  const [gazeEnabled, setGazeEnabled] = useState(
    () => localStorage.getItem("hoovy_gaze_enabled") === "true",
  );
  const [showCalibration, setShowCalibration] = useState(
    () =>
      localStorage.getItem("hoovy_gaze_enabled") === "true" &&
      localStorage.getItem("hoovy_gaze_calibrated") !== "true",
  );
  const redirectCountRef = useRef(0);
  const stepStartRef = useRef(Date.now());

  const { play, playDataUrl, stop, isPlaying, duration } = useAudioOut();
  const { start, stop: stopRec, isRecording, blob, mimeType, error: micError } =
    useAudioIn();
  const { evaluate, isEvaluating: isVoiceEvaluating } = useEvaluate();
  const { evaluateChoice, isEvaluating: isChoiceEvaluating } =
    useEvaluateChoice();

  const isEvaluating = isVoiceEvaluating || isChoiceEvaluating;

  const handleAttentionDrop = useCallback(() => {
    redirectCountRef.current += 1;
    const phrase =
      REDIRECT_PHRASES[Math.floor(Math.random() * REDIRECT_PHRASES.length)];
    play(phrase);
  }, [play]);

  const { gazePosition, currentlyOnScreen, offScreenSeconds } = useGaze({
    enabled: gazeEnabled && !showCalibration,
    onAttentionDrop: handleAttentionDrop,
  });

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = scenario?.steps[currentStep];

  // ── Session creation (skip if resuming) ──────────────────────────────────
  useEffect(() => {
    if (sessionId || !scenarioId) return; // already have one (resumed)

    const kidName = localStorage.getItem("hoovy_kid_name") || "Anonymous";
    axios
      .post<SessionRead>("/api/v1/sessions", {
        scenario_id: scenarioId,
        kid_name: kidName,
        language: "en",
      })
      .then((res) => {
        setSessionId(res.data.id);
      })
      .catch(() => {
        showToast("Could not start session. Check your connection.");
      });

    return () => {
      // fire-and-forget end session on unmount
      if (sessionId) {
        axios.post(`/api/v1/sessions/${sessionId}/end`).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  // ── Persist resume state on step/attempt/session changes ──────────────────
  useEffect(() => {
    if (!scenarioId || !sessionId) return;
    saveResume({ scenarioId, sessionId, stepIndex: currentStep, attempt });
  }, [scenarioId, sessionId, currentStep, attempt]);

  // ── POST attention log for previous step on step change ──────────────────
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
        .catch(() => {}); // fire-and-forget
    },
    [sessionId, gazeEnabled],
  );

  // ── Reset per-step state and auto-play teacher prompt ─────────────────────
  useEffect(() => {
    // Post attention for the step we're leaving (skip first mount)
    if (step?.id && gazeEnabled) {
      const elapsed = (Date.now() - stepStartRef.current) / 1000;
      const onScreenPct = elapsed > 0
        ? Math.max(0, 1 - offScreenSeconds / elapsed)
        : 1;
      postAttentionLog(
        step.id,
        Math.round(onScreenPct * 100) / 100,
        offScreenSeconds,
        redirectCountRef.current,
      );
    }
    // Reset per-step counters
    redirectCountRef.current = 0;
    stepStartRef.current = Date.now();

    setAttempt(resumeRef.current?.attempt ?? 1);
    resumeRef.current = null; // only use resume data once
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

  // ── Enable mic/choices once teacher audio finishes ────────────────────────
  useEffect(() => {
    if (!isPlaying && !isEvaluating && !feedback) {
      setMicEnabled(true);
    }
  }, [isPlaying, isEvaluating, feedback]);

  // ── Surface mic permission errors ────────────────────────────────────────
  useEffect(() => {
    if (micError) {
      setMicUnavailable(true);
    }
  }, [micError]);

  // ── Shared post-evaluate handler ─────────────────────────────────────────
  const handleEvaluateResult = useCallback(
    async (result: EvaluateResponse) => {
      setFeedback({ text: result.feedback, isCorrect: result.is_correct });
      if (!result.is_correct) setShowHint(true);

      await playDataUrl(result.feedback_audio_b64);

      if (result.advance) {
        advanceTimerRef.current = setTimeout(() => {
          const isLast = currentStep === (scenario?.steps.length ?? 1) - 1;
          if (isLast) {
            clearResume();
            navigate("/");
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

  // ── Submit audio when recording stops and blob is ready ───────────────────
  useEffect(() => {
    if (!blob || !sessionId || !step || isEvaluating) return;

    // Guard: blob too small = silence
    if (blob.size < MIN_BLOB_BYTES) {
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
      } catch {
        showToast("Teacher didn't catch that. Let's try again.");
        setMicEnabled(true);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  // ── Choice handler ────────────────────────────────────────────────────────
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
    if (isRecording) {
      stopRec();
    } else {
      start();
    }
  };

  const handleNext = () => {
    stop();
    setCurrentStep((s) => s + 1);
  };

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleToggleGaze() {
    if (gazeEnabled) {
      // Disable
      localStorage.setItem("hoovy_gaze_enabled", "false");
      setGazeEnabled(false);
      setShowCalibration(false);
    } else {
      // Enable — show calibration if not yet done
      localStorage.setItem("hoovy_gaze_enabled", "true");
      setGazeEnabled(true);
      if (localStorage.getItem("hoovy_gaze_calibrated") !== "true") {
        setShowCalibration(true);
      }
    }
  }

  function handleCalibrationComplete() {
    setShowCalibration(false);
  }

  function handleCalibrationSkip() {
    setShowCalibration(false);
    // Gaze stays enabled but uncalibrated — WebGazer still works
  }

  // ── Determine effective response type (force choice if mic unavailable) ───
  const effectiveResponseType =
    micUnavailable && step?.response_type === "voice"
      ? "choice"
      : micUnavailable && step?.response_type === "voice_or_choice"
        ? "choice"
        : (step?.response_type ?? "voice");

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-hoovy-bg flex items-center justify-center font-friendly">
        <div className="w-12 h-12 rounded-full border-4 border-hoovy-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !scenario || !step) {
    return (
      <div className="min-h-screen bg-hoovy-bg flex flex-col items-center justify-center gap-4 font-friendly">
        <p className="text-red-500 font-semibold text-lg">Scenario not found.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-hoovy-blue text-white font-bold rounded-2xl hover:bg-blue-500 transition-colors"
        >
          Back to Playground
        </button>
      </div>
    );
  }

  const isLast = currentStep === scenario.steps.length - 1;

  return (
    <div className="min-h-screen bg-hoovy-bg px-4 py-6 font-friendly flex flex-col max-w-xl mx-auto gap-5">
      {/* Gaze calibration overlay — renders outside the scrollable content */}
      {showCalibration && (
        <GazeCalibration
          onComplete={handleCalibrationComplete}
          onSkip={handleCalibrationSkip}
        />
      )}

      {/* Dev gaze HUD */}
      <GazeMonitor
        gazePosition={gazePosition}
        currentlyOnScreen={currentlyOnScreen}
        offScreenSeconds={offScreenSeconds}
      />

      {/* Modals */}
      {showNameModal && (
        <KidNameModal onConfirm={() => setShowNameModal(false)} />
      )}

      {/* Mic permission denied modal */}
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

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-100 border border-yellow-300 text-yellow-800 font-semibold text-sm px-5 py-3 rounded-2xl shadow-md max-w-xs text-center">
          {toast}
        </div>
      )}

      {/* Back + title + gaze toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            clearResume();
            navigate("/");
          }}
          className="text-hoovy-purple font-bold text-sm hover:underline"
        >
          Back
        </button>
        <h1 className="font-extrabold text-xl text-gray-800 truncate flex-1">
          {scenario.title}
        </h1>
        <button
          onClick={handleToggleGaze}
          title={gazeEnabled ? "Disable eye tracking" : "Enable eye tracking"}
          className={[
            "text-xs font-semibold px-3 py-1 rounded-xl border-2 transition-all",
            gazeEnabled
              ? "border-hoovy-purple text-hoovy-purple bg-purple-50 hover:bg-purple-100"
              : "border-gray-300 text-gray-400 hover:border-hoovy-purple hover:text-hoovy-purple",
          ].join(" ")}
        >
          {gazeEnabled ? "Eye on" : "Eye off"}
        </button>
      </div>

      {/* Progress */}
      <ProgressBar current={currentStep + 1} total={scenario.steps.length} />

      {/* Scene image */}
      <div
        className="w-full h-44 rounded-3xl bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden flex items-center justify-center"
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
          <span className="text-6xl select-none">🏫</span>
        )}
      </div>

      {/* Hint image */}
      {showHint && step.hint_image_url && (
        <div className="w-full rounded-2xl overflow-hidden border-2 border-yellow-300">
          <img src={step.hint_image_url} alt="hint" className="w-full object-cover" />
        </div>
      )}

      {/* Teacher + speech bubble */}
      <div className="flex items-start gap-4">
        <VirtualTeacher speaking={isPlaying} />
        <SpeechBubble
          text={feedback ? feedback.text : step.teacher_prompt}
          durationMs={duration > 0 ? duration * 1000 : undefined}
        />
      </div>

      {/* "Teacher is listening" overlay for response area */}
      {isEvaluating && (
        <div className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-purple-50 border border-purple-100">
          <div className="flex items-center gap-2 text-hoovy-purple font-semibold text-sm animate-pulse">
            <div className="w-3 h-3 rounded-full bg-hoovy-purple animate-ping" />
            Teacher is listening...
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={[
            "px-4 py-3 rounded-2xl font-bold text-sm text-center",
            feedback.isCorrect
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700",
          ].join(" ")}
        >
          {feedback.isCorrect ? "Great job!" : "Keep trying!"}
        </div>
      )}

      {/* Replay */}
      <div className="flex justify-end">
        <button
          onClick={() => play(step.teacher_prompt)}
          disabled={isPlaying || isRecording || isEvaluating}
          className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-hoovy-purple border-2 border-hoovy-purple rounded-xl hover:bg-purple-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Replay
        </button>
      </div>

      {/* Response input (voice + choice) */}
      {!isEvaluating && (
        <div className="flex flex-col items-center gap-4 w-full">
          <ResponseInput
            responseType={effectiveResponseType}
            choices={step.choices}
            isRecording={isRecording}
            isEvaluating={isEvaluating}
            disabled={!micEnabled || isPlaying}
            onToggle={handleMicToggle}
            onChoice={handleChoice}
          />
        </div>
      )}

      {/* Next / Finish (manual fallback for non-voice, non-choice steps e.g. tap) */}
      {effectiveResponseType === "tap" && (
        <div className="mt-auto">
          {isLast ? (
            <button
              onClick={() => {
                clearResume();
                navigate("/");
              }}
              className="w-full py-4 bg-hoovy-green text-white font-extrabold text-lg rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              Finish!
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={isPlaying}
              className="w-full py-4 bg-hoovy-blue text-white font-extrabold text-lg rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
