import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useActiveKid, useMyKids } from "@/features/kids/hooks";

// ---------------------------------------------------------------------------
// Mocked progress data. Backend aggregation endpoint is a v2; this is UI only.
// ---------------------------------------------------------------------------

interface DomainProgress {
  domain: "communication" | "money" | "time" | "social" | "practical";
  attempted: number;
  correct: number;
}

interface SessionSummary {
  scenario_title: string;
  date: string;
  accuracy: number;
  steps_done: number;
  total_steps: number;
}

interface MockKidProgress {
  sessions_total: number;
  scenarios_completed: number;
  streak_days: number;
  avg_attempts_to_correct: number;
  domains: DomainProgress[];
  recent: SessionSummary[];
  weekly_minutes: number[]; // last 7 days
}

const MOCK_PROGRESS: MockKidProgress = {
  sessions_total: 23,
  scenarios_completed: 11,
  streak_days: 4,
  avg_attempts_to_correct: 1.4,
  domains: [
    { domain: "communication", attempted: 28, correct: 23 },
    { domain: "social", attempted: 14, correct: 11 },
    { domain: "money", attempted: 9, correct: 6 },
    { domain: "time", attempted: 4, correct: 3 },
    { domain: "practical", attempted: 6, correct: 4 },
  ],
  recent: [
    { scenario_title: "Greeting the teacher", date: "Today", accuracy: 1.0, steps_done: 3, total_steps: 3 },
    { scenario_title: "Train Station Visit", date: "Yesterday", accuracy: 0.67, steps_done: 3, total_steps: 3 },
    { scenario_title: "Buying juice at the shop", date: "2 days ago", accuracy: 1.0, steps_done: 2, total_steps: 2 },
    { scenario_title: "Asking for help politely", date: "3 days ago", accuracy: 0.5, steps_done: 2, total_steps: 2 },
    { scenario_title: "Saying goodbye to grandma", date: "4 days ago", accuracy: 1.0, steps_done: 3, total_steps: 3 },
  ],
  weekly_minutes: [6, 8, 0, 12, 5, 9, 7],
};

const DOMAIN_COLORS: Record<DomainProgress["domain"], string> = {
  communication: "bg-blue-400",
  social: "bg-purple-400",
  money: "bg-emerald-400",
  time: "bg-amber-400",
  practical: "bg-pink-400",
};

function StatCard({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="bg-white rounded-3xl shadow-md p-5">
      <div className="text-xs font-bold text-gray-400 uppercase">{label}</div>
      <div className="text-3xl font-extrabold text-gray-800 mt-1">
        {value}
        {suffix && <span className="text-base text-gray-400 font-bold ml-1">{suffix}</span>}
      </div>
    </div>
  );
}

function AccuracyRing({ accuracy }: { accuracy: number }) {
  const pct = Math.round(accuracy * 100);
  const dashoffset = 264 * (1 - accuracy);
  return (
    <div className="bg-white rounded-3xl shadow-md p-5 flex items-center gap-5">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="264"
            strokeDashoffset={dashoffset}
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-extrabold text-gray-800">{pct}%</div>
          <div className="text-xs font-bold text-gray-400 uppercase">accuracy</div>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-500">Overall accuracy across</div>
        <div className="text-xl font-extrabold text-gray-800">all sessions</div>
        <div className="text-xs text-gray-400 mt-2">Higher is better. Hoovy adapts hints when this drops.</div>
      </div>
    </div>
  );
}

