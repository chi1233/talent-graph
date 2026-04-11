import { Search, Sun, Moon, ShieldCheck, Brain, GitCompare } from 'lucide-react'

export default function TopBar({ query, onQuery, theme, onToggleTheme, connectionStatus, dataset, onDatasetToggle, compareMode, onCompareToggle, overlapCount }) {
  const isSafety = dataset === 'safety'

  return (
    <header className="topbar">
      <div className="topbar__logo">
        Meridian<span></span>
      </div>

      <div className="topbar__search">
        <Search className="topbar__search-icon" size={14} />
        <input
          type="text"
          placeholder="Search people, roles, companies…"
          value={query}
          onChange={e => onQuery(e.target.value)}
        />
      </div>

      {/* Dataset toggle */}
      <div className="dataset-toggle" role="group" aria-label="Switch dataset">
        <button
          className={`dataset-toggle__btn${!isSafety ? ' dataset-toggle__btn--active' : ''}`}
          onClick={() => onDatasetToggle('general')}
          title="Top 49 AI Researchers"
        >
          <Brain size={13} />
          <span>General AI</span>
          <span className="dataset-toggle__count">49</span>
        </button>
        <button
          className={`dataset-toggle__btn dataset-toggle__btn--safety${isSafety ? ' dataset-toggle__btn--active dataset-toggle__btn--active-safety' : ''}`}
          onClick={() => onDatasetToggle('safety')}
          title="Top 40 AI Safety Researchers"
        >
          <ShieldCheck size={13} />
          <span>AI Safety</span>
          <span className="dataset-toggle__count">40</span>
        </button>
      </div>

      {/* Compare button */}
      <button
        className={`topbar__btn topbar__btn--compare${compareMode ? ' topbar__btn--compare-active' : ''}`}
        onClick={onCompareToggle}
        title="Compare researchers in both lists"
        aria-pressed={compareMode}
      >
        <GitCompare size={14} />
        <span style={{ fontSize: 12, marginLeft: 4 }}>Compare</span>
        {overlapCount > 0 && (
          <span className="compare-badge">{overlapCount}</span>
        )}
      </button>

      <div className="topbar__spacer" />

      <div className="topbar__status">
        <span className={`status-dot status-dot--${connectionStatus === 'live' ? 'live' : 'mock'}`} />
        {connectionStatus === 'connecting' ? 'Connecting…'
          : connectionStatus === 'live'    ? 'Neo4j Live'
          : 'Data (As of April 2026)'}
      </div>

      <button
        className="topbar__btn"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </header>
  )
}
