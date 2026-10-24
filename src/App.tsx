import { useEffect, useMemo, useState } from 'react'
import deck from './deck.json'
import revData from './revisions.data.json'
import { ProposalView, proposal } from './Proposal'

type Face = { normal: string; large: string; png?: string | null }
type Card = { qty: number; name: string; commander: boolean; type_line: string; mana_cost: string; faces: Face[]; uri: string }
const cards = deck as Card[]
type Revision = { name: string; removed: Card[]; added: Card[] }
const revisions = revData as Revision[]
// Current deck = base list with every revision applied in order.
const current: Card[] = (() => {
  const m = new Map(cards.map(c => [c.name, { ...c }]))
  for (const r of revisions) {
    for (const c of r.removed) { const e = m.get(c.name); if (e) { e.qty -= 1; if (e.qty <= 0) m.delete(c.name) } else console.warn('Removed card not in deck:', c.name) }
    for (const c of r.added) { const e = m.get(c.name); if (e) e.qty += 1; else m.set(c.name, { ...c, qty: 1 }) }
  }
  return [...m.values()]
})()
const ORDER = ['Commander', 'Creatures', 'Planeswalkers', 'Artifacts', 'Enchantments', 'Instants', 'Sorceries', 'Battles', 'Lands', 'Other']
const MOX = 'https://moxfield.com/decks/jZovhvZTckuZY5ow0XN7_A'

function group(c: Card) {
  if (c.commander) return 'Commander'
  const t = c.type_line.split('—')[0]
  for (const [k, g] of [['Creature', 'Creatures'], ['Planeswalker', 'Planeswalkers'], ['Land', 'Lands'], ['Artifact', 'Artifacts'], ['Enchantment', 'Enchantments'], ['Instant', 'Instants'], ['Sorcery', 'Sorceries'], ['Battle', 'Battles']])
    if (t.includes(k)) return g
  return 'Other'
}

function Tile({ c, onOpen }: { c: Card; onOpen: () => void }) {
  const [f, setF] = useState(0)
  return (
    <div className="relative">
      <button onClick={onOpen} className="block w-full rounded-[4.5%] overflow-hidden shadow-lg shadow-black/60 ring-1 ring-white/5 active:scale-[0.98] transition" aria-label={c.name}>
        <img src={c.faces[f].normal} alt={c.name} loading="lazy" className="w-full aspect-[488/680] bg-neutral-900" />
      </button>
      {c.qty > 1 && <span className="absolute top-2 right-2 rounded-full bg-amber-500 text-black text-xs font-bold px-2 py-0.5 shadow">×{c.qty}</span>}
      {c.faces.length > 1 && (
        <button onClick={() => setF((f + 1) % c.faces.length)} className="absolute bottom-2 right-2 rounded-full bg-black/70 backdrop-blur text-white text-xs px-2.5 py-1 ring-1 ring-white/20">⟲ Flip</button>
      )}
    </div>
  )
}

function Modal({ c, onClose }: { c: Card; onClose: () => void }) {
  const [y0, setY0] = useState<number | null>(null)
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto" onClick={onClose}
      onTouchStart={e => setY0(e.touches[0].clientY)} onTouchEnd={e => { if (y0 !== null && Math.abs(e.changedTouches[0].clientY - y0) > 90) onClose() }}>
      <button className="fixed top-3 right-3 z-10 h-10 w-10 rounded-full bg-white/10 text-2xl leading-none" aria-label="Close">×</button>
      <div className="min-h-full flex flex-col items-center justify-center gap-4 p-4 py-14">
        {c.faces.map((f, i) => <img key={i} src={f.large} alt={c.name} className="w-full max-w-md rounded-[4.5%] shadow-2xl" />)}
        <a href={c.uri} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-sm text-stone-400 underline">{c.name} on Scryfall</a>
      </div>
    </div>
  )
}

