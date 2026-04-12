"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { firebaseConfigError, firebaseConfigValid, getFirebaseAuth } from "@/lib/firebase";

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseConfigValid) {
      setError(firebaseConfigError?.message ?? "Firebase is not configured.");
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-400">
        Checking authentication…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-3xl flex-col items-center justify-center rounded-3xl border border-industrial-rail/80 bg-industrial-panel/80 p-8 text-center shadow-lg">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-rose-400">
          Configuration error
        </p>
        <p className="mt-3 text-sm text-zinc-300">{error}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded border border-industrial-amber/60 bg-industrial-amber/10 px-6 py-3 text-sm uppercase tracking-[0.2em] text-industrial-amber transition hover:border-industrial-amber hover:bg-industrial-amber/20"
        >
          Go to login page
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-3xl flex-col items-center justify-center rounded-3xl border border-industrial-rail/80 bg-industrial-panel/80 p-8 text-center shadow-lg">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-industrial-amber">
          Sign in required
        </p>
        <p className="mt-3 text-sm text-zinc-300">
          You need to sign in before using the capture bay and diagnostics.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded border border-industrial-amber/60 bg-industrial-amber/10 px-6 py-3 text-sm uppercase tracking-[0.2em] text-industrial-amber transition hover:border-industrial-amber hover:bg-industrial-amber/20"
        >
          Sign in with Google
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
