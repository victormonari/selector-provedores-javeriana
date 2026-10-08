"use client";

import type { Model, Results } from "@/lib/bg";
import { AlphaSlider, type Update } from "./steps";
import { Card, PALETTE, StepHeader, fmt, money } from "./ui";

const colorOf = (m: Model, id: string) => PALETTE[m.alternatives.findIndex((a) => a.id === id) % PALETTE.length];

export function StepResults({ m, r, update }: { m: Model; r: Results; update: Update }) {
  const missing = r.missing.step1 + r.missing.step2 + r.missing.step3 + r.missing.step4;
  if (!r.winner) {
    return (
      <Card>
        <StepHeader n={5} title="Resultado" hint="Completa los pasos anteriores para ver la decisión." missing={missing} />
        <div className="grid place-items-center rounded-xl border border-dashed border-line py-16 text-center text-sm text-muted">
          {r.discarded === m.alternatives.length && m.alternatives.length > 0
            ? "Todas las alternativas incumplen algún requisito obligatorio. Revisa el paso 2 o busca más proveedores."
            : `Faltan ${missing} dato${missing === 1 ? "" : "s"} para calcular el índice.`}
        </div>
      </Card>
    );
  }
  const w = r.winner;
  const sorted = [...r.alts].sort((a, b) => (b.is ?? 0) - (a.is ?? 0));
  const maxIs = sorted[0].is ?? 0;
  const robust = r.robustness === 11;
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-muted">La mejor opción es</p>
        <h2 className="mt-1 text-3xl font-semibold leading-tight text-navy">{w.name}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Índice de selección <b className="text-navy">{fmt(w.is)}</b> · costo total {money(w.cost)} ·{" "}
          {robust ? "gana con cualquier peso del costo" : `gana en ${r.robustness} de 11 pesos del costo`}.
        </p>
        <div className="mt-6 max-w-sm">
          <p className="mb-2 text-xs text-muted">¿Y si el costo pesara más o menos?</p>
          <AlphaSlider m={m} update={update} />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-navy">Ranking</h3>
          <div className="flex gap-4 text-xs">
            <Legend color="#14284B">Costo</Legend>
            <Legend color="#B8963E">Calidad</Legend>
          </div>
        </div>
        <ol className="mt-5 space-y-4">
          {sorted.map((a, i) => (
            <li key={a.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">
                  <span className="mr-2 text-muted">{i + 1}</span>
                  {a.name}
                  {a.fc === 0 && <span className="ml-2 text-xs text-red-600">descartada</span>}
                </span>
                <span className="tabular-nums text-muted">{fmt(a.is, 3)}</span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-track">
                <div className="h-full bg-navy transition-all duration-500" style={{ width: `${((a.costPart ?? 0) / maxIs) * 100}%` }} />
                <div className="h-full bg-gold transition-all duration-500" style={{ width: `${((a.qualityPart ?? 0) / maxIs) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-navy">Ver sensibilidad al peso del costo</summary>
          <p className="mt-2 text-xs text-muted">Si una línea queda arriba en todo el recorrido, la decisión no depende de α.</p>
          <Sensitivity m={m} r={r} />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {m.alternatives.map((a, i) => <Legend key={a.id} color={PALETTE[i % PALETTE.length]}>{a.name}</Legend>)}
          </div>
        </details>
      </Card>

      <Card>
        <h3 className="font-semibold text-navy">Conclusión</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>Con α = {m.alpha.toFixed(2).replace(".", ",")}, la mejor alternativa es <b>{w.name}</b>, con IS = {fmt(w.is)}.</li>
          {r.bestExternal && r.bestExternal.id !== w.id && (
            <li>Entre los proveedores externos, el mejor es <b>{r.bestExternal.name}</b>, con IS = {fmt(r.bestExternal.is)}.</li>
          )}
          <li>{r.discarded === 0 ? "Ninguna alternativa queda descartada por los requisitos obligatorios." : `${r.discarded} alternativa${r.discarded === 1 ? " queda descartada" : "s quedan descartadas"} por incumplir un requisito obligatorio: su IS es 0 sin importar el costo.`}</li>
          <li>La elegida gana en {r.robustness} de los 11 valores de α entre 0 y 1{robust ? ": la decisión es robusta." : ": revisa cuánto debe pesar el costo antes de decidir."}</li>
        </ol>
        <details className="mt-5 rounded-xl bg-soft p-3">
          <summary className="cursor-pointer text-sm font-semibold text-navy">Ver la tabla completa</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm tabular-nums">
              <thead className="text-xs text-muted">
                <tr className="text-right">
                  <th className="py-1 text-left font-medium">Alternativa</th>
                  <th className="font-medium">FC</th><th className="font-medium">Costo</th><th className="font-medium">FO</th>
                  <th className="font-medium">FS</th><th className="font-medium">IS</th><th className="font-medium">Puesto</th>
                </tr>
              </thead>
              <tbody>
                {r.alts.map((a) => (
                  <tr key={a.id} className="border-t border-line text-right">
                    <td className="py-1.5 text-left">{a.name}</td>
                    <td>{a.fc}</td><td>{money(a.cost)}</td><td>{fmt(a.fo)}</td><td>{fmt(a.fs)}</td>
                    <td className="font-semibold">{fmt(a.is)}</td><td>{a.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Card>
    </div>
  );
}

function Legend({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} /> {children}
    </span>
  );
}

function Sensitivity({ m, r }: { m: Model; r: Results }) {
  const W = 520, H = 240, pl = 40, pr = 12, pt = 12, pb = 30;
  const maxV = Math.max(0.05, ...r.sensitivity.flatMap((s) => Object.values(s.values))) * 1.1;
  const x = (a: number) => pl + a * (W - pl - pr);
  const y = (v: number) => pt + (1 - v / maxV) * (H - pt - pb);
  const ticks = [0, maxV / 2, maxV];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Gráfico de sensibilidad del IS frente a α">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} stroke="#E5E8F0" />
          <text x={pl - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#6B7280">{t.toFixed(2).replace(".", ",")}</text>
        </g>
      ))}
      {[0, 0.5, 1].map((a) => (
        <text key={a} x={x(a)} y={H - 10} textAnchor="middle" fontSize="10" fill="#6B7280">α = {String(a).replace(".", ",")}</text>
      ))}
      <line x1={x(m.alpha)} x2={x(m.alpha)} y1={pt} y2={H - pb} stroke="#B8963E" strokeDasharray="4 3" />
      {m.alternatives.map((a) => {
        const pts = r.sensitivity.filter((s) => a.id in s.values).map((s) => `${x(s.alpha)},${y(s.values[a.id])}`).join(" ");
        const win = r.winner?.id === a.id;
        return <polyline key={a.id} points={pts} fill="none" stroke={colorOf(m, a.id)} strokeWidth={win ? 3.5 : 2} strokeOpacity={win ? 1 : 0.7} strokeLinejoin="round" />;
      })}
    </svg>
  );
}