function DomainBars({ domains }: { domains: DomainProgress[] }) {
  const max = Math.max(...domains.map((d) => d.attempted));
  return (
    <div className="bg-white rounded-3xl shadow-md p-5">
      <h3 className="font-extrabold text-gray-800 mb-4">By skill area</h3>
      <div className="flex flex-col gap-3">
        {domains.map((d) => {
          const acc = d.attempted ? d.correct / d.attempted : 0;
          const width = max ? (d.attempted / max) * 100 : 0;
          return (
            <div key={d.domain}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold capitalize text-gray-700">{d.domain}</span>
                <span className="text-gray-500">
                  {d.correct}/{d.attempted} · {Math.round(acc * 100)}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${DOMAIN_COLORS[d.domain]} transition-all`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklySparkline({ minutes }: { minutes: number[] }) {
  const max = Math.max(...minutes, 1);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="bg-white rounded-3xl shadow-md p-5">
      <h3 className="font-extrabold text-gray-800 mb-4">Minutes this week</h3>
      <div className="flex items-end gap-2 h-32">
        {minutes.map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex-1 w-full flex items-end">
              <div
                className="w-full bg-gradient-to-t from-hoovy-blue to-hoovy-purple rounded-t-lg transition-all"
                style={{ height: `${(m / max) * 100}%`, minHeight: m > 0 ? "6px" : "0" }}
              />
            </div>
            <div className="text-xs font-bold text-gray-400">{days[i]}</div>
            <div className="text-xs text-gray-500">{m}m</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentSessions({ sessions }: { sessions: SessionSummary[] }) {
  return (
    <div className="bg-white rounded-3xl shadow-md p-5">
      <h3 className="font-extrabold text-gray-800 mb-4">Recent sessions</h3>
      <ul className="flex flex-col divide-y divide-gray-100">
        {sessions.map((s, i) => (
          <li key={i} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-800">{s.scenario_title}</div>
              <div className="text-xs text-gray-400">
                {s.date} · {s.steps_done}/{s.total_steps} steps
              </div>
            </div>
            <div
              className={`text-sm font-extrabold ${
                s.accuracy >= 0.8
                  ? "text-emerald-500"
                  : s.accuracy >= 0.5
                  ? "text-amber-500"
                  : "text-red-400"
              }`}
            >
              {Math.round(s.accuracy * 100)}%
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgressPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: kids } = useMyKids();
  const { activeKidId } = useActiveKid();
  const activeKid = kids?.find((k) => k.id === activeKidId);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-hoovy-bg flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Parents only</h1>
          <p className="text-gray-500 mb-6">Sign in to see progress for your kids.</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-hoovy-blue text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const overallAccuracy =
    MOCK_PROGRESS.domains.reduce((acc, d) => acc + d.correct, 0) /
    Math.max(1, MOCK_PROGRESS.domains.reduce((acc, d) => acc + d.attempted, 0));

  return (
    <div className="min-h-screen bg-hoovy-bg p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{activeKid?.avatar_emoji ?? "📊"}</span>
              <h1 className="text-3xl font-extrabold text-gray-800">
                {activeKid ? `${activeKid.display_name}'s progress` : "Progress"}
              </h1>
            </div>
            <p className="text-gray-500 mt-1 text-sm">
              {activeKid
                ? "What's working, what to practice next."
                : "Pick a kid first to see their numbers."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/kids")}
              className="text-sm font-bold text-hoovy-blue hover:underline"
            >
              Switch kid
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-sm font-bold text-gray-500 hover:underline"
            >
              Playground
            </button>
          </div>
        </div>

        {!activeKid && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6 text-yellow-800 text-sm">
            No active kid selected — showing demo data.{" "}
            <button onClick={() => navigate("/kids")} className="underline font-bold">
              Pick a kid
            </button>
            .
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard label="Sessions" value={MOCK_PROGRESS.sessions_total} />
          <StatCard label="Scenarios done" value={MOCK_PROGRESS.scenarios_completed} />
          <StatCard label="Streak" value={MOCK_PROGRESS.streak_days} suffix="days" />
          <StatCard label="Avg attempts" value={MOCK_PROGRESS.avg_attempts_to_correct} suffix="/correct" />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <AccuracyRing accuracy={overallAccuracy} />
          <WeeklySparkline minutes={MOCK_PROGRESS.weekly_minutes} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <DomainBars domains={MOCK_PROGRESS.domains} />
          <RecentSessions sessions={MOCK_PROGRESS.recent} />
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          Numbers shown are demo data. Live aggregation hooks up to{" "}
          <code className="bg-gray-100 px-1 rounded">/api/v1/kids/{"{id}"}/progress</code> in v2.
        </p>
      </div>
    </div>
  );
}
