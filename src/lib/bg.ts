// Método sinérgico de Brown & Gibson: modelo de datos y cálculo.
// IS = FC × [α × FO + (1 − α) × FS]

export type AltType = "Comprar" | "Hacer";
export type SubKind = "scale" | "lowerBetter";

export interface Alternative {
  id: string;
  name: string;
  type: AltType;
  unitCost: number | null;
  hours: number | null;
  crit: Record<string, 0 | 1 | null>;
  scores: Record<string, number | null>;
}

export interface CriticalFactor {
  id: string;
  name: string;
  desc: string;
}

export interface SubjectiveFactor {
  id: string;
  name: string;
  kind: SubKind;
  unit?: string;
}

export interface Model {
  item: string;
  units: number | null;
  rate: number | null;
  alpha: number;
  alternatives: Alternative[];
  critical: CriticalFactor[];
  subjective: SubjectiveFactor[];
  /** clave "idA|idB" (en el orden de la lista) → id del factor más importante */
  pairwise: Record<string, string | null>;
}

export interface AltResult {
  id: string;
  name: string;
  type: AltType;
  fc: number | null;
  cost: number | null;
  fo: number | null;
  fs: number | null;
  costPart: number | null;
  qualityPart: number | null;
  is: number | null;
  rank: number | null;
}

export interface Results {
  weights: Record<string, number>;
  zeroWeight: string[];
  alts: AltResult[];
  winner: AltResult | null;
  bestExternal: AltResult | null;
  discarded: number;
  sensitivity: { alpha: number; values: Record<string, number>; winnerId: string | null }[];
  robustness: number;
  missing: { step1: number; step2: number; step3: number; step4: number };
}

export const uid = () => Math.random().toString(36).slice(2, 9);

export const pairKey = (a: string, b: string) => `${a}|${b}`;

export function pairs<T extends { id: string }>(list: T[]) {
  const out: [T, T][] = [];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) out.push([list[i], list[j]]);
  return out;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function compute(m: Model): Results {
  const alts = m.alternatives;

  // Pesos de los factores subjetivos por comparación pareada
  const wins: Record<string, number> = Object.fromEntries(m.subjective.map((f) => [f.id, 0]));
  let decided = 0;
  for (const [a, b] of pairs(m.subjective)) {
    const w = m.pairwise[pairKey(a.id, b.id)];
    if (w && w in wins) {
      wins[w] += 1;
      decided += 1;
    }
  }
  const weights: Record<string, number> = {};
  for (const f of m.subjective) weights[f.id] = decided > 0 ? wins[f.id] / decided : 0;
  const zeroWeight = m.subjective.length > 1 && decided > 0 ? m.subjective.filter((f) => weights[f.id] === 0).map((f) => f.id) : [];

  // FC
  const fc = alts.map((a) => {
    const vals = m.critical.map((c) => a.crit[c.id]);
    if (vals.some((v) => v === null || v === undefined)) return null;
    return vals.reduce<number>((p, v) => p * (v as number), 1);
  });

  // Costo total y FO
  const cost = alts.map((a) =>
    isNum(a.unitCost) && a.unitCost > 0 && isNum(m.units) && isNum(a.hours) && isNum(m.rate)
      ? a.unitCost * m.units + a.hours * m.rate
      : null,
  );
  const allCosts = cost.every((c) => c !== null);
  const invSum = allCosts ? cost.reduce<number>((s, c) => s + 1 / (c as number), 0) : 0;
  const fo = cost.map((c) => (allCosts && c ? 1 / c / invSum : null));

  // FS: puntaje → normalizado por factor → ponderado
  const fsParts = alts.map(() => 0);
  let fsComplete = m.subjective.length > 0;
  for (const f of m.subjective) {
    const raw = alts.map((a) => a.scores[f.id]);
    if (raw.some((v) => !isNum(v) || v <= 0)) {
      fsComplete = false;
      continue;
    }
    const nums = raw as number[];
    const minV = Math.min(...nums);
    const s = f.kind === "lowerBetter" ? nums.map((v) => minV / v) : nums;
    const total = s.reduce((x, y) => x + y, 0);
    s.forEach((v, i) => (fsParts[i] += weights[f.id] * (v / total)));
  }
  const fs = alts.map((_, i) => (fsComplete ? fsParts[i] : null));

  const a = m.alpha;
  const res: AltResult[] = alts.map((alt, i) => {
    const ready = fc[i] !== null && fo[i] !== null && fs[i] !== null;
    const costPart = ready ? (fc[i] as number) * a * (fo[i] as number) : null;
    const qualityPart = ready ? (fc[i] as number) * (1 - a) * (fs[i] as number) : null;
    return {
      id: alt.id, name: alt.name || `Alternativa ${i + 1}`, type: alt.type,
      fc: fc[i], cost: cost[i], fo: fo[i], fs: fs[i], costPart, qualityPart,
      is: ready ? (costPart as number) + (qualityPart as number) : null, rank: null,
    };
  });

  const scored = res.filter((r) => r.is !== null);
  for (const r of scored) r.rank = scored.filter((o) => (o.is as number) > (r.is as number)).length + 1;
  const allReady = scored.length === res.length && res.length > 0;
  const best = (list: AltResult[]) =>
    list.reduce<AltResult | null>((b, r) => (r.is !== null && (b === null || r.is > (b.is as number)) ? r : b), null);
  const winner = allReady ? best(res) : null;
  const bestExternal = allReady ? best(res.filter((r) => r.type === "Comprar" && (r.is as number) > 0)) : null;

  const sensitivity = Array.from({ length: 11 }, (_, k) => {
    const alpha = k / 10;
    const values: Record<string, number> = {};
    let top: string | null = null;
    let topV = -Infinity;
    res.forEach((r) => {
      if (r.fc === null || r.fo === null || r.fs === null) return;
      const v = r.fc * (alpha * r.fo + (1 - alpha) * r.fs);
      values[r.id] = v;
      if (v > topV) { topV = v; top = r.id; }
    });
    return { alpha, values, winnerId: allReady ? top : null };
  });
  const robustness = winner ? sensitivity.filter((s) => s.winnerId === winner.id).length : 0;

  const blank = (v: unknown) => v === null || v === undefined || (typeof v === "number" && !Number.isFinite(v));
  const missing = {
    step1: [m.item.trim() ? 1 : null, m.units, m.rate].filter(blank).length + alts.filter((x) => !x.name.trim()).length,
    step2: alts.reduce((n, x) => n + m.critical.filter((c) => blank(x.crit[c.id])).length, 0),
    step3: alts.reduce((n, x) => n + (blank(x.unitCost) ? 1 : 0) + (blank(x.hours) ? 1 : 0), 0),
    step4:
      pairs(m.subjective).filter(([p, q]) => !m.pairwise[pairKey(p.id, q.id)]).length +
      alts.reduce((n, x) => n + m.subjective.filter((f) => blank(x.scores[f.id])).length, 0),
  };

  return {
    weights, zeroWeight, alts: res, winner, bestExternal,
    discarded: res.filter((r) => r.fc === 0).length, sensitivity, robustness, missing,
  };
}

