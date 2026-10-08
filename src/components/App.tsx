"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { blankModel, compute, exampleModel, type Model } from "@/lib/bg";
import Intro from "./Intro";
import { StepResults } from "./results";
import { StepCritical, StepObjective, StepParams, StepSubjective, type Update } from "./steps";

const KEY = "brown-gibson:v1";
const STEPS = ["Parámetros", "Requisitos", "Costos", "Calidad", "Resultado"];

function loadSaved(): Model | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Model;
  } catch {
    /* sin almacenamiento */
  }
  return null;
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [model, setModel] = useState<Model | null>(null);
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [view, setView] = useState<"intro" | "wizard">("intro");
  const [saved, setSaved] = useState<Model | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // localStorage solo existe en el navegador
    const s = loadSaved();
    /* eslint-disable react-hooks/set-state-in-effect */
    setSaved(s);
    setModel(s ?? exampleModel());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    if (!model || view !== "wizard") return;
    try {
      localStorage.setItem(KEY, JSON.stringify(model));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [model, view]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const update: Update = useCallback((fn) => setModel((m) => (m ? fn(m) : m)), []);
  const r = useMemo(() => (model ? compute(model) : null), [model]);

  if (!model || !r) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted">Cargando…</div>;
  }

  const missingByStep = [r.missing.step1, r.missing.step2, r.missing.step3, r.missing.step4, 0];
  const firstIncomplete = missingByStep.findIndex((n) => n > 0);
  const unlocked = (i: number) => firstIncomplete === -1 || i <= firstIncomplete;

  const go = (i: number) => {
    setStep(i);
    setShowErrors(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // No deja avanzar con datos pendientes: marca en rojo lo que falta y lleva al primer campo vacío.
  const blockAt = (i: number) => {
    if (i !== step) setStep(i);
    setShowErrors(true);
    const n = missingByStep[i];
    setToast(`Faltan ${n} dato${n === 1 ? "" : "s"}: están marcados en rojo`);
    setTimeout(() => document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  const tryGo = (target: number) => {
    if (target <= step || unlocked(target)) return go(target);
    blockAt(firstIncomplete);
  };

  const reset = (next: Model, msg?: string) => {
    setModel(next);
    if (msg) setToast(msg);
    setView("wizard");
    go(0);
  };

  if (view === "intro") {
    return (
      <div className="min-h-screen bg-page">
        <header className="border-b border-line bg-white">
          <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
            <h1 className="text-xl font-semibold text-navy">Selector de proveedores</h1>
            <p className="mt-0.5 text-sm text-muted">Método de Brown &amp; Gibson</p>
          </div>
        </header>
        <Intro
          onExample={() => reset(exampleModel())}
          onBlank={() => reset(blankModel())}
          onContinue={saved ? () => reset(saved) : undefined}
          savedName={saved?.item || undefined}
        />
      </div>
    );
  }

  const exportCsv = () => {
    const rows = [["Alternativa", "Tipo", "FC", "Costo total USD", "FO", "FS", "IS", "Puesto"],
      ...r.alts.map((a) => [a.name, a.type, a.fc, a.cost?.toFixed(2), a.fo?.toFixed(4), a.fs?.toFixed(4), a.is?.toFixed(4), a.rank])];
    download("resultados-brown-gibson.csv", rows.map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n"), "text/csv;charset=utf-8");
  };

  const importJson = (file: File) => {
    file.text().then((t) => {
      try {
        const m = JSON.parse(t) as Model;
        if (!Array.isArray(m.alternatives) || !Array.isArray(m.critical) || !Array.isArray(m.subjective)) throw new Error();
        reset(m, "Datos importados");
      } catch {
        setToast("El archivo no es un caso válido");
      }
    });
  };

  return (
    <div className="min-h-screen bg-page pb-28">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-5 sm:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-navy">
              <button type="button" onClick={() => { setSaved(model); setView("intro"); }} className="hover:underline" title="Volver al inicio">Selector de proveedores</button>
            </h1>
            <p className="mt-0.5 text-sm text-muted">Elige la mejor opción de compra combinando requisitos, costo y calidad · Método de Brown &amp; Gibson</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => reset(exampleModel(), "Ejemplo cargado")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-navy/20 bg-white px-4 text-sm font-semibold text-navy transition hover:border-navy hover:bg-soft">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5" /></svg>
              Cargar ejemplo
            </button>
            <button type="button" onClick={() => reset(blankModel(), "Caso nuevo en blanco")}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white transition hover:bg-navy/90">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
              Nuevo caso
            </button>
          </div>
        </div>
        <nav aria-label="Pasos" className="mx-auto max-w-3xl px-4 sm:px-6">
          <ol className="flex gap-1 overflow-x-auto">
            {STEPS.map((s, i) => {
              const miss = missingByStep[i];
              const active = i === step;
              const open = unlocked(i);
              return (
                <li key={s} className="flex-1">
                  <button type="button" onClick={() => tryGo(i)} aria-current={active ? "step" : undefined} aria-disabled={!open}
                    title={open ? undefined : "Completa los pasos anteriores"}
                    className={`flex w-full items-center gap-1.5 whitespace-nowrap border-b-2 px-2 pb-3 pt-1 text-left text-sm transition ${
                      active ? "border-navy font-semibold text-navy"
                        : !open ? "cursor-not-allowed border-transparent text-muted/50"
                        : "border-transparent text-muted hover:text-navy"}`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
                      i < 4 && miss === 0 ? "bg-ok text-white" : active ? "bg-navy text-white" : "bg-track text-navy"}`}>
                      {i < 4 && miss === 0 ? "✓" : i + 1}
                    </span>
                    {s}
                    {i < 4 && miss > 0 && open && <span className="rounded-full bg-warn-bg px-1.5 text-[11px] font-medium text-warn">{miss}</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <main className="mx-auto mt-6 max-w-3xl px-4 sm:px-6">
        {showErrors && missingByStep[step] > 0 && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Completa los campos marcados en rojo para continuar.
          </div>
        )}
        {step === 0 && <StepParams m={model} r={r} update={update} showErrors={showErrors} />}
        {step === 1 && <StepCritical m={model} r={r} update={update} showErrors={showErrors} />}
        {step === 2 && <StepObjective m={model} r={r} update={update} showErrors={showErrors} />}
        {step === 3 && <StepSubjective m={model} r={r} update={update} showErrors={showErrors} />}
        {step === 4 && <StepResults m={model} r={r} update={update} />}

        <footer className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>Los datos se guardan en este navegador.</span>
          <button type="button" className="underline-offset-2 hover:text-navy hover:underline"
            onClick={() => download("caso-brown-gibson.json", JSON.stringify(model, null, 2), "application/json")}>Guardar archivo</button>
          <button type="button" className="underline-offset-2 hover:text-navy hover:underline" onClick={() => fileRef.current?.click()}>Abrir archivo</button>
          {r.winner && <button type="button" className="underline-offset-2 hover:text-navy hover:underline" onClick={exportCsv}>Descargar CSV</button>}
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
        </footer>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1 text-sm">
            {r.winner ? (
              <>
                <span className="text-muted">Va ganando </span>
                <span className="font-semibold text-navy">{r.winner.name}</span>
              </>
            ) : (
              <span className="text-muted">Completa los datos para ver quién gana</span>
            )}
          </div>
          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)} className="h-10 shrink-0 rounded-lg px-3 text-sm font-medium text-navy hover:bg-soft">Atrás</button>
          )}
          {step < 4 && (
            <button type="button" onClick={() => tryGo(step + 1)} className="h-10 shrink-0 rounded-lg bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90">
              {step === 3 ? "Ver resultado" : "Siguiente"}
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full bg-navy px-4 py-2 text-sm text-white">{toast}</div>
      )}
    </div>
  );
}
