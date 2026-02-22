# Admin Portal – Expansion Plan

> Broad access and control features for the Admin Portal. Builds on the foundation in `ADMIN_PLAN.md`.

**Completed by Cursor:** E1 (Audit log), E3 (Settings persistence), E4 (Announcements), E5 Orders export. Phase F (Photo mod, Conversation audit, Impersonate) pending.

---

## Overview

| Priority | Feature | Effort | Owner | Status |
|----------|---------|--------|-------|--------|
| High | Admin audit log | Moderate | Cursor | ✅ Done |
| High | Advanced search | Moderate | Antigravity | ✅ Done |
| High | Settings persistence | Moderate | Cursor | ✅ Done |
| High | Announcements | Moderate | Cursor | ✅ Done |
| High | Export to CSV | Moderate | Split | ✅ Done |
| High | Photo moderation queue | Higher | Cursor |
| High | Conversation audit | Higher | Cursor |
| High | Impersonate user | Higher | Cursor |

---

## Phase E – High Impact, Moderate Effort

### E1. Admin Audit Log *(Cursor)* ✅

**Purpose:** Track all admin actions for accountability and debugging.

| # | Task | Owner | Files |
|---|------|-------|-------|
| 1 | [x] Create `AdminAuditLog` model (adminId, action, resource, resourceId, details, ip, createdAt) | Cursor | `backend/src/models/AdminAuditLog.js` |
| 2 | [x] Middleware/helper to log admin actions (call after each admin mutation) | Cursor | `backend/src/helpers/adminAudit.js` |
| 3 | [x] `GET /api/admin/audit-log` (paginated, filter by action, date range, admin) | Cursor | `backend/src/routes/admin.js` |
| 4 | [x] Audit Log component: table (Admin, Action, Resource, Date, Details) | Cursor | `admin/src/app/components/audit-log/` |
| 5 | [x] Integrate logging into existing admin routes (suspend, delete, resolve, etc.) | Cursor | `backend/src/routes/admin.js` |

---

### E2. Advanced Search *(Antigravity)* ✅

**Purpose:** Find users by ID, email, phone, profile ID.

| # | Task | Owner | Files |
|---|------|-------|-------|
| 1 | [x] Extend `GET /api/admin/users` with `search` param (matches fullName, email, _id) | Antigravity | `backend/src/routes/admin.js` |
| 2 | [x] Extend `GET /api/admin/profiles` with `search` param (fullName, profileId, _id) | Antigravity | `backend/src/routes/admin.js` |
| 3 | [x] Add search input + quick-search to Users page | Antigravity | `admin/src/app/components/users/` |
| 4 | [x] Add search input + quick-search to Profiles page | Antigravity | `admin/src/app/components/profiles/` |
| 5 | [x] Optional: Global search bar in admin layout (searches users + profiles) | Antigravity | `admin/src/app/components/layout/` |

---

### E3. Settings Persistence *(Cursor)* ✅

**Purpose:** Backend for maintenance mode, max photos, tier pricing.

| # | Task | Owner | Files |
|---|------|-------|-------|
| 1 | [x] Create `PlatformSettings` model (singleton: maintenanceMode, maxPhotosPerUser, tierPricing[]) | Cursor | `backend/src/models/PlatformSettings.js` |
| 2 | [x] `GET /api/admin/settings` – return platform settings | Cursor | `backend/src/routes/admin.js` |
| 3 | [x] `PUT /api/admin/settings` – update platform settings | Cursor | `backend/src/routes/admin.js` |
| 4 | [x] Wire Settings component to API (load + save) | Cursor | `admin/src/app/components/settings/` |
| 5 | [x] User app: read maintenance mode (public endpoint or in app config) | Cursor | `backend/`, `frontend/` |

---

### E4. Announcements *(Cursor)* ✅

**Purpose:** Site-wide banners (maintenance, promotions).

| # | Task | Owner | Files |
|---|------|-------|-------|
| 1 | [x] Create `Announcement` model (title, message, type, active, startDate, endDate) | Cursor | `backend/src/models/Announcement.js` |
| 2 | [x] `GET /api/admin/announcements` – list all | Cursor | `backend/src/routes/admin.js` |
| 3 | [x] `POST /api/admin/announcements` – create | Cursor | `backend/src/routes/admin.js` |
| 4 | [x] `PUT /api/admin/announcements/:id` – update, toggle active | Cursor | `backend/src/routes/admin.js` |
| 5 | [x] `DELETE /api/admin/announcements/:id` | Cursor | `backend/src/routes/admin.js` |
| 6 | [x] Public `GET /api/platform/announcements/active` – active announcements for user app | Cursor | `backend/src/routes/platform.js` |
| 7 | [x] Admin: Announcements component (list, create, edit, toggle) | Cursor | `admin/src/app/components/announcements/` |
| 8 | [x] User app: Banner component to show active announcements | Cursor | `frontend/src/app/` |

---

### E5. Export to CSV *(Split)* ✅

**Purpose:** Export users, profiles, orders to CSV.

| # | Task | Owner | Files |
|---|------|-------|-------|
| 1 | [x] `GET /api/admin/export/users` – CSV download | Antigravity | `backend/src/routes/admin.js` |
| 2 | [x] `GET /api/admin/export/profiles` – CSV download | Antigravity | `backend/src/routes/admin.js` |
| 3 | [x] `GET /api/admin/export/orders` – CSV download | Cursor | `backend/src/routes/admin.js` |
| 4 | [x] Export buttons on Users page | Antigravity | `admin/src/app/components/users/` |
| 5 | [x] Export buttons on Profiles page | Antigravity | `admin/src/app/components/profiles/` |
| 6 | [x] Export button on Orders page | Cursor | `admin/src/app/components/orders/` |

