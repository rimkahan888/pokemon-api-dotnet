# Roadmap: C# + PokeAPI + Vue

This roadmap tracks delivered milestones and the next opportunities for incremental work.

## Completed milestones

### Milestone 0: Planning and repo hygiene
- [x] Define architecture and PR slicing strategy.
- [x] Establish naming, folder layout, and review conventions.

### Milestone 1: Backend foundation (C#)
- [x] Create .NET solution and API project.
- [x] Add basic health endpoint.
- [x] Add config structure for external API settings.

### Milestone 2: PokeAPI integration
- [x] Add typed client/service for PokéAPI.
- [x] Fetch Pokémon details and paginated lists.
- [x] Add retries, timeout handling, error handling, caching, and DTO mapping.

### Milestone 3: Frontend foundation (Vue)
- [x] Scaffold Vue app with a base page.
- [x] Add API service layer pointing to the backend.

### Milestone 4: End-to-end feature slice
- [x] Search for or select Pokémon and render detail data.
- [x] Browse a paginated Pokémon list.
- [x] Save favorites and browse the favorites collection.

### Milestone 5: Quality and polish
- [x] Add incremental backend and frontend tests.
- [x] Add loading, empty, and error states.
- [x] Add CI checks.

## Next opportunities

- Add server-side search and filters so queries span the complete PokéAPI catalog.
- Add richer favorite metadata and management without requiring a detail request.
- Continue improving responsive layout and accessibility based on usage.

## Pokémon team builder

- [x] Phase 1: Create and persist a six-Pokémon team with add/remove controls.
- [ ] Phase 2: Analyze type coverage and shared weaknesses.
- [ ] Phase 3: Polish team interactions and responsive/accessibility behavior.


