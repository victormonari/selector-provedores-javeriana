"use client";

import {
  emptyAlternative, pairKey, pairs, uid,
  type Alternative, type Model, type Results, type SubKind,
} from "@/lib/bg";
import {
  AddButton, Bar, Card, IconButton, NumberField, PALETTE, Segmented, StepHeader, TextField, TrashIcon,
  fmt, money, pct,
} from "./ui";

export type Update = (fn: (m: Model) => Model) => void;
export type StepProps = { m: Model; r: Results; update: Update; showErrors?: boolean };

const setAlt = (update: Update, id: string, patch: (a: Alternative) => Partial<Alternative>) =>
  update((m) => ({ ...m, alternatives: m.alternatives.map((a) => (a.id === id ? { ...a, ...patch(a) } : a)) }));

const MAX_ALTS = 8;

// ------------------------------------------------------------------ 1
export function StepParams({ m, r, update, showErrors: se = false }: StepProps) {
  return (
    <Card>
      <StepHeader
        n={1}
        title="¿Qué compras y quién compite?"
        hint="Define el insumo, cuánto vas a comprar y las alternativas. Puede ser un proveedor externo (Comprar) o producirlo tú mismo (Hacer)."
        missing={r.missing.step1}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField className="sm:col-span-3" label="Insumo o servicio" value={m.item} error={se && !m.item.trim()} placeholder="Ej.: 15 cursos de 20 minutos"
          onChange={(v) => update((x) => ({ ...x, item: v }))} />
        <NumberField label="Unidades a comprar" value={m.units} error={se && m.units === null} suffix="unid." onChange={(v) => update((x) => ({ ...x, units: v }))} />
        <NumberField label="Costo de coordinación interna" value={m.rate} error={se && m.rate === null} prefix="$" suffix="USD/h" onChange={(v) => update((x) => ({ ...x, rate: v }))} />
        <div>
          <span className="mb-1 block text-xs font-medium text-muted">Peso del costo (α)</span>
          <AlphaSlider m={m} update={update} />
        </div>
      </div>

      <h3 className="mt-8 text-sm font-semibold text-navy">Alternativas</h3>
      <ul className="mt-3 space-y-2">
        {m.alternatives.map((a, i) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-soft p-2 sm:flex-nowrap">
            <span className="ml-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} aria-hidden />
            <input
              aria-label={`Nombre de la alternativa ${i + 1}`}
              data-error={(se && !a.name.trim()) || undefined}
              className={`h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-gold/50 ${se && !a.name.trim() ? "border-red-400 bg-red-50" : "border-line bg-white"}`}
              value={a.name}
              onChange={(e) => setAlt(update, a.id, () => ({ name: e.target.value }))}
            />
            <Segmented ariaLabel="Tipo" value={a.type} onChange={(v) => setAlt(update, a.id, () => ({ type: v }))}
              options={[{ value: "Comprar", label: "Comprar" }, { value: "Hacer", label: "Hacer" }]} />
            <IconButton label="Quitar alternativa" disabled={m.alternatives.length <= 2}
              onClick={() => update((x) => ({ ...x, alternatives: x.alternatives.filter((y) => y.id !== a.id) }))}>
              <TrashIcon />
            </IconButton>
          </li>
        ))}
      </ul>
      <AddButton disabled={m.alternatives.length >= MAX_ALTS}
        onClick={() => update((x) => ({ ...x, alternatives: [...x.alternatives, emptyAlternative(x, x.alternatives.length + 1)] }))}>
        Agregar alternativa
      </AddButton>
      {m.alternatives.length >= MAX_ALTS && <p className="mt-2 text-xs text-muted">Máximo {MAX_ALTS} alternativas.</p>}
    </Card>
  );
}

