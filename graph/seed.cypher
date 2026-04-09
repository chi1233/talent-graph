// ============================================================
// Talent Graph V1 — Seed Script (3 example nodes)
// Run after schema.cypher has been applied.
// ============================================================

// ------------------------------------------------------------
// 1. Geographic Clusters
// ------------------------------------------------------------
MERGE (sf:GeographicCluster {id: "geo-001"})
SET sf.name    = "Bay Area",
    sf.country = "USA",
    sf.region  = "California",
    sf.lat     = 37.7749,
    sf.lon     = -122.4194;

MERGE (lon:GeographicCluster {id: "geo-002"})
SET lon.name    = "London Tech",
    lon.country = "UK",
    lon.region  = "Greater London",
    lon.lat     = 51.5074,
    lon.lon     = -0.1278;

// ------------------------------------------------------------
// 2. Institutions
// ------------------------------------------------------------
MERGE (mit:Institution {id: "inst-001"})
SET mit.name         = "Massachusetts Institute of Technology",
    mit.alias        = "MIT",
    mit.type         = "university",
    mit.country      = "USA",
    mit.city         = "Cambridge",
    mit.world_rank   = 1,
    mit.founded_year = 1861,
    mit.website_url  = "https://www.mit.edu";

MERGE (oxf:Institution {id: "inst-002"})
SET oxf.name         = "University of Oxford",
    oxf.alias        = "Oxford",
    oxf.type         = "university",
    oxf.country      = "UK",
    oxf.city         = "Oxford",
    oxf.world_rank   = 3,
    oxf.founded_year = 1096,
    oxf.website_url  = "https://www.ox.ac.uk";

// ------------------------------------------------------------
// 3. Companies
// ------------------------------------------------------------
MERGE (acme:Company {id: "co-001"})
SET acme.name          = "Acme AI",
    acme.stage         = "seed",
    acme.sector        = "deeptech",
    acme.founded_year  = 2022,
    acme.hq_city       = "San Francisco",
    acme.hq_country    = "USA",
    acme.total_raised_usd = 3500000;

// ------------------------------------------------------------
// 4. Publications
// ------------------------------------------------------------
MERGE (pub1:Publication {id: "pub-001"})
SET pub1.title          = "Scalable Graph Neural Networks for Talent Embedding",
    pub1.doi            = "10.1000/example.2023.001",
    pub1.venue          = "NeurIPS",
    pub1.year           = 2023,
    pub1.citation_count = 47;

// ------------------------------------------------------------
// 5. Person nodes (3 example people)
// ------------------------------------------------------------

// Person 1 — PhD researcher, likely founder
MERGE (alice:Person {id: "person-001"})
SET alice.name                = "Alice Chen",
    alice.email               = "alice.chen@example.com",
    alice.linkedin_url        = "https://linkedin.com/in/alicechen-example",
    alice.github_handle       = "alicechen-ml",
    alice.bio                 = "ML researcher specializing in graph neural networks. Former MIT PhD. Co-founder of Acme AI.",
    alice.created_at          = datetime(),
    alice.updated_at          = datetime(),
    alice.pedigree_score      = 9.0,
    alice.trajectory_score   = 8.5,
    alice.publication_score  = 7.0,
    alice.founder_likelihood = 9.5,
    alice.data_confidence    = 8.0,
    alice.composite_score    = 8.4,
    alice.manually_reviewed  = true,
    alice.review_notes       = "Strong signal: MIT PhD, published at NeurIPS, actively founding.";

// Person 2 — Senior engineer, not yet a founder
MERGE (bob:Person {id: "person-002"})
SET bob.name                = "Bob Okafor",
    bob.email               = "bob.okafor@example.com",
    bob.linkedin_url        = "https://linkedin.com/in/bobokafor-example",
    bob.github_handle       = "bokafor",
    bob.bio                 = "Staff engineer at a Series B fintech. Oxford CS graduate. Open-source contributor.",
    bob.created_at          = datetime(),
    bob.updated_at          = datetime(),
    bob.pedigree_score      = 7.5,
    bob.trajectory_score   = 7.0,
    bob.publication_score  = 2.0,
    bob.founder_likelihood = 5.5,
    bob.data_confidence    = 7.0,
    bob.composite_score    = 5.8,
    bob.manually_reviewed  = true,
    bob.review_notes       = "Good trajectory, but no founding history yet. Watch for job changes.";

