import { useState } from 'react'
import data from './proposal.data.json'

type Face = { normal: string; large: string; png?: string | null }
export type PCard = { qty: number; name: string; commander: boolean; type_line: string; mana_cost: string; faces: Face[]; uri: string; set: string; cn: string; placeholder?: boolean }
type Proposal = {
  name: string; status: string; cost: string; stats: string[][]
  curve: { labels: string[]; before: number[]; after: number[] }
  phases: { name: string; note: string; swaps: { out: PCard; in: PCard }[] }[]
}
export const proposal = data as Proposal

function Img({ c, ring, onOpen }: { c: PCard; ring: string; onOpen: (c: PCard) => void }) {
  const [f, setF] = useState(0)
  if (c.placeholder || !c.faces.length) return (
    <div className={'w-full aspect-[488/680] rounded-[4.5%] ring-2 bg-gradient-to-b from-neutral-800 to-neutral-950 flex flex-col items-center justify-center gap-2 p-4 text-center ' + ring}>
      <span className="text-[10px] uppercase tracking-widest text-stone-500">Not yet on Scryfall</span>
      <span className="font-semibold text-stone-200">{c.name}</span>
      <span className="font-mono text-xs text-stone-400">{c.set.toUpperCase()} #{c.cn}</span>
    </div>
  )
  return (
    <div className="relative">
      <button onClick={() => onOpen(c)} aria-label={c.name} className={'block w-full rounded-[4.5%] overflow-hidden ring-2 shadow-lg shadow-black/60 active:scale-[0.98] transition ' + ring}>
        <img src={c.faces[f].normal} alt={c.name} loading="lazy" className="w-full aspect-[488/680] bg-neutral-900" />
      </button>
      {c.faces.length > 1 && <button onClick={() => setF((f + 1) % c.faces.length)} className="absolute bottom-2 right-2 rounded-full bg-black/70 backdrop-blur text-white text-xs px-2.5 py-1 ring-1 ring-white/20">⟲ Flip</button>}
    </div>
  )
}

function Curve() {
  const { labels, before, after } = proposal.curve
  const max = Math.max(...before, ...after)
  return (
    <div>
      <div className="flex items-end gap-2 h-28">
        {labels.map((l, i) => (
          <div key={l} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center gap-0.5 h-24">
              {[[before[i], 'bg-red-400/70'], [after[i], 'bg-green-400/80']].map(([v, cls], j) => (
                <div key={j} className="relative w-1/2 max-w-4 flex flex-col justify-end h-full">
                  <span className="text-[9px] text-center text-stone-400">{v}</span>
                  <div className={'rounded-t ' + cls} style={{ height: `${(Number(v) / max) * 80}%` }} />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-mono text-stone-500">{l}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-stone-500"><span className="text-red-400">■</span> before · <span className="text-green-400">■</span> after · mana value</p>
    </div>
  )
}

export function ProposalView({ onOpen }: { onOpen: (c: PCard) => void }) {
  const n = proposal.phases.reduce((s, p) => s + p.swaps.length, 0)
  return (
    <div className="pt-6 space-y-8">
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 sm:p-4">
        <p className="text-xs font-mono uppercase tracking-widest text-amber-400">⚠ {proposal.status}</p>
        <p className="mt-1 text-sm text-stone-300">A proposed {n}-swap plan. It is <b>not</b> part of the Current list or any revision. Est. total cost <b className="text-amber-300">{proposal.cost}</b>.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-3 sm:p-4">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-amber-400/90">Before → After</h2>
          <dl className="grid grid-cols-2 gap-2">
            {proposal.stats.map(([k, a, b]) => (
              <div key={k} className="rounded-lg bg-black/30 px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wider text-stone-500">{k}</dt>
                <dd className="font-mono text-sm"><span className="text-red-300">{a}</span> <span className="text-stone-500">→</span> <span className="text-green-300">{b}</span></dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-xl bg-white/5 p-3 sm:p-4">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-amber-400/90">Mana curve</h2>
          <Curve />
        </div>
      </div>
      {proposal.phases.map(p => (
        <section key={p.name}>
          <h2 className="mb-3 text-sm uppercase tracking-widest text-amber-400/90">{p.name} <span className="normal-case tracking-normal text-stone-400">· {p.note}</span> <span className="text-stone-500">({p.swaps.length})</span></h2>
          <div className="space-y-4">
            {p.swaps.map(s => (
              <div key={s.out.name + s.in.name} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
                <div className="rounded-xl p-2 bg-red-500/10 border border-red-500/30">
                  <p className="mb-2 text-xs font-mono text-red-300 truncate">− {s.out.name}</p>
                  <Img c={s.out} ring="ring-red-500/60" onOpen={onOpen} />
                </div>
                <span className="text-stone-500 text-lg">→</span>
                <div className="rounded-xl p-2 bg-green-500/10 border border-green-500/30">
                  <p className="mb-2 text-xs font-mono text-green-300 truncate">+ {s.in.name}</p>
                  <Img c={s.in} ring="ring-green-500/60" onOpen={onOpen} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
