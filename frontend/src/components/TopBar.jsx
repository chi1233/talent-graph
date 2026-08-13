import { useEffect, useRef } from 'react'
import { Search, Sun, Moon, Columns2 } from 'lucide-react'

function BrandMark() {
  return (
    <svg
      className="brand__mark"
      width="16" height="16" viewBox="0 0 16 16"
      fill="none" aria-hidden="true"
    >
      <path d="M8 3.2 3.4 11.6M8 3.2l4.6 8.4M3.4 11.6h9.2" stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.45" />
      <circle cx="8" cy="3.2" r="2.1" fill="currentColor" />
      <circle cx="3.4" cy="11.6" r="1.5" fill="currentColor" fillOpacity="0.7" />
      <circle cx="12.6" cy="11.6" r="1.5" fill="currentColor" fillOpacity="0.7" />
    </svg>
  )
}

export default function TopBar({
  query, onQuery,
  theme, onToggleTheme,
  connectionStatus,
  dataset, onDatasetToggle,
  compareMode, onCompareToggle,
  overlapCount,
}) {
  const isSafety = dataset === 'safety'
  const inputRef = useRef(null)

  // "/" focuses search, Escape clears it
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')
      if (e.key === '/' && !typing) {
        e.preventDefault()
        inputRef.current?.focus()
      } else if (e.key === 'Escape' && el === inputRef.current) {
        onQuery('')
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onQuery])

  const statusText =
    connectionStatus === 'connecting' ? 'Connecting'
    : connectionStatus === 'live'     ? 'Neo4j live'
    : 'Snapshot · Jun 2026'

  return (
    <header className="topbar">
      <div className="brand">
        <BrandMark />
        <span className="brand__name">Meridian</span>
      </div>

      <div className="rule-v" aria-hidden="true" />

      <div className="search">
        <Search className="search__icon" size={13} strokeWidth={2} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search people, roles, companies"
          value={query}
          onChange={e => onQuery(e.target.value)}
          aria-label="Search people, roles, or companies"
          spellCheck="false"
          autoComplete="off"
        />
        <span className="search__kbd" aria-hidden="true">/</span>
      </div>

      <div className="seg" role="group" aria-label="Dataset">
        <button
          className={`seg__btn seg__btn--general${!isSafety ? ' seg__btn--on' : ''}`}
          onClick={() => onDatasetToggle('general')}
          title="Top 49 AI researchers"
          aria-pressed={!isSafety}
        >
          <span className="seg__dot" aria-hidden="true" />
          <span>General AI</span>
          <span className="seg__count">49</span>
        </button>
        <button
          className={`seg__btn seg__btn--safety${isSafety ? ' seg__btn--on' : ''}`}
          onClick={() => onDatasetToggle('safety')}
          title="Top 40 AI safety researchers"
          aria-pressed={isSafety}
        >
          <span className="seg__dot" aria-hidden="true" />
          <span>AI Safety</span>
          <span className="seg__count">40</span>
        </button>
      </div>

      <button
        className={`btn${compareMode ? ' btn--on' : ''}`}
        onClick={onCompareToggle}
        title="Compare researchers appearing in both lists"
        aria-pressed={compareMode}
      >
        <Columns2 size={13} strokeWidth={2} aria-hidden="true" />
        <span>Compare</span>
        {overlapCount > 0 && (
          <span className="btn__count" aria-label={`${overlapCount} overlapping researchers`}>
            {overlapCount}
          </span>
        )}
      </button>

      <div className="spacer" />

      <div className="status" title={statusText}>
        <span
          className={`status__dot status__dot--${connectionStatus === 'live' ? 'live' : 'mock'}`}
          aria-hidden="true"
        />
        {statusText}
      </div>

      <button
        className="icon-btn"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {theme === 'dark'
          ? <Sun size={14} strokeWidth={2} aria-hidden="true" />
          : <Moon size={14} strokeWidth={2} aria-hidden="true" />}
      </button>
    </header>
  )
}
