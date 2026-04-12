"use client";

import { useCallback, useState, type FormEvent } from "react";
import type { DiagnosisPayload } from "@/types/diagnosis";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type DiagnosisChatProps = {
  diagnosis: DiagnosisPayload;
};

export function DiagnosisChat({ diagnosis }: DiagnosisChatProps) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const question = input.trim();
      if (!question || busy) return;

      setError(null);
      setBusy(true);
      setHistory((current) => [...current, { role: "user", text: question }]);
      setInput("");

      try {
        const response = await fetch("/api/diagnosis-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diagnosis, question }),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
          const message = typeof data.error === "string" ? data.error : `HTTP ${response.status}`;
          setError(message);
          setHistory((current) => [...current, { role: "assistant", text: `Error: ${message}` }]);
          return;
        }

        setHistory((current) => [...current, { role: "assistant", text: data.answer ?? "No answer returned." }]);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Network error";
        setError(message);
        setHistory((current) => [...current, { role: "assistant", text: `Error: ${message}` }]);
      } finally {
        setBusy(false);
      }
    },
    [diagnosis, input, busy],
  );

  return (
    <div className="mt-6 rounded-3xl border border-industrial-rail/70 bg-black/60 p-4 text-zinc-300 shadow-lg shadow-black/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Interactive diagnosis chat</p>
          <h3 className="mt-2 text-sm font-semibold text-zinc-100">Ask follow-up questions</h3>
        </div>
        <span className="rounded-full bg-industrial-amber/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-industrial-amber">
          GPT assistant
        </span>
      </div>

      <div className="space-y-3 rounded-3xl bg-industrial-panel/70 p-3 text-[13px] leading-6 text-zinc-300">
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Ask anything about the diagnosis, repair steps, or what to inspect next.
          </p>
        ) : (
          history.map((message, index) => (
            <div key={`${message.role}-${index}`} className="space-y-2 rounded-3xl border border-industrial-rail/60 bg-black/10 p-3">
              <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                <span>{message.role === "user" ? "You" : "Assistant"}</span>
                <span>{message.role === "user" ? "Question" : "Answer"}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-zinc-200">{message.text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex flex-col gap-3">
        <label className="sr-only" htmlFor="diagnosis-chat-input">
          Ask a follow-up question
        </label>
        <textarea
          id="diagnosis-chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a follow-up question about the repair..."
          rows={3}
          className="w-full rounded-3xl border border-industrial-rail/70 bg-black/90 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-industrial-amber/80 focus:ring-1 focus:ring-industrial-amber/30"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-500">
            {busy ? "Assistant is composing a reply…" : "Type your question and press Send."}
          </p>
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-full bg-industrial-amber px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-industrial-amber/90 disabled:opacity-40"
          >
            Send
          </button>
        </div>
        {error ? (
          <p className="rounded-3xl bg-red-950/80 px-4 py-3 text-sm text-red-300">{error}</p>
        ) : null}
      </form>
    </div>
  );
}
