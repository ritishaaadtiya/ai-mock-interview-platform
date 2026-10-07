import Link from "next/link";
import { Mail } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Mail size={32} />
        </div>
        <h1 className="mb-3 font-display text-2xl font-semibold tracking-tight text-ink">
          Check your email
        </h1>
        <p className="mb-6 text-sm text-ink-muted leading-relaxed">
          We sent a verification link to your email address. 
          Please check your inbox and click &quot;Verify Email&quot; to activate your account.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-xl border border-line bg-surface py-3 text-[0.95rem] font-medium text-ink transition-colors hover:bg-paper"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
