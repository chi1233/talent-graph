"""
Talent Graph API — V1
FastAPI application providing read access to the Neo4j talent graph.
"""

from __future__ import annotations

from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

app = FastAPI(
    title="Talent Graph API",
    description="Query talent network data from the Neo4j graph.",
    version="0.1.0",
)


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class PersonSummary(BaseModel):
    id: str
    name: str
    composite_score: Optional[float] = None
    founder_likelihood: Optional[float] = None
    current_role: Optional[str] = None
    current_company: Optional[str] = None


class PersonDetail(PersonSummary):
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_handle: Optional[str] = None
    bio: Optional[str] = None
    pedigree_score: Optional[float] = None
    trajectory_score: Optional[float] = None
    publication_score: Optional[float] = None
    data_confidence: Optional[float] = None
    manually_reviewed: Optional[bool] = None
    review_notes: Optional[str] = None


class SearchResult(BaseModel):
    total: int
    results: list[PersonSummary]


class FounderSignal(BaseModel):
    id: str
    name: str
    founder_likelihood: float
    composite_score: float
    pedigree_score: Optional[float] = None
    trajectory_score: Optional[float] = None
    review_notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Neo4j driver setup
# ---------------------------------------------------------------------------
# Replace with actual credentials. In production, load from environment
# variables (e.g., via python-dotenv or a secrets manager).
#
# from neo4j import GraphDatabase
#
# NEO4J_URI      = os.getenv("NEO4J_URI", "bolt://localhost:7687")
# NEO4J_USER     = os.getenv("NEO4J_USER", "neo4j")
# NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
#
# driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def _get_db_session():
    """Return a Neo4j session. Placeholder — replace with real driver."""
    raise NotImplementedError("Connect a real Neo4j driver before using this.")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    """Liveness probe."""
    return {"status": "ok", "version": app.version}


@app.get(
    "/person/{person_id}",
    response_model=PersonDetail,
    summary="Get a single person by ID",
)
def get_person(person_id: str):
    """
    Retrieve full details for a Person node by its stable internal ID.

    Returns 404 if the person is not found.
    """
    # TODO: replace stub with real Neo4j query:
    #
    # with driver.session() as session:
    #     result = session.run(
    #         "MATCH (p:Person {id: $id}) RETURN p",
    #         id=person_id,
    #     )
    #     record = result.single()
    #     if record is None:
    #         raise HTTPException(status_code=404, detail="Person not found")
    #     node = record["p"]
    #     return PersonDetail(**dict(node))

    # Stub response for development
    if person_id == "person-001":
        return PersonDetail(
            id="person-001",
            name="Alice Chen",
            composite_score=8.4,
            founder_likelihood=9.5,
            current_role="CEO & Co-Founder",
            current_company="Acme AI",
            email="alice.chen@example.com",
            linkedin_url="https://linkedin.com/in/alicechen-example",
            github_handle="alicechen-ml",
            bio="ML researcher specializing in graph neural networks.",
            pedigree_score=9.0,
            trajectory_score=8.5,
            publication_score=7.0,
            data_confidence=8.0,
            manually_reviewed=True,
            review_notes="Strong signal: MIT PhD, published at NeurIPS, actively founding.",
        )
    raise HTTPException(status_code=404, detail=f"Person '{person_id}' not found")


@app.get(
    "/search",
    response_model=SearchResult,
    summary="Full-text and filtered person search",
)
def search_persons(
    q: Optional[str] = Query(None, description="Free-text search across name and bio"),
    min_score: Optional[float] = Query(None, ge=0, le=10, description="Minimum composite_score"),
    sector: Optional[str] = Query(None, description="Filter by current company sector"),
    degree: Optional[str] = Query(None, description="Filter by highest degree (PhD, MS, BS, etc.)"),
    geo: Optional[str] = Query(None, description="Filter by GeographicCluster name"),
    reviewed_only: bool = Query(False, description="Return only manually reviewed nodes"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Search and filter Person nodes.

    Supports free-text search plus structured filters. All filters are ANDed.
    Results are ordered by composite_score descending.
    """
    # TODO: replace stub with real Neo4j full-text + filter query:
    #
    # cypher = """
    #     CALL db.index.fulltext.queryNodes('person_search', $q) YIELD node AS p, score
    #     WHERE ($min_score IS NULL OR p.composite_score >= $min_score)
    #     AND   ($reviewed_only = false OR p.manually_reviewed = true)
    #     RETURN p
    #     ORDER BY p.composite_score DESC
    #     SKIP $offset LIMIT $limit
    # """
    # ...

    # Stub response for development
    stub_results = [
        PersonSummary(
            id="person-001",
            name="Alice Chen",
            composite_score=8.4,
            founder_likelihood=9.5,
            current_role="CEO & Co-Founder",
            current_company="Acme AI",
        ),
        PersonSummary(
            id="person-003",
            name="Sara Müller",
            composite_score=8.0,
            founder_likelihood=7.0,
            current_role="Associate Professor",
            current_company="MIT",
        ),
    ]

    # Apply stub filters
    if min_score is not None:
        stub_results = [r for r in stub_results if (r.composite_score or 0) >= min_score]
    if q:
        q_lower = q.lower()
        stub_results = [r for r in stub_results if q_lower in r.name.lower()]

    return SearchResult(total=len(stub_results), results=stub_results[offset: offset + limit])


@app.get(
    "/signals/founders",
    response_model=list[FounderSignal],
    summary="Top founder-likelihood signals",
)
def get_founder_signals(
    min_founder_likelihood: float = Query(7.0, ge=0, le=10),
    min_composite_score: float = Query(6.0, ge=0, le=10),
    reviewed_only: bool = Query(True),
    limit: int = Query(50, ge=1, le=200),
):
    """
    Return people with high founder likelihood scores, sorted by
    founder_likelihood descending then composite_score descending.

    Useful for generating weekly "who to watch" lists.
    """
    # TODO: replace stub with real Neo4j query:
    #
    # cypher = """
    #     MATCH (p:Person)
    #     WHERE p.founder_likelihood >= $min_fl
    #       AND p.composite_score    >= $min_cs
    #       AND ($reviewed_only = false OR p.manually_reviewed = true)
    #     RETURN p
    #     ORDER BY p.founder_likelihood DESC, p.composite_score DESC
    #     LIMIT $limit
    # """
    # ...

    # Stub response for development
    stub = [
        FounderSignal(
            id="person-001",
            name="Alice Chen",
            founder_likelihood=9.5,
            composite_score=8.4,
            pedigree_score=9.0,
            trajectory_score=8.5,
            review_notes="Strong signal: MIT PhD, published at NeurIPS, actively founding.",
        ),
        FounderSignal(
            id="person-003",
            name="Sara Müller",
            founder_likelihood=7.0,
            composite_score=8.0,
            pedigree_score=9.5,
            trajectory_score=8.0,
            review_notes="Academic star with IP. Likely to spin out in 2–3 years.",
        ),
    ]

    return [
        s for s in stub
        if s.founder_likelihood >= min_founder_likelihood
        and s.composite_score >= min_composite_score
    ][:limit]
