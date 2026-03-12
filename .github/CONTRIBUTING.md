# Contributing to Pionts

## Quick Start
1. Log in to your GitHub account, go to github.com/hbc-group, and find the pionts_system repository
2. Clone: `git clone <REPO_URL>`
3. Install deps: `cd backend && npm install` (repeat for admin-ui, client-ui, sdk, shared)
4. Start DB: `docker compose up -d postgres`
5. Setup: `cd backend && npx prisma generate && npx prisma migrate deploy && npm run seed`
6. Run: `cd backend && npm run start:dev`

## Code Conventions

### Principles
- DRY — extract shared logic into reusable pieces
- SOLID — single responsibility, dependency inversion
- No magic values — use constants files

### File Naming
| Type | Convention | Example |
|------|-----------|---------|
| NestJS Module | kebab-case.module.ts | customers.module.ts |
| NestJS Controller | kebab-case.controller.ts | customers.controller.ts |
| NestJS Service | kebab-case.service.ts | customers.service.ts |
| NestJS Guard | kebab-case.guard.ts | secret-key.guard.ts |
| NestJS DTO | kebab-case.dto.ts | create-customer.dto.ts |
| React Component | PascalCase.tsx | StatCard.tsx |
| React Page | PascalCase.tsx | Overview.tsx |
| React Hook | camelCase.ts | useCustomer.ts |
| React Context | PascalCase.tsx | AuthContext.tsx |
| CSS | kebab-case.css | admin.css |
| Test | *.spec.ts or *.test.tsx | auth.service.spec.ts |
| Shared Types | kebab-case.ts | api.types.ts |

### Backend Patterns
- Controllers handle HTTP concerns only (validation, response format)
- Services handle business logic
- Use DTOs with class-validator for input validation
- Use guards for auth (not middleware)
- All queries filter by projectId for tenant isolation
- Use snake_case for API responses (transform in controller)

### Frontend Patterns (React)
- Functional components with hooks
- Custom hooks for data fetching (useFetch from @pionts/shared)
- Context for global state (AuthContext, ProjectContext)
- API calls through centralized api.ts
- Tailwind CSS v4 for styling
- TypeScript strict mode

### Widget Patterns
- BEM-style CSS classes with `pw-` prefix
- Dual-mode architecture (SPA + UMD)
- i18n for all user-facing strings

## API Response Format

All API responses follow consistent patterns:

Success (single item):
```json
{ "customer": { ... } }
```

Success (list):
```json
{ "customers": [...], "total": 42 }
```

Success (action):
```json
{ "success": true, "new_balance": 150 }
```

Error:
```json
{ "statusCode": 400, "message": "Validation failed", "error": "Bad Request" }
```

## Git Workflow

### Branch Naming
- `feature/description` — new features
- `fix/description` — bug fixes
- `refactor/description` — code improvements
- `docs/description` — documentation

### Commit Message Format
Use descriptive messages in imperative mood:
- `Add customer CRUD endpoints`
- `Fix redemption refund bug`
- `Update widget i18n system`

### PR Process
1. Create feature branch from main
2. Make changes, write tests
3. Run all tests: `cd backend && npm run test:all`
4. Run type check: `npx tsc --noEmit` in each package
5. Push branch and create PR
6. Fill in PR template
7. Request review from team lead

## How-To Guides

### Add a New API Endpoint
1. Create/update DTO in `src/module-name/dto/`
2. Add method to service in `src/module-name/module-name.service.ts`
3. Add route to controller in `src/module-name/module-name.controller.ts`
4. Add appropriate guards and decorators
5. Write unit test in `test/unit/`
6. Write E2E test in `test/e2e/`

### Add a New Database Model
1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add-model-name`
3. Run `npx prisma generate`
4. Create NestJS module, service, controller
5. Register module in `app.module.ts`
6. Add seed data to `prisma/seed.ts`

### Add a Dashboard Page
1. Create page component in `admin-ui/src/pages/`
2. Add route in `admin-ui/src/App.tsx`
3. Add nav item in `admin-ui/src/constants.ts`
4. Use `useProject()` for project context
5. Use `useFetch()` from @pionts/shared for data
6. Add API function in `admin-ui/src/api.ts`

### Add to @pionts/shared
Only add to shared if:
- Used by 2+ packages (admin-ui AND client-ui)
- It's a type definition, utility function, or reusable hook

Steps:
1. Add to appropriate directory in `shared/src/`
2. Export from `shared/src/index.ts`
3. Write tests in `shared/src/__tests__/`
4. Import as `import { Thing } from '@pionts/shared'`

## Security Checklist Before PR

- [ ] All DB queries filter by projectId
- [ ] Endpoints have appropriate guards
- [ ] No secrets logged or exposed in responses
- [ ] Input validated with DTOs
- [ ] API keys/passwords hashed before storage
- [ ] HMAC comparisons use timing-safe equality
- [ ] No raw SQL with string concatenation
- [ ] Sensitive data not in error messages
