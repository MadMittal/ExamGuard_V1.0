# ExamGuard Cloud — Product Requirements Document (PRD)

**Version**: 1.0  
**Date**: July 21, 2025  
**Author**: Solutions Architect  
**Status**: Draft  
**Project**: ExamGuard Cloud Migration  

---

## 1. Executive Summary

ExamGuard Cloud is a migration of the existing ExamGuard 2.0 examination proctoring system from Google Apps Script + Google Sheets to a modern, scalable cloud architecture using **Next.js (Vercel)** for the frontend and **Supabase** for the backend — achieving **zero infrastructure cost** by operating entirely within free-tier limits.

The system monitors 500 concurrent students during online examinations, detecting integrity violations (tab switches, focus loss, clipboard usage, etc.), managing exam sessions, and providing real-time dashboards for faculty and TAs.

---

## 2. Assumed Context (Based on Codebase Analysis)

Since the project is migrating from a fully functional system, the following assumptions are derived from the existing [Code.gs](file:///c:/Users/mitta/Downloads/ExamGuard%202.0%20%28BackUp%29/ExamGuard%202.0/Code.gs) and [ExamPortal.html](file:///c:/Users/mitta/Downloads/ExamGuard%202.0%20%28BackUp%29/ExamGuard%202.0/ExamPortal.html):

| Question | Assumed Answer | Rationale |
|----------|---------------|-----------|
| Concurrency pattern | Thundering herd: 500 students within a 5-10 min window | University exam scheduling is time-boxed |
| Exam duration | 30-90 minutes typical | Standard academic exam length |
| Heartbeat interval | 15-30 seconds with client-side batching | Current code batches up to 50 events per call |
| Exam delivery | **Keep Google Forms** (iframe embed) | Deep integration exists; reduces scope dramatically |
| Authentication | Email-based with Supabase Auth (magic links optional) | Current system uses email-only; upgrade path available |
| Real-time dashboard | Admin gets Supabase Realtime push; students use REST | Only admin needs live updates |
| Data retention | Per-semester cleanup; ~6 months | Free-tier storage constraint |
| Webcam snapshots | Optional; stored in Supabase Storage with aggressive compression | Currently optional in ExamGuard 2.0 |
| Multi-tenancy | Single institution (Masters Union) | Current system is single-tenant |
| Admin roles | Faculty (super-admin) + TAs (limited admin) | Current system has TA Emails + Faculty Email |

---

## 3. User Personas

### 3.1 Student (Primary User — 500 concurrent)
- **Profile**: University student, age 18-25, tech-savvy, uses laptop/desktop
- **Goal**: Take the exam with minimal friction while maintaining academic integrity
- **Behavior**: Enters email → views exam info → starts session → completes Google Form → session ends
- **Pain Points**: Slow loading, false violation detections, unclear instructions, browser compatibility issues
- **Device**: Laptop/desktop with Chrome/Edge (mobile not supported for proctored exams)

### 3.2 Faculty / Professor (Admin — 1-3 users)
- **Profile**: University professor or course coordinator
- **Goal**: Create exams, monitor integrity in real-time, generate reports
- **Behavior**: Configures exam settings → links Google Form → monitors live dashboard → exports reports
- **Pain Points**: Complex setup, inability to intervene during exams, slow report generation
- **Device**: Laptop/desktop, any browser

### 3.3 Teaching Assistant (TA — 2-5 users)
- **Profile**: Graduate assistant helping faculty
- **Goal**: Monitor live sessions, flag suspicious students, assist with technical issues
- **Behavior**: Watches dashboard → flags students → ends sessions for violators
- **Pain Points**: Can't see all students at once, no alert notifications, limited permissions
- **Device**: Laptop/desktop or tablet

---

## 4. Feature Requirements

### 4.1 Priority Definitions
| Priority | Label | Definition |
|----------|-------|------------|
| **P0** | Must Have | Core functionality; migration fails without it |
| **P1** | Should Have | Important for parity with ExamGuard 2.0 |
| **P2** | Nice to Have | Enhancements beyond current capabilities |

---

### 4.2 Student Portal Features

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| SP-01 | Email Login | P0 | Student enters email to identify themselves |
| SP-02 | Exam Info Display | P0 | Show exam name, institution, time window, monitoring settings |
| SP-03 | Pre-Exam Checklist | P0 | Browser compatibility, fullscreen readiness, webcam permission (if enabled) |
| SP-04 | Session Start | P0 | Create session record, generate Google Form embed URL |
| SP-05 | Google Form Embed | P0 | Iframe embedding with email pre-fill |
| SP-06 | Violation Detection | P0 | Monitor 11 event types (tab switch, focus loss, clipboard, etc.) |
| SP-07 | Integrity Score Display | P0 | Real-time score counter visible to student (configurable) |
| SP-08 | Session Resume | P0 | Resume active session on page reload/reconnection |
| SP-09 | Auto-Termination | P0 | End session when violation thresholds exceeded |
| SP-10 | Manual Submit | P0 | Student clicks "Submit & End" to complete exam |
| SP-11 | Completion Screen | P1 | Post-exam summary with score and violation count |
| SP-12 | Countdown Timer | P1 | Show remaining time if exam has an end time |
| SP-13 | Offline Event Buffer | P2 | Queue events in IndexedDB during network interruptions |
| SP-14 | Blocked Student Screen | P0 | Clear message for terminated/completed/unenrolled students |

### 4.3 Admin Dashboard Features

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| AD-01 | Live Session Grid | P0 | Table of all active/completed/terminated sessions |
| AD-02 | Real-Time Metrics | P0 | Active/completed/terminated/alert counts |
| AD-03 | Form Management | P0 | Add/edit/delete Google Form links with time windows |
| AD-04 | Student Roster | P0 | Import students via CSV or email list; OPEN/CLOSED roster modes |
| AD-05 | Settings Panel | P0 | All 30+ configurable settings (deductions, thresholds, toggles) |
| AD-06 | End Single Session | P0 | Admin terminates a specific student's session |
| AD-07 | End All Sessions | P0 | Bulk terminate all active sessions |
| AD-08 | Flag Student | P1 | Admin adds a note/flag to a student's session |
| AD-09 | Activity Feed | P1 | Scrolling list of recent violation events across all students |
| AD-10 | Report Generation | P0 | Per-student violation breakdown with export |
| AD-11 | Auto-Form Detection | P1 | Fetch form metadata (title, fields) from Google Form URL |
| AD-12 | Shareable Portal Link | P1 | Generate URL for students to access the exam portal |
| AD-13 | Setup Wizard | P2 | Guided first-time setup flow |
| AD-14 | TA Role Support | P1 | Limited admin access for TAs (monitor + flag, no settings) |

### 4.4 Proctoring Engine Features

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| PE-01 | Tab Switch Detection | P0 | `visibilitychange` API |
| PE-02 | Focus Loss Detection | P0 | `blur` event on window |
| PE-03 | Fullscreen Monitoring | P0 | `fullscreenchange` API |
| PE-04 | Split Screen / Resize | P0 | Window resize below threshold |
| PE-05 | Clipboard Monitoring | P0 | `copy` and `paste` events |
| PE-06 | Right-Click Blocking | P0 | `contextmenu` event |
| PE-07 | Keyboard Shortcut Block | P0 | Restricted key combos (Ctrl+C, F12, Alt+Tab surface detection) |
| PE-08 | DevTools Detection | P0 | Size differential + F12/Ctrl+Shift+I detection |
| PE-09 | Idle Detection | P0 | No interaction for configurable timeout |
| PE-10 | Webcam Snapshots | P1 | Periodic JPEG capture with cloud storage |
| PE-11 | Event Batching | P0 | Client-side queue, flush every 30 seconds |
| PE-12 | Score Calculation | P0 | Configurable per-event deductions from 100 |

### 4.5 System Features

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| SY-01 | One-Submission Enforcement | P0 | Block multiple attempts per email per form |
| SY-02 | Terminated Block | P0 | Terminated students cannot resume or retake |
| SY-03 | Email Notifications | P1 | Configurable start/alert/end emails |
| SY-04 | Data Export | P1 | CSV export of reports |
| SY-05 | Auto-Archive | P2 | Cleanup old exam data to stay within storage limits |

---

## 5. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Concurrent Student Support | 500 students | Load test with simulated sessions |
| Page Load Time (Student Portal) | < 2 seconds | Lighthouse + Vercel Analytics |
| Heartbeat Reliability | > 99% delivery rate | Log analysis of sent vs received events |
| Session Start Latency | < 3 seconds | Time from "Start Exam" click to form display |
| Admin Dashboard Update Latency | < 5 seconds | Time from violation to dashboard appearance |
| Infrastructure Cost | ₹0 / month | Billing dashboard verification |
| Free-Tier Headroom | > 30% remaining quotas | Monthly quota monitoring |
| System Uptime | > 99.5% during exam hours | Health check monitoring |
| False Positive Rate (violations) | < 2% | Student complaints vs total violations |

---

## 6. Free-Tier Constraints & Guardrails

### 6.1 Supabase Free Tier (as of 2025)
| Resource | Limit | ExamGuard Usage Estimate | Headroom |
|----------|-------|------------------------|----------|
| Database Size | 500 MB | ~150 MB/semester | ✅ 70% |
| Bandwidth | 5 GB/month | ~2 GB during exam weeks | ✅ 60% |
| Storage (file) | 1 GB | ~500 MB (webcam optional) | ⚠️ 50% |
| Edge Functions | 500K invocations/month | ~200K during peak month | ✅ 60% |
| Realtime Connections | 200 concurrent | 5-10 (admin only) | ✅ 95% |
| Auth (MAU) | 50,000 | ~600 | ✅ 99% |
| API Requests | No hard limit | ~500K/month | ✅ |

### 6.2 Vercel Free Tier (Hobby Plan)
| Resource | Limit | ExamGuard Usage Estimate | Headroom |
|----------|-------|------------------------|----------|
| Bandwidth | 100 GB/month | ~5 GB | ✅ 95% |
| Serverless Function Execution | 100 GB-hours/month | ~10 GB-hours | ✅ 90% |
| Builds | 6,000 minutes/month | ~100 minutes | ✅ 98% |
| Edge Functions | Unlimited | Used for caching | ✅ |
| Deployments | Unlimited | ~20/month | ✅ |

### 6.3 Cost Guardrails
- **Supabase**: Configure billing alerts; enable "Pause project after inactivity" OFF during exam periods
- **Vercel**: Use Hobby plan (free); no commercial use restriction for educational tools
- **Webcam Storage**: Implement 7-day auto-delete policy for snapshot files
- **Database Cleanup**: Archive exams older than 6 months to exported JSON

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Student portal must load within 2 seconds on a 10 Mbps connection
- API responses must complete within 500ms (p95)
- Client-side monitoring must not degrade browser performance (< 2% CPU overhead)

### 7.2 Security
- All API endpoints authenticated via Supabase JWT tokens
- Row-Level Security (RLS) policies: students can only read/write their own sessions
- Admin endpoints protected by role check
- CORS restricted to the Vercel deployment domain
- No exam content stored in ExamGuard (remains in Google Forms)
- XSS and CSRF protection via Next.js built-in security headers

### 7.3 Availability
- Target 99.5% uptime during scheduled exam windows
- Graceful degradation: if Supabase is unreachable, buffer events locally
- No data loss: events queued in IndexedDB are flushed on reconnection

### 7.4 Compatibility
- Chrome 90+, Edge 90+, Firefox 90+ (desktop only)
- Minimum screen resolution: 1024 × 768
- Mobile explicitly blocked with a "use desktop" message

### 7.5 Accessibility
- Keyboard-navigable pre-exam flow
- High contrast mode support
- Screen reader compatible for non-monitoring screens
- Clear error messages with actionable instructions

---

## 8. Feature Comparison: ExamGuard 2.0 → Cloud

| Feature | ExamGuard 2.0 (Apps Script) | ExamGuard Cloud (Supabase + Next.js) |
|---------|----------------------------|-------------------------------------|
| Backend | Google Apps Script | Supabase (Postgres + Edge Functions) |
| Database | Google Sheets (7 tabs) | PostgreSQL (relational tables) |
| Frontend | Single HTML file (2,617 lines) | Next.js App Router (component-based) |
| Auth | Email text input (no verification) | Supabase Auth (email + optional OAuth) |
| Real-time | Manual refresh (sidebar) | Supabase Realtime (WebSocket push) |
| Concurrency | ~50 students (Sheets lock contention) | 500 students (connection pooling) |
| Hosting | Google Apps Script `/exec` URL | Vercel (global CDN) |
| Storage | Google Drive (webcam) | Supabase Storage (webcam) |
| Reporting | Google Sheets tab | SQL queries + CSV export |
| Scalability | Limited (6-min timeout, lock contention) | Horizontal (Vercel Edge + Supabase pool) |
| Cost | Free (Google Workspace) | Free (Supabase + Vercel free tier) |

---

## 9. Out of Scope (v1.0)

The following are explicitly **not** included in the initial cloud migration:

- ❌ Custom question engine (keep Google Forms)
- ❌ AI-based proctoring (face detection, eye tracking)
- ❌ Mobile app (native iOS/Android)
- ❌ Multi-tenant / multi-institution support
- ❌ LMS integrations (Canvas, Moodle, Blackboard)
- ❌ Video recording (webcam video stream)
- ❌ Plagiarism detection
- ❌ Multi-language support (English only)

---

## 10. Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Supabase free-tier changes | Low | High | Abstract DB layer; easy to swap |
| Google Forms iframe restrictions | Medium | High | Pre-test form embedding; fallback to direct link |
| Vercel hobby plan restrictions | Low | Medium | Static export fallback to Cloudflare Pages |
| Browser API deprecation (e.g., `visibilitychange`) | Low | Medium | Feature detection with graceful degradation |
| Student circumvention (VM, second device) | High | Medium | Out of scope for v1; document known limitations |
| Exam time thundering herd | High | High | Session pre-warming, edge caching, staggered form loads |
