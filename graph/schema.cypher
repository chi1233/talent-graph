// ============================================================
// Talent Graph V1 — Neo4j Schema Definition
// ============================================================

// ------------------------------------------------------------
// CONSTRAINTS & INDEXES
// ------------------------------------------------------------

// Person
CREATE CONSTRAINT person_id_unique IF NOT EXISTS
FOR (p:Person) REQUIRE p.id IS UNIQUE;

CREATE INDEX person_name IF NOT EXISTS
FOR (p:Person) ON (p.name);

CREATE INDEX person_email IF NOT EXISTS
FOR (p:Person) ON (p.email);

// Institution
CREATE CONSTRAINT institution_id_unique IF NOT EXISTS
FOR (i:Institution) REQUIRE i.id IS UNIQUE;

CREATE INDEX institution_name IF NOT EXISTS
FOR (i:Institution) ON (i.name);

// Company
CREATE CONSTRAINT company_id_unique IF NOT EXISTS
FOR (c:Company) REQUIRE c.id IS UNIQUE;

CREATE INDEX company_name IF NOT EXISTS
FOR (c:Company) ON (c.name);

// Publication
CREATE CONSTRAINT publication_id_unique IF NOT EXISTS
FOR (pub:Publication) REQUIRE pub.id IS UNIQUE;

CREATE INDEX publication_doi IF NOT EXISTS
FOR (pub:Publication) ON (pub.doi);

// GeographicCluster
CREATE CONSTRAINT geo_id_unique IF NOT EXISTS
FOR (g:GeographicCluster) REQUIRE g.id IS UNIQUE;

CREATE INDEX geo_name IF NOT EXISTS
FOR (g:GeographicCluster) ON (g.name);


// ------------------------------------------------------------
// NODE TYPE DEFINITIONS (documented as comments)
// ------------------------------------------------------------

// (:Person)
//   id             String  — stable internal UUID
//   name           String  — full display name
//   email          String? — primary contact email
//   linkedin_url   String? — LinkedIn profile URL
//   twitter_handle String? — Twitter/X handle (no @)
//   github_handle  String? — GitHub username
//   bio            String? — short professional bio
//   created_at     DateTime
//   updated_at     DateTime
//   pedigree_score      Float? — 0–10, institutional pedigree
//   trajectory_score    Float? — 0–10, career trajectory signal
//   publication_score   Float? — 0–10, publication record
//   founder_likelihood  Float? — 0–10, probability of founding a company
//   data_confidence     Float? — 0–10, completeness/quality of data
//   composite_score     Float? — weighted aggregate of above scores
//   manually_reviewed   Boolean
//   review_notes        String?

// (:Institution)
//   id           String  — stable internal UUID
//   name         String  — official institution name
//   alias        String? — common short name (e.g. "MIT", "Stanford")
//   type         String  — ENUM: university | research_lab | think_tank | gov_agency
//   country      String
//   city         String?
//   world_rank   Integer? — e.g. QS or THE ranking
//   founded_year Integer?
//   website_url  String?

// (:Company)
//   id            String  — stable internal UUID
//   name          String  — legal entity name
//   alias         String? — common trade name
//   stage         String  — ENUM: idea | pre_seed | seed | series_a | series_b | growth | public | acquired | defunct
//   sector        String  — primary sector (e.g. "biotech", "fintech", "deeptech")
//   founded_year  Integer?
//   hq_city       String?
//   hq_country    String
//   crunchbase_url String?
//   website_url   String?
//   total_raised_usd Integer?

// (:Publication)
//   id              String  — stable internal UUID
//   title           String
//   doi             String? — Digital Object Identifier
//   arxiv_id        String?
//   venue           String? — journal or conference name
//   year            Integer
//   citation_count  Integer?
//   abstract        String?
//   url             String?

// (:GeographicCluster)
//   id       String  — stable internal UUID
//   name     String  — cluster name (e.g. "Bay Area", "London Tech", "Bangalore")
//   country  String
//   region   String? — state / province
//   lat      Float?
//   lon      Float?


// ------------------------------------------------------------
// EDGE TYPE DEFINITIONS
// ------------------------------------------------------------

// (:Person)-[:EMPLOYED_AT]->(:Company)
//   role         String  — job title
//   start_year   Integer
//   end_year     Integer? — null if current
//   is_founder   Boolean — true if the person co-founded the company
//   is_current   Boolean

// (:Person)-[:ADVISED_BY]->(:Person)
//   context      String? — e.g. "PhD advisor", "postdoc supervisor"
//   start_year   Integer?
//   end_year     Integer?

// (:Person)-[:CO_FOUNDED_WITH]->(:Person)
//   company_id   String  — references Company node
//   founded_year Integer

// (:Person)-[:CO_AUTHORED_WITH]->(:Person)
//   publication_id String  — references Publication node
//   year           Integer

// (:Person)-[:ALUMNI_OF]->(:Institution)
//   degree       String  — ENUM: BS | MS | MBA | PhD | Postdoc | Faculty | Other
//   field        String? — field of study
//   start_year   Integer?
//   end_year     Integer?
//   thesis_title String?

// (:Person)-[:LOCATED_IN]->(:GeographicCluster)
//   since_year   Integer?
//   is_current   Boolean
