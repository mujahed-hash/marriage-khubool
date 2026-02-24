# Membership Tier Specification

> Reference for tier features, limits, and pricing. Use for implementing tier-based access control.

---

## Tier Hierarchy (Low → High)

Bronze → Silver → Gold → Diamond → Crown

---

## Bronze Membership — Free / Basic Access

- Create Profile
- Browse Profiles
- **Limited Access to Profile Details**
- **Limited Interaction Options**
- **Contact Details Locked**
- **Limited Profile Views**
- Profile Highlighting: **No Highlighting Available**

---

## Silver Membership

| Duration | Price | Savings |
|----------|-------|---------|
| 1 Month | ₹299 | — |
| 2 Months | ₹569 | Save ₹29 |
| 3 Months | ₹799 | Save ₹98 |
| 6 Months | ₹1299 | Save ₹495 |

**Features:**
- Full Access to **12 Profiles/Day**
- Chats per Profile: **15 messages**
- Photo Requests: **15 per day**
- See Who Viewed Your Profile
- Profile Boost: After 2 months
- Advanced Search Filters
- Customer Support
- Profile Highlighting: 7 / 15 / 30 / 60 Days (by duration)

---

## Gold Membership

| Duration | Price | Savings |
|----------|-------|---------|
| 1 Month | ₹499 | — |
| 2 Months | ₹949 | Save ₹49 |
| 3 Months | ₹1299 | Save ₹198 |
| 6 Months | ₹2299 | Save ₹999 |

**Features:**
- Full Access to **25 Profiles/Day**
- Chats per Profile: **30 messages**
- Photo Requests: **30 per day**
- See Who Viewed Your Profile
- Profile Boost: Monthly
- Verified Badge on Profile
- Enhanced Search Filters
- Priority Support
- Profile Highlighting: 14 / 30 / 45 / 90 Days (by duration)

---

## Diamond Membership

| Duration | Price | Savings |
|----------|-------|---------|
| 1 Month | ₹699 | — |
| 2 Months | ₹1299 | Save ₹99 |
| 3 Months | ₹1799 | Save ₹398 |
| 6 Months | ₹2999 | Save ₹1395 |

**Features:**
- **Full Access to All Profiles**
- **Unlimited Profile Viewing**
- **Unlimited Messaging**
- See Who Viewed Your Profile
- Profile Boost: Monthly
- Verified Badge on Profile
- Enhanced Search Filters
- Priority Support
- Partner Requirements Access
- Personalized Profile Suggestions
- Early Access to New Features
- Profile Highlighting: 30 / 60 / 90 / 120 Days (by duration)

---

## Crown Membership

| Duration | Price |
|----------|-------|
| Lifetime (Till Marry) | ₹9999 |

**Features:**
- Full Access to All Profiles
- Unlimited Profile Viewing
- Unlimited Messaging
- See Who Viewed Your Profile
- Enhanced Search Filters
- Priority Support
- Profile Boost: Monthly
- Verified Badge on Profile
- Partner Requirements Access
- Personalized Profile Suggestions
- Early Access to New Features
- Profile Highlighting: **120 Days (Lifetime)**

---

## Implementation Notes

### Profile View Limits (Daily)

| Tier | Full Profile Views/Day |
|------|------------------------|
| Bronze | Limited (e.g. 3–5) |
| Silver | 12 |
| Gold | 25 |
| Diamond | Unlimited |
| Crown | Unlimited |

### Contact Details

- **Bronze:** Locked (email, phone, alternate phone hidden)
- **Silver+:** Visible when within daily limit

### Profile Details

- **Bronze:** Limited sections (basic info only; contact locked)
- **Silver+:** Full access within daily limit
