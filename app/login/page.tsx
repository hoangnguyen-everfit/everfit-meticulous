"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    router.push("/dashboard");
  };

  return (
    <section>
      <h1>Login</h1>
      <form
        onSubmit={handleSubmit}
        data-testid="form-login"
        style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}
      >
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="input-email-login"
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="input-password-login"
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <button
          type="submit"
          data-testid="btn-submit-login"
          style={{ padding: 10, background: "#5158cf", color: "#fff", border: 0, borderRadius: 6 }}
        >
          Log in
        </button>
      </form>
    </section>
  );
}
