# Incremental PR Plan

Goal: maximize consistent, showcaseable daily activity with focused PRs.

## PR slicing rules

- Keep PRs small (prefer 1 logical change per PR).
- Include a clear title, scope, and acceptance criteria.
- Avoid mixing backend, frontend, and infra changes unless necessary.

## Delivered work

1. [x] **Planning docs** — Add roadmap and PR strategy documents.
2. [x] **.NET solution scaffold** — Add solution and API project skeleton.
3. [x] **Health endpoint** — Add `/health` endpoint and verification.
4. [x] **PokéAPI client contract** — Add interfaces and DTOs for integration boundary.
5. [x] **PokéAPI implementation** — Implement details and paginated list calls with mapping, caching, retries, and timeout handling.
6. [x] **Backend Pokémon endpoints** — Expose normalized detail and paginated list responses.
7. [x] **Vue scaffold** — Create Vue app structure and base page.
8. [x] **Frontend API integration** — Wire frontend service to backend Pokémon endpoints.
9. [x] **UX states and controls** — Add loading, empty, error, filtering, sorting, pagination, and detail states.
10. [x] **Testing and CI** — Add targeted backend/frontend tests and CI checks.
11. [x] **Favorites collection** — Browse saved favorites, open their details, and show an empty state.
12. [x] **Team builder, Phase 1** — Assemble and persist a team of up to six Pokémon.
13. [x] **Team builder, Phase 2** — Show type coverage and shared weaknesses, accounting for dual-type matchups.
14. [x] **Team builder, Phase 3** — Add accessible reorder controls and responsive team analysis layout.

## Next opportunities

- **Catalog-wide search** — Search across PokéAPI results rather than only the current page.
- **Favorite metadata** — Keep names and sprites available in the favorites collection without a current-page lookup.
- **Accessibility and responsive polish** — Continue refining keyboard and small-screen experiences.

## Definition of done per PR

- Scope is limited and reviewable.
- Basic validation for the touched area is complete.
- Documentation is updated when behavior/design changes.



- editing the latest version of the document 

