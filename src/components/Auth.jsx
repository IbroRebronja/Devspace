
import React, { useState } from "react";
import { authAPI } from "../services/api";
import "../styles/Auth.css";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;

      if (mode === "register") {
        result = await authAPI.register({
          name,
          email,
          password,
        });
      } else {
        result = await authAPI.login({
          email,
          password,
        });
      }

      onLogin(result.user);
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">D</div>
          <span>DevSpace</span>
        </div>

        <div className="auth-heading">
          <span className="section-kicker">
            YOUR DEVELOPER WORKSPACE
          </span>

          <h1>
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h1>

          <p>
            {mode === "login"
              ? "Sign in to continue to your workspace."
              : "Start organising your development projects."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign in
          </button>

          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <label>
              Full name
              <input
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Your name"
                maxLength={100}
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={72}
              required
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in to DevSpace"
                : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Secure authentication powered by DevSpace.
        </p>
      </section>
    </main>
  );
}
