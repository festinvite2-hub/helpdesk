# Helpdesk (Local-First AI Stack)

This repository contains a simple local-first scaffold for an internal AI helpdesk app.

## Stack

- Frontend: React + Vite + Tailwind (`/frontend`)
- Database: PostgreSQL 16 + pgvector (`/db`)
- Workflow orchestration: n8n (`/n8n/workflows`)
- Local AI runtime: Ollama
- Reverse proxy: Nginx (`/nginx`)
- Orchestration: Docker Compose

## Folder Structure

```txt
.
├── frontend/
├── db/
├── n8n/
│   └── workflows/
├── nginx/
├── documents/
├── scripts/
├── docker-compose.yml
└── .env.example
```

## Local Setup

1. Copy env file:

   ```bash
   cp .env.example .env
   ```

2. Start infrastructure services:

   ```bash
   docker compose up -d
   ```

3. Frontend setup:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Build frontend:

   ```bash
   npm run build
   ```

## Notes

- `db/init.sql` and `nginx/nginx.conf` are placeholders; update as needed for your local environment.
- The stack intentionally avoids external SaaS and is designed for local-first development.
