# Pokémon Data Explorer

Planning-first project to build a C# backend integrated with PokéAPI and a Vue frontend.

## Stack
- Backend: ASP.NET Core Web API
- External API integration: [PokéAPI](https://pokeapi.co/)
- Frontend: Vue 3 + Vite + TypeScript

## Features (MVP)
- Search Pokémon by name or ID
- Paginated Pokémon list
- Pokémon detail panel (types, abilities, stats, sprite)
- Backend caching and retry/timeout handling for PokéAPI calls
- Loading/error states in frontend

## Incremental planning docs
- `docs/roadmap.md`
- `docs/pr-plan.md`

## Project Structure
- `PokemonApi.sln` – Root .NET solution
- `PokemonApi` – C# backend
- `PokemonApi.Tests` – C# unit test suite
- `pokemon-ui` – Vue frontend

## Run Locally

### 1) Backend API & Tests
```bash
# Build and run tests
dotnet test PokemonApi.sln

# Run backend API
dotnet run --project PokemonApi
```
Backend listens on `http://localhost:5010` in development.
The health check is available at `GET /health`.

### 2) Frontend
```bash
cd pokemon-ui
npm ci
npm run dev
```
Frontend runs on Vite and proxies `/api/*` requests to `http://localhost:5010`; start the backend in a separate terminal first. Run frontend checks with `npm run build` and `npm test` from `pokemon-ui`.

## API Endpoints
- `GET /health`
- `GET /api/pokemon/{nameOrId}`
- `GET /api/pokemon?page={n}&size={m}`
