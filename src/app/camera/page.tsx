"use client";

import { CameraCapture } from "@/components/CameraCapture";
import { AuthGate } from "@/components/AuthGate";

export default function CameraPage() {
  return (
    <AuthGate>
      <CameraCapture />
    </AuthGate>
  );
}
