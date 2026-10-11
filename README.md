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
- `/home/runner/work/csharp1/csharp1/docs/roadmap.md`
- `/home/runner/work/csharp1/csharp1/docs/pr-plan.md`

## Project Structure
- `/home/runner/work/csharp1/csharp1/PokemonApi` – C# backend
- `/home/runner/work/csharp1/csharp1/pokemon-ui` – Vue frontend

## Run Locally

### 1) Backend API
```bash
cd /home/runner/work/csharp1/csharp1/PokemonApi
dotnet run
```
Backend listens on `http://localhost:5010` in development.

### 2) Frontend
```bash
cd /home/runner/work/csharp1/csharp1/pokemon-ui
npm install
npm run dev
```
Frontend runs on Vite and proxies `/api/*` requests to `http://localhost:5010`.

## API Endpoints
- `GET /api/pokemon/{nameOrId}`
- `GET /api/pokemon?page={n}&size={m}`