---

## Phase F – High Impact, Higher Effort

### F1. Photo Moderation Queue *(Cursor)*

**Purpose:** Approve/reject photos before they go live.

| # | Task | Owner | Files |
|---|------|-------|-------|
| 1 | Add `status: pending|approved|rejected` to profile photos (or new Photo model) | Cursor | `backend/src/models/Profile.js` or new model |
| 2 | `GET /api/admin/photos/pending` – photos awaiting approval | Cursor | `backend/src/routes/admin.js` |
| 3 | `PUT /api/admin/photos/:id/approve` | Cursor | `backend/src/routes/admin.js` |
| 4 | `PUT /api/admin/photos/:id/reject` | Cursor | `backend/src/routes/admin.js` |
| 5 | Photo Moderation component: grid of pending photos, approve/reject actions | Cursor | `admin/src/app/components/photo-moderation/` |
| 6 | Update profile photo upload flow to set status=pending (or approved by default if no queue) | Cursor | `backend/` |
| 7 | User app: only show approved photos | Cursor | `frontend/`, `backend/` |

---

### F2. Conversation Audit *(Cursor)*

**Purpose:** Read chats for abuse investigations.

| # | Task | Owner | Files |
|---|------|-------|-------|
| 1 | Identify chat/message model and structure | Cursor | `backend/src/models/` |
| 2 | `GET /api/admin/conversations` – list conversations (paginated, filter by user) | Cursor | `backend/src/routes/admin.js` |
| 3 | `GET /api/admin/conversations/:id/messages` – read messages in a conversation | Cursor | `backend/src/routes/admin.js` |
| 4 | Conversation Audit component: search by user, list conversations, message viewer | Cursor | `admin/src/app/components/conversation-audit/` |
| 5 | Log access in AdminAuditLog (who viewed which conversation) | Cursor | `backend/` |

---

### F3. Impersonate User *(Cursor)*

**Purpose:** Login as user for debugging (with audit).

| # | Task | Owner | Files |
|---|------|-------|-------|
| 1 | `POST /api/admin/impersonate/:userId` – returns JWT as that user (admin token in header) | Cursor | `backend/src/routes/admin.js` |
| 2 | Log impersonation in AdminAuditLog (adminId, targetUserId, action: 'impersonate_start') | Cursor | `backend/` |
| 3 | `POST /api/admin/impersonate/end` – end session, return to admin | Cursor | `backend/` |
| 4 | Admin: Impersonate button on User detail page | Cursor | `admin/src/app/components/users/` |
| 5 | Open user app in new tab with impersonation token (or in-app switcher) | Cursor | `admin/` |
| 6 | Clear audit trail when impersonation ends | Cursor | `backend/` |

---

## Work Split Summary

| Agent | Phase E Tasks | Phase F Tasks |
|-------|---------------|---------------|
| **Antigravity** | E2 (Advanced search), E5.1–2 + E5.4–5 (Export users/profiles + UI) | — |
| **Cursor** | E1 (Audit log), E3 (Settings), E4 (Announcements), E5.3 + E5.6 (Export orders + UI) | F1 (Photo mod), F2 (Conversation audit), F3 (Impersonate) |

---

## Delivery Order

```
Phase E (parallel):
  Antigravity: E2 (Advanced search), E5 users/profiles export
  Cursor:      E1 (Audit log), E3 (Settings), E4 (Announcements), E5 orders export

Phase F (after E):
  Cursor:      F1 (Photo moderation) → F2 (Conversation audit) → F3 (Impersonate)
```

---

## New Routes Summary

**Cursor backend routes:**
```
GET    /api/admin/audit-log
GET    /api/admin/settings
PUT    /api/admin/settings
GET    /api/admin/announcements
POST   /api/admin/announcements
PUT    /api/admin/announcements/:id
DELETE /api/admin/announcements/:id
GET    /api/admin/export/orders
GET    /api/admin/photos/pending
PUT    /api/admin/photos/:id/approve
PUT    /api/admin/photos/:id/reject
GET    /api/admin/conversations
GET    /api/admin/conversations/:id/messages
POST   /api/admin/impersonate/:userId
POST   /api/admin/impersonate/end
```

**Antigravity backend routes:**
```
GET    /api/admin/export/users
GET    /api/admin/export/profiles
```

**Public (user app):**
```
GET    /api/platform/status
GET    /api/platform/announcements/active
```

---

## New Admin Components

| Component | Owner | Route |
|-----------|-------|-------|
| Audit Log | Cursor | `/audit-log` |
| Announcements | Cursor | `/announcements` |
| Photo Moderation | Cursor | `/photo-moderation` |
| Conversation Audit | Cursor | `/conversations` |

*(Advanced search and Export are enhancements to existing Users, Profiles, Orders pages.)*

---

## File Reference (New)

| Purpose | Path |
|---------|------|
| Admin audit log model | `backend/src/models/AdminAuditLog.js` |
| Platform settings model | `backend/src/models/PlatformSettings.js` |
| Announcement model | `backend/src/models/Announcement.js` |
| Admin audit helper | `backend/src/helpers/adminAudit.js` |
| Audit log component | `admin/src/app/components/audit-log/` |
| Announcements component | `admin/src/app/components/announcements/` |
| Photo moderation component | `admin/src/app/components/photo-moderation/` |
| Conversation audit component | `admin/src/app/components/conversation-audit/` |
