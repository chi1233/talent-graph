import { useMemo } from 'react'

function tierColor(tier) {
  if (tier === 1) return 'tier-badge--1'
  if (tier === 2) return 'tier-badge--2'
  return 'tier-badge--3'
}

export default function Sidebar({
  nodes, selectedNode, onSelect,
  minScore, onMinScore,
  tierFilter, onTierFilter,
  geoFilter, onGeoFilter,
  allNodes,
}) {
  // Collect unique geo values for the filter dropdown
  const geoOptions = useMemo(() => {
    const seen = new Set()
    allNodes.forEach(n => { if (n.geo) seen.add(n.geo) })
    return [...seen].sort()
  }, [allNodes])

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__title">Filters</div>

        <div className="filter-row">
          <div style={{ flex: 1 }}>
            <div className="filter-label">Min score</div>
            <input
              type="number"
              className="filter-range"
              min={0} max={10} step={0.5}
              value={minScore}
              onChange={e => onMinScore(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="filter-label">Tier</div>
            <select
              className="filter-select"
              value={tierFilter}
              onChange={e => onTierFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div style={{ flex: 1 }}>
            <div className="filter-label">Geography</div>
            <select
              className="filter-select"
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

      <div className="sidebar__count">
        {nodes.length} person{nodes.length !== 1 ? 's' : ''}
      </div>

      <div className="sidebar__list">
        {nodes.map(node => (
          <div
            key={node.id}
            className={`node-item${selectedNode?.id === node.id ? ' node-item--selected' : ''}`}
            onClick={() => onSelect(node)}
          >
            <div className="node-item__name">{node.name}</div>
            <div className="node-item__sub">
              {[node.role, node.company].filter(Boolean).join(' · ')}
            </div>
            <div className="node-item__score-row">
              {node.tier && (
                <span className={`tier-badge ${tierColor(node.tier)}`}>
                  T{node.tier}
                </span>
              )}
              {node.composite_score != null && (
                <span className="score-chip">{node.composite_score.toFixed(1)}</span>
              )}
              {node.geo && (
                <span className="score-chip" style={{ marginLeft: 'auto', fontSize: 10 }}>
                  {node.geo}
                </span>
              )}
            </div>
          </div>
        ))}

        {nodes.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No results
          </div>
        )}
      </div>
    </aside>
  )
}