function Diff({ r, onOpen }: { r: Revision; onOpen: (c: Card) => void }) {
  const col = (title: string, cs: Card[], sign: string, cls: string, ring: string) => (
    <div className={'rounded-xl p-2 sm:p-3 ' + cls}>
      <h2 className="mb-3 text-sm font-mono font-semibold">{sign} {title} <span className="opacity-60">({cs.length})</span></h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cs.map(c => <div key={c.name} className={'rounded-[5%] ring-2 ' + ring}><Tile c={c} onOpen={() => onOpen(c)} /></div>)}
        {!cs.length && <p className="text-xs opacity-60">None</p>}
      </div>
    </div>
  )
  return (
    <section className="pt-6">
      <p className="mb-3 text-xs text-stone-400 font-mono">{r.name}: <span className="text-red-400">−{r.removed.length}</span> <span className="text-green-400">+{r.added.length}</span> vs previous</p>
      <div className="grid grid-cols-2 gap-3">
        {col('Removed', r.removed, '−', 'bg-red-500/10 border border-red-500/30 text-red-300', 'ring-red-500/60')}
        {col('Added', r.added, '+', 'bg-green-500/10 border border-green-500/30 text-green-300', 'ring-green-500/60')}
      </div>
    </section>
  )
}

export default function App() {
  const [open, setOpen] = useState<Card | null>(null)
  const tabs = ['Current', 'Version 1', ...revisions.map(r => r.name), proposal.name + ' (Proposed)']
  const PROP = tabs.length - 1
  const [tab, setTab] = useState(() => location.hash === '#artifact-maximalism' ? PROP : 0)
  useEffect(() => { history.replaceState(null, '', tab === PROP ? '#artifact-maximalism' : location.pathname) }, [tab, PROP])
  const list = tab === 1 ? cards : current
  const groups = useMemo(() => {
    const m = new Map<string, Card[]>()
    for (const c of list) { const g = group(c); m.set(g, [...(m.get(g) ?? []), c]) }
    return ORDER.filter(g => m.has(g)).map(g => [g, m.get(g)!] as const)
  }, [list])
  const total = list.reduce((s, c) => s + c.qty, 0)
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-[#0b0b0f]/85 backdrop-blur border-b border-white/5">
        <div role="tablist" className="max-w-5xl mx-auto px-4 pt-3 flex gap-2 overflow-x-auto text-sm no-scrollbar">
          {tabs.map((t, i) => <button key={t} role="tab" aria-selected={tab === i} onClick={() => { setTab(i); scrollTo(0, 0) }}
            className={'shrink-0 rounded-full px-3 py-1.5 transition ' + (i === PROP && tab !== i ? 'border border-dashed border-amber-500/50 ' : '') + (tab === i ? 'bg-amber-500 text-black font-semibold' : 'bg-white/5 text-stone-300 hover:bg-white/10')}>{t}</button>)}
        </div>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-semibold truncate">Aerid Konstrari Artifacts</h1>
            <p className="text-xs text-stone-400"><span className="text-red-400">●</span><span className="text-green-400">●</span> Red-green artifact tokens · {total} cards</p>
          </div>
          <a href={MOX} target="_blank" rel="noreferrer" className="shrink-0 text-xs rounded-full px-3 py-1.5 bg-white/10 hover:bg-white/15">Moxfield ↗</a>
        </div>
        {tab < 2 && <nav className="max-w-5xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto text-xs no-scrollbar">
          {groups.map(([g, cs]) => <a key={g} href={'#' + g} className="shrink-0 rounded-full px-2.5 py-1 bg-white/5 text-stone-300">{g} {cs.reduce((s, c) => s + c.qty, 0)}</a>)}
        </nav>}
      </header>
      <main className="max-w-5xl mx-auto px-3 pb-16">
        {tab === PROP ? <ProposalView onOpen={c => setOpen(c)} /> : tab > 1 ? <Diff r={revisions[tab - 2]} onOpen={setOpen} /> : groups.map(([g, cs]) => (
          <section key={g} id={g} className="scroll-mt-36 pt-6">
            <h2 className="mb-3 text-sm uppercase tracking-widest text-amber-400/90">{g} <span className="text-stone-500">({cs.reduce((s, c) => s + c.qty, 0)})</span></h2>
            <div className={g === 'Commander' ? 'max-w-sm mx-auto' : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'}>
              {cs.map(c => <Tile key={c.name} c={c} onOpen={() => setOpen(c)} />)}
            </div>
          </section>
        ))}
      </main>
      {open && <Modal c={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
