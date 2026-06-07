# POS Platform

Multi-tenant shop + kasse platform (Angular client, Express API, PostgreSQL).

## Prerequisites

- **Node.js** 20+ (Angular CLI 20 works with Node 22.22+)
- **Docker Desktop** (for local Postgres)

## Quick start

```bash
npm install
npm run dev
```

This will:

1. Start **Postgres** in Docker (`pos-postgres`) if it is not already running
2. Start the **Express API** on http://localhost:3000 (hot reload via `tsx watch`)
3. Start the **Angular app** on http://localhost:4200 (hot reload via `ng serve`)
4. Open your browser to http://localhost:4200

### Individual commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Postgres + API + client + open browser |
| `npm run dev:server` | API only |
| `npm run dev:client` | Angular only |
| `npm run docker:postgres` | Start Postgres container |

## Project layout

```text
Client/src/app/
  core/           guards, interceptors, models, services
  features/       shop, kasse, admin, checkout
  layouts/        shop-layout, kasse-layout, admin-layout
  shared/         reusable components

Server/src/
  controllers/
  repositories/
  services/
  routes/
  middleware/
  infra/          db, config
  prisma/         schema (Server/prisma/)

Shared/types/     API types shared by client and server
scripts/          Dev orchestration
.worktrees/        Local git worktrees (ignored; one per feature)
```

## Feature workflow (git worktree)

Every new feature uses an isolated worktree — do not build features directly on `master`.

```bash
# 1. Create feature worktree + branch from master
npm run worktree:new -- feature/my-feature

# 2. Open .worktrees/feature-my-feature in your editor and implement there

# 3. When happy — merge to master, remove worktree, delete branch
npm run worktree:merge -- feature/my-feature

# List active worktrees
npm run worktree:list

# Abandon without merging (type "discard" to confirm)
npm run worktree:discard -- feature/my-feature
```

See `.cursor/rules/git-worktree-workflow.mdc` for AI agent behavior.

## Environment

Copy `Server/.env.example` to `Server/.env` (already created for local dev):

```env
DATABASE_URL=postgresql://pos:pos@localhost:5432/pos
```

## AI / Angular MCP (Cursor & VS Code)

- **Cursor:** `.cursor/mcp.json` — Angular CLI MCP server
- **VS Code:** `.vscode/mcp.json` — same server for Copilot MCP
- **Rules:** `.cursor/rules/angular-best-practices.mdc`

Restart Cursor/VS Code after cloning, then verify **angular-cli** shows as connected under MCP settings.

Use MCP tools `get_best_practices` and `search_documentation` when generating Angular code.

## API

- `GET /api/health` — API + database status

Angular dev server proxies `/api/*` → `http://localhost:3000`.

## Troubleshooting TypeScript errors

If you see errors in **`Server/express-gen-ts/tsconfig.json`** (missing `vitest/globals` or `User.model.ts`):

That folder is a **duplicate Express generator project** and is not used. The real API lives in **`Server/src/`**.

1. Run `npm run fix:errors` to remove `Server/express-gen-ts` if it exists
2. Close any unsaved tabs under `Server/express-gen-ts`
3. **Developer: Reload Window** in VS Code/Cursor (`Ctrl+Shift+P`)

Do not generate a second Express app inside `Server/` — extend `Server/src/` instead.
