interface Props {
  children: React.ReactNode;
  /** "playground" = sky+sun+clouds+grass (welcome). "soft" = cream bg (lists/pages). */
  variant?: "playground" | "soft" | "rainbow";
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

