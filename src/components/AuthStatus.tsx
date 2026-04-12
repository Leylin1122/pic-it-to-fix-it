"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { firebaseConfigError, firebaseConfigValid, getFirebaseAuth } from "@/lib/firebase";

export function AuthStatus() {
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

  const handleSignOut = async () => {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      setError("Sign out failed.");
    }
  };

  if (loading) {
    return <div className="text-xs text-zinc-400">Checking auth…</div>;
  }

  if (user) {
    return (
      <div className="flex flex-col items-end gap-2 text-right">
        <span className="text-[10px] uppercase tracking-[0.2em] text-industrial-amber">
          Signed in as
        </span>
        <p className="text-sm font-semibold text-zinc-100">{user.email ?? user.displayName ?? "User"}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded border border-industrial-amber/60 bg-industrial-amber/10 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-industrial-amber transition hover:bg-industrial-amber/20"
        >
          Sign out
        </button>
        {error ? <p className="text-[10px] text-rose-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <Link
        href="/login"
        className="rounded border border-industrial-amber/60 bg-industrial-amber/10 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-industrial-amber transition hover:bg-industrial-amber/20"
      >
        Sign in
      </Link>
      <span className="text-[10px] text-zinc-500">Authenticate to use the camera</span>
    </div>
  );
}
