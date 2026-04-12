import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import type { DiagnosisPayload } from "@/types/diagnosis";

/** Google rotates model IDs; override with GEMINI_MODEL in .env.local if needed. */
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `You are an electronics repair assistant. Analyze the photo.

Respond with ONLY valid JSON (no markdown, no code fences), using this exact shape:
{
  "device_name": "short name of what you see",
  "visible_damage": ["bullet list as strings"],
  "repair_focus": "short summary of the first thing to inspect or fix",
  "repair_steps": [
    { "step": 1, "title": "short title", "instruction": "clear instruction" },
    { "step": 2, "title": "...", "instruction": "..." },
    { "step": 3, "title": "...", "instruction": "..." }
  ],
  "hotspots": [
    { "step": 1, "label": "Part or area", "x": 0.5, "y": 0.4 }
  ]
}

Rules:
- repair_steps must have exactly 3 items with step 1,2,3.
- hotspots: 3 items, one per step. x and y are normalized 0–1 (left/top of image).
- If unsure, give best-effort guesses and say so in visible_damage.
- Use repair_focus as the most important first action to take.`;

function stripDataUrlPrefix(dataUrl: string): { mime: string; base64: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  return { mime: m[1], base64: m[2] };
}

function tryParseJson(text: string): DiagnosisPayload | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as DiagnosisPayload;
  } catch {
    return null;
  }
}

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

  const image = typeof body === "object" && body !== null && "image" in body
    ? String((body as { image?: unknown }).image ?? "")
    : "";

  const parsed = stripDataUrlPrefix(image) ?? (image.length > 100 ? { mime: "image/jpeg", base64: image } : null);
  if (!parsed) {
    return NextResponse.json(
      { error: "Send { \"image\": \"data:image/jpeg;base64,...\" }" },
      { status: 400 },
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: parsed.mime,
          data: parsed.base64,
        },
      },
      {
        text: "Analyze this electronic component image and output the JSON described above.",
      },
    ]);

    const text = result.response.text();
    const data = tryParseJson(text);
    if (!data) {
      return NextResponse.json(
        { error: "Model did not return valid JSON", raw: text.slice(0, 2000) },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gemini request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
