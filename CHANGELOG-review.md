# Admin-UI Code Review Changelog

**Date:** 2026-02-26
**Scope:** Full admin-ui review for DRY, SOLID, scalability, and performance best practices

---

## Overview

Comprehensive code review and refactor of the `admin-ui` SPA. The review identified and fixed issues across 4 categories: duplicate code (DRY), type safety, performance, and bundle optimization.

### Results

- **16/16 tests passing**
- **0 TypeScript errors**
- **Production build: 2.16s**
- **Vendor chunks properly split** (react 48KB, recharts 363KB)

---

## 1. Charting Library Migration

**Problem:** Hand-rolled Canvas chart in Overview.tsx looked poor and was hard to maintain.

**Solution:** Installed `recharts` and rewrote both charts.

### Files Changed

| File | Change |
|------|--------|
| `admin-ui/src/pages/Overview.tsx` | Replaced Canvas `AreaChart` with Recharts `PointsChart` (smooth monotone curves, gradient fills, custom tooltip) |
| `admin-ui/src/pages/Overview.tsx` | Replaced Canvas donut with Recharts `SegmentsDonut` (`PieChart` + `Pie` + `Cell`) |
| `admin-ui/src/pages/Overview.tsx` | Added custom `ChartTooltip` component |
| `admin-ui/src/pages/Overview.tsx` | Fixed `buckets.map is not a function` bug (API returns `{ buckets: [...] }`, not a bare array) |
| `admin-ui/src/pages/Overview.tsx` | Made Points Economy and Customer Health charts equal height (`items-stretch` grid) |

### New Dependency

```
recharts ^2.15.3
```

---

## 2. DRY: Icon Consolidation (26 duplicates removed)

**Problem:** 26+ inline SVG icon functions were duplicated across `Layout.tsx`, `ProjectList.tsx`, and `ProjectCreate.tsx`.

**Solution:** Created 17 new icon components in `@pionts/shared` and replaced all inline definitions with imports.

### New Shared Icons (17 files)

All in `shared/src/components/icons/`:

| Icon | Previously duplicated in |
|------|--------------------------|
| `SearchIcon` | Layout.tsx, ProjectList.tsx |
| `CheckIcon` | Layout.tsx, ProjectList.tsx, ProjectCreate.tsx |
| `PlusIcon` | Layout.tsx, ProjectList.tsx |
| `CodeIcon` | ProjectList.tsx, ProjectCreate.tsx |
| `GlobeIcon` | ProjectList.tsx, ProjectCreate.tsx |
| `GridViewIcon` | ProjectList.tsx |
| `ListViewIcon` | ProjectList.tsx |
| `MonitorIcon` | Layout.tsx |
| `SunIcon` | Layout.tsx |
| `MoonIcon` | Layout.tsx |
| `ChevronsUpDownIcon` | Layout.tsx |
| `CopyIcon` | ProjectCreate.tsx |
| `ShieldIcon` | ProjectCreate.tsx |
| `ArrowLeftIcon` | ProjectCreate.tsx |
| `SidebarToggleIcon` | Layout.tsx |
| `ShopifyIcon` | ProjectList.tsx, ProjectCreate.tsx |
| `WordPressIcon` | ProjectList.tsx, ProjectCreate.tsx |

### Files Changed

| File | Change |
|------|--------|
| `shared/src/components/icons/` | 17 new icon files created |
| `shared/src/components/icons/index.ts` | Barrel updated (23 -> 40 exports) |
| `shared/src/index.ts` | Added all 17 new icon re-exports |
| `admin-ui/src/components/Layout.tsx` | Removed 8 inline icons, added shared imports (631 -> 559 lines) |
| `admin-ui/src/pages/ProjectList.tsx` | Removed 10 inline icons, added shared imports |
| `admin-ui/src/pages/ProjectCreate.tsx` | Removed 8 inline icons, added shared imports |

---

## 3. DRY: Shared Utility Extraction

**Problem:** `getInitial()` helper was duplicated in 3 customer-detail files.

**Solution:** Extracted to `@pionts/shared` utils.

### Files Changed

| File | Change |
|------|--------|
| `shared/src/utils/index.ts` | Added `getInitial(name?, email?): string` |
| `shared/src/index.ts` | Added `getInitial` to exports |
| `admin-ui/src/pages/customer-detail/CustomerHero.tsx` | Removed local `getInitial`, imports from shared |
| `admin-ui/src/pages/customer-detail/ReferralChain.tsx` | Removed local `getInitial`, imports from shared |
| `admin-ui/src/pages/customer-detail/DirectReferralsTable.tsx` | Removed local `getInitial`, imports from shared |

---

## 4. Type Safety: Error Handling

**Problem:** 12 `catch(err: any)` blocks across 9 files used unsafe `err.message` access.

**Solution:** Added `getErrorMessage(err: unknown)` helper and replaced all catch blocks.