// Person 3 — Academic with commercialization potential
MERGE (sara:Person {id: "person-003"})
SET sara.name                = "Sara Müller",
    sara.email               = "sara.muller@example.com",
    sara.linkedin_url        = "https://linkedin.com/in/saramuller-example",
    sara.bio                 = "Associate Professor of Computational Biology at MIT. Multiple patents. Advising Acme AI.",
    sara.created_at          = datetime(),
    sara.updated_at          = datetime(),
    sara.pedigree_score      = 9.5,
    sara.trajectory_score   = 8.0,
    sara.publication_score  = 9.0,
    sara.founder_likelihood = 7.0,
    sara.data_confidence    = 6.5,
    sara.composite_score    = 8.0,
    sara.manually_reviewed  = true,
    sara.review_notes       = "Academic star with IP. Likely to spin out in 2–3 years.";

// ------------------------------------------------------------
// 6. Edges
// ------------------------------------------------------------

// Alice — alumni of MIT (PhD)
MATCH (alice:Person {id: "person-001"}), (mit:Institution {id: "inst-001"})
MERGE (alice)-[r:ALUMNI_OF]->(mit)
SET r.degree     = "PhD",
    r.field      = "Machine Learning",
    r.start_year = 2017,
    r.end_year   = 2022;

// Bob — alumni of Oxford (BS)
MATCH (bob:Person {id: "person-002"}), (oxf:Institution {id: "inst-002"})
MERGE (bob)-[r:ALUMNI_OF]->(oxf)
SET r.degree     = "BS",
    r.field      = "Computer Science",
    r.start_year = 2014,
    r.end_year   = 2018;

// Sara — faculty at MIT
MATCH (sara:Person {id: "person-003"}), (mit:Institution {id: "inst-001"})
MERGE (sara)-[r:ALUMNI_OF]->(mit)
SET r.degree     = "Faculty",
    r.field      = "Computational Biology",
    r.start_year = 2019;

// Sara advised Alice
MATCH (alice:Person {id: "person-001"}), (sara:Person {id: "person-003"})
MERGE (alice)-[r:ADVISED_BY]->(sara)
SET r.context    = "PhD advisor",
    r.start_year = 2017,
    r.end_year   = 2022;

// Alice employed at Acme AI (founder)
MATCH (alice:Person {id: "person-001"}), (acme:Company {id: "co-001"})
MERGE (alice)-[r:EMPLOYED_AT]->(acme)
SET r.role        = "CEO & Co-Founder",
    r.start_year  = 2022,
    r.is_founder  = true,
    r.is_current  = true;

// Alice co-authored with Sara
MATCH (alice:Person {id: "person-001"}), (sara:Person {id: "person-003"})
MERGE (alice)-[r:CO_AUTHORED_WITH]->(sara)
SET r.publication_id = "pub-001",
    r.year           = 2023;

// Alice located in Bay Area
MATCH (alice:Person {id: "person-001"}), (sf:GeographicCluster {id: "geo-001"})
MERGE (alice)-[r:LOCATED_IN]->(sf)
SET r.since_year  = 2022,
    r.is_current  = true;

// Bob located in London
MATCH (bob:Person {id: "person-002"}), (lon:GeographicCluster {id: "geo-002"})
MERGE (bob)-[r:LOCATED_IN]->(lon)
SET r.since_year  = 2020,
    r.is_current  = true;

// Sara located in Bay Area
MATCH (sara:Person {id: "person-003"}), (sf:GeographicCluster {id: "geo-001"})
MERGE (sara)-[r:LOCATED_IN]->(sf)
SET r.since_year  = 2019,
    r.is_current  = true;

// ------------------------------------------------------------
// 7. Verify seed
// ------------------------------------------------------------
MATCH (p:Person) RETURN p.id, p.name, p.composite_score ORDER BY p.composite_score DESC;
