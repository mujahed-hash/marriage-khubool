# Admin Portal – Development Plan

> Admin dashboard for the Marriage Platform. Covers moderation, user management, revenue, and platform settings.

**Completed by Cursor:** Reports (API + component), Orders (API + component), Interests (API + component), Settings (component UI). Report model `status` field. Settings persistence needs backend.

**Next:** See `ADMIN_EXPANSION_PLAN.md` for Phase E (audit log, advanced search, settings persistence, announcements, export) and Phase F (photo moderation, conversation audit, impersonate user).

---

## 1. Architecture Decision

**Separate Angular app** inside the monorepo for security isolation.

```
marriage-project/
  frontend/    ← User-facing Angular app (existing)
  admin/       ← Admin Angular app (new)
  backend/     ← Shared backend (add /api/admin/* routes)
```

**Authentication:** Separate admin login. JWT with `isAdmin: Boolean` role-check on `User` model.  
**Port:** Admin app runs on a different dev port (e.g. `4401`).

---

## 2. Backend Changes

### 2.1 User Model Update

Add `isAdmin: { type: Boolean, default: false }` to `User.js`.

### 2.2 Admin Middleware

New `middleware/adminAuth.js`:
- Verify JWT + check `req.user.isAdmin === true`
- Return 403 if not admin

### 2.3 Admin API Routes (`/api/admin/*`)

