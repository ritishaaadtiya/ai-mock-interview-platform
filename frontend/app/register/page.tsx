"use client";

import { useState } from "react";
import Link from "next/link";
import "./register.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{
  username?: string[];
  email?: string[];
  password?: string[];
  non_field_errors?: string[];
}>({});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Clear previous errors
  setErrors({});

  // Frontend validation
  if (password !== confirmPassword) {
    setErrors({
      password: ["Passwords do not match"],
    });
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8000/api/auth/register/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setErrors(data);
      return;
    }

    console.log("Registration successful:", data);
    alert("Registration successful!");
  } catch (error) {
    console.error("Error:", error);

    setErrors({
      non_field_errors: ["Unable to connect to the server."],
    });
  }
};

  return (
    <main className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>

        <p className="auth-subtitle">
          Start your AI mock interview journey
        </p>

        <form onSubmit={handleSubmit}>
            <div className="form-group">
            <label htmlFor="username">Username</label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />

            {errors.username && (
              <p className="error-message">{errors.username[0]}</p>
            )}
          </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />

                {errors.email && (
                  <p className="error-message">{errors.email[0]}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />

                {errors.password && (
                  <p className="error-message">{errors.password[0]}</p>
                )}
              </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
            />
          </div>

          <button type="submit" className="auth-button">
            Create Account
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?
          <Link href="/login" className="auth-link">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}