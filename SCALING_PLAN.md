# Scalability Fix Plan — Pionts Platform

## Context
Production incidents revealed scalability weaknesses: a circular referral tree caused infinite recursive queries that exhausted all DB connections (Prisma P2024 error), crashing login and customer detail pages.

**Previous capacity**: ~1K customers OK, 10K degrades, 100K crashes.
**Target**: Handle 100K+ customers per project reliably.

## Changes Implemented

### P0 — Critical

| # | Fix | File(s) | Impact |
|---|-----|---------|--------|
| 1 | Database indexes on `ApiKey.keyHash`, `ReferralTree(projectId,parentId)`, `Redemption(projectId,customerId)`, `Project.orgId` | `schema.prisma` + migration | Eliminates full table scans on every SDK/API request |
| 2 | Prisma connection pool config (`connection_limit=20&pool_timeout=10`) | `docker-compose.prod.yml` | Prevents P2024 connection exhaustion |
| 3 | Production Prisma logging (warn/error events) | `prisma.service.ts` | Catch slow queries in production |
| 4 | JWT validation: single compound-index lookup instead of loading all memberships | `jwt.strategy.ts` | ~50% reduction in auth DB queries |
| 5 | Cursor-based CSV export (1000-row batches) | `analytics.service.ts` | Prevents OOM on large exports |
| 6 | Paginated referral tree (`getFullTree` with limit/offset) | `referrals.service.ts`, `dashboard.controller.ts` | Prevents loading all customers into memory |
| 7 | Recursive CTE for `walkUpline` (single query vs N round-trips) | `referrals.service.ts` | Eliminates N+1 sequential DB queries |

### P1 — Important

| # | Fix | File(s) | Impact |
|---|-----|---------|--------|
| 8 | Config cache TTL (5 minutes) | `app-config.service.ts` | Prevents stale settings, bounded memory |
| 9 | Session middleware scoped to `/admin` and `/rewards` only | `main.ts` | Removes overhead from SDK/API requests |
| 10 | SDK query deduplication (pass project + tiers to avoid re-fetching) | `sdk.service.ts` | Reduces 12+ queries to ~10 per widget load |

### P2 — Infrastructure & Schema

| # | Fix | File(s) | Impact |
|---|-----|---------|--------|
| 11 | `shopifyCustomerId` global unique → project-scoped compound unique | `schema.prisma` | Multi-tenant correctness |
| 12 | Nginx: rate limiting, gzip, timeouts, keepalive upstream | `nginx.conf` | DDoS protection, compression, connection reuse |
| 13 | Docker: 2 CPU / 2GB limits, PG tuning (shared_buffers, work_mem) | `docker-compose.prod.yml` | Higher capacity ceiling |
| 14 | `useFetch` AbortController | `shared/src/hooks/useFetch.ts` | Cancel in-flight requests on unmount/re-fetch |

## Migration

```bash
# Applied via: prisma migrate deploy
# Migration: 20260311120000_add_scaling_indexes
```

## Verification Checklist

- [ ] Backend unit tests pass (`npx jest --passWithNoTests`)
- [ ] Frontend tests pass (`npx vitest run` in shared/, admin-ui/, client-ui/)
- [ ] CSV export works with large datasets
- [ ] Referral tree pagination returns correct `totalChains` count
- [ ] Nginx rate limiting verified with `curl` burst test
- [ ] `docker stats` shows memory within limits under load
