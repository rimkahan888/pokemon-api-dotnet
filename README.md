# Pokémon Data Explorer

A full-stack app with a C# backend API and Vue frontend that fetches Pokémon data from [PokéAPI](https://pokeapi.co/).

## Stack
- Backend: ASP.NET Core Web API
- Frontend: Vue 3 + Vite + TypeScript

## Features (MVP)
- Search Pokémon by name or ID
- Paginated Pokémon list
- Pokémon detail panel (types, abilities, stats, sprite)
- Backend caching and retry/timeout handling for PokéAPI calls
- Loading/error states in frontend

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
