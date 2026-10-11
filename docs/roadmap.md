# Roadmap: C# + PokeAPI + Vue

This roadmap intentionally breaks delivery into small, gradual milestones.

## Milestone 0: Planning and repo hygiene

- Define architecture and PR slicing strategy.
- Establish naming, folder layout, and review conventions.

## Milestone 1: Backend foundation (C#)

- Create .NET solution and API project.
- Add basic health endpoint.
- Add config structure for external API settings.

## Milestone 2: PokeAPI integration

- Add typed client/service for PokeAPI.
- Start with one endpoint (for example: Pokémon by name).
- Add error handling and DTO mapping.

## Milestone 3: Frontend foundation (Vue)

- Scaffold Vue app.
- Add basic routing and layout.
- Add API service layer pointing to backend.

## Milestone 4: End-to-end feature slice

- UI to search/select Pokémon.
- Backend endpoint calls PokeAPI and returns normalized response.
- Frontend renders selected Pokémon data.

## Milestone 5: Quality and polish

- Add incremental tests for backend and frontend.
- Improve UX/loading/error states.
- Add CI checks once code exists.
