import Link from "next/link";

export default function ResetPasswordSentPage() {
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
              Password reset sent
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-zinc-100">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              We sent a password reset link to your email address. Follow the instructions in the message to choose a new password.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-industrial-rail/80 bg-black/20 p-5 text-sm text-zinc-300">
            <p>
              If you don’t see the email shortly, check your spam folder or try again via the login page.
            </p>
            <p>
              The link will expire after a short time. If it doesn’t arrive, request a new reset email.
            </p>
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
