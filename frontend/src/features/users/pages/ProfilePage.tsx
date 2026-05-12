import { useMe } from "@/features/users/hooks";
import { useAuth } from "@/features/auth/AuthProvider";

export const ProfilePage = () => {
  const { data, isLoading, error } = useMe();
  const { logout } = useAuth();

  if (isLoading) return <p>Loading…</p>;
  if (error || !data) return <p style={{ color: "crimson" }}>Failed to load profile.</p>;

  return (
    <div style={{ maxWidth: 480, margin: "4rem auto" }}>
      <h1>Hello, {data.full_name ?? data.email}</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={logout}>Log out</button>
    </div>
  );
};