// ---------------------------------------------------------------- plantillas

const CRITICAL_DEFAULT: CriticalFactor[] = [
  { id: "fc1", name: "Ética", desc: "Código de ética, política antisoborno y trato justo" },
  { id: "fc2", name: "Derechos de autor", desc: "Cede los derechos del contenido a la empresa" },
  { id: "fc3", name: "Datos personales", desc: "Cumple la Ley 1581 de 2012 y anexo ISO 27001" },
  { id: "fc4", name: "Legal y tributario", desc: "RUT y cámara de comercio vigentes" },
];

const SUBJECTIVE_DEFAULT: SubjectiveFactor[] = [
  { id: "s1", name: "Calidad pedagógica", kind: "scale" },
  { id: "s2", name: "Experiencia en el sector", kind: "scale" },
  { id: "s3", name: "Plazo de entrega", kind: "lowerBetter", unit: "días" },
  { id: "s4", name: "Flexibilidad", kind: "scale" },
  { id: "s5", name: "Sostenibilidad e inclusión", kind: "scale" },
];

function alt(name: string, type: AltType, unitCost: number | null, hours: number | null,
  crit: (0 | 1 | null)[], scores: (number | null)[]): Alternative {
  return {
    id: uid(), name, type, unitCost, hours,
    crit: Object.fromEntries(CRITICAL_DEFAULT.map((c, i) => [c.id, crit[i]])),
    scores: Object.fromEntries(SUBJECTIVE_DEFAULT.map((f, i) => [f.id, scores[i]])),
  };
}

const PAIRWISE_EXAMPLE: Record<string, string> = {
  "s1|s2": "s1", "s1|s3": "s1", "s1|s4": "s1", "s1|s5": "s1",
  "s2|s3": "s2", "s2|s4": "s2", "s2|s5": "s5",
  "s3|s4": "s3", "s3|s5": "s3", "s4|s5": "s4",
};

export function exampleModel(): Model {
  return {
    item: "Producción de 15 cursos a medida de 20 min",
    units: 15,
    rate: 25,
    alpha: 0.5,
    critical: CRITICAL_DEFAULT.map((c) => ({ ...c })),
    subjective: SUBJECTIVE_DEFAULT.map((f) => ({ ...f })),
    pairwise: { ...PAIRWISE_EXAMPLE },
    alternatives: [
      alt("Proveedor habitual de producción", "Comprar", 14500 / 15, 20, [1, 1, 1, 1], [5, 3, 45, 2, 3]),
      alt("Proveedor E1: video tipo Loom + guía PDF", "Comprar", 300, 20, [1, 1, 1, 1], [3, 2, 30, 1, 3]),
      alt("Productora B: alta calidad", "Comprar", 1150, 20, [1, 1, 1, 1], [5, 4, 35, 3, 5]),
      alt("Productora C: especialista en salud", "Comprar", 900, 20, [1, 1, 1, 1], [4, 5, 50, 2, 4]),
      alt("Productora D: bajo costo sin código de ética", "Comprar", 1050, 20, [0, 1, 1, 1], [4, 3, 40, 2, 2]),
      alt("Producción propia con IA", "Hacer", 303.5, 0, [1, 1, 1, 1], [3, 2, 7, 5, 3]),
    ],
  };
}

export function blankModel(): Model {
  return {
    item: "",
    units: null,
    rate: null,
    alpha: 0.5,
    critical: CRITICAL_DEFAULT.map((c) => ({ ...c })),
    subjective: SUBJECTIVE_DEFAULT.map((f) => ({ ...f })),
    pairwise: {},
    alternatives: [1, 2, 3].map((n) => alt(`Proveedor ${n}`, "Comprar", null, null, [null, null, null, null], [null, null, null, null, null])),
  };
}

export function emptyAlternative(m: Model, n: number): Alternative {
  return {
    id: uid(), name: `Proveedor ${n}`, type: "Comprar", unitCost: null, hours: null,
    crit: Object.fromEntries(m.critical.map((c) => [c.id, null])),
    scores: Object.fromEntries(m.subjective.map((f) => [f.id, null])),
  };
}
