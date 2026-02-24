# Guest Browsing Plan – What to Show Unauthenticated Users

> **Safety first.** Some people misuse publicly available info. Do not reveal user images or personal details without login. Goals: attract visitors, protect members, drive sign-ups.

---

## Implementation Status ✅

| Item | Status | Notes |
|------|--------|-------|
| G1 Backend (profile IDs only for guests) | ✅ Done | `profileController.getProfiles` |
| G2 Home guest mode | ✅ Done | Placeholder cards, login redirect |
| G3 Login redirect param | ✅ Done | `authGuard`, `login.ts` |
| G4 Search guest mode | ✅ Done | Placeholder cards, login redirect |
| G5 Profile List guest mode | ✅ Done | Placeholder cards, login redirect |
| Rate limiting | ✅ Done | `express-rate-limit` on `/profiles/list` (60/min) |
| Guest activity logging | ✅ Done | `logGuestActivity` in profileController (no PII) |
| Sticky banner | ✅ Done | `GuestBannerComponent` – "Join free to connect" |

---

## 1. Core Principle

**Safety over conversion.** Unauthenticated users must NOT see:
- Profile photos (real images)
- Names, age, location, religion, caste, education, profession
- Bio, contact info, or any identifying details

Bad actors can misuse such data (harassment, stalking, fraud). Keep member info behind login.

---

## 2. Current State

| Route | Auth Required | Guest Access |
|-------|---------------|--------------|
| `/` (Home) | No | ✅ Locked preview (placeholder cards only) |
| `/search` | No | ✅ Locked preview (placeholders only) |
| `/profiles/:tier` | No | ✅ Locked preview (placeholder cards only) |
| `/profile/:id` | **Yes** | ❌ Redirects to login (keep) |
| `/login`, `/register`, `/terms`, `/privacy` | No | ✅ Full access |
| All other routes | Yes | ❌ Redirect to login |

**Implemented:** Home, Search, Profile List show placeholder cards to guests. No photos, names, or PII.

---

## 3. Recommended Strategy: Locked Preview

**Principle:** Guests see that profiles exist, but no real member data. All personal info and images require login.

| Approach | Guest Sees | Safe? |
|----------|------------|-------|
| **A. Full lock** | Nothing—redirect to login on any profile click | ✅ Safest |
| **B. Locked preview** (recommended) | Placeholder cards, no photos, no names, "Login to view" | ✅ Safe |
| **C. Teaser** | Blurred photo, first name, age, location | ❌ Still risky |

---

## 4. Proposed Access Matrix

### 4.1 Pages & Routes

| Page | Guest Access | Notes |
|------|--------------|-------|
| **Home** | ✅ Locked preview | Hero, CTAs, placeholder profile cards (no photos, no names) |
| **Search** | ✅ Locked preview | Search form works; results show placeholders only |
| **Profile List** (`/profiles/gold`, etc.) | ✅ Locked preview | Placeholder cards only |
| **Single Profile** (`/profile/:id`) | ❌ **Login required** | Redirect to login. No teaser. |
| **Login, Register, Terms, Privacy** | ✅ Full | No change. |
| **All other** | ❌ Login required | No change. |

### 4.2 What Guests See (Locked Preview)

**Profile cards (Home, Search, Profile List):**

| Element | Guest | Signed-in |
|---------|-------|-----------|
| Photo | ❌ Placeholder (avatar icon, silhouette, or generic image) | ✅ Real photo |
| Name | ❌ "Member" or "Login to view" | ✅ Real name |
| Age, Location | ❌ Hidden | ✅ Shown |
| Match % | ❌ Hidden | ✅ Shown |
| CTA | "Login to view profile" | "View profile" |

**Single profile:** Guest cannot open. Clicking a card → redirect to `/login` (with `?redirect=/profile/:id`).

### 4.3 What Guests Never See (Without Login)

- Real profile photos
- Names (first or full)
- Age, height, location
- Religion, caste, education, profession
- Bio, about
- Contact (phone, email)
- Match score
- Any identifying information

---

## 5. Implementation Checklist

### 5.1 Home, Search, Profile List – Guest Mode

- [x] Detect guest vs signed-in in each component.
- [x] **For guests:** Do NOT fetch or display real profile data. Show:
  - Placeholder cards (e.g. grey avatar, "Member", "Login to view")
  - Count: "X members in your area" (optional, if safe)
  - CTA: "Create free profile to browse"
- [x] **For signed-in:** Keep current behavior (real photos, names, etc.).
- [x] Guest clicking a card → redirect to `/login?redirect=/profile/:id`.

### 5.2 Single Profile

