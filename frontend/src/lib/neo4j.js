import neo4j from 'neo4j-driver'
import { mockNodes, mockEdges } from './mockData.js'

const URI  = import.meta.env.VITE_NEO4J_URI
const USER = import.meta.env.VITE_NEO4J_USER
const PASS = import.meta.env.VITE_NEO4J_PASSWORD

let driver = null
let _usingMock = true

export function isUsingMock() { return _usingMock }

async function initDriver() {
  if (!URI || !USER || !PASS) return false
  try {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS), {
      connectionTimeout: 4000,
      maxConnectionLifetime: 60000,
    })
    await driver.verifyConnectivity()
    _usingMock = false
    return true
  } catch {
    driver = null
    _usingMock = true
    return false
  }
}

// Kick off connection attempt immediately; components can await connectionReady
export const connectionReady = initDriver()

async function runQuery(cypher, params = {}) {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ })
  try {
    const result = await session.run(cypher, params)
    return result.records
  } finally {
    await session.close()
  }
}

// ─── fetchGraph ────────────────────────────────────────────────────────────
// Returns { nodes: [...], edges: [...] } in mock-compatible shape.

export async function fetchGraph() {
  await connectionReady
  if (_usingMock) return { nodes: mockNodes, edges: mockEdges }

  const records = await runQuery(`
    MATCH (n)
    WHERE n:Person OR n:Institution OR n:Company OR n:GeographicCluster
    OPTIONAL MATCH (n)-[r]->(m)
    WHERE m:Person OR m:Institution OR m:Company OR m:GeographicCluster
    RETURN n, r, m
  `)

  const nodeMap = new Map()
  const edges = []

  for (const rec of records) {
    const n = rec.get('n')
    if (n && !nodeMap.has(n.identity.toString())) {
      nodeMap.set(n.identity.toString(), shapeNode(n))
    }
    const m = rec.get('m')
    if (m && !nodeMap.has(m.identity.toString())) {
      nodeMap.set(m.identity.toString(), shapeNode(m))
    }
    const r = rec.get('r')
    if (r) {
      edges.push({
        id:     r.identity.toString(),
        source: r.start.toString(),
        target: r.end.toString(),
        type:   r.type,
        label:  r.properties.label || r.properties.role || r.type,
      })
    }
  }

  return { nodes: [...nodeMap.values()], edges }
}

// ─── fetchPerson ───────────────────────────────────────────────────────────

export async function fetchPerson(id) {
  await connectionReady
  if (_usingMock) return mockNodes.find(n => n.id === id) || null

  const records = await runQuery(
    'MATCH (p:Person {id: $id}) RETURN p',
    { id }
  )
  if (!records.length) return null
  return shapeNode(records[0].get('p'))
}

// ─── searchPersons ─────────────────────────────────────────────────────────

export async function searchPersons({ q = '', minScore = 0, tier, geo } = {}) {
  await connectionReady

  if (_usingMock) {
    return mockNodes
      .filter(n => n.label === 'Person')
      .filter(n => !q || n.name.toLowerCase().includes(q.toLowerCase()) ||
                       (n.role || '').toLowerCase().includes(q.toLowerCase()) ||
                       (n.company || '').toLowerCase().includes(q.toLowerCase()))
      .filter(n => (n.composite_score || 0) >= minScore)
      .filter(n => !tier || n.tier === tier)
      .filter(n => !geo || n.geo === geo)
  }

  const records = await runQuery(`
    MATCH (p:Person)
    WHERE ($q = '' OR toLower(p.name) CONTAINS toLower($q)
                   OR toLower(p.role) CONTAINS toLower($q)
                   OR toLower(p.company) CONTAINS toLower($q))
      AND p.composite_score >= $minScore
      AND ($tier IS NULL OR p.tier = $tier)
      AND ($geo  IS NULL OR p.geo  = $geo)
    RETURN p
    ORDER BY p.composite_score DESC
    LIMIT 100
  `, {
    q,
    minScore: neo4j.int(Math.round(minScore * 10)) / 10,
    tier:     tier  ? neo4j.int(tier) : null,
    geo:      geo   || null,
  })

  return records.map(r => shapeNode(r.get('p')))
}

// ─── fetchFounderSignals ───────────────────────────────────────────────────

export async function fetchFounderSignals({ minFounderLikelihood = 7.0 } = {}) {
  await connectionReady

  if (_usingMock) {
    return mockNodes
      .filter(n => n.label === 'Person' && (n.founder_likelihood || 0) >= minFounderLikelihood)
      .sort((a, b) => b.founder_likelihood - a.founder_likelihood)
  }

  const records = await runQuery(`
    MATCH (p:Person)
    WHERE p.founder_likelihood >= $min
    RETURN p ORDER BY p.founder_likelihood DESC
  `, { min: minFounderLikelihood })

  return records.map(r => shapeNode(r.get('p')))
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function shapeNode(neo4jNode) {
  const p = neo4jNode.properties
  const id = p.id || neo4jNode.identity.toString()
  const label = neo4jNode.labels[0] || 'Unknown'

  // Convert neo4j Integer objects to plain JS numbers
  const num = v => (neo4j.isInt(v) ? v.toNumber() : (typeof v === 'number' ? v : undefined))
  const float = v => (v !== undefined && v !== null ? parseFloat(v) : undefined)

  return {
    id,
    label,
    name:               p.name,
    role:               p.role,
    company:            p.company,
    composite_score:    float(p.composite_score),
    founder_likelihood: float(p.founder_likelihood),
    pedigree_score:     float(p.pedigree_score),
    trajectory_score:   float(p.trajectory_score),
    publication_score:  float(p.publication_score),
    data_confidence:    float(p.data_confidence),
    tier:               num(p.tier),
    linkedin_url:       p.linkedin_url,
    github_handle:      p.github_handle,
    bio:                p.bio,
    manually_reviewed:  p.manually_reviewed,
    review_notes:       p.review_notes,
    geo:                p.geo,
    degree:             p.degree || p.highest_degree,
    field:              p.field  || p.field_of_study,
    // Institution / Company extras
    type:               p.type,
    country:            p.country,
    world_rank:         num(p.world_rank),
    stage:              p.stage,
    sector:             p.sector,
    hq_city:            p.hq_city,
  }
}
