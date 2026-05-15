import { useState } from "react";

interface KidNameModalProps {
  onConfirm: (name: string) => void;
}

export function KidNameModal({ onConfirm }: KidNameModalProps) {
  const [name, setName] = useState("");

  const submit = (value: string) => {
    const trimmed = value.trim() || "Anonymous";
    localStorage.setItem("hoovy_kid_name", trimmed);
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col gap-5 max-w-sm w-full">
        <h2 className="text-2xl font-extrabold text-gray-800 text-center">
          What's your name?
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(name)}
          placeholder="Type your name..."
          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-lg font-semibold focus:outline-none focus:border-hoovy-blue"
          autoFocus
        />
        <button
          onClick={() => submit(name)}
          className="w-full py-4 bg-hoovy-blue text-white font-extrabold text-lg rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          Let's go!
        </button>
        <button
          onClick={() => submit("Anonymous")}
          className="text-sm text-gray-400 hover:text-gray-600 text-center underline"
        >
          I'll skip
        </button>
      </div>
    </div>
  );
}
