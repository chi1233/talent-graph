import { useState, useEffect, useCallback } from 'react'
import { fetchGraph, searchPersons, isUsingMock, connectionReady } from './lib/neo4j.js'
import TopBar from './components/TopBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import GraphCanvas from './components/GraphCanvas.jsx'
import DetailPanel from './components/DetailPanel.jsx'

export default function App() {
  const [theme, setTheme]             = useState('dark')
  const [query, setQuery]             = useState('')
  const [selectedNode, setSelected]   = useState(null)
  const [graphData, setGraphData]     = useState({ nodes: [], edges: [] })
  const [filteredNodes, setFiltered]  = useState([])
  const [connectionStatus, setStatus] = useState('connecting')

  // Filters
  const [minScore, setMinScore]  = useState(0)
  const [tierFilter, setTier]    = useState('')
  const [geoFilter, setGeo]      = useState('')

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Load graph once connection is resolved
  useEffect(() => {
    connectionReady.then(async () => {
      setStatus(isUsingMock() ? 'mock' : 'live')
      const data = await fetchGraph()
      setGraphData(data)
      setFiltered(data.nodes.filter(n => n.label === 'Person'))
    })
  }, [])

  // Re-filter whenever query or filter state changes
  useEffect(() => {
    if (!graphData.nodes.length) return

    searchPersons({
      q: query,
      minScore: Number(minScore),
      tier:     tierFilter ? Number(tierFilter) : undefined,
      geo:      geoFilter  || undefined,
    }).then(setFiltered)
  }, [query, minScore, tierFilter, geoFilter, graphData.nodes.length])

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  return (
    <div className="app">
      <TopBar
        query={query}
        onQuery={setQuery}
        theme={theme}
        onToggleTheme={toggleTheme}
        connectionStatus={connectionStatus}
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
      />
      <GraphCanvas
        nodes={graphData.nodes}
        edges={graphData.edges}
        selectedNode={selectedNode}
        onSelect={setSelected}
        theme={theme}
      />
      <DetailPanel
        node={selectedNode}
        edges={graphData.edges}
        allNodes={graphData.nodes}
      />
    </div>
  )
}