- [x] Keep `authGuard` on `/profile/:id`. No change.
- [x] Guest never reaches single profile page.

### 5.3 Backend

- [x] Option B: Return profile IDs only (for "X profiles match" message); no photos, names, or details.
- [x] Never return contact, photos, or PII to unauthenticated clients.
- [x] Rate limit guest-accessible endpoint (`/profiles/list` – 60 req/min).
- [x] Log guest activity for analytics (no PII).

### 5.4 Navbar / Layout

- [x] For guests: show "Login" and "Register" prominently.
- [x] Sticky banner "Join free to connect with verified profiles" (`GuestBannerComponent`).

---

## 6. Content Summary by Page

### Home (`/`)

| Section | Guest | Signed-in |
|---------|-------|-----------|
| Hero / headline | ✅ | ✅ |
| Featured profiles | Placeholder cards only | ✅ Real cards |
| Gold profiles | Placeholder cards only | ✅ Real cards |
| CTAs | "Register free", "Login" | User menu |

### Search (`/search`)

| Section | Guest | Signed-in |
|---------|-------|-----------|
| Search form | ✅ | ✅ |
| Results | "Login to view matches" or placeholders | ✅ Real results |

### Profile List (`/profiles/gold`, etc.)

| Section | Guest | Signed-in |
|---------|-------|-----------|
| Tier header | ✅ | ✅ |
| Profile grid | Placeholder cards only | ✅ Real cards |

---

## 7. Privacy & Safety Rules

- **Never expose** photos, names, age, location, religion, caste, education, profession, bio, or contact to guests.
- **No teaser** of personal data—even "first name" or "blurred photo" can be misused.
- **Rate limit** any guest-accessible endpoints to reduce scraping.
- **Log** guest activity only for analytics (no PII).

---

## 8. Work Split (Cursor vs Antigravity)

> Each agent owns their tasks end-to-end. Shared: `AuthService.isAuthenticated()` for guest detection. Coordinate placeholder card design (grey avatar, "Member", "Login to view") for consistency.

### Antigravity

| # | Task | Files |
|---|------|-------|
| G1 | Backend: For unauthenticated requests to profile list/search, return empty or count-only (no photos, names, PII) | `backend/src/routes/profiles.js`, `backend/src/controllers/profileController.js` |
| G2 | Home component: Guest mode—placeholder cards only; signed-in gets real data; guest card click → `/login?redirect=/profile/:id` | `frontend/src/app/components/home/` |
| G3 | Login: Support `?redirect=` param so guest returns to intended profile after login | `frontend/src/app/guards/auth.ts`, `frontend/src/app/components/login/` |

### Cursor

| # | Task | Files |
|---|------|-------|
| G4 | Search component: Guest mode—placeholders or "Login to view"; signed-in gets real results; guest card click → `/login?redirect=/profile/:id` | `frontend/src/app/components/search/` |
| G5 | Profile List component: Guest mode—placeholder cards only; signed-in gets real data; guest card click → `/login?redirect=/profile/:id` | `frontend/src/app/components/profile-list/` |

### Shared / Coordination

| Item | Owner | Notes |
|------|-------|-------|
| Placeholder card design | Either | Grey avatar, "Member", "Login to view" — keep consistent across Home, Search, Profile List |
| `AuthService.isAuthenticated()` | Antigravity | Already exists; both use it for guest detection |
| Backend contract | Antigravity | Define response shape for guest (empty array vs count-only); Cursor's frontend adapts |

### Delivery Order

```
1. Antigravity: G1 (Backend) — blocks frontend guest mode
2. Antigravity: G2 (Home), G3 (Login redirect)
3. Cursor:      G4 (Search), G5 (Profile List)
```

---

## 9. File Reference

| Change | File | Status |
|--------|------|--------|
| Backend profile list for guests | `backend/src/routes/profiles.js`, `backend/src/controllers/profileController.js` | ✅ |
| Rate limiting | `backend/src/middleware/guestRateLimit.js` | ✅ |
| Guest activity logging | `backend/src/helpers/guestActivity.js` | ✅ |
| Home guest mode | `frontend/src/app/components/home/` | ✅ |
| Search guest mode | `frontend/src/app/components/search/` | ✅ |
| Profile List guest mode | `frontend/src/app/components/profile-list/` | ✅ |
| Login redirect param | `frontend/src/app/guards/auth.ts`, `frontend/src/app/components/login/` | ✅ |
| Sticky guest banner | `frontend/src/app/components/guest-banner/` | ✅ |
| Profile card click (redirect) | Each component handles its own cards | ✅ |
