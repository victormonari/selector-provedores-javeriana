"use client";

import { useState, type ReactNode } from "react";

export const PALETTE = ["#14284B", "#B8963E", "#2A9D8F", "#C8553D", "#6D5BD0", "#4F7CAC", "#7A9E3B", "#B5651D"];

export const fmt = (v: number | null | undefined, d = 4) =>
  v === null || v === undefined ? "—" : v.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });

export const money = (v: number | null | undefined) =>
  v === null || v === undefined
    ? "—"
    : v.toLocaleString("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: v < 1000 ? 2 : 0 });

export const pct = (v: number) => `${Math.round(v * 100)} %`;

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-5 sm:p-8 ${className}`}>{children}</section>;
}

export function StepHeader({ title, hint, missing }: { n?: number; title: string; hint: ReactNode; missing?: number }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-navy sm:text-2xl">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{hint}</p>
      {missing !== undefined && missing > 0 && (
        <p className="mt-2 text-xs font-medium text-warn">Faltan {missing} dato{missing === 1 ? "" : "s"}</p>
      )}
    </div>
  );
}

const parse = (s: string): number | null => {
  const t = s.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/** Campo numérico que acepta coma o punto decimal y deja el valor vacío como null. */
export function NumberField({
  value, onChange, label, suffix, prefix, min = 0, placeholder, className = "", srLabel, error,
}: {
  value: number | null; onChange: (v: number | null) => void; label?: string; suffix?: string; prefix?: string;
  min?: number; placeholder?: string; className?: string; srLabel?: string; error?: boolean;
}) {
  const show = (v: number | null) => (v === null ? "" : String(Number(v.toFixed(2))).replace(".", ","));
  const [text, setText] = useState(show(value));
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    // El valor cambió desde fuera (ejemplo, importación): sincronizar el texto.
    setPrev(value);
    if (parse(text) !== value) setText(show(value));
  }
  const n = parse(text);
  const invalid = (text.trim() !== "" && (n === null || n < min)) || !!error;
  return (
    <label className={`block ${className}`} data-error={invalid || undefined}>
      {label && <span className="mb-1 block text-xs font-medium text-muted">{label}</span>}
      <span
        className={`flex items-center rounded-lg border px-3 transition focus-within:ring-2 focus-within:ring-gold/50 ${
          invalid ? "border-red-400 bg-red-50" : "border-line bg-input"
        }`}
      >
        {prefix && <span className="mr-1 text-sm text-muted">{prefix}</span>}
        <input
          inputMode="decimal"
          aria-label={srLabel ?? label}
          aria-invalid={invalid}
          className="h-10 w-full min-w-0 bg-transparent text-sm tabular-nums outline-none"
          value={text}
          placeholder={placeholder ?? "0"}
          onChange={(e) => {
            setText(e.target.value);
            const v = parse(e.target.value);
            onChange(v !== null && v >= min ? v : null);
          }}
        />
        {suffix && <span className="ml-1 shrink-0 text-xs text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

export function TextField({ value, onChange, label, placeholder, className = "", error }: {
  value: string; onChange: (v: string) => void; label?: string; placeholder?: string; className?: string; error?: boolean;
}) {
  return (
    <label className={`block ${className}`} data-error={error || undefined}>
      {label && <span className="mb-1 block text-xs font-medium text-muted">{label}</span>}
      <input
        aria-invalid={error}
        className={`h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:ring-2 focus:ring-gold/50 ${error ? "border-red-400 bg-red-50" : "border-line bg-input"}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange, size = "md", ariaLabel, error }: {
  options: { value: T; label: ReactNode; title?: string }[]; value: T | null; onChange: (v: T) => void;
  size?: "sm" | "md"; ariaLabel?: string; error?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} data-error={error || undefined}
      className={`inline-flex rounded-lg border p-0.5 ${error ? "border-red-400 bg-red-50 ring-2 ring-red-200" : "border-line bg-input"}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`${size === "sm" ? "h-8 min-w-8 px-2 text-xs" : "h-9 px-3 text-sm"} rounded-md font-medium transition ${
              active ? "bg-navy text-white shadow-sm" : "text-muted hover:bg-white hover:text-navy"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function IconButton({ onClick, label, children, disabled }: {
  onClick: () => void; label: string; children: ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export function AddButton({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-navy/30 px-3 text-sm font-medium text-navy transition hover:border-navy hover:bg-navy/5 disabled:opacity-40"
    >
      <span aria-hidden className="text-base leading-none">+</span> {children}
    </button>
  );
}

export const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);

export function Bar({ value, max, color = "#14284B" }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-track">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}
