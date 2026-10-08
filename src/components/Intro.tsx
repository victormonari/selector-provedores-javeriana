"use client";

const FACTORS = [
  { sym: "FC", name: "Requisitos", text: "Lo obligatorio, como la ética o la ley. Si una opción falla uno, queda fuera." },
  { sym: "FO", name: "Costo", text: "Precio y horas internas. La más barata obtiene el mayor puntaje." },
  { sym: "FS", name: "Calidad", text: "Lo que se juzga: calidad, experiencia, plazo. Tú decides qué pesa más." },
];

const STEPS = ["Qué compras y quién compite", "Requisitos obligatorios", "Costos", "Calidad", "Resultado"];

export default function Intro({ onExample, onBlank, onContinue, savedName }: {
  onExample: () => void; onBlank: () => void; onContinue?: () => void; savedName?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h2 className="text-3xl font-semibold leading-tight text-navy sm:text-4xl">¿A qué proveedor le compro?</h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
        Compara hasta 8 opciones (proveedores externos o producirlo tú mismo) y te dice cuál conviene, combinando tres miradas
        con el método sinérgico de Brown &amp; Gibson.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Choice onClick={onExample} title="Con datos de ejemplo" primary
          text="Un caso real cargado: producir 15 cursos, con 6 opciones. Ideal para ver cómo funciona y cambiar datos." />
        <Choice onClick={onBlank} title="Caso nuevo"
          text="Empieza en blanco con 3 proveedores y llena tus propios datos, reales o de prueba." />
      </div>
      {onContinue && (
        <button type="button" onClick={onContinue}
          className="mt-3 w-full rounded-2xl border border-dashed border-navy/30 bg-white/60 p-4 text-left text-sm text-navy transition hover:border-navy hover:bg-white">
          <b>Continuar donde quedé</b>
          <span className="ml-2 text-muted">{savedName ? `· ${savedName}` : "· datos guardados en este navegador"}</span>
        </button>
      )}

      <section aria-labelledby="como-funciona" className="mt-14 rounded-2xl border border-line bg-[#eceff5] p-6 sm:p-8">
        <h3 id="como-funciona" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" />
          </svg>
          Cómo funciona
        </h3>

        <dl className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line">
          {FACTORS.map((f) => (
            <div key={f.sym} className="sm:px-5 sm:first:pl-0 sm:last:pr-0">
              <dt className="text-sm font-semibold text-navy">
                <span className="mr-1.5 text-gold">{f.sym}</span>{f.name}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 border-t border-line pt-6 text-sm text-muted">
          <p className="font-mono font-semibold text-navy">IS = FC × [α × FO + (1 − α) × FS]</p>
          <p className="mt-1.5 leading-relaxed">
            α es cuánto pesa el costo frente a la calidad (0,5 = igual). Gana la opción con el mayor índice IS.
          </p>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <p className="text-sm font-semibold text-navy">En 5 pasos</p>
          <ol className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-5 sm:gap-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-1.5 sm:block">
                <span className="tabular-nums text-navy/60 sm:block">{i + 1}.</span> {s}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

function Choice({ title, text, onClick, primary }: { title: string; text: string; onClick: () => void; primary?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={`group rounded-2xl p-5 text-left transition ${primary ? "bg-navy text-white hover:bg-navy/90" : "border border-navy/15 bg-white text-navy hover:border-navy"}`}>
      <span className="flex items-center justify-between font-semibold">
        {title}
        <span aria-hidden className="transition group-hover:translate-x-1">→</span>
      </span>
      <span className={`mt-2 block text-sm leading-relaxed ${primary ? "text-white/75" : "text-muted"}`}>{text}</span>
    </button>
  );
}
