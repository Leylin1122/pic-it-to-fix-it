"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { firebaseConfigError, firebaseConfigValid, getFirebaseAuth } from "@/lib/firebase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!firebaseConfigValid) {
      setError(firebaseConfigError?.message ?? "Firebase is not configured.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setMessage("Check your inbox for a password reset link.");
      router.push("/reset-password/sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send reset email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-industrial-void bg-grid-pattern bg-grid">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-industrial-amber/5 via-transparent to-transparent"
        aria-hidden
      />
      <main className="relative z-10 mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-industrial-rail/80 bg-industrial-panel/90 p-8 shadow-2xl">
          <div className="mb-6">
            <p className="font-display text-xs uppercase tracking-[0.22em] text-industrial-amber">
              Password recovery
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-zinc-100">Forgot your password?</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Enter your registered email and we’ll send a password reset link.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-industrial-rail/80 bg-black/20 p-5">
            <label className="block text-xs uppercase tracking-[0.2em] text-zinc-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded border border-industrial-rail bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-industrial-amber"
              placeholder="you@example.com"
            />

            <button
              type="button"
              onClick={handleReset}
              disabled={busy || !email}
              className="w-full rounded border border-industrial-amber/60 bg-industrial-amber/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-industrial-amber transition hover:bg-industrial-amber/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Sending reset link…" : "Send reset link"}
            </button>

            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </div>

          <div className="mt-6 text-sm text-zinc-500">
            <Link href="/login" className="text-industrial-amber underline">
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
