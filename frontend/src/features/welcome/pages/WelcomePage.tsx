import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SceneBackdrop } from "@/components/ui/SceneBackdrop";
import { HoovyMascot } from "@/components/ui/HoovyMascot";
import { Hoovy3DButton } from "@/components/ui/Hoovy3DButton";

export function WelcomePage() {
  const navigate = useNavigate();

  // Lock the document — nothing scrolls.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <SceneBackdrop variant="playground">
      {/* One centered stack: logo → mascot → card. Sized 1.5x larger. */}
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-5 px-6">
        {/* Logo + tagline (1.5x) */}
        <header className="text-center">
          <h1
            className="font-extrabold tracking-tight leading-none"
            style={{
              fontSize: "clamp(3.75rem, 12dvh, 6rem)",
              fontFamily: "Fredoka, Nunito, sans-serif",
              background:
                "linear-gradient(90deg,#FF4766 0%,#FF9800 25%,#FFD833 50%,#3CB84B 75%,#1FA3E6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 6px 0 rgba(255,255,255,0.6))",
            }}
          >
            Hoovy
          </h1>
          <p
            className="mt-1 text-base font-extrabold text-white"
            style={{ textShadow: "0 2px 4px rgba(31,111,216,0.6)" }}
          >
            Your friendly learning buddy
          </p>
        </header>

        {/* Mascot (1.5x: 240 → 360) */}
        <HoovyMascot size={360} speaking />

        {/* Greeting card (1.5x padding, text, borders, shadows) */}
        <div className="w-full max-w-2xl bg-white rounded-[2.25rem] px-8 py-6 text-center relative border-[8px] border-hoovy-yellow shadow-[0_12px_0_#FF9800,0_22px_35px_rgba(0,0,0,0.15)]">
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[20px] border-b-hoovy-yellow" />

          <h2 className="text-4xl font-extrabold text-hoovy-skyDeep leading-tight" style={{ fontFamily: "Fredoka" }}>
            Hi, I'm Hoovy!
          </h2>
          <p className="mt-2 text-lg text-hoovy-navy font-bold leading-snug">
            Let's <span className="text-hoovy-pink">play</span>,{" "}
            <span className="text-hoovy-orange">learn</span>,
            and <span className="text-hoovy-purple">grow</span> together!
          </p>

          <Hoovy3DButton
            variant="green"
            size="lg"
            fullWidth
            className="mt-5 !text-2xl !py-5"
            onClick={() => navigate("/episodes")}
          >
            <span className="inline-flex items-center justify-center gap-3">
              Let's Play!
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                <polygon points="6 4 20 12 6 20" />
              </svg>
            </span>
          </Hoovy3DButton>
        </div>
      </div>
    </SceneBackdrop>
  );
}
