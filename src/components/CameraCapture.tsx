"use client";

/**
 * Camera capture UI and AI diagnosis workflow.
 *
 * This component handles live camera capture, local image preview,
 * schematic conversion, and calls the /api/diagnose endpoint.
 */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

import { imageDataUrlToSchematicDataUrl } from "@/lib/schematicPipeline";
import { DiagnosisChat } from "@/components/DiagnosisChat";
import type { DiagnosisPayload } from "@/types/diagnosis";

type CameraStatus = "idle" | "requesting" | "live" | "error";
type ViewTab = "photo" | "blueprint" | "repair";

const IDEAL_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920, min: 1280 },
    height: { ideal: 1080, min: 720 },
  },
  audio: false,
};

const FALLBACK_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: "environment" },
  audio: false,
};

export function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  const [viewTab, setViewTab] = useState<ViewTab>("photo");
  const [schematicDataUrl, setSchematicDataUrl] = useState<string | null>(null);
  const [schematicBusy, setSchematicBusy] = useState(false);
  const [schematicError, setSchematicError] = useState<string | null>(null);

  const [diagnosis, setDiagnosis] = useState<DiagnosisPayload | null>(null);
  const [diagnosisBusy, setDiagnosisBusy] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    setStatus("requesting");
    stopStream();

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(IDEAL_CONSTRAINTS);
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia(FALLBACK_CONSTRAINTS);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Camera unavailable";
        setErrorMessage(msg);
        setStatus("error");
        return;
      }
    }

    streamRef.current = stream;
    const v = videoRef.current;
    if (v) {
      v.srcObject = stream;
      await v.play().catch(() => {});
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (vw && vh) setDimensions({ w: vw, h: vh });
      setStatus("live");
    }
  }, [stopStream]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const url = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(url);
    setDimensions({ w, h });
    setViewTab("photo");
    setSchematicDataUrl(null);
    setSchematicError(null);
    setDiagnosis(null);
    setDiagnosisError(null);
    stopStream();
    setStatus("idle");
  }, [stopStream]);

  const loadImageFile = useCallback(
    (file: File) => {
      setErrorMessage(null);
      stopStream();
      setStatus("idle");
      setCapturedDataUrl(null);
      setSchematicDataUrl(null);
      setSchematicError(null);
      setDiagnosis(null);
      setDiagnosisError(null);

      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result;
        if (typeof url !== "string") {
          setErrorMessage("Unable to read image file");
          setStatus("error");
          return;
        }

        const img = new Image();
        img.onload = () => {
          setDimensions({ w: img.width, h: img.height });
          setCapturedDataUrl(url);
          setViewTab("photo");
        };
        img.onerror = () => {
          setErrorMessage("Unable to load image file");
          setStatus("error");
        };
        img.src = url;
      };
      reader.onerror = () => {
        setErrorMessage("Unable to read image file");
        setStatus("error");
      };
      reader.readAsDataURL(file);
    },
    [stopStream]
  );

  const handleUploadChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        loadImageFile(file);
      }
      event.target.value = "";
    },
    [loadImageFile]
  );

  const clearCapture = useCallback(() => {
    setCapturedDataUrl(null);
    setSchematicDataUrl(null);
    setSchematicError(null);
    setDiagnosis(null);
    setDiagnosisError(null);
    setViewTab("photo");
  }, []);

  useEffect(() => {
    if (!capturedDataUrl) return;

    let cancelled = false;
    setSchematicBusy(true);
    setSchematicError(null);

    imageDataUrlToSchematicDataUrl(capturedDataUrl)
      .then((url) => {
        if (!cancelled) setSchematicDataUrl(url);
      })
      .catch((e) => {
        if (!cancelled) {
          setSchematicError(e instanceof Error ? e.message : "Blueprint failed");
        }
      })
      .finally(() => {
        if (!cancelled) setSchematicBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [capturedDataUrl]);

  const runDiagnosis = useCallback(async () => {
    if (!capturedDataUrl) return;
    setDiagnosisBusy(true);
    setDiagnosisError(null);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedDataUrl }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        data?: DiagnosisPayload;
        error?: string;
        raw?: string;
      };
      if (!res.ok) {
        setDiagnosisError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      if (json.data) {
        setDiagnosis(json.data);
        setViewTab("repair");
      } else {
        setDiagnosisError("No data in response");
      }
    } catch (e) {
      setDiagnosisError(e instanceof Error ? e.message : "Network error");
    } finally {
      setDiagnosisBusy(false);
    }
  }, [capturedDataUrl]);

  const displayUrl =
    viewTab === "blueprint" && schematicDataUrl
      ? schematicDataUrl
      : capturedDataUrl;

  const hotspots = diagnosis?.hotspots ?? [];

  return (
    <div className="flex min-h-dvh flex-col bg-industrial-void">
      <header className="flex shrink-0 items-center justify-between border-b border-industrial-rail bg-industrial-steel/90 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/"
          className="font-display text-xs uppercase tracking-widest text-zinc-500 transition hover:text-industrial-amber"
        >
          ← Dashboard
        </Link>
        <div className="text-center">
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-industrial-amber">
            Capture bay
          </p>
          <p className="font-display text-xs text-zinc-400">Hardware imaging</p>
        </div>
        <div className="w-20" aria-hidden />
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="relative flex flex-1 flex-col bg-black">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-industrial-void sm:aspect-video lg:min-h-0 lg:flex-1">
            <video
              ref={videoRef}
              className={`h-full w-full object-cover ${capturedDataUrl ? "invisible absolute h-px w-px opacity-0" : ""}`}
              playsInline
              muted
              autoPlay
            />
            {!capturedDataUrl && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden
              >
                <div className="h-[min(70%,420px)] w-[min(85%,720px)] border border-industrial-amber/25 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.15)]" />
                <div className="absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-industrial-amber/40" />
                <div className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-industrial-amber/40" />
              </div>
            )}
            {capturedDataUrl && viewTab !== "repair" && displayUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayUrl}
                alt={viewTab === "blueprint" ? "Blueprint view" : "Captured photo"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {capturedDataUrl && viewTab === "repair" && (
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedDataUrl}
                  alt="Repair overlay base"
                  className="h-full w-full object-cover"
                />
                {hotspots.map((h) => (
                  <div
                    key={`${h.step}-${h.label}`}
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                    style={{ left: `${Math.min(100, Math.max(0, h.x * 100))}%`, top: `${Math.min(100, Math.max(0, h.y * 100))}%` }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-industrial-amber bg-industrial-void/90 font-display text-xs font-bold text-industrial-amber shadow-lg">
                      {h.step}
                    </span>
                    <span className="mt-1 max-w-[140px] rounded bg-black/75 px-1.5 py-0.5 text-center text-[10px] text-zinc-200">
                      {h.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {capturedDataUrl && viewTab === "blueprint" && schematicBusy && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 font-display text-xs uppercase tracking-wider text-industrial-amber">
                Building blueprint…
              </div>
            )}
            <div className="pointer-events-none absolute left-3 top-3 rounded border border-industrial-rail/80 bg-industrial-panel/90 px-2 py-1 font-display text-[10px] uppercase tracking-wider text-zinc-400 backdrop-blur-sm">
              {status === "live" && !capturedDataUrl && "LIVE"}
              {capturedDataUrl && "FROZEN"}
              {status === "idle" && !capturedDataUrl && "STANDBY"}
              {status === "requesting" && "LINK…"}
              {status === "error" && "FAULT"}
            </div>
            {dimensions && (
              <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 font-display text-[10px] text-zinc-400">
                {dimensions.w}×{dimensions.h}
              </div>
            )}
          </div>

          {capturedDataUrl && (
            <div className="flex justify-center gap-1 border-t border-industrial-rail bg-industrial-steel/90 px-2 py-2">
              {(
                [
                  ["photo", "Photo"],
                  ["blueprint", "Blueprint"],
                  ["repair", "Repair map"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewTab(id)}
                  disabled={id === "blueprint" && !schematicDataUrl && schematicBusy}
                  className={`rounded px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-wider transition sm:text-xs ${
                    viewTab === id
                      ? "bg-industrial-amber/20 text-industrial-amber ring-1 ring-industrial-amber/50"
                      : "text-zinc-500 hover:text-zinc-300"
                  } disabled:opacity-40`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-industrial-rail bg-industrial-steel/95 px-4 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadChange}
            />
            {status !== "live" && !capturedDataUrl && (
              <>
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={status === "requesting"}
                  className="rounded border border-industrial-amber/70 bg-industrial-amber/15 px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-industrial-amber transition hover:bg-industrial-amber/25 disabled:opacity-50"
                >
                  {status === "requesting" ? "Initializing…" : "Start camera"}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded border border-industrial-rail px-5 py-2.5 font-display text-xs uppercase tracking-wider text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
                >
                  Upload image
                </button>
              </>
            )}
            {status === "live" && !capturedDataUrl && (
              <>
                <button
                  type="button"
                  onClick={captureFrame}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-zinc-600 bg-zinc-900 shadow-lg ring-2 ring-industrial-amber/50 transition hover:ring-industrial-amber"
                  aria-label="Capture photo"
                >
                  <span className="h-9 w-9 rounded-full bg-industrial-amber" />
                </button>
                <button
                  type="button"
                  onClick={stopStream}
                  className="rounded border border-industrial-rail px-4 py-2 font-display text-xs uppercase tracking-wider text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
                >
                  Stop
                </button>
              </>
            )}
            {capturedDataUrl && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    clearCapture();
                    void startCamera();
                  }}
                  className="rounded border border-industrial-amber/60 bg-industrial-amber/10 px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-industrial-amber transition hover:bg-industrial-amber/20"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={runDiagnosis}
                  disabled={diagnosisBusy}
                  className="rounded border border-industrial-cyan/50 bg-industrial-cyan/10 px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-industrial-cyan transition hover:bg-industrial-cyan/20 disabled:opacity-50"
                >
                  {diagnosisBusy ? "Analyzing…" : "Run AI diagnosis"}
                </button>
              </>
            )}
          </div>
        </div>

        <aside className="w-full shrink-0 border-t border-industrial-rail bg-industrial-panel p-4 lg:w-96 lg:border-l lg:border-t-0">
          <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Telemetry
          </h2>
          <dl className="mt-4 space-y-3 font-display text-xs text-zinc-400">
            <div className="flex justify-between gap-4 border-b border-industrial-rail/60 pb-2">
              <dt>Stream</dt>
              <dd className="text-right text-zinc-300">{status}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-industrial-rail/60 pb-2">
              <dt>Resolution</dt>
              <dd className="text-right text-zinc-300">
                {dimensions ? `${dimensions.w} × ${dimensions.h}` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-industrial-rail/60 pb-2">
              <dt>Capture</dt>
              <dd className="text-right text-zinc-300">
                {capturedDataUrl ? "JPEG buffered" : "None"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 pb-2">
              <dt>Blueprint</dt>
              <dd className="text-right text-zinc-300">
                {schematicBusy && "Processing…"}
                {!schematicBusy && schematicDataUrl && "Ready"}
                {!schematicBusy && schematicError && "Error"}
                {!schematicBusy && !schematicDataUrl && !schematicError && capturedDataUrl && "—"}
                {!capturedDataUrl && "—"}
              </dd>
            </div>
          </dl>

          {schematicError && (
            <p className="mt-3 text-xs text-amber-600/90" role="status">
              Blueprint: {schematicError}
            </p>
          )}

          {diagnosisError && (
            <p className="mt-3 rounded border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300" role="alert">
              AI: {diagnosisError}
            </p>
          )}

          {diagnosis && (
            <>
              <div className="mt-6 border-t border-industrial-rail pt-4">
                <h3 className="font-display text-[10px] uppercase tracking-widest text-industrial-cyan">
                  Diagnosis
                </h3>
                {diagnosis.device_name && (
                  <p className="mt-2 text-sm font-medium text-zinc-200">{diagnosis.device_name}</p>
                )}
                {diagnosis.visible_damage && diagnosis.visible_damage.length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-industrial-amber/30 bg-industrial-amber/5 p-3 text-xs text-zinc-200">
                    <p className="font-display text-[10px] uppercase tracking-widest text-industrial-amber">
                      Likely visible damage
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
                      {diagnosis.visible_damage.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-zinc-500">
                    No obvious external damage detected. Follow the repair steps and hotspot map carefully.
                  </p>
                )}

                {diagnosis.repair_focus && (
                  <div className="mt-4 rounded-2xl border border-industrial-cyan/40 bg-industrial-cyan/5 p-4 text-xs text-zinc-200">
                    <p className="font-display text-[10px] uppercase tracking-widest text-industrial-cyan">
                      First thing to check
                    </p>
                    <p className="mt-2 text-sm text-zinc-100">{diagnosis.repair_focus}</p>
                  </div>
                )}

                {diagnosis.repair_steps && diagnosis.repair_steps.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                      Step-by-step fix guide
                    </p>
                    <ol className="space-y-3">
                      {diagnosis.repair_steps.map((s) => (
                        <li key={s.step} className="rounded-2xl border border-industrial-rail/60 bg-black/40 p-3 text-xs text-zinc-300">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-display text-[11px] uppercase tracking-[0.25em] text-industrial-amber">
                              Step {s.step}
                            </span>
                            {s.title ? <span className="text-[11px] text-zinc-400">{s.title}</span> : null}
                          </div>
                          {s.instruction ? (
                            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.instruction}</p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              <DiagnosisChat diagnosis={diagnosis} />
            </>
          )}

          {errorMessage && (
            <p
              className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <p className="mt-6 text-[11px] leading-relaxed text-zinc-600">
            <strong className="text-zinc-500">How to use this:</strong> Start camera → capture image →
            review the <strong className="text-zinc-400">Blueprint</strong> and visible damage notes →
            run <strong className="text-zinc-400">AI diagnosis</strong> → follow the numbered repair steps and hotspot map.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
            Focus first on the highlighted repair focus above, then move through each step in order.
          </p>
        </aside>
      </div>
    </div>
  );
}
