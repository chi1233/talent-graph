# Talent Graph

A platform for mapping talent networks and surfacing high-potential individuals — researchers, engineers, and operators who are likely to found companies or join founding teams.

The core data store is a Neo4j property graph. A FastAPI layer sits on top for read access. Manual curation drives the first 1,000 nodes using a structured scoring rubric.

---

## Folder Structure

```
talent-graph/
├── api/                  # FastAPI application
│   ├── main.py           # Route handlers (person/:id, /search, /signals/founders)
│   └── requirements.txt  # Python dependencies
│
├── data/                 # Raw and curated data artifacts
│   └── node-intake-template.csv   # CSV template for manual node intake
│
├── docs/                 # Human-readable documentation
│   └── curation-rubric.md         # Scoring criteria for the first 1,000 nodes
│
├── frontend/             # (placeholder) UI layer — not yet implemented
│
├── graph/                # Neo4j schema and seed data
│   ├── schema.cypher     # Constraints, indexes, and node/edge type documentation
│   └── seed.cypher       # 3 example nodes + edges to validate the schema
│
├── models/               # (placeholder) ML models — not yet implemented
│
├── scripts/              # Utility scripts for ingestion and enrichment
│
└── README.md             # This file
```

---

## Graph Schema Overview

### Node Types

| Label              | Description |
|--------------------|-------------|
| `Person`           | The primary entity. Researchers, engineers, founders. |
| `Institution`      | Universities, research labs, government agencies. |
| `Company`          | Startups and established companies. |
| `Publication`      | Academic papers and preprints. |
| `GeographicCluster`| City-level talent hubs (Bay Area, London, etc.). |

### Edge Types

| Relationship        | From → To            | Key Properties |
|---------------------|----------------------|----------------|
| `EMPLOYED_AT`       | Person → Company     | role, is_founder, is_current |
| `ADVISED_BY`        | Person → Person      | context (PhD advisor, etc.) |
| `CO_FOUNDED_WITH`   | Person → Person      | company_id, founded_year |
| `CO_AUTHORED_WITH`  | Person → Person      | publication_id, year |
| `ALUMNI_OF`         | Person → Institution | degree, field, start_year, end_year |
| `LOCATED_IN`        | Person → GeographicCluster | since_year, is_current |

### Scoring Model

Each Person node carries five scores (0–10) that feed a weighted composite:

| Dimension            | Weight | What it measures |
|----------------------|--------|-----------------|
| `pedigree_score`     | 25%    | Prestige of institutions and employers |
| `trajectory_score`   | 30%    | Speed and quality of career progression |
| `publication_score`  | 15%    | Research output and citation impact |
| `founder_likelihood` | 20%    | Probability of founding in the next 3 years |
| `data_confidence`    | 10%    | Completeness of our data on this person |

See [docs/curation-rubric.md](docs/curation-rubric.md) for full scoring criteria.

---

## Running the Graph Locally

### Prerequisites

- [Neo4j Desktop](https://neo4j.com/download/) ≥ 5.x **or** Neo4j via Docker
- Python ≥ 3.11

### 1. Start Neo4j

**Docker (recommended):**

```bash
docker run \
  --name talent-graph-neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/changeme \
  neo4j:5
```

Open the browser UI at `http://localhost:7474` and log in with `neo4j / changeme`.

### 2. Apply the Schema

In the Neo4j Browser, run the contents of `graph/schema.cypher` — either paste the file directly or use `:play` with a local file.

### 3. Load Seed Data

Run `graph/seed.cypher` in the same way. You should see 3 Person nodes, 2 Institutions, 1 Company, 1 Publication, and 2 GeographicClusters.

**Verify:**

```cypher
MATCH (p:Person) RETURN p.name, p.composite_score ORDER BY p.composite_score DESC;
```

Expected output:

| p.name      | p.composite_score |
|-------------|-------------------|
| Alice Chen  | 8.4               |
| Sara Müller | 8.0               |
| Bob Okafor  | 5.8               |

### 4. Run the API

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

The API is now available at `http://localhost:8000`.

Interactive docs: `http://localhost:8000/docs`

**Example requests:**

```bash
# Get a person by ID
curl http://localhost:8000/person/person-001

# Search by name
curl "http://localhost:8000/search?q=alice"

# Top founder signals
curl "http://localhost:8000/signals/founders?min_founder_likelihood=7.0"
```

> **Note:** The API currently returns stub data. Wire it to Neo4j by uncommenting the driver code in `api/main.py` and setting `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` as environment variables.

---

## Adding New Nodes

1. Copy `data/node-intake-template.csv` and fill in one row per person.
2. Score each person using the [curation rubric](docs/curation-rubric.md).
3. Set `manually_reviewed = TRUE` and fill in `reviewer_id`.
4. Run the import script (TBD in `scripts/`) to upsert nodes into Neo4j via `MERGE`.

---

## Roadmap

- [ ] `scripts/import_csv.py` — bulk CSV → Neo4j upsert
- [ ] `scripts/enrich.py` — LinkedIn / GitHub API enrichment
- [ ] `models/` — ML model to predict `founder_likelihood` from graph features
- [ ] `frontend/` — Search and exploration UI
- [ ] Authentication layer on the API
- [ ] Webhook / notification when a Tier 1 node changes jobs
