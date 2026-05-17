interface Props {
  speaking?: boolean;
}

export function VirtualTeacher({ speaking = false }: Props) {
  return (
    <div className="relative flex-shrink-0">
      {/* Avatar circle */}
      <div
        className={[
          "w-20 h-20 rounded-full bg-gradient-to-br from-hoovy-purple to-hoovy-blue",
          "flex items-center justify-center text-4xl shadow-lg select-none",
          speaking ? "animate-pulse" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        🧑‍🏫
      </div>

      {/* Mouth indicator */}
      {speaking && (
        <span
          className="absolute bottom-1 right-1 w-4 h-2 rounded-full bg-hoovy-pink animate-bounce shadow"
          aria-hidden="true"
        />
      )}

      {/* Sound wave dots */}
      {speaking && (
        <div className="absolute -right-5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-hoovy-purple opacity-70 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
