# Talent Graph — Curation Rubric V1

**Purpose:** Standardize how the first 1,000 Person nodes are manually evaluated and scored before being promoted to the "reviewed" tier of the graph. Each reviewer assigns scores across five dimensions. Scores are 0–10 (integers or one decimal place). A weighted composite score is computed automatically.

---

## Composite Score Formula

```
composite_score = (
    pedigree_score      × 0.25 +
    trajectory_score    × 0.30 +
    publication_score   × 0.15 +
    founder_likelihood  × 0.20 +
    data_confidence     × 0.10
)
```

Nodes with a composite score ≥ 7.0 are flagged as **Tier 1** (high-priority for enrichment and outreach). Nodes 5.0–6.9 are **Tier 2**. Below 5.0 are **Tier 3** (deprioritized).

---

## Dimension 1 — Institutional Pedigree (`pedigree_score`)

*Weight: 25%*

Measures the prestige and relevance of the institutions (universities, labs, companies) where the person has trained or worked.

| Score | Criteria |
|-------|----------|
| 9–10  | PhD or postdoc from a globally top-10 CS/STEM university (MIT, Stanford, CMU, Oxford, ETH Zürich, etc.) **or** faculty at such an institution **or** founding team / early employee at a category-defining company (Google, DeepMind, OpenAI, Stripe, Palantir, etc.) |
| 7–8   | Degree from a top-50 global university **or** senior role at a well-funded scale-up (Series B+) in a relevant sector |
| 5–6   | Degree from a solid regional university **or** mid-level role at a known company in the sector |
| 3–4   | Degree from an unranked institution **or** role at a company with minimal public profile |
| 1–2   | No verifiable institutional history |
| 0     | Data missing or unresolvable |

**Reviewer notes:** Score the single strongest institution in the person's history, not an average. If a person has a weak undergrad but a top-5 PhD, score based on the PhD.

---

## Dimension 2 — Trajectory Signal (`trajectory_score`)

*Weight: 30%*

Measures career momentum: rate of progression, quality of transitions, and whether the arc points toward founding.

| Score | Criteria |
|-------|----------|
| 9–10  | Clear upward arc with 2+ step-changes in role or scope in the last 5 years; moved from IC → tech lead → founding role **or** repeated pattern of joining early-stage teams before they scaled |
| 7–8   | Consistent upward progression; reached senior/staff/principal level within 5–7 years of graduation; history of joining companies pre-Series A |
| 5–6   | Moderate progression; lateral moves visible but overall heading upward; no obvious stagnation |
| 3–4   | Mostly lateral moves; long tenures with no title progression; or gaps unexplained by public data |
| 1–2   | Downward moves (e.g., director → manager) or very slow progression over 5+ years |
| 0     | Insufficient data to assess |

**Reviewer notes:** Do not penalize people who spent time in academia (postdoc, faculty). Score the non-academic track or note "academic track" in review_notes.

---

## Dimension 3 — Publication Record (`publication_score`)

*Weight: 15%*

Measures research output quality and relevance to the sectors the Talent Graph cares about (AI/ML, biotech, climate tech, fintech infrastructure, defense tech).

| Score | Criteria |
|-------|----------|
| 9–10  | 10+ papers; at least 3 in top venues (NeurIPS, ICML, Nature, Science, Cell, etc.); h-index ≥ 15 or total citations ≥ 1,000 |
| 7–8   | 5–9 papers; at least 1 in a top venue; h-index ≥ 8 or citations ≥ 300 |
| 5–6   | 2–4 papers; workshop papers or regional conferences; modest citations |
| 3–4   | 1 paper or preprints only; < 50 citations |
| 1–2   | No publications but patents exist (note in review_notes) |
| 0     | No publications, no patents; or person is purely non-technical (score 0 and note) |

**Reviewer notes:** For purely commercial founders with no publications, score 0 and compensate via trajectory and pedigree. Do not penalize non-academics as long as it is noted.

---

## Dimension 4 — Founder Likelihood (`founder_likelihood`)

*Weight: 20%*

Estimates the probability that this person will found a company within the next 3 years, or has already founded one. This is a predictive score, not a historical one.

| Score | Criteria |
|-------|----------|
| 9–10  | Already a founder **or** all three present: (a) strong pedigree, (b) recently left a large company / academia, (c) publicly exploring ideas (tweets, blog posts, angel investing) |
| 7–8   | Two of the three signals above; or has previously co-founded (even if company failed) |
| 5–6   | One strong founding signal (e.g., angel investor, side project with traction, advisor to startups) |
| 3–4   | Works in a role that commonly precedes founding (e.g., PM, BD at early-stage company) but no explicit signals |
| 1–2   | Long tenure at a large company with no side activity visible; no public founding intent |
| 0     | Active academic with no commercial activity visible |

**Reviewer notes:** Check LinkedIn "Open to" section, Twitter/X bio, AngelList profile, and recent GitHub activity for signals.

---

## Dimension 5 — Data Confidence (`data_confidence`)

*Weight: 10%*

Measures the completeness and verifiability of the data we have for this node. This is a meta-score about the quality of our information, not about the person themselves.

| Score | Criteria |
|-------|----------|
| 9–10  | LinkedIn URL verified + GitHub verified + 2+ publications with DOIs + employment history complete with dates |
| 7–8   | LinkedIn verified + at least one of: GitHub, publications, or company affiliation with dates |
| 5–6   | LinkedIn verified but minimal additional data; or strong secondary source (e.g., company website bio) without LinkedIn |
| 3–4   | Name + company only; no profile URLs; employment dates missing |
| 1–2   | Only a name; no verifiable secondary sources |
| 0     | Conflicting or potentially incorrect data (flag for deduplication) |

---

## Reviewer Workflow

1. Open the person's profile using available URLs (LinkedIn, GitHub, Google Scholar).
2. Fill in all columns in `data/node-intake-template.csv`.
3. Score each of the five dimensions independently — do not anchor on one dimension when scoring another.
4. Write a 1–3 sentence note in `review_notes` explaining your highest and lowest scores.
5. Set `manually_reviewed = true` and record your initials in `reviewer_id`.
6. Flag any suspected duplicates by setting `duplicate_of` to the existing node ID.

## Edge Cases

- **Non-technical founders** (e.g., CEO with MBA): Score `publication_score = 0`, compensate with trajectory and pedigree if warranted. Note "non-technical" in review_notes.
- **Stealth founders**: Score `founder_likelihood` based on indirect signals. Note "stealth signals" in review_notes.
- **Pseudonymous individuals**: Score `data_confidence ≤ 3`. Escalate to the data lead before publishing the node.
- **Deceased individuals** (historical nodes): Set `is_current = false` on all edges. Score normally based on historical record.
