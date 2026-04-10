import { Search, Sun, Moon } from 'lucide-react'

export default function TopBar({ query, onQuery, theme, onToggleTheme, connectionStatus }) {
  return (
    <header className="topbar">
      <div className="topbar__logo">
        Talent<span>Graph</span>
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
