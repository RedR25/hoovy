import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useActiveKid, useCreateKid, useDeleteKid, useMyKids } from "../hooks";

const AVATAR_OPTIONS = ["🧒", "👦", "👧", "🧑", "👶", "🦸", "🦄", "🚂", "🐶", "🐱"];

export function KidsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { activeKidId, setActiveKidId } = useActiveKid();
  const { data: kids, isLoading, isError, error } = useMyKids();
  const createKid = useCreateKid();
  const deleteKid = useDeleteKid();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("🧒");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-hoovy-bg flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Sign in first</h1>
          <p className="text-gray-500 mb-6">Parents need to log in to manage kid profiles.</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-hoovy-blue text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const pickKid = (id: string) => {
    setActiveKidId(id);
    navigate("/");
  };

  const submitNewKid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createKid.mutate(
      { display_name: newName.trim(), avatar_emoji: newAvatar },
      {
        onSuccess: () => {
          setNewName("");
          setNewAvatar("🧒");
          setCreating(false);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-hoovy-bg p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">Who's playing today?</h1>
            <p className="text-gray-500 mt-1">Pick a kid profile to start a session.</p>
          </div>
          <button
            onClick={() => navigate("/progress")}
            className="text-sm font-bold text-hoovy-blue hover:underline"
          >
            See progress →
          </button>
        </div>

        {isLoading && <p className="text-gray-500">Loading kids…</p>}
        {isError && (
          <p className="text-red-600">Failed to load kids: {error?.message}</p>
        )}

        {kids && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {kids.map((kid) => {
              const isActive = kid.id === activeKidId;
              return (
                <div
                  key={kid.id}
                  className={`bg-white rounded-3xl shadow-md p-5 flex flex-col items-center gap-3 cursor-pointer border-4 transition-all ${
                    isActive ? "border-hoovy-blue scale-105" : "border-transparent hover:border-hoovy-blue/40"
                  }`}
                  onClick={() => pickKid(kid.id)}
                >
                  <div className="text-6xl">{kid.avatar_emoji}</div>
                  <div className="font-extrabold text-gray-800">{kid.display_name}</div>
                  {isActive && (
                    <div className="text-xs font-bold text-hoovy-blue uppercase">Active</div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove ${kid.display_name}?`)) {
                        if (kid.id === activeKidId) setActiveKidId(null);
                        deleteKid.mutate(kid.id);
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 mt-1"
                  >
                    Remove
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => setCreating((c) => !c)}
              className="bg-white border-4 border-dashed border-gray-300 rounded-3xl p-5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-hoovy-blue hover:text-hoovy-blue transition-colors min-h-[180px]"
            >
              <div className="text-5xl">+</div>
              <div className="font-bold">Add a kid</div>
            </button>
          </div>
        )}

        {creating && (
          <form
            onSubmit={submitNewKid}
            className="bg-white rounded-3xl shadow-md p-7 flex flex-col gap-4"
          >
            <h2 className="text-lg font-extrabold text-gray-800">New kid profile</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Display name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Mai"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-hoovy-blue"
                required
                minLength={1}
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewAvatar(emoji)}
                    className={`text-3xl w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition ${
                      newAvatar === emoji
                        ? "border-hoovy-blue bg-hoovy-blue/10"
                        : "border-gray-200 hover:border-hoovy-blue"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-2xl hover:border-hoovy-blue transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createKid.isPending || !newName.trim()}
                className="flex-1 bg-hoovy-blue text-white font-extrabold py-3 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {createKid.isPending ? "Saving…" : "Save"}
              </button>
            </div>
            {createKid.isError && (
              <p className="text-sm text-red-600">{createKid.error?.message}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
