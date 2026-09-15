"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setIsSubmitting(true);

  try {
    const response = await fetch(
      "http://localhost:8000/api/auth/login/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail || "Invalid email or password.");
      return;
    }

    // Store JWT tokens
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);

    // Login successful
    window.location.href = "/interview";
  } catch (error) {
    console.error("Login error:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <main className="flex min-h-screen bg-paper">
      {/* Left branding panel — hidden on small screens */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-ink px-10 py-10 text-white lg:flex xl:px-14">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-400 blur-3xl" />
          <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-brand-200 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-2 text-sm font-medium">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <Sparkles size={16} className="text-brand-200" />
          </span>
          MockInterview AI
        </div>

        <div className="relative max-w-sm">
          <h2 className="font-display text-3xl font-semibold leading-snug tracking-tight">
            Walk into every interview prepared.
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-white/70">
            Practice with AI-generated questions tailored to your resume,
            role, and experience — then get feedback that actually helps.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-white/50">
          <span>© {new Date().getFullYear()} MockInterview AI</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>All rights reserved</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile-only brand mark */}
          <div className="mb-8 flex items-center gap-2 text-sm font-medium text-ink lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
              <Sparkles size={16} />
            </span>
            MockInterview AI
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              Login to continue your interview journey.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Email
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-faint">
                    <Mail size={16} strokeWidth={1.75} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3.5 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus:border-brand-500 focus:shadow-focus focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-ink"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-faint">
                    <Lock size={16} strokeWidth={1.75} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-11 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus:border-brand-500 focus:shadow-focus focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-faint transition-colors hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={[
                  "mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[0.95rem] font-medium text-white transition-all duration-150",
                  isSubmitting
                    ? "cursor-not-allowed bg-ink-faint/50"
                    : "bg-brand-600 shadow-raised hover:bg-brand-700 active:bg-brand-700",
                ].join(" ")}
              >
                {isSubmitting ? "Signing in…" : "Login"}
                {!isSubmitting && <ArrowRight size={16} strokeWidth={2} />}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}