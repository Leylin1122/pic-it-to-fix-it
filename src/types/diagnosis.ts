/** Shape we ask Gemini to return (parse loosely for robustness). */
export type DiagnosisHotspot = {
  step: number;
  label: string;
  /** 0–1 from left */
  x: number;
  /** 0–1 from top */
  y: number;
};

export type DiagnosisRepairStep = {
  step: number;
  title: string;
  instruction: string;
};

export type DiagnosisPayload = {
  device_name?: string;
  visible_damage?: string[];
  repair_focus?: string;
  repair_steps?: DiagnosisRepairStep[];
  hotspots?: DiagnosisHotspot[];
};

export type DiagnosisChatMessage = {
  role: "user" | "assistant";
  text: string;
};
