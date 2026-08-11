import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchGraph, searchPersons, isUsingMock, connectionReady, setActiveDataset } from './lib/neo4j.js'
import { mockNodes } from './lib/mockData.js'
import { mockSafetyNodes } from './lib/mockDataSafety.js'
import { computeOverlap } from './lib/overlap.js'
import TopBar from './components/TopBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import GraphCanvas from './components/GraphCanvas.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import ComparePanel from './components/ComparePanel.jsx'

// FIXED: Removed `window.React = React` global pollution.
// ComparePanel now imports its own useState directly from 'react'.

const THEME_KEY = 'meridian-theme'

function initialTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t === 'light' || t === 'dark') return t
  } catch { /* storage unavailable — fall through to the default */ }
  return 'dark'
}

export default function App() {
  const [theme, setTheme]             = useState(initialTheme)
  const [query, setQuery]             = useState('')
  const [selectedNode, setSelected]   = useState(null)
  const [graphData, setGraphData]     = useState({ nodes: [], edges: [] })
  const [filteredNodes, setFiltered]  = useState([])
  const [connectionStatus, setStatus] = useState('connecting')
  // FIXED: Use explicit `loaded` boolean instead of fragile nodes.length dependency
  const [dataLoaded, setDataLoaded]   = useState(false)
  const [loadError, setLoadError]     = useState(null)

  // Dataset toggle: 'general' | 'safety'
  const [dataset, setDataset] = useState('general')

  // Compare mode
  const [compareMode, setCompareMode] = useState(false)

  // Filters
  const [minScore, setMinScore]  = useState(0)
  const [tierFilter, setTier]    = useState('')
  const [geoFilter, setGeo]      = useState('')

  // Compute overlap pairs from both static datasets (always available)
  const overlapPairs = useMemo(
    () => computeOverlap(mockNodes, mockSafetyNodes),
    []
  )

  // Apply theme to document root and remember it
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.background = theme === 'light' ? '#fcfcfd' : '#08090a'
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* non-fatal */ }
  }, [theme])

  // Load graph once connection is resolved (or re-load on dataset switch)
  useEffect(() => {
    setSelected(null)
    setQuery('')
    setTier('')
    setGeo('')
    setDataLoaded(false)
    setLoadError(null)

    // FIXED: Added .catch() so errors surface in UI instead of silently failing
    connectionReady
      .then(async () => {
        setStatus(isUsingMock() ? 'mock' : 'live')
        setActiveDataset(dataset)
        const data = await fetchGraph()
        setGraphData(data)
        setFiltered(data.nodes.filter(n => n.label === 'Person'))
        setDataLoaded(true)
      })
      .catch(err => {
        console.error('[App] Failed to load graph data:', err)
        setStatus('mock')
        setLoadError('Failed to load graph data. Showing cached data.')
        setDataLoaded(true)
      })
  }, [dataset])

  // Re-filter whenever query or filter state changes
  // FIXED: Depend on `dataLoaded` boolean, not `graphData.nodes.length`
  useEffect(() => {
    if (!dataLoaded) return

    searchPersons({
      q: query,
      minScore: Number(minScore),
      tier:     tierFilter ? Number(tierFilter) : undefined,
      geo:      geoFilter  || undefined,
    })
      .then(setFiltered)
      .catch(err => console.error('[App] searchPersons failed:', err))
  }, [query, minScore, tierFilter, geoFilter, dataLoaded])

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  const handleDatasetToggle = useCallback((ds) => {
    if (ds !== dataset) setDataset(ds)
  }, [dataset])

  const handleCompareToggle = useCallback(() => {
    setCompareMode(m => !m)
  }, [])

  return (
    <div className="app">
      {loadError && (
        <div className="app-error-banner" role="alert">
          {loadError}
        </div>
      )}
      <TopBar
        query={query}
        onQuery={setQuery}
        theme={theme}
        onToggleTheme={toggleTheme}
        connectionStatus={connectionStatus}
        dataset={dataset}
        onDatasetToggle={handleDatasetToggle}
        compareMode={compareMode}
        onCompareToggle={handleCompareToggle}
        overlapCount={overlapPairs.length}
      />
      <Sidebar
        nodes={filteredNodes}
        selectedNode={selectedNode}
        onSelect={setSelected}
        minScore={minScore}
        onMinScore={setMinScore}
        tierFilter={tierFilter}
        onTierFilter={setTier}
        geoFilter={geoFilter}
        onGeoFilter={setGeo}
        allNodes={graphData.nodes}
        dataset={dataset}
      />
      <GraphCanvas
        nodes={graphData.nodes}
        edges={graphData.edges}
        selectedNode={selectedNode}
        onSelect={setSelected}
      />
      <DetailPanel
        node={selectedNode}
        edges={graphData.edges}
        allNodes={graphData.nodes}
      />

      {/* Compare overlay */}
      {compareMode && (
        <ComparePanel
          overlapPairs={overlapPairs}
          onClose={() => setCompareMode(false)}
        />
      )}
    </div>
  )
}