### New Helper

```typescript
// admin-ui/src/api.ts
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
```

### Files Changed (9 files, 12 catch blocks)

| File | Catch blocks fixed |
|------|-------------------|
| `admin-ui/src/pages/Login.tsx` | 1 |
| `admin-ui/src/pages/Signup.tsx` | 1 |
| `admin-ui/src/pages/ProjectCreate.tsx` | 1 |
| `admin-ui/src/pages/customer-detail/CustomerDetail.tsx` | 2 (award + deduct) |
| `admin-ui/src/pages/org-settings/AddMemberForm.tsx` | 1 |
| `admin-ui/src/pages/org-settings/MemberList.tsx` | 1 |
| `admin-ui/src/pages/org-settings/OrgDetailsForm.tsx` | 1 |
| `admin-ui/src/pages/settings/ProjectTeam.tsx` | 3 (add + role change + remove) |
| `admin-ui/src/components/SettingsForm.tsx` | 1 |

### Test Mocks Updated

| File | Change |
|------|--------|
| `admin-ui/src/__tests__/Login.test.tsx` | Added `getErrorMessage` to `vi.mock('../api')` |
| `admin-ui/src/__tests__/AuthContext.test.tsx` | Added `getErrorMessage` to `vi.mock('../api')` |

---

## 5. API Race Condition Fix

**Problem:** Multiple concurrent 401 responses could trigger parallel `silentRefresh()` calls, causing token refresh races.

**Solution:** Added a mutex pattern to `silentRefresh()`.

### Files Changed

| File | Change |
|------|--------|
| `admin-ui/src/api.ts` | Added `refreshPromise` mutex; concurrent callers await the same in-flight refresh |

### Pattern

```typescript
let refreshPromise: Promise<boolean> | null = null;

async function silentRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try { /* refresh logic */ }
    finally { refreshPromise = null; }
  })();
  return refreshPromise;
}
```

---

## 6. Performance: React.memo

**Problem:** 5 pure components re-rendered unnecessarily on parent state changes.

**Solution:** Wrapped with `React.memo()`.

### Files Changed

| File | Change |
|------|--------|
| `admin-ui/src/components/StatCard.tsx` | Wrapped with `memo()` |
| `admin-ui/src/components/ActivityFeed.tsx` | Wrapped with `memo()` |
| `admin-ui/src/components/DataTable.tsx` | Wrapped with `memo()` |
| `admin-ui/src/components/GuideStep.tsx` | Wrapped with `memo()` |
| `admin-ui/src/components/CodeBlock.tsx` | Rewritten with `memo()`, `useRef` timer cleanup, `type="button"` |

---

## 7. Performance: Vite Bundle Optimization

**Problem:** Single monolithic JS bundle with no code splitting for vendor libraries.

**Solution:** Added `manualChunks` config for vendor splitting.

### Files Changed

| File | Change |
|------|--------|
| `admin-ui/vite.config.ts` | Added `build.rollupOptions.output.manualChunks` for react + recharts |
| `admin-ui/vite.config.ts` | Added `target: 'es2020'` and `sourcemap: true` |

### Bundle Output

| Chunk | Size (gzip) |
|-------|-------------|
| `vendor-react` | 17.0 KB |
| `vendor-recharts` | 108.2 KB |
| `index` (app code) | 101.4 KB |
| CSS | 11.9 KB |
| Lazy-loaded pages | 0.2 - 4.5 KB each |

---

## 8. Navigation Redesign: Two-Mode Sidebar

**Problem:** After login, user auto-lands on a single project's Overview. No way to see all projects without navigating away.

**Solution:** Conditional home route and two sidebar nav configs.

### Files Changed

| File | Change |
|------|--------|
| `admin-ui/src/constants.ts` | Split `NAV_ITEMS` into `NAV_ITEMS_NO_PROJECT` + `NAV_ITEMS_PROJECT` |
| `admin-ui/src/components/Layout.tsx` | Conditional nav arrays based on project selection; "All Projects" in header dropdown |
| `admin-ui/src/App.tsx` | Added `HomeRoute` component: no project -> ProjectList, with project -> Overview |
| `admin-ui/src/context/ProjectContext.tsx` | Removed auto-select-single-project behavior |

### Behavior

1. Login -> lands on `/` -> no project selected -> sees **ProjectList**
2. Sidebar shows: Projects, Customers, Referrals, Analytics
3. User clicks a project -> sees **Overview**
4. Sidebar shows: Overview, Customers, Referrals, Analytics, Settings
5. Header dropdown allows switching projects or going back to "All Projects"

---

## Total Files Modified

| Package | Files |
|---------|-------|
| `shared/` | 20 (17 new icons + index.ts + utils/index.ts + src/index.ts) |
| `admin-ui/` | 19 files modified |
| **Total** | **39 files** |
