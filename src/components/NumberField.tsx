"use client";

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (raw: string) => void;
  error?: string | null | undefined;
  step?: number | undefined;
  min?: number | undefined;
  max?: number | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
}

// A numeric input with an always-visible label (PRD §6.2 — no in-field hint
// used in place of a label), wired for a11y via aria-invalid / aria-describedby.
export function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  step,
  min,
  max,
  prefix,
  suffix,
}: NumberFieldProps) {
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-1">
        {prefix ? (
          <span aria-hidden="true" className="text-zinc-500 dark:text-zinc-400">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className="min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-[invalid]:border-red-600 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {suffix ? (
          <span aria-hidden="true" className="text-zinc-500 dark:text-zinc-400">
            {suffix}
          </span>
        ) : null}
      </div>
      {invalid ? (
        <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
