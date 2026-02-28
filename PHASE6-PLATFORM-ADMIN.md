# Phase 6 — Platform Admin (Super Admin Panel)

## Overview
Add a platform-level admin layer so the SaaS owner can manage all organizations, provide support, control billing, and monitor platform health. This is separate from org-level admin — it sees across ALL tenants.

## Database Changes

### New field on User model
```prisma
model User {
  ...
  isSuperAdmin  Boolean @default(false) @map("is_super_admin")
}
```
- NOT tied to any org — a super admin can exist without an org
- Set manually via DB seed or CLI command (not via UI signup)
- A user CAN be both a super admin AND an org owner (dual role)

### New model: PlatformNote (support notes on orgs)
```prisma
model PlatformNote {
  id        Int      @id @default(autoincrement())
  orgId     Int
  org       Organization @relation(fields: [orgId], references: [id])
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now()) @map("created_at")
}
```

## Backend Changes

### New Module: `platform-admin/`
- `platform-admin.module.ts`
- `platform-admin.controller.ts`
- `platform-admin.service.ts`
- `super-admin.guard.ts` — checks `user.isSuperAdmin === true`

### API Endpoints (all require SuperAdminGuard)

```
GET    /api/v1/platform/stats              → Platform-wide stats (total orgs, users, projects, revenue)
GET    /api/v1/platform/orgs               → List all orgs (search, sort, paginate)
GET    /api/v1/platform/orgs/:id           → Org detail (members, projects, billing, activity)
PUT    /api/v1/platform/orgs/:id           → Update org (name, status)
POST   /api/v1/platform/orgs/:id/suspend   → Suspend org (disable all projects)
POST   /api/v1/platform/orgs/:id/activate  → Reactivate suspended org
DELETE /api/v1/platform/orgs/:id           → Delete org (with safety confirmation)

GET    /api/v1/platform/orgs/:id/projects  → List org's projects with stats
GET    /api/v1/platform/orgs/:id/members   → List org's members
GET    /api/v1/platform/orgs/:id/billing   → Org billing history + current plan
PUT    /api/v1/platform/orgs/:id/billing   → Override plan, set limits, add credits

GET    /api/v1/platform/users              → Search users across all orgs
GET    /api/v1/platform/users/:id          → User detail (which orgs, activity)
POST   /api/v1/platform/users/:id/impersonate → Get a JWT as this user (for support)

GET    /api/v1/platform/orgs/:id/notes     → Support notes on org
POST   /api/v1/platform/orgs/:id/notes     → Add support note

GET    /api/v1/platform/analytics          → Platform analytics (MRR, growth, churn, signups over time)
GET    /api/v1/platform/activity            → Recent activity across all orgs (signups, project creates, etc.)
```

### Guard: SuperAdminGuard
```typescript
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.user?.isSuperAdmin === true;
  }
}
```

### Auth Changes
- Include `isSuperAdmin` in JWT payload
- Return `isSuperAdmin` in `/auth/me` response
- Login response includes `isSuperAdmin` flag

### Seed Changes
- Seed script creates a super admin user:
  - email: `admin@pionts.com`, password: `admin123`, isSuperAdmin: true
  - NOT part of any org

## Frontend Changes

### New App: `platform-ui/` (or integrated into admin-ui)

**Option A — Separate SPA** (recommended for security isolation):
- New Vite SPA at `/platform/`
- Own auth context checking `isSuperAdmin`
- Served from a different route/subdomain

**Option B — Integrated into admin-ui**:
- If `user.isSuperAdmin`, show a "Platform" nav section
- Sidebar: Platform Dashboard, Organizations, Users, Billing, Analytics
- Route prefix: `/platform/*`

### Pages

#### Platform Dashboard (`/platform`)
- Stats cards: Total Orgs, Total Users, Total Projects, Active Projects, MRR, Total Customers
- Recent activity feed (org signups, project creates)
- Quick search bar (search orgs/users)

#### Organizations (`/platform/orgs`)
- Searchable/sortable table: name, owner email, plan, projects count, members count, status, created date
- Click → Org Detail
- Status badge: Active / Suspended / Trial

#### Org Detail (`/platform/orgs/:id`)
- Org info card (name, slug, created, status, owner)
- Actions: Suspend, Activate, Delete
- Tabs:
  - **Projects** — list with customer counts, status
  - **Members** — list with roles
  - **Billing** — current plan, usage, override controls
  - **Notes** — support notes (add/view)
  - **Activity** — recent activity log

#### Users (`/platform/users`)
- Search across all orgs
- Table: name, email, org name, org role, last login, super admin badge
- Click → User Detail
- Impersonate button (opens new tab as that user)

#### Billing Management (`/platform/billing`)
- Revenue overview (MRR, ARR, growth)
- Org-by-org billing table
- Override plan, add credits, extend trial

#### Platform Analytics (`/platform/analytics`)
- Signup trend chart (orgs over time)
- Revenue chart (MRR over time)
- Customer distribution (customers per org)
- Churn rate
- Top orgs by customers/revenue

## Implementation Order

1. **Database**: Add `isSuperAdmin` to User, create migration
2. **Backend guard**: `SuperAdminGuard`
3. **Backend module**: `PlatformAdminModule` with basic CRUD endpoints
4. **Auth changes**: Include `isSuperAdmin` in JWT + login response
5. **Seed**: Create super admin user
6. **Frontend routing**: Add `/platform/*` routes with super admin check
7. **Platform Dashboard page**: Stats + activity feed
8. **Organizations page**: List + search + detail
9. **Users page**: Search + impersonate
10. **Billing page**: Plan management + overrides
11. **Analytics page**: Platform-wide charts
12. **Support tools**: Notes, activity logs

## Security Considerations
- Super admin endpoints must NEVER be accessible without `isSuperAdmin` flag
- Impersonation should log who impersonated whom (audit trail)
- Super admin actions should be logged (suspend, delete, plan changes)
- Consider rate limiting on impersonation endpoint
- Consider 2FA requirement for super admin accounts (future)
- Platform routes should not be discoverable (no links in regular UI)

## Estimated Scope
- Backend: 1 new module, 1 guard, ~15 endpoints, 1 migration
- Frontend: ~8 new pages, 1 new auth check, sidebar integration
- Tests: Unit tests for guard + service, E2E for critical endpoints
