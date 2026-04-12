"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { firebaseConfigError, firebaseConfigValid, getFirebaseAuth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const goToCamera = () => {
    router.push("/camera");
  };

  const handleGoogleSignIn = async () => {
    if (!firebaseConfigValid) {
      setError(firebaseConfigError?.message ?? "Firebase is not configured.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getFirebaseAuth(), provider);
      goToCamera();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!firebaseConfigValid) {
      setError(firebaseConfigError?.message ?? "Firebase is not configured.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      goToCamera();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!firebaseConfigValid) {
      setError(firebaseConfigError?.message ?? "Firebase is not configured.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await signOut(getFirebaseAuth());
    } catch {
      setError("Sign out failed.");
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
              Authentication
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-zinc-100">Sign in to Pic It To Fix It</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Use Google or email/password to access the capture bay and repair guidance.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-400">Checking auth…</p>
          ) : user ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-200">
                Signed in as <span className="font-semibold">{user.email ?? user.displayName}</span>
              </p>
              <button
                type="button"
                onClick={goToCamera}
                className="w-full rounded border border-industrial-amber/60 bg-industrial-amber px-5 py-3 text-sm uppercase tracking-[0.2em] text-black transition hover:bg-yellow-300"
              >
                Continue to camera
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={busy}
                className="w-full rounded border border-industrial-amber/60 bg-industrial-amber/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-industrial-amber transition hover:bg-industrial-amber/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded border px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition ${
                    mode === "login"
                      ? "border-industrial-amber bg-industrial-amber/10 text-industrial-amber"
                      : "border-industrial-rail bg-transparent text-zinc-300 hover:border-industrial-amber/40"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`rounded border px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition ${
                    mode === "register"
                      ? "border-industrial-amber bg-industrial-amber/10 text-industrial-amber"
                      : "border-industrial-rail bg-transparent text-zinc-300 hover:border-industrial-amber/40"
                  }`}
                >
                  Register
                </button>
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
                <label className="block text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded border border-industrial-rail bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-industrial-amber"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={handleEmailSubmit}
                  disabled={busy || !email || !password}
                  className="w-full rounded border border-industrial-amber/60 bg-industrial-amber/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-industrial-amber transition hover:bg-industrial-amber/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? (mode === "register" ? "Creating account…" : "Signing in…") : mode === "register" ? "Register with email" : "Login with email"}
                </button>
                {error ? <p className="text-sm text-rose-400">{error}</p> : null}
              </div>

              <div className="mt-3 text-right text-xs text-zinc-500">
                <Link href="/reset-password" className="text-industrial-amber underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
                className="w-full rounded border border-industrial-cyan/50 bg-industrial-cyan/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-industrial-cyan transition hover:bg-industrial-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Opening Google…" : "Continue with Google"}
              </button>
            </div>
          )}

          <div className="mt-6 text-sm text-zinc-500">
            <Link href="/" className="text-industrial-amber underline">
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
