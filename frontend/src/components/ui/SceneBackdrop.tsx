interface Props {
  children: React.ReactNode;
  /**
   * "playground" = hero sky+sun+clouds+grass (welcome).
   * "soft" = cream bg (lists/pages).
   * "rainbow" = pastel multi-stop (progress).
   * "meadow" = soft sky → subtle grass strip with little trees (episode list).
   */
  variant?: "playground" | "soft" | "rainbow" | "meadow";
  /** Show full-height playground elements (sun, multiple clouds, full grass) */
  scenery?: boolean;
  className?: string;
}

/**
 * Backdrop chrome — every Hoovy screen sits on top of one of these. Visuals
 * match the Figma site's playground style: sky gradient, fluffy inset-shadow
 * clouds, glowing sun, rounded-top grass with inset highlight, 3D trees.
 */
export function SceneBackdrop({
  children,
  variant = "playground",
  scenery = true,
  className = "",
}: Props) {
  if (variant === "soft") {
    return (
      <div className={`min-h-screen relative overflow-hidden ${className}`}
           style={{ background: "linear-gradient(to bottom, #FFFDF5, #FFF1D6 100%)" }}>
        {scenery && (
          <>
            <Cloud size={70} className="absolute top-6 left-6 opacity-90" />
            <Cloud size={56} className="absolute top-16 right-8 opacity-80" />
          </>
        )}
        <div className="relative">{children}</div>
      </div>
    );
  }

  if (variant === "rainbow") {
    return (
      <div className={`min-h-screen relative overflow-hidden ${className}`}
           style={{
             background:
               "linear-gradient(to bottom, #BFE6FF 0%, #FFE6F4 45%, #FFF6D9 75%, #DFFFE3 100%)",
           }}>
        {scenery && (
          <>
            <Cloud size={84} className="absolute top-10 left-8 opacity-95" />
            <Cloud size={64} className="absolute top-20 right-10 opacity-85" />
          </>
        )}
        <div className="relative">{children}</div>
      </div>
    );
  }

  if (variant === "meadow") {
    // List-view backdrop modeled on the My Episodes mockup: a saturated sky
    // that meets a vivid grass band with tiny tree silhouettes. Calmer than
    // the hero "playground" (no giant sun, no oversized clouds) but still
    // colorful — pastel washes felt washed-out.
    return (
      <div
        className={`min-h-screen relative overflow-hidden ${className}`}
        style={{
          // Three-stop sky → soft horizon haze → grass top color, so the
          // blue-to-green transition reads like an actual horizon, not a
          // pastel smear.
          background:
            "linear-gradient(to bottom," +
            " #3FA7E0 0%," +
            " #6BC4EE 30%," +
            " #B6E2F4 62%," +
            " #DFF1D1 72%," +
            " #8FD672 100%)",
        }}
      >
        {scenery && (
          <>
            {/* Sky clouds — small, soft */}
            <Cloud size={80} className="absolute top-6 left-[6%]" />
            <Cloud size={56} className="absolute top-16 right-[10%]" />
            <Cloud size={44} className="absolute top-28 left-[55%] opacity-90" />
            <Cloud size={36} className="absolute top-44 left-[18%] opacity-80" />

            {/* Bottom grass band with tiny tree silhouettes */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 right-0 z-0"
              style={{ height: "140px" }}
            >
              {/* Grass mound */}
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: "100px",
                  background:
                    "linear-gradient(to top, #4FB256 0%, #6FCB5E 55%, #8FD672 100%)",
                  borderTopLeftRadius: "100% 55%",
                  borderTopRightRadius: "100% 55%",
                  boxShadow:
                    "inset 0 14px 28px rgba(255,255,255,0.28), 0 -8px 18px rgba(63,167,224,0.08)",
                }}
              />
              {/* Trees scattered along the mound */}
              <TinyTree className="absolute bottom-4  left-[4%]"   size={34} tone="dark"  />
              <TinyTree className="absolute bottom-2  left-[16%]"  size={24} tone="light" />
              <TinyTree className="absolute bottom-5  left-[30%]"  size={30} tone="dark"  />
              <TinyTree className="absolute bottom-3  left-[44%]"  size={22} tone="light" />
              <TinyTree className="absolute bottom-5  left-[58%]"  size={28} tone="dark"  />
              <TinyTree className="absolute bottom-2  left-[72%]"  size={22} tone="light" />
              <TinyTree className="absolute bottom-4  left-[84%]"  size={30} tone="dark"  />
              <TinyTree className="absolute bottom-2  right-[3%]"  size={22} tone="light" />
            </div>
          </>
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden bg-sky ${className}`}>
      {scenery && (
        <>
          {/* Sun */}
          <div
            className="absolute top-10 left-8 w-28 h-28 rounded-full flex items-center justify-center z-0"
            style={{
              background: "linear-gradient(135deg, #FFF599 0%, #FFD833 50%, #FF9800 100%)",
              boxShadow:
                "0 0 60px rgba(255,216,51,0.6), inset -6px -6px 15px rgba(255,152,0,0.5)",
            }}
          />
          {/* Clouds */}
          <Cloud size={140} className="absolute top-20 right-[10%] z-0" />
          <Cloud size={90} className="absolute top-40 left-[28%] z-0 scale-y-75" />
          <Cloud size={70} className="absolute top-12 left-[55%] z-0" />

          {/* Grass band — rounded top with inset highlight */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 z-0"
            style={{
              background: "linear-gradient(to top, #3CB84B 0%, #59D968 100%)",
              borderTopLeftRadius: "100% 60%",
              borderTopRightRadius: "100% 60%",
              borderTop: "8px solid #3CB84B",
              boxShadow:
                "inset 0 15px 30px rgba(255,255,255,0.4), 0 -10px 20px rgba(71,194,255,0.2)",
            }}
          />
        </>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Cloud({ size = 100, className = "" }: { size?: number; className?: string }) {
  // Approximate 3.2:1 cloud shape using a wide pill with inset shadow
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size / 3.2,
        background: "rgba(255,255,255,0.95)",
        borderRadius: 9999,
        boxShadow:
          "inset -4px -6px 12px rgba(71,194,255,0.2), 0 10px 20px rgba(0,0,0,0.05)",
      }}
    />
  );
}

function TinyTree({
  size = 24,
  tone = "dark",
  className = "",
}: {
  size?: number;
  tone?: "dark" | "light";
  className?: string;
}) {
  const canopy = tone === "dark" ? "#3CB84B" : "#7BD686";
  const canopyShade = tone === "dark" ? "#2A9038" : "#5DC471";
  const trunk = tone === "dark" ? "#7A4A28" : "#9C6D44";
  const trunkW = Math.max(3, Math.round(size * 0.15));
  const trunkH = Math.round(size * 0.35);
  const canopyR = Math.round(size * 0.55);

  return (
    <div className={className} style={{ width: size, height: size }} aria-hidden>
      <div className="relative w-full h-full">
        {/* canopy */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: 0,
            width: canopyR * 2,
            height: canopyR * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, ${canopy} 0%, ${canopyShade} 100%)`,
            boxShadow: "inset -3px -4px 6px rgba(0,0,0,0.12)",
          }}
        />
        {/* trunk */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-sm"
          style={{
            bottom: 0,
            width: trunkW,
            height: trunkH,
            background: trunk,
          }}
        />
      </div>
    </div>
  );
}
