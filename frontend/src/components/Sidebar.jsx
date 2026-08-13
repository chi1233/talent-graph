import { useMemo } from 'react'

function tierClass(tier) {
  return `tier tier--${tier === 1 ? '1' : tier === 2 ? '2' : '3'}`
}

function scoreColor(v) {
  return v >= 7 ? 'var(--sig-hi)' : v >= 5 ? 'var(--sig-mid)' : 'var(--sig-lo)'
}

export default function Sidebar({
  nodes, selectedNode, onSelect,
  minScore, onMinScore,
  tierFilter, onTierFilter,
  geoFilter, onGeoFilter,
  allNodes,
  dataset,
}) {
  const geoOptions = useMemo(() => {
    const seen = new Set()
    allNodes.forEach(n => { if (n.geo) seen.add(n.geo) })
    return [...seen].sort()
  }, [allNodes])

  const hasFilters = Number(minScore) > 0 || tierFilter !== '' || geoFilter !== ''

  return (
    <aside className="sidebar" aria-label="Researcher filters and list">
      <div className="panel-head">
        <span className="panel-head__title">
          {dataset === 'safety' ? 'AI Safety' : 'General AI'}
        </span>
        <span className="panel-head__meta" aria-live="polite" aria-atomic="true">
          {nodes.length}
        </span>
      </div>

      <div className="filters">
        <div className="field">
          <label className="field__label" htmlFor="f-score">
            <span>Minimum score</span>
            <span className="field__value">{Number(minScore).toFixed(1)}</span>
          </label>
          <input
            id="f-score"
            type="range"
            className="range"
            min={0} max={10} step={0.5}
            value={minScore}
            onChange={e => onMinScore(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="f-tier"><span>Tier</span></label>
            <select
              id="f-tier"
              className="select"
              value={tierFilter}
              onChange={e => onTierFilter(e.target.value)}
            >
              <option value="">All tiers</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="f-geo"><span>Region</span></label>
            <select
              id="f-geo"
              className="select"
              value={geoFilter}
              onChange={e => onGeoFilter(e.target.value)}
            >
              <option value="">All regions</option>
              {geoOptions.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="list scroll" role="list">
        {nodes.map((node, i) => {
          const on = selectedNode?.id === node.id
          return (
            <div
              key={node.id}
              className={`row${on ? ' row--on' : ''}`}
              // Drives the cascade delay; capped so long lists don't crawl in
              style={{ '--i': Math.min(i, 22) }}
              onClick={() => onSelect(node)}
              role="listitem"
              tabIndex={0}
              aria-current={on ? 'true' : undefined}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(node)
                }
              }}
            >
              <span className="row__rank" aria-hidden="true">{i + 1}</span>

              <div className="row__body">
                <div className="row__name">{node.name}</div>
                {/* Role only — pairing it with the company truncated almost
                    every row. The company is one click away in the inspector. */}
                <div className="row__sub">{node.role || node.company || node.geo || '—'}</div>
              </div>

              <div className="row__meta">
                {node.tier && (
                  <span className={tierClass(node.tier)} aria-label={`Tier ${node.tier}`}>
                    T{node.tier}
                  </span>
                )}
                {node.composite_score != null && (
                  <span
                    className="row__score"
                    style={{ color: scoreColor(node.composite_score) }}
                    aria-label={`Score ${node.composite_score.toFixed(1)}`}
                  >
                    {node.composite_score.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {nodes.length === 0 && (
          <div className="empty" role="status">
            No matches
            {hasFilters && <div className="empty__hint">Try widening the filters</div>}
          </div>
        )}
      </div>
    </aside>
  )
}
