import { useEffect, useRef, useMemo, useState } from 'react'
import * as d3 from 'd3'

// Node type → CSS custom property holding its colour
const LABEL_VAR = {
  Person:            '--d-person',
  Institution:       '--d-inst',
  Company:           '--d-company',
  GeographicCluster: '--d-geo',
  Publication:       '--d-pub',
}

const LABEL_TEXT = {
  Person:            'Person',
  Institution:       'Institution',
  Company:           'Company',
  GeographicCluster: 'Geography',
  Publication:       'Publication',
}

// Person radius scales with composite score; other types are fixed
const BASE_RADIUS = {
  Person:            8,
  Institution:       13,
  Company:           12,
  GeographicCluster: 11,
  Publication:       8,
}

function radiusOf(n) {
  const base = BASE_RADIUS[n.label] ?? 9
  if (n.label !== 'Person' || n.composite_score == null) return base
  return base + (n.composite_score / 10) * 6
}

// Only the places get names on the canvas. People are identified by the
// inspector, by hover, and by the roster — labelling all of them buried
// the graph in text.
function isLabelled(n) {
  return n.label !== 'Person'
}

function colorOf(n) {
  const v = LABEL_VAR[n.label]
  return v ? `var(${v})` : 'var(--fg-4)'
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function opacityOf(n) {
  if (n.label !== 'Person' || n.composite_score == null) return 0.85
  return 0.4 + (n.composite_score / 10) * 0.55
}

export default function GraphCanvas({ nodes, edges, selectedNode, onSelect }) {
  const svgRef = useRef(null)
  // The hint is onboarding chrome — it retires once the graph has been used
  const [used, setUsed] = useState(false)
  const markUsed = useRef(() => {})
  markUsed.current = () => setUsed(u => u || true)
  const selRef = useRef(null)
  const declutterRef = useRef(() => {})
  const pinnedRef = useRef(new Set())
  // Zoom applied to fit the layout, and the radius compensation that undoes it
  const fitScaleRef = useRef(1)
  const compRef = useRef(1)

  // Keep the latest onSelect without restarting the simulation
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  const counts = useMemo(() => {
    const c = {}
    nodes.forEach(n => { c[n.label] = (c[n.label] || 0) + 1 })
    return c
  }, [nodes])

  useEffect(() => {
    if (!nodes.length || !svgRef.current) return

    const container = svgRef.current.parentElement
    const W = container.clientWidth
    const H = container.clientHeight

    fitScaleRef.current = 1
    compRef.current = 1

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', W).attr('height', H)

    const g = svg.append('g')

    let zoomTimer = null
    const zoom = d3.zoom()
      .scaleExtent([0.25, 4])
      .on('zoom', e => {
        if (e.sourceEvent) markUsed.current()
        g.attr('transform', e.transform)
        // Labels grow more slowly than the graph, so zooming in makes room for more of them
        g.selectAll('text').attr('font-size', 10 / Math.sqrt(fitScaleRef.current * e.transform.k))
        clearTimeout(zoomTimer)
        zoomTimer = setTimeout(() => declutterRef.current(), 90)
      })
    svg.call(zoom).on('dblclick.zoom', null)

    // D3 mutates its data, so work on copies
    const nodeData = nodes.map(n => ({ ...n }))
    const nodeById = new Map(nodeData.map(n => [n.id, n]))
    const edgeData = edges
      .map(e => ({ ...e, source: nodeById.get(e.source), target: nodeById.get(e.target) }))
      .filter(e => e.source && e.target)

    const sim = d3.forceSimulation(nodeData)
      // Spacing scales with the node sizes above, so the graph keeps the same
      // visual density rather than getting cramped
      .force('link',    d3.forceLink(edgeData).id(d => d.id).distance(92).strength(0.42))
      .force('charge',  d3.forceManyBody().strength(-250))
      .force('center',  d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide().radius(d => radiusOf(d) + 8))
      .force('x',       d3.forceX(W / 2).strength(0.09))
      .force('y',       d3.forceY(H / 2).strength(0.09))
      // Settle in ~3s rather than ~5s, so the fit-to-view lands promptly
      .alphaDecay(0.04)

    const link = g.append('g')
      .attr('stroke', 'var(--line-2)')
      .attr('stroke-opacity', 0.9)
      .selectAll('line')
      .data(edgeData).join('line')
      .attr('stroke-width', 1)

    link.append('title').text(d => d.type)

    const node = g.append('g')
      .selectAll('g')
      .data(nodeData).join('g')
      .attr('class', 'graph-node')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            markUsed.current()
            if (!event.active) sim.alphaTarget(0.25).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation()
        markUsed.current()
        onSelectRef.current(d)
      })

    svg.on('click', () => onSelectRef.current(null))

    // Pulse ring — expands out of the selected node, driven entirely by CSS
    node.append('circle')
      .attr('class', 'ping')
      .attr('r', d => radiusOf(d))
      .attr('fill', 'none')
      .attr('stroke', d => colorOf(d))
      .attr('stroke-width', 1.5)

    // Selection halo — drawn behind the node, sized in the update effect
    node.append('circle')
      .attr('class', 'halo')
      .attr('r', d => radiusOf(d) + 5)
      .attr('fill', 'none')
      .attr('stroke', d => colorOf(d))
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0)

    const dot = node.append('circle')
      .attr('class', 'dot')
      .attr('r', d => radiusOf(d))
      .attr('fill', d => colorOf(d))
      .attr('fill-opacity', d => opacityOf(d))
      .attr('stroke', 'var(--bg)')
      .attr('stroke-width', 1.5)

    // Nodes bloom in, biggest first, and the edges follow once they have landed
    if (!prefersReducedMotion()) {
      const order = [...nodeData].sort((a, b) => radiusOf(b) - radiusOf(a))
      const rank = new Map(order.map((d, i) => [d.id, i]))

      dot.attr('r', 0)
        .transition()
        .duration(460)
        .delay(d => 180 + rank.get(d.id) * 7)
        .ease(d3.easeCubicOut)
        .attr('r', d => radiusOf(d))

      link.attr('stroke-opacity', 0)
        .transition()
        .duration(600)
        .delay(520)
        .attr('stroke-opacity', 0.9)
    }

    const label = node.filter(isLabelled).append('text')
      .attr('dy', d => radiusOf(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', 'var(--fg-3)')
      .style('opacity', 0)
      .text(d => d.name || d.label)

    node.append('title').text(d => d.name || d.label)

    // Greedy label decluttering: bigger nodes win, anything that would collide
    // with an already-placed label is dropped. Re-run whenever the layout or
    // zoom level changes, never on every frame.
    declutterRef.current = () => {
      const pinned = pinnedRef.current
      const items = label.nodes()
        .map(el => ({ el, d: d3.select(el).datum() }))
        .filter(it => it.d && it.d.x != null)
        .sort((a, b) => {
          const pa = pinned.has(a.d.id) ? 1 : 0
          const pb = pinned.has(b.d.id) ? 1 : 0
          if (pa !== pb) return pb - pa
          return radiusOf(b.d) - radiusOf(a.d)
        })

      // Seed with the node circles so labels never sit on top of a node. Each
      // obstacle carries its node id: a label sits directly beneath its own
      // circle, so testing it against that circle would reject every label.
      const placed = nodeData
        .filter(d => d.x != null)
        .map(d => {
          const r = radiusOf(d) * compRef.current + 1
          return { id: d.id, x: d.x - r, y: d.y - r, r: d.x + r, b: d.y + r }
        })

      for (const { el, d } of items) {
        const bb = el.getBBox()
        const box = {
          id: d.id,
          x: d.x + bb.x - 3, y: d.y + bb.y - 2,
          r: d.x + bb.x + bb.width + 3, b: d.y + bb.y + bb.height + 2,
        }
        const clash = placed.some(p =>
          p.id !== d.id &&
          !(box.r < p.x || p.r < box.x || box.b < p.y || p.b < box.y))
        el.style.opacity = clash ? 0 : 1
        if (!clash) placed.push(box)
      }
    }

    let fitted = false
    const fitToView = () => {
      if (fitted || !nodeData.length) return
      fitted = true

      const xs = nodeData.map(d => d.x)
      const ys = nodeData.map(d => d.y)
      const pad = 46   // room for the labels that hang below each node
      const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad
      const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad

      const box = svgRef.current?.getBoundingClientRect()
      if (!box?.width) return

      const scale = Math.min(1, box.width / (maxX - minX), box.height / (maxY - minY))
      const t = d3.zoomIdentity
        .translate(box.width / 2 - scale * (minX + maxX) / 2,
                   box.height / 2 - scale * (minY + maxY) / 2)
        .scale(scale)

      // Zooming out to fit would shrink the nodes with everything else. Scale
      // the drawn radii back up by the same factor so they keep their intended
      // on-screen size. Clamped, because past ~1.5x the compensated circles
      // start eating the gaps that forceCollide reserved for them.
      fitScaleRef.current = scale
      const comp = Math.min(1 / scale, 1.5)
      compRef.current = comp

      node.select('.dot').attr('r', d => radiusOf(d) * comp)
      node.select('.ping').attr('r', d => radiusOf(d) * comp)
      node.select('.halo').attr('r', d => radiusOf(d) * comp + 5)
      label.attr('dy', d => (radiusOf(d) + 12) * comp)

      svg.transition().duration(600).ease(d3.easeCubicOut).call(zoom.transform, t)
    }

    let ticks = 0
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
      if (++ticks % 25 === 0) declutterRef.current()
    })
    sim.on('end', () => { fitToView(); declutterRef.current() })

    selRef.current = { node, link }

    // Keep the graph centred when the pane is resized
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      const h = entry.contentRect.height
      if (!w || !h) return
      svg.attr('width', w).attr('height', h)
      sim.force('center', d3.forceCenter(w / 2, h / 2))
      sim.force('x', d3.forceX(w / 2).strength(0.03))
      sim.force('y', d3.forceY(h / 2).strength(0.03))
      sim.alpha(0.2).restart()
    })
    ro.observe(container)

    return () => {
      clearTimeout(zoomTimer)
      ro.disconnect()
      sim.stop()
    }
  }, [nodes, edges])

  // Selection: highlight the node and dim everything it isn't connected to
  useEffect(() => {
    const sel = selRef.current
    if (!sel) return
    const id = selectedNode?.id

    const idOf = (v) => (v && typeof v === 'object' ? v.id : v)
    const neighbours = new Set()
    if (id) {
      neighbours.add(id)
      sel.link.each(d => {
        const s = idOf(d.source), t = idOf(d.target)
        if (s === id) neighbours.add(t)
        if (t === id) neighbours.add(s)
      })
    }

    // Drives the CSS pulse ring
    sel.node.classed('graph-node--on', d => d.id === id)

    sel.node.select('.halo')
      .attr('stroke-opacity', d => (d.id === id ? 0.9 : 0))

    sel.node.select('.dot')
      .attr('fill-opacity', d =>
        !id ? opacityOf(d) : neighbours.has(d.id) ? Math.max(opacityOf(d), 0.9) : opacityOf(d) * 0.28)

    sel.node.select('text')
      .attr('fill', d => (!id || neighbours.has(d.id) ? 'var(--fg-3)' : 'var(--fg-4)'))
      .attr('fill-opacity', d => (!id || neighbours.has(d.id) ? 1 : 0.35))

    // The selection and everything it touches always keeps its label
    pinnedRef.current = neighbours
    declutterRef.current()

    sel.link
      .attr('stroke-opacity', d => {
        if (!id) return 0.9
        return idOf(d.source) === id || idOf(d.target) === id ? 1 : 0.2
      })
      .attr('stroke', d => {
        if (!id) return 'var(--line-2)'
        return idOf(d.source) === id || idOf(d.target) === id ? 'var(--fg-3)' : 'var(--line-2)'
      })
  }, [selectedNode, nodes])

  const legendTypes = Object.keys(LABEL_VAR).filter(l => counts[l])

  return (
    <div className={`canvas${used ? ' canvas--used' : ''}`}>
      <svg ref={svgRef} role="img" aria-label="Talent graph" />

      {legendTypes.length > 0 && (
        <div className="canvas-card legend">
          {legendTypes.map(label => (
            <div key={label} className="legend__row">
              <span className="legend__dot" style={{ background: `var(${LABEL_VAR[label]})` }} />
              <span className="legend__label">{LABEL_TEXT[label]}</span>
              <span className="legend__count">{counts[label]}</span>
            </div>
          ))}
        </div>
      )}

      {nodes.length === 0 && (
        <div className="canvas-empty">Loading graph…</div>
      )}

      <div className="canvas-card canvas-hint">
        <span><kbd>scroll</kbd>zoom</span>
        <span><kbd>drag</kbd>pan</span>
        <span><kbd>click</kbd>inspect</span>
      </div>
    </div>
  )
}
