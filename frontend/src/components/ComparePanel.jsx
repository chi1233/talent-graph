import { ArrowUpRight, ArrowDownRight, Minus, X } from 'lucide-react'

const SCORE_DIMS = [
  { key: 'composite_score',    label: 'Composite',          weight: null  },
  { key: 'pedigree_score',     label: 'Pedigree',           weight: '25%' },
  { key: 'trajectory_score',   label: 'Trajectory',         weight: '30%' },
  { key: 'publication_score',  label: 'Publications',       weight: '15%' },
  { key: 'founder_likelihood', label: 'Founder Likelihood', weight: '20%' },
  { key: 'data_confidence',    label: 'Data Confidence',    weight: '10%' },
]

function tierClass(tier) {
  return `tier-badge tier-badge--${tier || '3'}`
}

function Delta({ a, b }) {
  if (a == null || b == null) return null
  const diff = +(a - b).toFixed(1)
  if (diff === 0) return <span className="cmp-delta cmp-delta--eq"><Minus size={10} />0</span>
  if (diff > 0)   return <span className="cmp-delta cmp-delta--up"><ArrowUpRight size={10} />+{diff}</span>
  return               <span className="cmp-delta cmp-delta--dn"><ArrowDownRight size={10} />{diff}</span>
}

function ScoreRow({ dim, generalNode, safetyNode }) {
  const gVal = generalNode?.[dim.key]
  const sVal = safetyNode?.[dim.key]

  const barColor = (v) =>
    v >= 7 ? 'var(--tier1)' : v >= 5 ? 'var(--tier2)' : 'var(--tier3)'

  const isComposite = dim.key === 'composite_score'

  return (
    <div className={`cmp-score-row${isComposite ? ' cmp-score-row--composite' : ''}`}>
      <div className="cmp-score-dim">
        <span className="cmp-score-dim-label">{dim.label}</span>
        {dim.weight && <span className="cmp-score-dim-weight">{dim.weight}</span>}
      </div>

      {/* General AI side */}
      <div className="cmp-score-side cmp-score-side--general">
        {gVal != null ? (
          <>
            <span className="cmp-score-val" style={{ color: barColor(gVal) }}>
              {gVal.toFixed(1)}
            </span>
            <div className="cmp-bar-track">
              <div
                className="cmp-bar-fill"
                style={{ width: `${(gVal / 10) * 100}%`, background: barColor(gVal) }}
              />
            </div>
          </>
        ) : <span className="cmp-score-val" style={{ color: 'var(--text-3)' }}>—</span>}
      </div>

      {/* Delta */}
      <div className="cmp-score-delta">
        <Delta a={gVal} b={sVal} />
      </div>

      {/* AI Safety side */}
      <div className="cmp-score-side cmp-score-side--safety">
        <div className="cmp-bar-track cmp-bar-track--rtl">
          <div
            className="cmp-bar-fill cmp-bar-fill--rtl"
            style={{ width: sVal != null ? `${(sVal / 10) * 100}%` : 0, background: sVal != null ? barColor(sVal) : 'transparent' }}
          />
        </div>
        {sVal != null ? (
          <span className="cmp-score-val" style={{ color: barColor(sVal) }}>
            {sVal.toFixed(1)}
          </span>
        ) : <span className="cmp-score-val" style={{ color: 'var(--text-3)' }}>—</span>}
      </div>
    </div>
  )
}

function ResearcherCard({ generalNode, safetyNode, isSelected, onClick }) {
  const name = generalNode?.name || safetyNode?.name
  const gRank = generalNode?._rank
  const sRank = safetyNode?._rank

  return (
    <div
      className={`cmp-card${isSelected ? ' cmp-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="cmp-card__name">{name}</div>
      <div className="cmp-card__ranks">
        <span className="cmp-rank-chip cmp-rank-chip--general">
          #{gRank} General
        </span>
        <span className="cmp-rank-chip cmp-rank-chip--safety">
          #{sRank} Safety
        </span>
      </div>
    </div>
  )
}

export default function ComparePanel({ overlapPairs, onClose }) {
  // overlapPairs: Array<{ name, generalNode, safetyNode }>
  const [selectedName, setSelected] = window.React.useState(
    overlapPairs[0]?.name || null
  )

  const selected = overlapPairs.find(p => p.name === selectedName)

  return (
    <div className="cmp-overlay">
      <div className="cmp-panel">
        {/* Header */}
        <div className="cmp-header">
          <div className="cmp-header__title">
            <span className="cmp-header__label">Cross-List Comparison</span>
            <span className="cmp-header__sub">
              {overlapPairs.length} researcher{overlapPairs.length !== 1 ? 's' : ''} appear in both lists
            </span>
          </div>
          <button className="cmp-close" onClick={onClose} aria-label="Close comparison">
            <X size={16} />
          </button>
        </div>

        <div className="cmp-body">
          {/* Left: researcher list */}
          <div className="cmp-list">
            {overlapPairs.map(pair => (
              <ResearcherCard
                key={pair.name}
                generalNode={pair.generalNode}
                safetyNode={pair.safetyNode}
                isSelected={pair.name === selectedName}
                onClick={() => setSelected(pair.name)}
              />
            ))}
          </div>

          {/* Right: score comparison */}
          {selected ? (
            <div className="cmp-detail">
              {/* Column headers */}
              <div className="cmp-col-headers">
                <div className="cmp-col-header cmp-col-header--general">
                  <span className="cmp-col-dot cmp-col-dot--general" />
                  <span>General AI</span>
                  {selected.generalNode?.tier && (
                    <span className={tierClass(selected.generalNode.tier)}>
                      T{selected.generalNode.tier}
                    </span>
                  )}
                </div>
                <div className="cmp-col-header-center">
                  <div className="cmp-researcher-name">{selected.name}</div>
                  <div className="cmp-researcher-sub">{selected.generalNode?.role || selected.safetyNode?.role}</div>
                </div>
                <div className="cmp-col-header cmp-col-header--safety">
                  {selected.safetyNode?.tier && (
                    <span className={tierClass(selected.safetyNode.tier)}>
                      T{selected.safetyNode.tier}
                    </span>
                  )}
                  <span>AI Safety</span>
                  <span className="cmp-col-dot cmp-col-dot--safety" />
                </div>
              </div>

              {/* Score rows */}
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

              {/* Context rows */}
              <div className="cmp-context">
                <div className="cmp-context-row">
                  <div className="cmp-context-side">
                    <div className="cmp-context-label">General AI focus</div>
                    <div className="cmp-context-val">{selected.generalNode?.field || '—'}</div>
                  </div>
                  <div className="cmp-context-divider" />
                  <div className="cmp-context-side cmp-context-side--right">
                    <div className="cmp-context-label">AI Safety focus</div>
                    <div className="cmp-context-val">{selected.safetyNode?.field || '—'}</div>
                  </div>
                </div>

                {selected.generalNode?.review_notes && (
                  <div className="cmp-notes-row">
                    <div className="cmp-notes-col">
                      <div className="cmp-notes-label">General AI notes</div>
                      <div className="cmp-notes-text">{selected.generalNode.review_notes}</div>
                    </div>
                    <div className="cmp-notes-col cmp-notes-col--safety">
                      <div className="cmp-notes-label">AI Safety notes</div>
                      <div className="cmp-notes-text">{selected.safetyNode?.review_notes || '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="cmp-detail cmp-detail--empty">
              Select a researcher to compare
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
