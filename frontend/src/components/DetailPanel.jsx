import { Github, Linkedin, Check, AlertCircle, Network } from 'lucide-react'

const SCORE_DIMS = [
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

function ScoreBar({ label, value, weight }) {
  if (value == null) return null
  return (
    <div className="bar">
      <div className="bar__label">
        {label}
        {weight && <span className="bar__weight">{weight}%</span>}
      </div>
      <div className="bar__track">
        <div
          className="bar__fill"
          style={{ width: `${Math.min(100, (value / 10) * 100)}%`, background: scoreColor(value) }}
        />
      </div>
      <div className="bar__val">{value.toFixed(1)}</div>
    </div>
  )
}

export default function DetailPanel({ node, edges, allNodes }) {
  if (!node) {
    return (
      <div className="detail">
        <div className="panel-head">
          <span className="panel-head__title">Inspector</span>
        </div>
        <div className="detail__empty">
          <Network className="detail__empty-mark" size={22} strokeWidth={1.5} aria-hidden="true" />
          <span>Select a node to inspect it</span>
        </div>
      </div>
    )
  }

  const idOf = (v) => (v && typeof v === 'object' ? v.id : v)

  const connected = edges
    .filter(e => idOf(e.source) === node.id || idOf(e.target) === node.id)
    .map(e => {
      const otherId = idOf(e.source) === node.id ? idOf(e.target) : idOf(e.source)
      return { ...e, otherNode: allNodes.find(n => n.id === otherId) }
    })
    .filter(e => e.otherNode)

  const isPerson = node.label === 'Person'
  const education = [node.degree, node.field].filter(Boolean).join(' in ')

  // One labelled block instead of a heading per node type
  const facts = [
    ['Education',  education],
    ['World rank', node.world_rank ? `#${node.world_rank}` : null],
    ['Country',    node.country],
    ['Stage',      node.stage],
    ['Sector',     node.sector],
    ['HQ',         node.hq_city],
  ].filter(([, v]) => v)

  return (
    <div className="detail">
      <div className="panel-head">
        <span className="panel-head__title">Inspector</span>
        <span className="panel-head__meta">{node.label}</span>
      </div>

      {/* Keyed by node so the sections re-run their cascade on every selection */}
      <div className="detail__scroll scroll" key={node.id}>
        <div className="detail__head">
          {(node.tier || node.geo) && (
            <div className="detail__kicker">
              {node.tier && (
                <span className={tierClass(node.tier)}>Tier {node.tier}</span>
              )}
              {node.geo && <span className="kicker">{node.geo}</span>}
            </div>
          )}

          <h2 className="detail__name">{node.name}</h2>

          {node.role && (
            <div className="detail__role">
              {node.role}
              {node.company && <span style={{ color: 'var(--fg-3)' }}> · {node.company}</span>}
            </div>
          )}

          {(node.linkedin_url || node.github_handle) && (
            <div className="chips" style={{ marginTop: 12 }}>
              {node.linkedin_url && (
                <a className="chip" href={node.linkedin_url} target="_blank" rel="noreferrer">
                  <Linkedin size={11} strokeWidth={2} aria-hidden="true" /> LinkedIn
                </a>
              )}
              {node.github_handle && (
                <a
                  className="chip"
                  href={`https://github.com/${node.github_handle}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={11} strokeWidth={2} aria-hidden="true" /> {node.github_handle}
                </a>
              )}
            </div>
          )}
        </div>

        {isPerson && node.composite_score != null && (
          <div className="section">
            <div className="composite">
              <span className="composite__val" style={{ color: scoreColor(node.composite_score) }}>
                {node.composite_score.toFixed(1)}
              </span>
              <div className="composite__meta">
                <span className="composite__label">Composite</span>
                <span className="prose" style={{ fontSize: 11.5 }}>weighted, out of 10</span>
              </div>
            </div>

            <div className="bars">
              {SCORE_DIMS.map(d => (
                <ScoreBar key={d.key} label={d.label} value={node[d.key]} weight={d.weight} />
              ))}
            </div>
          </div>
        )}

        {node.bio && (
          <div className="section">
            <p className="prose">{node.bio}</p>
          </div>
        )}

        {facts.length > 0 && (
          <div className="section">
            <div className="kv">
              {facts.map(([k, v]) => (
                <div className="kv__row" key={k}>
                  <span className="kv__k">{k}</span>
                  <span className="kv__v">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {connected.length > 0 && (
          <div className="section">
            <div className="section__title">
              <span>Connections</span>
              <span className="panel-head__meta">{connected.length}</span>
            </div>
            <div className="conns">
              {connected.map((e, i) => (
                <div className="conn" key={`${e.type}-${e.otherNode.id}-${i}`}>
                  <span className="conn__name">{e.otherNode.name}</span>
                  <span className="conn__type">{e.type.replace(/_/g, ' ').toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isPerson && (
          <div className="section">
            <div className={`note note--${node.manually_reviewed ? 'ok' : 'pending'}`}>
              <span className="note__icon">
                {node.manually_reviewed
                  ? <Check size={13} strokeWidth={2.5} color="var(--sig-hi)" aria-hidden="true" />
                  : <AlertCircle size={13} strokeWidth={2} color="var(--sig-mid)" aria-hidden="true" />}
              </span>
              <span>
                {node.manually_reviewed
                  ? (node.review_notes || 'Manually reviewed.')
                  : 'Pending manual review.'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
