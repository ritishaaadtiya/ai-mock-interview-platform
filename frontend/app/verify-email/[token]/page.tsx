"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function VerifyEmailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = decodeURIComponent(resolvedParams.token);
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully.");
        } else {
          setStatus("error");
          setMessage(data.detail || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Unable to connect to the server.");
      }
    };
    
    verifyToken();
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand-600" />
            <h1 className="mb-2 font-display text-2xl font-semibold text-ink">Verifying Email</h1>
            <p className="text-sm text-ink-muted">Please wait while we verify your link...</p>
          </div>
        )}
        
        {status === "success" && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
            <h1 className="mb-2 font-display text-2xl font-semibold text-ink">Email Verified</h1>
            <p className="mb-6 text-sm text-ink-muted">
              {message}<br/>You can now log in to your account.
            </p>
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-brand-600 py-3 text-[0.95rem] font-medium text-white transition-colors hover:bg-brand-700"
            >
              Login
            </Link>
          </div>
        )}
        
        {status === "error" && (
          <div className="flex flex-col items-center">
            <XCircle className="mb-4 h-16 w-16 text-red-500" />
            <h1 className="mb-2 font-display text-2xl font-semibold text-ink">Verification Failed</h1>
            <p className="mb-6 text-sm text-ink-muted">{message}</p>
            <div className="flex w-full flex-col gap-3">
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-xl border border-line bg-surface py-3 text-[0.95rem] font-medium text-ink transition-colors hover:bg-paper"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
