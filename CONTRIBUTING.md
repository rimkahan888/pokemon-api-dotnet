# Contributing

Thanks for improving the Pokémon Data Explorer. Keep each change small enough to review on its own.

## Setup

Clone the repository and follow the run instructions in the [README](README.md).

```bash
git clone https://github.com/rimkahan888/pokemon-api-dotnet.git
cd pokemon-api-dotnet
dotnet test PokemonApi.sln
cd pokemon-ui && npm ci && npm test && npm run build
```

The API listens on `http://localhost:5010`. The Vue dev server proxies `/api` to that address.

## Pull requests

- Branch from `main` and limit the diff to one logical change.
- Use a conventional-commit title such as `fix(api): reject pages past the catalog`.
- Explain what changed and why in the pull request body.
- Run `dotnet test PokemonApi.sln` for API changes.
- Run `npm test` and `npm run build` in `pokemon-ui` for frontend changes.
- Update the README or `docs/` when setup or behavior changes.

## Project layout

- `PokemonApi` — ASP.NET Core API, PokéAPI client, and caching
- `PokemonApi.Tests` — xUnit tests
- `pokemon-ui` — Vue 3 + Vite frontend
- `docs` — roadmap and supporting guides
