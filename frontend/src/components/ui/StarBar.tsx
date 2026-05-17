interface Props {
  filled: number; // number of filled stars
  total?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_PX: Record<NonNullable<Props["size"]>, number> = {
  sm: 14,
  md: 20,
  lg: 28,
};

export function StarBar({ filled, total = 5, size = "md", className = "" }: Props) {
  const px = SIZE_PX[size];
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <Star key={i} active={i < filled} size={px} />
      ))}
    </div>
  );
}

function Star({ active, size }: { active: boolean; size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <polygon
        points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"
        fill={active ? "#FFD166" : "#E5E7EB"}
        stroke={active ? "#F0B400" : "#D1D5DB"}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
