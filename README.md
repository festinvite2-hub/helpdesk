# Helpdesk AI Platform Scaffold

Initial scaffold for a local-first helpdesk platform with:

- React + Vite + Tailwind frontend
- PostgreSQL + pgvector
- n8n workflows
- Ollama local AI runtime
- Docker Compose orchestration

## Project Structure

```text
.
├── frontend/            # React + Vite + Tailwind app
├── db/                  # Database initialization and migration scripts
├── n8n/
│   └── workflows/       # n8n workflow exports
├── nginx/               # Reverse proxy configuration
├── documents/           # Project docs and product artifacts
├── scripts/             # Utility scripts for local development
├── docker-compose.yml
└── .env.example
```

## Quick Start

1. Copy environment values:

   ```bash
   cp .env.example .env
   ```

2. Start services:

   ```bash
   docker compose up -d
   ```

3. Open services:
   - Frontend: `http://localhost:5173`
   - n8n: `http://localhost:5678`
   - Nginx gateway: `http://localhost:8080`
   - Ollama API: `http://localhost:11434`

## Notes

- `db/init.sql` creates the `vector` extension for pgvector.
- Frontend runs with Vite dev server in Docker for local iteration.
- Add n8n workflows to `n8n/workflows` and import via n8n UI.
