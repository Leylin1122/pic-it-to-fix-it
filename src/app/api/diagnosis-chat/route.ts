import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import type { DiagnosisPayload } from "@/types/diagnosis";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `You are an electronics repair assistant. A user has already received a diagnosis with repair steps. Answer the user's follow-up question using only the diagnosis context provided. Be precise, do not invent new repair actions, and if the answer is uncertain, say so clearly.`;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing GEMINI_API_KEY. Add it to .env.local and restart the dev server." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = typeof body === "object" && body !== null && "question" in body
    ? String((body as { question?: unknown }).question ?? "").trim()
    : "";
  const diagnosis = typeof body === "object" && body !== null && "diagnosis" in body
    ? (body as { diagnosis?: unknown }).diagnosis as DiagnosisPayload
    : null;

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  if (!diagnosis) {
    return NextResponse.json({ error: "Diagnosis data is required" }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  try {
    const result = await model.generateContent([
      {
        text: `Diagnosis context:\n${JSON.stringify(diagnosis, null, 2)}`,
      },
      {
        text: `User question: ${question}\n\nAnswer using the diagnosis context only.`,
      },
    ]);

    const answer = result.response.text().trim();
    return NextResponse.json({ ok: true, answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
