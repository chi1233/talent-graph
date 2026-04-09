import { Github, Linkedin, CheckCircle, AlertCircle } from 'lucide-react'

const SCORE_DIMS = [
  { key: 'composite_score',    label: 'Composite',         weight: null },
  { key: 'pedigree_score',     label: 'Pedigree',          weight: '25%' },
  { key: 'trajectory_score',   label: 'Trajectory',        weight: '30%' },
  { key: 'publication_score',  label: 'Publications',      weight: '15%' },
  { key: 'founder_likelihood', label: 'Founder Likelihood',weight: '20%' },
  { key: 'data_confidence',    label: 'Data Confidence',   weight: '10%' },
]

function ScoreBar({ label, value, weight }) {
  if (value == null) return null
  const pct = Math.min(100, (value / 10) * 100)
  const color = value >= 7 ? 'var(--tier1)'
              : value >= 5 ? 'var(--tier2)'
              : 'var(--tier3)'

  return (
    <div className="score-bar-row">
      <div className="score-bar-label">
        {label}
        {weight && <span style={{ color: 'var(--text-3)', marginLeft: 4, fontSize: 10 }}>{weight}</span>}
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="score-bar-value">{value.toFixed(1)}</div>
    </div>
  )
}

function tierLabel(tier) {
  if (tier === 1) return 'Tier 1'
  if (tier === 2) return 'Tier 2'
  if (tier === 3) return 'Tier 3'
  return null
}

function tierClass(tier) {
  return `tier-badge tier-badge--${tier || '3'}`
}

export default function DetailPanel({ node, edges, allNodes }) {
  if (!node) {
    return (
      <div className="detail">
        <div className="detail__empty">Select a node to see details</div>
      </div>
    )
  }

  // Edges connected to this node
  const connected = edges
    .filter(e => e.source === node.id || e.source?.id === node.id ||
                 e.target === node.id || e.target?.id === node.id)
    .map(e => {
      const otherId = (e.source?.id || e.source) === node.id
        ? (e.target?.id || e.target)
        : (e.source?.id || e.source)
      const other = allNodes.find(n => n.id === otherId)
      return { ...e, otherNode: other }
    })
    .filter(e => e.otherNode)

  const isPerson = node.label === 'Person'

  return (
    <div className="detail">
      <div className="detail__scroll">
        {/* Header */}
        <div className="detail__header">
          <div className="detail__label-row">
            <span className="label-tag">{node.label}</span>
            {node.tier && (
              <span className={tierClass(node.tier)}>{tierLabel(node.tier)}</span>
            )}
          </div>
          <div className="detail__name">{node.name}</div>
          {node.role && (
            <div className="detail__role">
              {node.role}{node.company ? ` · ${node.company}` : ''}
            </div>
          )}
          {node.geo && (
            <div className="detail__role" style={{ marginTop: 2 }}>{node.geo}</div>
          )}
        </div>

        {/* Bio */}
        {node.bio && <div className="detail__bio">{node.bio}</div>}

        {/* Links */}
        {(node.linkedin_url || node.github_handle) && (
          <div className="detail__links">
            {node.linkedin_url && (
              <a className="link-chip" href={node.linkedin_url} target="_blank" rel="noreferrer">
                <Linkedin size={12} /> LinkedIn
              </a>
            )}
            {node.github_handle && (
              <a
                className="link-chip"
                href={`https://github.com/${node.github_handle}`}
                target="_blank"
                rel="noreferrer"
              >
                <Github size={12} /> @{node.github_handle}
              </a>
            )}
          </div>
        )}

        {/* Academic */}
        {(node.degree || node.field) && (
          <>
            <div className="divider" />
            <div className="section-heading">Education</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {[node.degree, node.field].filter(Boolean).join(' in ')}
            </div>
          </>
        )}

        {/* Scores (Person only) */}
        {isPerson && node.composite_score != null && (
          <>
            <div className="divider" />
            <div className="composite-ring">
              <div
                className="ring-val"
                style={{
                  color: node.composite_score >= 7 ? 'var(--tier1)'
                       : node.composite_score >= 5 ? 'var(--tier2)'
                       : 'var(--tier3)',
                }}
              >
                {node.composite_score.toFixed(1)}
              </div>
              <div className="ring-meta">
                <span className={tierClass(node.tier)}>{tierLabel(node.tier)}</span>
                <span className="ring-sub">Composite score</span>
              </div>
            </div>

            <div className="section-heading">Score breakdown</div>
            <div className="score-bar-group">
              {SCORE_DIMS.filter(d => d.key !== 'composite_score').map(d => (
                <ScoreBar
                  key={d.key}
                  label={d.label}
                  value={node[d.key]}
                  weight={d.weight}
                />
              ))}
            </div>
          </>
        )}

        {/* Institution-specific */}
        {node.label === 'Institution' && node.world_rank && (
          <>
            <div className="divider" />
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              World rank: <strong style={{ color: 'var(--text)' }}>#{node.world_rank}</strong>
              {node.country && ` · ${node.country}`}
            </div>
          </>
        )}

        {/* Company-specific */}
        {node.label === 'Company' && (
          <>
            <div className="divider" />
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {[node.stage, node.sector, node.hq_city].filter(Boolean).join(' · ')}
            </div>
          </>
        )}

        {/* Review status */}
        {isPerson && (
          <>
            <div className="divider" />
            <div className={`review-badge review-badge--${node.manually_reviewed ? 'yes' : 'no'}`}>
              <span className="review-badge__icon">
                {node.manually_reviewed
                  ? <CheckCircle size={14} color="var(--tier1)" />
                  : <AlertCircle size={14} color="var(--tier2)" />}
              </span>
              <div className="review-badge__notes">
                {node.manually_reviewed
                  ? (node.review_notes || 'Manually reviewed')
                  : 'Pending manual review'}
              </div>
            </div>
          </>
        )}

        {/* Connections */}
        {connected.length > 0 && (
          <>
            <div className="divider" />
            <div className="section-heading">Connections ({connected.length})</div>
            {connected.map((e, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 0',
                borderBottom: i < connected.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: 'var(--text-3)',
                  padding: '1px 6px', background: 'var(--bg-3)', borderRadius: 10,
                  flexShrink: 0,
                }}>
                  {e.type}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>
                  {e.otherNode.name}
                </span>
                {e.label && e.label !== e.type && (
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
                    {e.label}
                  </span>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
