# Pionts

**Multi-tenant SaaS loyalty & referral rewards platform.** Any company can sign up, create a project, and integrate a points + referral system into their website — Shopify, WordPress, custom-built, anything with a `<script>` tag.

## Quick Start

```bash
# 1. Clone (go to github.com/hbc-group to find the repository)
git clone <REPO_URL>
cd pionts_system

# 2. Install dependencies
for dir in shared backend admin-ui client-ui sdk; do (cd $dir && npm install); done

# 3. Start PostgreSQL
docker compose up -d postgres

# 4. Setup database
cd backend && npx prisma generate && npx prisma migrate deploy && npm run seed && cd ..

# 5. Start development
cd backend && npm run start:dev
```

Dashboard: http://localhost:3000/admin | Login: `admin@brewbean.com` / `admin`

## Architecture

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Company's   │   │  Dashboard   │   │   Widget     │
│  Website     │   │  (admin-ui)  │   │ (client-ui)  │
│  + SDK       │   │  React SPA   │   │  React UMD   │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │ API Key          │ JWT              │ API Key
       │ + HMAC           │ Bearer           │ + OTP JWT
       └─────────────┬────┴─────────────┬────┘
                     ▼                  ▼
              ┌─────────────────────────────┐
              │    NestJS Backend (3000)     │
              │    21+ modules, Prisma ORM  │
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │    PostgreSQL 17             │
              │    Multi-tenant (projectId)  │
              └─────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11 + TypeScript |
| Database | PostgreSQL 17 + Prisma 6 ORM |
| Auth | JWT (access + refresh) + API keys (pk\_/sk\_) + HMAC |
| Dashboard | React 19 + TypeScript + Tailwind CSS v4 |
| Widget | React 19 + TypeScript + Tailwind CSS v4 (SPA + UMD) |
| SDK | loyalty.js IIFE loader (~1.7KB) |
| Shared | @pionts/shared (types, hooks, utils, icons) |
| Testing | Jest (backend) + Vitest (frontend) — 340+ tests |
| CI/CD | GitHub Actions → Hetzner VPS (PM2 + Nginx) |

## Project Structure

```
pionts_system/
├── shared/              @pionts/shared — types, hooks, utils, icons
├── backend/             NestJS API (21+ modules)
│   ├── prisma/          Schema, migrations, seed
│   ├── src/             All modules (auth, sdk, dashboard, webhooks, ...)
│   └── test/            Unit (15 suites) + E2E (10 suites)
├── admin-ui/            React dashboard SPA
│   └── src/             Pages, components, context, API client
├── client-ui/           React embeddable widget
│   └── src/             Dual-mode (SPA + UMD), i18n (en/de), BEM CSS
├── sdk/                 loyalty.js SDK loader
├── deploy/              Nginx config
├── documentation/       Complete project documentation
├── .github/             CI/CD, PR template, issue templates
├── docker-compose.yml   Development (PostgreSQL + backend)
└── docker-compose.prod.yml  Production overrides
```

## Roles & Permissions

### Organization Level
| Role | Access |
|------|--------|
| owner | Full org control, billing, all projects (implicit admin) |
| admin | Manage org members and projects |
| member | Access assigned projects only |

### Project Level
| Role | Access |
|------|--------|
| owner | Delete project, revoke keys, transfer ownership |
| admin | Manage settings, members, API keys, earn actions |
| editor | Manage customers, award/deduct points, update settings |
| viewer | Read-only access to all project data |

## Scripts Reference

| Command | Description |
|---------|-------------|
| `cd backend && npm run start:dev` | Start backend (hot-reload) |
| `cd admin-ui && npm run dev` | Start dashboard dev server |
| `cd client-ui && npm run dev` | Start widget dev server |
| `cd backend && npm test` | Backend unit tests |
| `cd backend && npm run test:e2e` | Backend E2E tests |
| `cd backend && npm run seed` | Seed database |
| `npx prisma studio` | Visual database browser |
| `npx prisma migrate dev --name x` | Create migration |
| `docker compose up -d` | Start all Docker services |

## Documentation

See [`documentation/`](documentation/) for comprehensive project docs:

| Document | Description |
|----------|-------------|
| [README.md](documentation/README.md) | Project overview & setup summary |
| [architecture.md](documentation/architecture.md) | System architecture & module diagram |
| [setup-guide.md](documentation/setup-guide.md) | Full dev environment setup |
| [api-reference.md](documentation/api-reference.md) | Every REST endpoint |
| [database-schema.md](documentation/database-schema.md) | All models, fields, relations |
| [roles-permissions.md](documentation/roles-permissions.md) | Roles, guards, permission matrix |
| [security.md](documentation/security.md) | Auth flows, HMAC, token lifecycle |
| [design-system.md](documentation/design-system.md) | Colors, typography, components |
| [deployment.md](documentation/deployment.md) | Docker, Nginx, CI/CD |
| [troubleshooting.md](documentation/troubleshooting.md) | Common issues & debugging |
| [changelog.md](documentation/changelog.md) | Implementation history |

## Contributing

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) for code conventions, git workflow, and how-to guides.

## GitHub Access

Log in to your GitHub account, go to [github.com/hbc-group](https://github.com/hbc-group), and find the **pionts_system** repository. You must be a member of the hbc-group organization to access it. Contact your team lead if you can't find it.

## License

Proprietary. All rights reserved.
