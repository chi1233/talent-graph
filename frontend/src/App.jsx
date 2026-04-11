import { useState, useEffect, useCallback, useMemo } from 'react'
import * as React from 'react'
import { fetchGraph, searchPersons, isUsingMock, connectionReady, setActiveDataset } from './lib/neo4j.js'
import { mockNodes } from './lib/mockData.js'
import { mockSafetyNodes } from './lib/mockDataSafety.js'
import { computeOverlap } from './lib/overlap.js'
import TopBar from './components/TopBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import GraphCanvas from './components/GraphCanvas.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import ComparePanel from './components/ComparePanel.jsx'

// Expose React for ComparePanel's useState (used in overlay component)
window.React = React

export default function App() {
  const [theme, setTheme]             = useState('dark')
  const [query, setQuery]             = useState('')
  const [selectedNode, setSelected]   = useState(null)
  const [graphData, setGraphData]     = useState({ nodes: [], edges: [] })
  const [filteredNodes, setFiltered]  = useState([])
  const [connectionStatus, setStatus] = useState('connecting')

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

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Load graph once connection is resolved (or re-load on dataset switch)
  useEffect(() => {
    setSelected(null)
    setQuery('')
    setTier('')
    setGeo('')

    connectionReady.then(async () => {
      setStatus(isUsingMock() ? 'mock' : 'live')
      setActiveDataset(dataset)
      const data = await fetchGraph()
      setGraphData(data)
      setFiltered(data.nodes.filter(n => n.label === 'Person'))
    })
  }, [dataset])

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

  const handleDatasetToggle = useCallback((ds) => {
    if (ds !== dataset) setDataset(ds)
  }, [dataset])

  const handleCompareToggle = useCallback(() => {
    setCompareMode(m => !m)
  }, [])

  return (
    <div className="app">
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
        theme={theme}
        dataset={dataset}
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
