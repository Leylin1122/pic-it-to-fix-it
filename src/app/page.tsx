"use client";

import Link from "next/link";
import { AuthStatus } from "@/components/AuthStatus";

export default function DashboardPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-industrial-void bg-grid-pattern bg-grid">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-industrial-amber/5 via-transparent to-transparent"
        aria-hidden
      />
      <header className="relative z-10 border-b border-industrial-rail/80 bg-industrial-steel/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="font-display text-xs uppercase tracking-[0.2em] text-industrial-amber"
              aria-hidden
            >
              SYS
            </span>
            <h1 className="font-display text-sm font-semibold tracking-tight text-zinc-100 sm:text-base">
              Pic It To Fix It
            </h1>
          </div>
          <AuthStatus />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="font-display text-xs uppercase tracking-[0.25em] text-industrial-amber">
          Diagnostic workstation
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-4xl">
          Photograph components. Get schematic-style analysis and repair steps.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
          Open the capture bay to stream your camera, grab a high-resolution
          frame, and prepare it for AI diagnostics and blueprint overlays.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/camera"
            className="inline-flex items-center gap-2 rounded border border-industrial-amber/60 bg-industrial-amber/10 px-6 py-3 font-display text-sm font-medium uppercase tracking-wider text-industrial-amber transition hover:border-industrial-amber hover:bg-industrial-amber/20"
          >
            Open capture bay
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded border border-industrial-amber/60 bg-transparent px-6 py-3 font-display text-sm font-medium uppercase tracking-wider text-zinc-100 transition hover:border-industrial-amber hover:bg-industrial-amber/10"
          >
            Login
          </Link>
        </div>

        <section
          className="mt-16 grid gap-4 border border-industrial-rail/60 bg-industrial-panel/50 p-6 sm:grid-cols-3"
          aria-label="Feature modules"
        >
          {[
            {
              label: "01",
              title: "Capture",
              body: "Live preview with framing aids for sharp hardware photos.",
            },
            {
              label: "02",
              title: "Blueprint",
              body: "High-contrast B&W edge pipeline for schematic-style views.",
            },
            {
              label: "03",
              title: "Diagnose",
              body: "Gemini vision + JSON repair steps and AR hotspot coords.",
            },
          ].map((item) => (
            <div key={item.label} className="border-l-2 border-industrial-amber/40 pl-4">
              <p className="font-display text-[10px] uppercase tracking-widest text-industrial-amber">
                {item.label}
              </p>
              <h3 className="mt-2 font-display text-sm font-semibold text-zinc-200">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
