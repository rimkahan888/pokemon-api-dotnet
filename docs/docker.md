# Run with Docker

The compose file builds the ASP.NET Core API and the Vue app. Nginx in the UI container proxies `/api` and `/health` to the API container, matching the paths the frontend already uses.

```bash
docker compose up --build
```

- UI: `http://localhost:8080`
- API: `http://localhost:5010`
- Liveness: `http://localhost:5010/health`

The API container listens on HTTP port 8080 and does not terminate TLS. PokéAPI must be reachable from the API container.
