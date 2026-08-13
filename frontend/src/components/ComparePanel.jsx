import { useState, useEffect, useRef } from 'react'
import { ArrowUp, ArrowDown, Minus, X } from 'lucide-react'

const SCORE_DIMS = [
  { key: 'composite_score',    label: 'Composite',          weight: null },
  { key: 'pedigree_score',     label: 'Pedigree',           weight: '25' },
  { key: 'trajectory_score',   label: 'Trajectory',         weight: '30' },
  { key: 'publication_score',  label: 'Publications',       weight: '15' },
  { key: 'founder_likelihood', label: 'Founder likelihood', weight: '20' },
  { key: 'data_confidence',    label: 'Data confidence',    weight: '10' },
]

function scoreColor(v) {
  return v >= 7 ? 'var(--sig-hi)' : v >= 5 ? 'var(--sig-mid)' : 'var(--sig-lo)'
}

function tierClass(tier) {
  return `tier tier--${tier === 1 ? '1' : tier === 2 ? '2' : '3'}`
}

function Delta({ a, b }) {
  if (a == null || b == null) return null
  const diff = +(a - b).toFixed(1)
  if (diff === 0) return <span className="cmp-delta cmp-delta--eq"><Minus size={9} strokeWidth={2.5} />0.0</span>
  if (diff > 0)   return <span className="cmp-delta cmp-delta--up"><ArrowUp size={9} strokeWidth={2.5} />{diff.toFixed(1)}</span>
  return <span className="cmp-delta cmp-delta--dn"><ArrowDown size={9} strokeWidth={2.5} />{Math.abs(diff).toFixed(1)}</span>
}

function ScoreRow({ dim, generalNode, safetyNode }) {
  const g = generalNode?.[dim.key]
  const s = safetyNode?.[dim.key]
  const isTotal = dim.key === 'composite_score'

  return (
    <div className={`cmp-row${isTotal ? ' cmp-row--total' : ''}`}>
      <div className="cmp-dim">
        <span className="cmp-dim__label">{dim.label}</span>
        {dim.weight && <span className="cmp-dim__weight">{dim.weight}%</span>}
      </div>

      <div className="cmp-side cmp-side--g">
        <span className="cmp-val" style={{ color: g != null ? scoreColor(g) : 'var(--fg-4)' }}>
          {g != null ? g.toFixed(1) : '—'}
        </span>
        <div className="cmp-track">
          <div
            className="cmp-fill"
            style={{
              width: g != null ? `${(g / 10) * 100}%` : 0,
              background: g != null ? scoreColor(g) : 'transparent',
            }}
          />
        </div>
      </div>

      <div className="cmp-delta-cell"><Delta a={g} b={s} /></div>

      <div className="cmp-side cmp-side--s">
        <div className="cmp-track">
          <div
            className="cmp-fill"
            style={{
              width: s != null ? `${(s / 10) * 100}%` : 0,
              background: s != null ? scoreColor(s) : 'transparent',
            }}
          />
        </div>
        <span className="cmp-val" style={{ color: s != null ? scoreColor(s) : 'var(--fg-4)' }}>
          {s != null ? s.toFixed(1) : '—'}
        </span>
      </div>
    </div>
  )
}

export default function ComparePanel({ overlapPairs, onClose }) {
  const [selectedName, setSelected] = useState(overlapPairs[0]?.name || null)
  const panelRef = useRef(null)

  const selected = overlapPairs.find(p => p.name === selectedName)

  // Escape closes from anywhere; focus the dialog on open
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div
        className="modal"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Cross-list comparison"
      >
        <div className="modal__head">
          <div>
            <div className="modal__title">Cross-list comparison</div>
            <div className="modal__sub">
              {overlapPairs.length} researcher{overlapPairs.length !== 1 ? 's' : ''} appear in both lists
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close comparison">
            <X size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body">
          <div className="cmp-list scroll">
            {overlapPairs.map(pair => (
              <div
                key={pair.name}
                className={`cmp-card${pair.name === selectedName ? ' cmp-card--on' : ''}`}
                onClick={() => setSelected(pair.name)}
                role="button"
                tabIndex={0}
                aria-current={pair.name === selectedName ? 'true' : undefined}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(pair.name)
                  }
                }}
              >
                <div className="cmp-card__name">{pair.name}</div>
                <div className="cmp-card__ranks">
                  <span className="cmp-card__rank cmp-card__rank--g" title="Rank in the General AI list">
                    #{pair.generalNode?._rank}
                  </span>
                  <span className="cmp-card__rank cmp-card__rank--s" title="Rank in the AI Safety list">
                    #{pair.safetyNode?._rank}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selected ? (
            <div className="cmp-detail">
              <div className="cmp-head">
                <div className="cmp-col cmp-col--g">
                  <span className="cmp-col__dot cmp-col__dot--g" aria-hidden="true" />
                  <span>General AI</span>
                  {selected.generalNode?.tier && (
                    <span className={tierClass(selected.generalNode.tier)}>T{selected.generalNode.tier}</span>
                  )}
                </div>

                <div className="cmp-who">
                  <div className="cmp-who__name">{selected.name}</div>
                  <div className="cmp-who__sub">
                    {selected.generalNode?.role || selected.safetyNode?.role}
                  </div>
                </div>

                <div className="cmp-col cmp-col--s">
                  {selected.safetyNode?.tier && (
                    <span className={tierClass(selected.safetyNode.tier)}>T{selected.safetyNode.tier}</span>
                  )}
                  <span>AI Safety</span>
                  <span className="cmp-col__dot cmp-col__dot--s" aria-hidden="true" />
                </div>
              </div>

              <div className="cmp-scores">
                {SCORE_DIMS.map(dim => (
                  <ScoreRow
                    key={dim.key}
                    dim={dim}
                    generalNode={selected.generalNode}
                    safetyNode={selected.safetyNode}
                  />
                ))}
              </div>

              <div className="cmp-context scroll">
                <div className="cmp-ctx-row">
                  <div className="cmp-ctx-side">
                    <div className="cmp-ctx-label">General AI focus</div>
                    <div className="cmp-ctx-val">{selected.generalNode?.field || '—'}</div>
                  </div>
                  <div className="cmp-ctx-rule" aria-hidden="true" />
                  <div className="cmp-ctx-side cmp-ctx-side--r">
                    <div className="cmp-ctx-label">AI Safety focus</div>
                    <div className="cmp-ctx-val">{selected.safetyNode?.field || '—'}</div>
                  </div>
                </div>

                {selected.generalNode?.review_notes && (
                  <div className="cmp-notes">
                    <div className="cmp-note">
                      <div className="cmp-note__label">General AI notes</div>
                      <div className="cmp-note__text">{selected.generalNode.review_notes}</div>
                    </div>
                    <div className="cmp-note">
                      <div className="cmp-note__label">AI Safety notes</div>
                      <div className="cmp-note__text">{selected.safetyNode?.review_notes || '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="cmp-detail cmp-detail--empty">Select a researcher</div>
          )}
        </div>
      </div>
    </div>
  )
}
