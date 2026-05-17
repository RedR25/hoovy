import React from "react";

type Variant = "green" | "pink" | "orange" | "yellow" | "blue" | "white";
type Size = "sm" | "md" | "lg";
type Shape = "pill" | "round" | "square";

/**
 * 3D-style button matching the Figma design.
 *
 * Recipe: solid color + thick white border + solid offset shadow (no blur)
 * in a darker shade of the button color. On press: translate down + remove
 * shadow → simulates being depressed.
 */

const VARIANT: Record<
  Variant,
  { bg: string; shadow: string; border: string; text: string }
> = {
  green:  { bg: "bg-hoovy-green",  shadow: "shadow-[0_6px_0_#2A9038]", border: "border-white",         text: "text-white" },
  pink:   { bg: "bg-hoovy-pink",   shadow: "shadow-[0_6px_0_#D93D55]", border: "border-white",         text: "text-white" },
  orange: { bg: "bg-hoovy-orange", shadow: "shadow-[0_6px_0_#CC7A00]", border: "border-white",         text: "text-white" },
  yellow: { bg: "bg-hoovy-yellow", shadow: "shadow-[0_6px_0_#D98A1C]", border: "border-white",         text: "text-hoovy-navy" },
  blue:   { bg: "bg-hoovy-sky",    shadow: "shadow-[0_6px_0_#1C86D9]", border: "border-white",         text: "text-white" },
  white:  { bg: "bg-white",        shadow: "shadow-[0_6px_0_#E5DCC2]", border: "border-hoovy-yellow",  text: "text-hoovy-skyDeep" },
};

const SIZE_PILL: Record<Size, string> = {
  sm: "px-4 py-2 text-sm border-[3px] rounded-full",
  md: "px-6 py-3 text-base border-[4px] rounded-full",
  lg: "px-8 py-4 text-xl border-[5px] rounded-full",
};

const SIZE_ROUND: Record<Size, string> = {
  sm: "w-10 h-10 border-[3px] text-sm",
  md: "w-14 h-14 border-[4px] text-base",
  lg: "w-20 h-20 border-[5px] text-xl",
};

const SIZE_SQUARE: Record<Size, string> = {
  sm: "px-3 py-2 text-sm border-[3px] rounded-2xl",
  md: "px-5 py-3 text-base border-[4px] rounded-2xl",
  lg: "px-7 py-4 text-lg border-[5px] rounded-3xl",
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  shape?: Shape;
  fullWidth?: boolean;
}

export function Hoovy3DButton({
  variant = "green",
  size = "md",
  shape = "pill",
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...rest
}: Props) {
  const v = VARIANT[variant];
  const shapeSize =
    shape === "round" ? SIZE_ROUND[size] + " rounded-full"
    : shape === "square" ? SIZE_SQUARE[size]
    : SIZE_PILL[size];

  return (
    <button
      {...rest}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-extrabold tracking-wide",
        "transition-all duration-100",
        "active:translate-y-[6px] active:!shadow-none",
        v.bg, v.border, v.text, v.shadow,
        shapeSize,
        fullWidth ? "w-full" : "",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
