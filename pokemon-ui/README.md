# Pokémon Data Explorer frontend

This Vue 3 application uses Vite and TypeScript to browse a paginated Pokémon list, search by name or ID, and view Pokémon details and favorites. Screenshots of the animated explorer are in the repository [Gallery](../README.md#gallery).

## Requirements

Use a Node.js version supported by `package.json`: `^22.18.0` or `>=24.12.0`.

## Development

Start the backend API from the repository root in a separate terminal:

```sh
dotnet run --project PokemonApi
```

Then start the frontend:

```sh
npm ci
npm run dev
```

Vite proxies `/api/*` requests to `http://localhost:5010`. The backend provides the Pokémon endpoints and `/health`.

## Checks

```sh
npm run build
npm test
```

The build type-checks the Vue/TypeScript project and creates a production Vite bundle. Tests run with Vitest.