All routes protected by `adminAuth` middleware.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stats` | GET | Dashboard metrics (users, profiles, reports, revenue) |
| `/api/admin/users` | GET | Paginated user list with filters |
| `/api/admin/users/:id` | GET | Single user detail |
| `/api/admin/users/:id/suspend` | PUT | Suspend/unsuspend account |
| `/api/admin/users/:id/verify` | PUT | Manually verify account |
| `/api/admin/users/:id/membership` | PUT | Manually grant/revoke tier |
| `/api/admin/users/:id` | DELETE | Delete user + profile |
| `/api/admin/profiles` | GET | Paginated profile list with filters |
| `/api/admin/profiles/:id` | GET | Single profile detail |
| `/api/admin/profiles/:id/deactivate` | PUT | Deactivate a profile |
| `/api/admin/profiles/:id/feature` | PUT | Feature profile on homepage |
| `/api/admin/reports` | GET | Pending/resolved reports |
| `/api/admin/reports/:id/resolve` | PUT | Resolve report (warn user) |
| `/api/admin/reports/:id/dismiss` | PUT | Dismiss report |
| `/api/admin/orders` | GET | All membership orders |
| `/api/admin/interests` | GET | All interest requests |

### 2.4 Stats Endpoint Response Shape

```json
{
  "totalUsers": 0,
  "totalProfiles": 0,
  "newUsersToday": 0,
  "newUsersThisWeek": 0,
  "pendingReports": 0,
  "totalOrders": 0,
  "revenueTotal": 0,
  "activeChats": 0
}
```

---

## 3. Frontend Admin App Structure

```
admin/src/app/
  components/
    layout/           ← AdminLayoutComponent (sidebar + topbar)
    dashboard/        ← Overview with stats cards + charts
    users/            ← User list table + detail view
    profiles/         ← Profile list table + detail view
    reports/          ← Moderation table
    orders/           ← Membership/revenue table
    interests/        ← Interest audit table
    settings/         ← Platform settings form
    login/            ← Admin login (separate from user login)
  services/
    admin-api.ts      ← Axios/HTTP calls to /api/admin/*
    admin-auth.ts     ← JWT storage + guard
  guards/
    admin.guard.ts    ← Redirect to /login if not admin
```

---

## 4. Feature Modules (8 Sections)

### 4.1 Dashboard (Overview)
- Stats cards: Total Users, Profiles, Pending Reports, Revenue
- Line chart: New registrations (last 30 days)
- Bar chart: Interest activity (sent/accepted/rejected)
- Top 5 most-visited profiles

### 4.2 User Management
- Paginated table: Name, Email, Tier (badge), Verified ✓, Joined, Status
- Filters: tier, verified, suspended, date range
- Actions: View profile, Verify, Suspend/Unsuspend, Delete
- Confirm modal for destructive actions

### 4.3 Profile Management
- Paginated table: Photo, Name, Age, Location, Tier, isActive
- Filters: gender, state, tier, active/inactive, has photo
- Actions: View profile, Deactivate, Feature on homepage, Delete

### 4.4 Reports / Moderation (Priority Queue)
- Shows only pending reports by default
- Columns: Reporter, Reported Profile, Reason, Date
- Actions: Dismiss, Warn User (sends notification), Suspend User, Delete Profile
- Color-coded rows: red = serious, yellow = minor

### 4.5 Membership & Revenue
- Revenue summary: Total, This Month, By Tier (breakdown cards)
- Table: User, Plan, Amount, Date, Payment Status
- Action: Manually grant tier upgrade (e.g. for support cases)

### 4.6 Interest Audit
- Read-only table: From → To, Status, Date
- Filter by status: pending, accepted, rejected
- Useful for detecting spam/abuse patterns

### 4.7 Communication Audit (Phase D)
- Read-only conversation list
- Searchable by user
- No destructive actions here — suspend from User Management

### 4.8 Platform Settings
- Toggle: Maintenance mode (shows banner on user app)
- Set: Max photos per user
- Manage: Membership tier pricing (name, price, duration)
- Feature profiles: pick profiles to show on homepage diamond section

---

## 5. Design & Tech

| Concern | Decision |
|---------|----------|
| Framework | Angular standalone (same as user app) |
| Charts | Chart.js via `ng2-charts` |
| Tables | Custom Angular `@for` tables, no heavy libraries |
| Styling | Clean professional: dark left sidebar (#0f172a), white content, slate text |
| Icons | Font Awesome (same as user app) |
| Auth | JWT stored in `localStorage`, `adminAuth` guard on all routes |

---

## 6. Phased Delivery

### Phase A – Foundation + Core Management (Priority)

- [x] Bootstrap Angular admin app (`admin/`)
- [x] Admin login page + JWT auth + `admin.guard`
- [x] Admin layout (sidebar + topbar)
- [x] Backend: `isAdmin` field, `adminAuth` middleware, `/api/admin/stats`, `/api/admin/users/*`
- [x] Dashboard overview (stats cards + charts)
- [x] User management (list, suspend, verify, delete)

### Phase B – Moderation + Profiles

- [x] Backend: `/api/admin/profiles/*`, `/api/admin/reports/*` *(reports: ✅ Cursor)*
- [x] Profile management (list, deactivate, feature)
- [x] Reports / moderation queue (dismiss, warn, suspend) *(Cursor)*

### Phase C – Revenue + Audit

- [x] Backend: `/api/admin/orders`, `/api/admin/interests` *(Cursor)*
- [x] Membership & revenue view *(Cursor)*
- [x] Interest audit table *(Cursor)*

### Phase D – Settings + Communication Audit

- [x] Platform settings form *(Cursor — UI only; backend needed for persistence)*
- [ ] Communication audit (read-only conversations)
- [x] Maintenance mode toggle *(Cursor — UI only; backend needed)*

---

## 7. Work Split (Cursor vs Antigravity)

> **Rule**: Each agent owns their features **end-to-end** (backend route + frontend component). No agent touches the other's files. Shared foundation (layout, auth, API service) is built by **Antigravity first** before Cursor starts any frontend work.

---

### ✅ MUST DO FIRST — Antigravity (Blocking Foundation)

These must be completed before Cursor can start. **Antigravity delivers these before anything else.**

| # | Task | Files Owned | Blocks |
|---|------|------------|--------|
| F1 | `isAdmin` field on User model | `backend/src/models/User.js` | Everything |
| F2 | `adminAuth` middleware | `backend/src/middleware/adminAuth.js` | All admin API routes |
| F3 | Bootstrap Angular admin app at `admin/` | `admin/` (entire app scaffold) | All frontend work |
| F4 | Admin login page + JWT auth service | `admin/src/app/components/login/`, `admin/src/app/services/admin-auth.ts` | All protected pages |
| F5 | Admin layout (sidebar + topbar) component | `admin/src/app/components/layout/` | All page components |
| F6 | Shared `AdminApiService` with interceptor | `admin/src/app/services/admin-api.ts` | All service calls |
| F7 | Admin app routes file (skeleton with all paths) | `admin/src/app/app.routes.ts` | Route registration |

---

### 🚀 Antigravity — Core Features (After Foundation)

| # | Feature | Backend Files | Frontend Files | Status |
|---|---------|--------------|----------------|--------|
| A1 | Stats API + Dashboard component | `backend/src/routes/admin.js` (stats endpoint) | `admin/src/app/components/dashboard/` | ✅ Done |
| A2 | Users API + User Management component | `backend/src/routes/admin.js` (users endpoints) | `admin/src/app/components/users/` | ✅ Done |
| A3 | Profiles API + Profile Management component | `backend/src/routes/admin.js` (profiles endpoints) | `admin/src/app/components/profiles/` | ✅ Done |

**Antigravity Backend Routes:**
```
GET  /api/admin/stats
GET  /api/admin/users          (paginated, filters: tier, verified, suspended)
GET  /api/admin/users/:id
PUT  /api/admin/users/:id/suspend
PUT  /api/admin/users/:id/verify
PUT  /api/admin/users/:id/membership
DELETE /api/admin/users/:id
GET  /api/admin/profiles       (paginated, filters: gender, state, tier, isActive)
GET  /api/admin/profiles/:id
PUT  /api/admin/profiles/:id/deactivate
PUT  /api/admin/profiles/:id/feature
```

**Antigravity Frontend Delivery:**
- Dashboard: stats cards (users, profiles, reports, revenue), line chart (registrations/30d), bar chart (interest activity)
- Users page: sortable table, tier badge, verify/suspend/delete actions, confirm modal
- Profiles page: photo thumbnail, tier badge, deactivate/feature actions

---

### 🖱️ Cursor — Moderation + Revenue + Audit (After Foundation is done)

| # | Feature | Backend Files | Frontend Files | Status |
|---|---------|--------------|----------------|--------|
| C1 | Reports API + Moderation component | `backend/src/routes/admin.js` (reports endpoints) | `admin/src/app/components/reports/` | ✅ Done |
| C2 | Orders API + Revenue component | `backend/src/routes/admin.js` (orders endpoint) | `admin/src/app/components/orders/` | ✅ Done |
| C3 | Interests API + Audit component | `backend/src/routes/admin.js` (interests endpoint) | `admin/src/app/components/interests/` | ✅ Done |
| C4 | Platform Settings component | No new backend needed (uses existing settings model) | `admin/src/app/components/settings/` | ✅ Done (UI only) |

**Cursor Backend Routes:**
```
GET  /api/admin/reports        (filter: pending/resolved/dismissed)
PUT  /api/admin/reports/:id/resolve
PUT  /api/admin/reports/:id/dismiss
GET  /api/admin/orders         (paginated, filter: status, tier)
GET  /api/admin/interests      (filter: status, date range)
```

**Cursor Frontend Delivery:**
- Reports page: color-coded rows (red/yellow severity), dismiss/warn/suspend actions
- Orders page: revenue summary cards, payments table, manual tier grant
- Interests page: read-only audit table, filter by status
- Settings page: maintenance toggle, max photos input, tier pricing table

---

### 📋 Delivery Order & Dependencies

```
Week 1 (Antigravity):
  Day 1-2: F1–F7 (Foundation — bootstrap app, auth, layout, API service)
  Day 3-4: A1 (Stats API + Dashboard)
  Day 5:   A2 (Users API + User Management)

Week 2 (Both in parallel):
  Antigravity: A3 (Profiles API + Profile Management)
  Cursor:      C1 (Reports API + Moderation) [can start once F1-F7 done]
               C2 (Orders + Revenue)
               C3 (Interests audit)
               C4 (Platform Settings)
```

---

### 🤝 Shared Contracts (Do Not Change Without Coordination)

| Contract | Owner | Used By |
|----------|-------|---------|
| `AdminApiService` base class | Antigravity | Both agents' services |
| `AdminLayoutComponent` | Antigravity | All page components |
| `adminAuth` middleware | Antigravity | All backend admin routes |
| `app.routes.ts` route paths | Antigravity (skeleton) | Both add their own route entries |
| JWT token key in localStorage | Antigravity | Both auth guards |
| Admin API base URL: `/api/admin` | Antigravity | All API calls |



---

## 9. Environment Notes

- Admin app API base: `http://localhost:5006/api/admin`
- Admin dev port: `4401`
- Seed script: Add one admin user manually (`isAdmin: true`) for initial access

---

## 10. File Reference (Admin App)

| Purpose | Path |
|---------|------|
| Admin app entry | `admin/src/main.ts` |
| Admin routes | `admin/src/app/app.routes.ts` |
| Admin API service | `admin/src/app/services/admin-api.ts` |
| Admin layout | `admin/src/app/components/layout/` |
| Dashboard component | `admin/src/app/components/dashboard/` |
| Users component | `admin/src/app/components/users/` |
| Backend admin routes | `backend/src/routes/admin.js` |
| Backend admin middleware | `backend/src/middleware/adminAuth.js` |
