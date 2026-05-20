"use client";

export type Voice = "alloy" | "nova" | "shimmer";

const VOICES: { value: Voice; label: string; sublabel: string }[] = [
  { value: "alloy", label: "Alloy", sublabel: "Male" },
  { value: "nova", label: "Nova", sublabel: "Female" },
  { value: "shimmer", label: "Shimmer", sublabel: "Energetic" },
];

interface VoicePickerProps {
  value: Voice;
  onChange: (v: Voice) => void;
  disabled?: boolean;
}

export default function VoicePicker({
  value,
  onChange,
  disabled,
}: VoicePickerProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Voiceover voice
      </label>
      <div className="grid grid-cols-3 gap-2">
        {VOICES.map((v) => {
          const selected = value === v.value;
          return (
            <button
              key={v.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(v.value)}
              className={`flex flex-col items-center gap-0.5 rounded-xl border px-3 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                selected
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <span className="font-semibold">{v.label}</span>
              <span className="text-xs text-slate-500">{v.sublabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
