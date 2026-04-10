import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

// Color map per node label
const LABEL_COLOR = {
  Person:           '#5b8ff9',
  Institution:      '#34d399',
  Company:          '#a78bfa',
  GeographicCluster:'#fbbf24',
  Publication:      '#f87171',
}

const LABEL_RADIUS = {
  Person:           10,
  Institution:      14,
  Company:          13,
  GeographicCluster:12,
  Publication:      8,
}

function nodeColor(n) { return LABEL_COLOR[n.label] || '#9097ae' }
function nodeRadius(n) { return LABEL_RADIUS[n.label] || 10 }

// Score drives opacity for Person nodes
function nodeOpacity(n) {
  if (n.label !== 'Person' || n.composite_score == null) return 0.8
  return 0.5 + (n.composite_score / 10) * 0.5
}

export default function GraphCanvas({ nodes, edges, selectedNode, onSelect, theme }) {
  const svgRef = useRef(null)
  const simRef = useRef(null)

  useEffect(() => {
    if (!nodes.length) return

    const container = svgRef.current.parentElement
    const W = container.clientWidth
    const H = container.clientHeight

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H)

    // Zoom layer
    const g = svg.append('g')
    svg.call(
      d3.zoom().scaleExtent([0.2, 4]).on('zoom', e => g.attr('transform', e.transform))
    )

    // Build working copies (D3 mutates them)
    const nodeData = nodes.map(n => ({ ...n }))
    const nodeById = new Map(nodeData.map(n => [n.id, n]))

    const edgeData = edges
      .map(e => ({ ...e, source: nodeById.get(e.source), target: nodeById.get(e.target) }))
      .filter(e => e.source && e.target)

    // Simulation
    const sim = d3.forceSimulation(nodeData)
      .force('link',   d3.forceLink(edgeData).id(d => d.id).distance(90).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide().radius(d => nodeRadius(d) + 6))
    simRef.current = sim

    // Edges
    const link = g.append('g').selectAll('line')
      .data(edgeData).join('line')
      .attr('stroke', 'var(--border)')
      .attr('stroke-width', 1.2)

    // Edge labels (shown on hover — simple title approach)
    link.append('title').text(d => d.type)

    // Nodes
    const node = g.append('g').selectAll('g')
      .data(nodeData).join('g')
      .attr('class', 'graph-node')
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )

    node.on('click', (event, d) => {
      event.stopPropagation()
      onSelect(d)
    })

    svg.on('click', () => onSelect(null))

    // Circle
    node.append('circle')
      .attr('r', d => nodeRadius(d))
      .attr('fill', d => nodeColor(d))
      .attr('fill-opacity', d => nodeOpacity(d))
      .attr('stroke', d => nodeColor(d))
      .attr('stroke-width', 2)

    // Label
    node.append('text')
      .attr('dy', d => nodeRadius(d) + 11)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', 'var(--text-2)')
      .text(d => d.name || d.label)

    node.append('title').text(d => d.name || d.label)

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => sim.stop()
  }, [nodes, edges])   // re-run only when data changes

  // Highlight selected node without restarting sim
  useEffect(() => {
    if (!svgRef.current) return
    d3.select(svgRef.current)
      .selectAll('.graph-node circle')
      .attr('stroke-width', d => d.id === selectedNode?.id ? 3.5 : 2)
      .attr('stroke-opacity', d => d.id === selectedNode?.id ? 1 : 0.7)
  }, [selectedNode])

  return (
    <div className="canvas-wrap">
      <svg ref={svgRef} />
      <div className="canvas-legend">
        {Object.entries(LABEL_COLOR).map(([label, color]) => (
          <div key={label} className="canvas-legend-item">
            <span className="canvas-legend-dot" style={{ background: color }} />
            <span className="canvas-legend-label">{label === 'GeographicCluster' ? 'Geographic Cluster' : label}</span>
          </div>
        ))}
      </div>
      <div className="canvas-hint">Scroll to zoom · Drag to pan · Click a node</div>
    </div>
  )
}
