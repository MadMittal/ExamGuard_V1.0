# ExamGuard Cloud Migration — Initial Assessment & Clarifying Questions

## 🔍 Current State Analysis

After thoroughly reviewing the existing codebase, here's what I found:

### Existing Architecture (ExamGuard 2.0)
| Component | Technology | Status |
|-----------|-----------|--------|
| Backend | Google Apps Script ([Code.gs](file:///c:/Users/mitta/Downloads/ExamGuard%202.0%20%28BackUp%29/ExamGuard%202.0/Code.gs)) — 2,093 lines | Fully functional |
| Frontend | Monolithic HTML ([ExamPortal.html](file:///c:/Users/mitta/Downloads/ExamGuard%202.0%20%28BackUp%29/ExamGuard%202.0/ExamPortal.html)) — 2,617 lines | Fully functional |
| Database | Google Sheets (7 sheets: Config, Forms, Students, Sessions, Activity, Report, Dashboard) | Working but not scalable |
| Auth | Email-based (no OAuth; roster check via Sheets) | Basic |
| Exam Delivery | Google Forms embedded in iframe | Working |
| Monitoring | 11 violation types (tab switch, focus loss, clipboard, idle, webcam, etc.) | Comprehensive |

### Cloud Migration Target (examguard-cloud)
| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | Next.js 16.2.10 + React 19 + TailwindCSS v4 + TypeScript | **Scaffolded only** (default template) |
| Backend | Not yet selected (Firebase vs Supabase) | **Not started** |
| Deployment | Vercel (planned) | **Not configured** |

> [!IMPORTANT]
> The `examguard-cloud` project is currently just a `create-next-app` scaffold — no ExamGuard functionality has been implemented yet. The entire application needs to be built from scratch on the new stack.

### Key Features to Migrate
1. **Student Portal** — Email login → Exam info → Start session → Embedded Google Form + monitoring overlay
2. **Admin Dashboard** — Live session monitoring, form management, student roster, settings, reports
3. **Proctoring Engine** — Real-time violation detection (11 types), integrity scoring, auto-termination
4. **Session Management** — Start/resume/end sessions, one-submission-per-email enforcement
5. **Reporting** — Violation summaries, per-student reports, activity logs
6. **Webcam Snapshots** — Optional periodic capture saved to Drive (needs cloud storage equivalent)
7. **Email Alerts** — Configurable notifications to TAs/faculty

---

## ❓ Critical Clarifying Questions

I need answers to these questions before I can produce accurate documentation. Each question directly impacts architecture, schema design, and free-tier feasibility.

---

### Q1: Exam Concurrency & Timing Pattern
**How do 500 students use the system simultaneously?**
- Do all 500 students start the exam at the **exact same time** (e.g., scheduled exam at 10:00 AM), or do they trickle in over a window?
- What's the expected **exam duration** (30 min, 1 hr, 3 hr)?
- Will there be **multiple exams running concurrently** (e.g., Section A taking Quiz 1 while Section B takes Quiz 2)?

> **Why this matters**: A thundering herd of 500 simultaneous session-starts is very different from a gradual ramp-up. This dictates whether we need connection pooling, edge caching, or session pre-warming. The free-tier limits of Firebase (100 simultaneous connections on Realtime DB) and Supabase (500 connections on Postgres) are directly impacted.

---

### Q2: Heartbeat / Monitoring Frequency
**How frequently does each student's browser send violation events (heartbeats) to the backend?**

Looking at the existing code, `apiLogEvents` is called periodically. What interval are you currently using?
- Every 5 seconds? 10 seconds? 30 seconds?
- Do you batch events or send individually?

> **Why this matters**: With 500 students × 1 heartbeat every 10 seconds = **3,000 writes/minute**. Firebase Firestore free tier allows ~20K writes/day (~14/min). Supabase free tier has no hard write limit but has **500 MB storage** and **2 GB bandwidth**. This is the **single biggest factor** in choosing Firebase vs Supabase and in designing the batching strategy.

---

### Q3: Google Forms Dependency
**Will the cloud version continue to use Google Forms for exam delivery, or are you building a custom question engine?**
- If keeping Google Forms, the backend only tracks monitoring/proctoring data (much simpler)
- If building a custom engine, we need question schema, answer validation, scoring logic, and potentially rich content (images, math equations)

> **Why this matters**: Keeping Google Forms dramatically reduces scope and free-tier usage (no need to store questions/answers). Building a custom engine adds 3-5x the complexity and data volume.

---

### Q4: Authentication & Identity
**How should students authenticate in the cloud version?**
- Keep the current approach (email-only, no password)?
- Use Firebase Auth / Supabase Auth (Google OAuth, email magic links, etc.)?
- Require institutional SSO (SAML/OIDC)?

> **Why this matters**: Firebase Auth free tier supports unlimited users. Supabase Auth also supports unlimited. But the auth choice affects the frontend UX, session security, and whether a student can impersonate another by typing their email.

---

### Q5: Real-Time Dashboard Requirements
**Does the admin dashboard need real-time updates (live push), or is periodic polling acceptable?**
- Current system: Admin manually refreshes the sidebar in Google Sheets
- Cloud option A: WebSocket/SSE push (every violation appears instantly)
- Cloud option B: Poll every 10-30 seconds

> **Why this matters**: Real-time push for 500 students requires WebSocket connections. Firebase Realtime Database handles this natively (but has 100 concurrent connections on free tier). Supabase has Realtime channels (limited to 200 concurrent on free tier). Polling is simpler and cheaper but less impressive.

---

### Q6: Data Retention & Storage
**How long should exam data be retained?**
- Keep forever?
- Purge after semester/term?
- How many exams per month, and how many students per exam?

> **Why this matters**: Supabase free tier has **500 MB** database storage. Firebase Firestore free tier has **1 GiB** storage. With 500 students × 50 violations avg × 12 exams/year, we need to estimate storage growth. Webcam snapshots are the wildcard — a single JPEG is ~50-100 KB. 500 students × 60 snapshots/exam = 1.5-3 GB per exam (⚠️ far exceeds free tier).

---

### Q7: Webcam Snapshot Strategy
**Is the webcam snapshot feature required for the cloud version?**
- If yes, where should images be stored? (Firebase Storage free tier: 5 GB, Supabase Storage free tier: 1 GB)
- Can you use lower resolution / higher compression?
- Is client-side face-detection (AI proctoring) on the roadmap?

> **Why this matters**: Webcam storage is the most likely feature to blow through free-tier limits. A single exam with 500 students could consume 3 GB. We may need to make this optional or store images only on the client with hash verification.

---

### Q8: Offline / Degraded Mode Handling
**What should happen when a student's internet connection drops temporarily?**
- Buffer events locally and sync when reconnected?
- Pause the exam timer?
- Auto-terminate after X seconds of no contact?

> **Why this matters**: The current Apps Script system doesn't handle offline gracefully. For a cloud version serving 500 students, network interruptions are guaranteed. A proper offline queue with client-side event buffering reduces backend load and prevents false terminations.

---

### Q9: Multi-Tenancy / Institution Scope
**Is this for a single institution (Masters Union), or will multiple institutions use the same deployment?**
- Single-tenant: One Vercel deployment, one Firebase/Supabase project
- Multi-tenant: Shared infrastructure with tenant isolation

> **Why this matters**: Multi-tenancy multiplies free-tier pressure by the number of tenants. Single-tenant is dramatically simpler and stays within free-tier limits more easily.

---

### Q10: Admin User Management
**Who are the admin users, and how are they managed?**
- Single super-admin (the faculty member)?
- Multiple TAs with different permission levels?
- Need role-based access control (RBAC)?

> **Why this matters**: RBAC adds complexity to the auth system and database schema. If it's just one faculty + a few TAs, a simple `is_admin` flag suffices. If there are department heads, multiple courses, etc., we need a proper roles/permissions system.

---

## 🏗️ Firebase vs Supabase — Preliminary Recommendation

| Criteria | Firebase (Firestore + RTDB) | Supabase (Postgres + Realtime) |
|----------|---------------------------|-------------------------------|
| **Free Concurrent Connections** | 100 (RTDB), unlimited (Firestore) | 200 (Realtime), 500 (Postgres) |
| **Free Storage** | 1 GiB (Firestore) + 5 GB (Storage) | 500 MB (DB) + 1 GB (Storage) |
| **Free Reads/Day** | 50K (Firestore) | Unlimited (Postgres) |
| **Free Writes/Day** | 20K (Firestore) | Unlimited (Postgres) |
| **Free Bandwidth** | 10 GB/month | 2 GB/month (5 GB DB bandwidth) |
| **Auth** | Unlimited users, free | Unlimited users, free (50K MAU) |
| **Edge Functions** | Cloud Functions (2M invocations/month) | Edge Functions (500K invocations/month) |
| **Real-Time** | Native (RTDB) | Postgres LISTEN/NOTIFY |
| **SQL Support** | ❌ NoSQL only | ✅ Full PostgreSQL |
| **Relational Queries** | Limited (collection-based) | Full JOINs, views, CTEs |

### My Preliminary Recommendation: **Supabase** 🏆

> [!TIP]
> **Supabase is the stronger choice for ExamGuard** for these reasons:
> 
> 1. **Relational data model fits perfectly** — Sessions, students, forms, violations, and reports have clear relational structures with foreign keys. The existing Google Sheets schema already uses relational patterns.
> 2. **No read/write quotas** — Firebase's 20K writes/day is dangerously tight for 500 students generating heartbeats. Supabase has no hard limits on database operations.
> 3. **SQL reporting** — The reporting/dashboard features need aggregate queries (GROUP BY, JOINs, window functions). Firestore can't do this without client-side aggregation.
> 4. **Row-Level Security (RLS)** — Supabase's RLS policies can enforce "students can only see their own sessions" at the database level, reducing API surface.
> 5. **200 Realtime connections** — Sufficient for admin dashboard (you don't need real-time for all 500 students; only admin needs it).

> [!WARNING]
> **The Supabase risks to mitigate:**
> - **500 MB storage**: Must implement data retention policies and avoid storing webcam images in the DB
> - **2 GB bandwidth**: Must optimize payload sizes, use client-side caching, and minimize polling frequency
> - **Rate limiting on free tier**: Must implement client-side debouncing and event batching

---

## ⚡ Rate-Limiting, Caching & Optimization Strategies

### 1. Client-Side Event Batching
```
Instead of: 500 students × 1 event/10sec = 3,000 writes/min
Batch to:   500 students × 1 batch/30sec = 1,000 writes/min
Each batch contains up to 10 events as a JSONB array in a single row.
```

### 2. Heartbeat Optimization (Dual-Channel Strategy)
- **Channel A (Lightweight)**: Timestamp-only heartbeat via Supabase Realtime presence — no DB write needed
- **Channel B (Event flush)**: Actual violation events batched and written every 30 seconds

### 3. Session State Caching
- Cache active session data in browser `sessionStorage`
- Only fetch from DB on page load or reconnection
- Use Supabase Realtime subscriptions for admin dashboard (push, not poll)

### 4. Edge Caching (Vercel)
- Cache exam info, settings, and form URLs at the edge (Vercel ISR or middleware)
- These don't change during an exam — serve from cache for all 500 students

### 5. Database Write Optimization
- Use `INSERT ... ON CONFLICT` (upsert) to avoid read-before-write patterns
- Store violation events as JSONB arrays inside the session row (denormalized) to reduce row count
- Use Postgres `NOTIFY` for admin dashboard updates instead of polling queries

---

## 🚨 Reliability Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase free-tier downtime | All 500 students lose monitoring | Client-side event buffer (IndexedDB), retry queue, graceful degradation |
| Bandwidth overage (2 GB) | API calls fail | Aggressive compression, minimal payloads, binary protocol for heartbeats |
| Storage overflow (500 MB) | Can't write new data | Auto-archive old exams to exported JSON, TTL-based cleanup |
| Cold start latency | Slow API responses after idle | Vercel Edge Functions (no cold start), keep-alive pings |
| Single point of failure | No redundancy on free tier | Client-side state persistence, offline-first architecture |
| Exam start thundering herd | 500 simultaneous session creates | Pre-create session stubs, stagger form loads, use Vercel edge cache |

---

## 📋 Next Steps

Once you answer the 10 questions above, I will produce the six documents in this order:

1. **PRD** — Product Requirements Document
2. **TRD** — Technical Requirements Document
3. **App Flow** — User journey + system flow diagrams
4. **UI/UX Brief** — Design principles and wireframes
5. **Backend Schema** — Database design with indexes and RLS policies
6. **Implementation Workflow** — Sprint breakdown and deployment plan

Each document will be specifically tailored to Supabase free-tier constraints (or Firebase, if your answers change my recommendation).
