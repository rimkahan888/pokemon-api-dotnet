Paste this prompt into the other AI together with `FRONTEND_BRIEF.md` and `openapi.json`.

```text
Build a replacement frontend for the Pokémon Data Explorer API.

You are given two attachments:
- FRONTEND_BRIEF.md, the product and integration spec
- openapi.json, the OpenAPI document exported from the running API

Follow FRONTEND_BRIEF.md. When the OpenAPI document and the brief disagree about response bodies, trust the captured JSON examples in the brief. The generated spec lists routes and query parameters but does not declare response schemas. Do not invent fields, endpoints, or error shapes.

Deliverables, written so they replace the existing pokemon-ui app in place:
- Vue 3 + TypeScript + Vite source under pokemon-ui/src
- API client and DTO types that match the brief
- Client-side favorites, six-Pokémon team, and the type-coverage rules in the brief
- Vitest tests for the API client, loading/empty/error states, favorite persistence, and the six-Pokémon team cap
- A dark, minimalist, responsive UI that uses icons as the visible labels and still has accessible names
- .env.example documenting VITE_API_BASE_URL
- Keep the existing Vite proxy from /api to http://localhost:5010 and the @ path alias

Acceptance criteria:
- npm test and npm run build succeed in pokemon-ui
- The app reads the API base from import.meta.env.VITE_API_BASE_URL and defaults to /api
- List, catalog search, detail, pagination, and the documented error messages work against the real API
- Favorites and the team survive a reload via the storage keys in the brief
- Keyboard users can search, page, open a Pokémon, favorite it, and edit the team
- Layout works at 390px and at desktop widths
- No requests are sent to any host other than the configured API base
```
