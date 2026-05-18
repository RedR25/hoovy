import { useLocation, useNavigate } from "react-router-dom";

interface Tab {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    to: "/episodes",
    label: "Episodes",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="3" />
        <path d="M8 3l4 3 4-3" />
      </svg>
    ),
  },
  {
    to: "/progress",
    label: "Growth",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-8" />
        <path d="M22 20V8" />
      </svg>
    ),
  },
  {
    to: "/author",
    label: "Build",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a3 3 0 0 1 4.2 4.2L7.5 21.9 3 23l1.1-4.5z" />
        <path d="M13 7.5l3.5 3.5" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 pb-5 pointer-events-none">
      <div
        className={[
          "pointer-events-auto max-w-md mx-auto flex items-center justify-around",
          "bg-white rounded-full px-3 py-2",
          "border-[5px] border-white",
          "shadow-[0_10px_24px_rgba(31,111,216,0.18),0_4px_0_rgba(11,61,138,0.06),inset_0_2px_0_rgba(255,255,255,0.7)]",
        ].join(" ")}
      >
        {TABS.map((tab) => {
          const active =
            pathname === tab.to ||
            (tab.to === "/episodes" && pathname.startsWith("/scenario"));
          return (
            <button
              key={tab.to}
              onClick={() => navigate(tab.to)}
              className={[
                "flex flex-col items-center gap-0.5 px-5 py-2 rounded-full transition-all duration-100",
                "active:translate-y-[3px] active:!shadow-none",
                active
                  ? "bg-hoovy-sky text-white border-[3px] border-white shadow-[0_4px_0_#1C86D9]"
                  : "text-hoovy-navy/55 hover:text-hoovy-sky",
              ].join(" ")}
            >
              {tab.icon}
              <span className="text-[10px] font-extrabold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