export function AlphaSlider({ m, update, compact }: { m: Model; update: Update; compact?: boolean }) {
  return (
    <div>
      <input
        type="range" min={0} max={1} step={0.05} value={m.alpha} aria-label="Peso del costo α"
        onChange={(e) => update((x) => ({ ...x, alpha: Number(e.target.value) }))}
        className="w-full accent-[#14284B]"
      />
      <div className={`flex justify-between text-xs ${compact ? "text-white/70" : "text-muted"}`}>
        <span>Calidad {pct(1 - m.alpha)}</span>
        <span className={`font-semibold ${compact ? "text-white" : "text-navy"}`}>α = {m.alpha.toFixed(2).replace(".", ",")}</span>
        <span>Costo {pct(m.alpha)}</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 2
export function StepCritical({ m, r, update, showErrors: se = false }: StepProps) {
  const toggle = (a: Alternative, cid: string) => {
    const cur = a.crit[cid];
    const next = cur === 1 ? 0 : cur === 0 ? null : 1;
    setAlt(update, a.id, (x) => ({ crit: { ...x.crit, [cid]: next } }));
  };
  return (
    <Card>
      <StepHeader
        n={2}
        title="Requisitos obligatorios"
        hint={<>Toca cada casilla: <b className="text-ok">✓ cumple</b> · <b className="text-red-600">✕ no cumple</b>. Un solo ✕ descarta la alternativa, aunque sea la más barata.</>}
        missing={r.missing.step2}
      />
      <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full min-w-[560px] border-separate border-spacing-y-1.5 text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="pb-1 font-medium">Alternativa</th>
              {m.critical.map((c) => (
                <th key={c.id} className="px-1 pb-1 text-center font-medium">
                  <input
                    aria-label="Nombre del requisito"
                    className="w-full min-w-20 rounded-md bg-transparent px-1 py-1 text-center font-semibold text-navy outline-none hover:bg-soft focus:bg-soft"
                    value={c.name}
                    onChange={(e) => update((x) => ({ ...x, critical: x.critical.map((y) => (y.id === c.id ? { ...y, name: e.target.value } : y)) }))}
                  />
                </th>
              ))}
              <th className="pb-1 text-center font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {m.alternatives.map((a, i) => {
              const fc = r.alts[i]?.fc;
              return (
                <tr key={a.id} className={fc === 0 ? "bg-red-50" : "bg-soft"}>
                  <td className="rounded-l-xl px-3 py-2 font-medium">{a.name || `Alternativa ${i + 1}`}</td>
                  {m.critical.map((c) => {
                    const v = a.crit[c.id];
                    return (
                      <td key={c.id} className="px-1 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(a, c.id)}
                          aria-label={`${c.name}: ${v === 1 ? "cumple" : v === 0 ? "no cumple" : "sin marcar"}`}
                          data-error={(se && (v === null || v === undefined)) || undefined}
                          className={`h-9 w-9 rounded-lg border text-base font-bold transition ${
                            v === 1 ? "border-ok bg-ok-bg text-ok" : v === 0 ? "border-red-300 bg-red-100 text-red-600" : se ? "border-2 border-red-400 bg-red-50 text-red-500" : "border-dashed border-line bg-white text-muted hover:border-navy"
                          }`}
                        >
                          {v === 1 ? "✓" : v === 0 ? "✕" : "?"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="rounded-r-xl px-3 py-2 text-center text-xs font-semibold">
                    {fc === 1 ? <span className="text-ok">Continúa</span> : fc === 0 ? <span className="text-red-600">Descartada</span> : <span className="text-muted">Pendiente</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="mt-5 rounded-xl bg-soft p-4">
        <summary className="cursor-pointer text-sm font-semibold text-navy">Qué exige cada requisito y editar la lista</summary>
        <ul className="mt-3 space-y-2">
          {m.critical.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <TextField className="w-40 shrink-0" value={c.name}
                onChange={(v) => update((x) => ({ ...x, critical: x.critical.map((y) => (y.id === c.id ? { ...y, name: v } : y)) }))} />
              <TextField className="flex-1" value={c.desc} placeholder="Qué evidencia se pide"
                onChange={(v) => update((x) => ({ ...x, critical: x.critical.map((y) => (y.id === c.id ? { ...y, desc: v } : y)) }))} />
              <IconButton label="Quitar requisito" disabled={m.critical.length <= 1}
                onClick={() => update((x) => ({ ...x, critical: x.critical.filter((y) => y.id !== c.id) }))}>
                <TrashIcon />
              </IconButton>
            </li>
          ))}
        </ul>
        <AddButton onClick={() => update((x) => {
          const id = uid();
          return { ...x, critical: [...x.critical, { id, name: "Nuevo requisito", desc: "" }],
            alternatives: x.alternatives.map((a) => ({ ...a, crit: { ...a.crit, [id]: null } })) };
        })}>Agregar requisito</AddButton>
        <p className="mt-3 text-xs text-muted">La guía del curso pide al menos un requisito de ética.</p>
      </details>
    </Card>
  );
}

// ------------------------------------------------------------------ 3
export function StepObjective({ m, r, update, showErrors: se = false }: StepProps) {
  const maxFo = Math.max(0, ...r.alts.map((a) => a.fo ?? 0));
  return (
    <Card>
      <StepHeader
        n={3}
        title="¿Cuánto cuesta cada una?"
        hint={<>Escribe el precio por unidad y las horas internas que exige gestionarla. El costo total suma ambas; <b>a menor costo, mayor FO</b>.</>}
        missing={r.missing.step3}
      />
      <div className="space-y-2">
        {m.alternatives.map((a, i) => {
          const res = r.alts[i];
          const top = res?.fo !== null && res?.fo === maxFo && maxFo > 0;
          return (
            <div key={a.id} className="rounded-xl bg-soft p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="truncate" title={a.name}>{a.name || `Alternativa ${i + 1}`}</span>
                <span className="ml-auto shrink-0 text-xs text-muted">{a.type === "Hacer" ? "Producción propia" : "Proveedor externo"}</span>
              </div>
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_0.8fr_0.9fr_1.2fr]">
                <NumberField label="Precio por unidad" value={a.unitCost} error={se && a.unitCost === null} prefix="$" suffix="USD" onChange={(v) => setAlt(update, a.id, () => ({ unitCost: v }))} />
                <NumberField label="Horas de coordinación" value={a.hours} error={se && a.hours === null} suffix="h" onChange={(v) => setAlt(update, a.id, () => ({ hours: v }))} />
                <div className="pb-1.5 text-sm tabular-nums">
                  <span className="block text-xs text-muted">Costo total</span>
                  <b className="text-base">{money(res?.cost)}</b>
                </div>
                <div className="pb-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">FO</span>
                    <b className={top ? "text-gold" : "text-navy"}>{fmt(res?.fo)}</b>
                  </div>
                  <Bar value={res?.fo ?? 0} max={maxFo} color={top ? "#B8963E" : "#14284B"} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted">
        Costo total = precio × {m.units ?? "unidades"} + horas × {money(m.rate)}. FO = (1/C) ÷ Σ(1/C). En dorado, la alternativa más barata.
      </p>
    </Card>
  );
}

// ------------------------------------------------------------------ 4
export function StepSubjective({ m, r, update, showErrors: se = false }: StepProps) {
  const maxW = Math.max(0, ...Object.values(r.weights));
  const setPair = (k: string, v: string) => update((x) => ({ ...x, pairwise: { ...x.pairwise, [k]: v } }));
  return (
    <Card>
      <StepHeader
        n={4}
        title="¿Qué tan buena es cada una?"
        hint="Primero decide qué importa más entre cada par de factores; eso da los pesos. Después califica cada alternativa."
        missing={r.missing.step4}
      />

      <div className="grid gap-8">
        <div>
          <h3 className="text-sm font-semibold text-navy">A. ¿Qué importa más? <span className="font-normal text-muted">(elige uno en cada par)</span></h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {pairs(m.subjective).map(([a, b]) => {
              const k = pairKey(a.id, b.id);
              return (
                <li key={k} className="flex items-center justify-between gap-2 rounded-xl bg-soft p-2">
                  <Segmented size="sm" value={m.pairwise[k] ?? null} error={se && !m.pairwise[k]} onChange={(v) => setPair(k, v)} ariaLabel={`${a.name} o ${b.name}`}
                    options={[{ value: a.id, label: a.name }, { value: b.id, label: b.name }]} />
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy">Pesos resultantes</h3>
          <ul className="mt-3 space-y-3">
            {m.subjective.map((f) => {
              const w = r.weights[f.id] ?? 0;
              const zero = r.zeroWeight.includes(f.id);
              return (
                <li key={f.id}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <input aria-label="Nombre del factor" className="min-w-0 flex-1 rounded-md bg-transparent px-1 font-medium outline-none hover:bg-soft focus:bg-soft"
                      value={f.name}
                      onChange={(e) => update((x) => ({ ...x, subjective: x.subjective.map((y) => (y.id === f.id ? { ...y, name: e.target.value } : y)) }))} />
                    <b className={zero ? "text-red-600" : w === maxW && w > 0 ? "text-gold" : "text-navy"}>{pct(w)}</b>
                  </div>
                  <Bar value={w} max={maxW} color={zero ? "#dc2626" : w === maxW ? "#B8963E" : "#14284B"} />
                  {zero && <p className="mt-1 text-xs text-red-600">Pesa 0: haz que gane al menos una comparación.</p>}
                </li>
              );
            })}
          </ul>
          <details className="mt-4 rounded-xl bg-soft p-3">
            <summary className="cursor-pointer text-sm font-semibold text-navy">Editar factores</summary>
            <ul className="mt-3 space-y-2">
              {m.subjective.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
                  <Segmented<SubKind> size="sm" value={f.kind} ariaLabel="Tipo de factor"
                    onChange={(v) => update((x) => ({ ...x, subjective: x.subjective.map((y) => (y.id === f.id ? { ...y, kind: v, unit: v === "lowerBetter" ? y.unit || "días" : undefined } : y)) }))}
                    options={[{ value: "scale", label: "Escala 1–5", title: "Más es mejor" }, { value: "lowerBetter", label: "Número, menos es mejor", title: "Ej.: plazo en días" }]} />
                  <IconButton label="Quitar factor" disabled={m.subjective.length <= 2}
                    onClick={() => update((x) => ({ ...x, subjective: x.subjective.filter((y) => y.id !== f.id) }))}>
                    <TrashIcon />
                  </IconButton>
                </li>
              ))}
            </ul>
            <AddButton disabled={m.subjective.length >= 8} onClick={() => update((x) => {
              const id = uid();
              return { ...x, subjective: [...x.subjective, { id, name: "Nuevo factor", kind: "scale" }],
                alternatives: x.alternatives.map((a) => ({ ...a, scores: { ...a.scores, [id]: null } })) };
            })}>Agregar factor</AddButton>
          </details>
        </div>
      </div>

      <h3 className="mt-8 text-sm font-semibold text-navy">B. Califica cada alternativa</h3>
      <p className="mt-1 text-xs text-muted">1 = deficiente · 3 = aceptable · 5 = excelente. En los factores numéricos (como el plazo) escribe el valor: el menor obtiene la mejor nota.</p>
      <div className="-mx-2 mt-3 overflow-x-auto px-2">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-1.5 text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="pb-1 font-medium">Alternativa</th>
              {m.subjective.map((f) => <th key={f.id} className="px-2 pb-1 font-medium">{f.name}</th>)}
              <th className="pb-1 text-right font-medium">FS</th>
            </tr>
          </thead>
          <tbody>
            {m.alternatives.map((a, i) => (
              <tr key={a.id} className="bg-soft">
                <td className="max-w-44 truncate rounded-l-xl px-3 py-2 font-medium" title={a.name}>{a.name || `Alternativa ${i + 1}`}</td>
                {m.subjective.map((f) => (
                  <td key={f.id} className="px-2 py-2">
                    {f.kind === "scale" ? (
                      <Segmented size="sm" value={a.scores[f.id] ?? null} error={se && (a.scores[f.id] ?? null) === null} ariaLabel={`${f.name} de ${a.name}`}
                        onChange={(v) => setAlt(update, a.id, (x) => ({ scores: { ...x.scores, [f.id]: v } }))}
                        options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: n }))} />
                    ) : (
                      <NumberField className="w-28" srLabel={`${f.name} de ${a.name}`} value={a.scores[f.id] ?? null} error={se && (a.scores[f.id] ?? null) === null} suffix={f.unit} min={0.0001}
                        onChange={(v) => setAlt(update, a.id, (x) => ({ scores: { ...x.scores, [f.id]: v } }))} />
                    )}
                  </td>
                ))}
                <td className="rounded-r-xl px-3 py-2 text-right font-semibold tabular-nums text-navy">{fmt(r.alts[i]?.fs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
