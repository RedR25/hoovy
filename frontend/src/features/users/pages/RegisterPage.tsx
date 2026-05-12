import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "@/features/users/hooks";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useRegister();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await register.mutateAsync({ email, password, full_name: fullName || undefined });
    navigate("/login");
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 320, margin: "4rem auto" }}>
      <h1>Register</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Full name (optional)"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password (min 8)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      <button type="submit" disabled={register.isPending}>
        {register.isPending ? "..." : "Create account"}
      </button>
      {register.error && <p style={{ color: "crimson" }}>{register.error.message}</p>}
      <p>
        Already have one? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
};
