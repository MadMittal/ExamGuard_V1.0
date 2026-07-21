# ExamGuard Cloud — App Flow Document

**Version**: 1.0  
**Date**: July 21, 2025  
**Author**: Solutions Architect  

---

## 1. Student User Journey

### 1.1 Complete Student Flow

```mermaid
stateDiagram-v2
    [*] --> Landing: Open exam URL

    Landing --> Login: Click "Start Exam"
    
    Login --> Checking: Enter email + Submit
    Checking --> Blocked_NotEnrolled: Roster closed & email not in roster
    Checking --> Blocked_NotAllowed: Student marked "not allowed"
    Checking --> Blocked_Terminated: Previous session was TERMINATED
    Checking --> Blocked_Completed: Already submitted (one-submission mode)
    Checking --> ExamInfo: Email verified / allowed

    ExamInfo --> PreChecklist: Click "Begin Exam"
    
    PreChecklist --> ExamActive: All checks pass + Enter fullscreen
    
    ExamActive --> ExamActive: Monitoring events detected
    ExamActive --> AutoTerminated: Violation threshold exceeded
    ExamActive --> Completed: Student clicks "Submit & End"
    ExamActive --> Reconnecting: Network lost
    Reconnecting --> ExamActive: Network restored + events flushed
    Reconnecting --> OfflineMode: Prolonged network loss (>60s)
    OfflineMode --> ExamActive: Network restored
    
    Completed --> Summary: Show final score + status
    AutoTerminated --> Summary: Show termination reason
    
    Blocked_NotEnrolled --> [*]
    Blocked_NotAllowed --> [*]
    Blocked_Terminated --> [*]
    Blocked_Completed --> [*]
    Summary --> [*]
```

### 1.2 Screen-by-Screen Breakdown

#### Screen 1: Landing Page
```
┌──────────────────────────────────────────────┐
│                                              │
│            🛡️ ExamGuard                      │
│         Masters Union                        │
│                                              │
│   ┌──────────────────────────────────────┐   │
│   │                                      │   │
│   │    Welcome to your secure exam       │   │
│   │    environment                       │   │
│   │                                      │   │
│   │    📋 Exam: Midterm Quiz #3          │   │
│   │    🕐 Window: 10:00 AM - 11:30 AM   │   │
│   │    ⏱️ Duration: 90 minutes           │   │
│   │                                      │   │
│   │    [ Enter Exam Portal →  ]          │   │
│   │                                      │   │
│   └──────────────────────────────────────┘   │
│                                              │
│   ⚠️ Desktop browser required (Chrome/Edge)  │
│   v3.0 Cloud                                 │
│                                              │
└──────────────────────────────────────────────┘
```

#### Screen 2: Email Login
```
┌──────────────────────────────────────────────┐
│  🛡️ ExamGuard          Masters Union         │
│──────────────────────────────────────────────│
│                                              │
│   Enter your institutional email             │
│                                              │
│   ┌──────────────────────────────────────┐   │
│   │ student@mastersunion.org             │   │
│   └──────────────────────────────────────┘   │
│                                              │
│   [ Continue → ]                             │
│                                              │
│   🔒 Your email is used to verify your       │
│   identity and track your exam session.      │
│                                              │
└──────────────────────────────────────────────┘
```

#### Screen 3: Pre-Exam Checklist
```
┌──────────────────────────────────────────────┐
│  🛡️ ExamGuard          Midterm Quiz #3       │
│──────────────────────────────────────────────│
│                                              │
│   Pre-Exam Readiness Check                   │
│                                              │
│   ✅ Browser supported (Chrome 120)          │
│   ✅ Screen size adequate (1920×1080)        │
│   ✅ Clipboard monitoring enabled            │
│   ✅ Tab switch detection enabled            │
│   ⬜ Fullscreen mode (click to activate)     │
│   ⬜ Webcam access (optional)                │
│                                              │
│   ┌──────────────────────────────────────┐   │
│   │  ⚠️ During this exam:               │   │
│   │  • Do not switch tabs or windows     │   │
│   │  • Do not use copy/paste             │   │
│   │  • Stay in fullscreen mode           │   │
│   │  • Violations reduce your score      │   │
│   └──────────────────────────────────────┘   │
│                                              │
│   [ Start Exam → ]   (requires all checks)   │
│                                              │
└──────────────────────────────────────────────┘
```

#### Screen 4: Active Exam
```
┌──────────────────────────────────────────────┐
│  🛡️ Score: 95  │  ⏱️ 47:23 remaining  │ 🔴  │
│──────────────────────────────────────────────│
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │                                          ││
│  │     Google Form (iframe)                 ││
│  │                                          ││
│  │     Question 1 of 25                     ││
│  │     What is the capital of...            ││
│  │                                          ││
│  │     ○ Option A                           ││
│  │     ○ Option B                           ││
│  │     ○ Option C                           ││
│  │     ○ Option D                           ││
│  │                                          ││
│  │                                          ││
│  └──────────────────────────────────────────┘│
│                                              │
│  [ Submit & End Exam ]                       │
│                                              │
└──────────────────────────────────────────────┘

Violation Toast (appears temporarily):
┌────────────────────────────────┐
│ ⚠️ Tab switch detected (-5)    │
│ Return to the exam immediately │
└────────────────────────────────┘
```

#### Screen 5: Completion / Termination
```
┌──────────────────────────────────────────────┐
│  🛡️ ExamGuard          Masters Union         │
│──────────────────────────────────────────────│
│                                              │
│   ✅ Exam Submitted Successfully             │
│                                              │
│   ┌──────────────────────────────────────┐   │
│   │  Integrity Score:  85 / 100          │   │
│   │  Status:           COMPLETED         │   │
│   │  Violations:       3                 │   │
│   │  Duration:         42 minutes        │   │
│   │                                      │   │
│   │  Tab switches:     2                 │   │
│   │  Focus losses:     1                 │   │
│   └──────────────────────────────────────┘   │
│                                              │
│   Your responses have been recorded in       │
│   Google Forms. You may close this window.   │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 2. Admin User Journey

### 2.1 Admin Navigation Flow

```mermaid
stateDiagram-v2
    [*] --> AdminLogin: Navigate to /admin

    AdminLogin --> Dashboard: Auth successful (admin role)

    Dashboard --> FormMgmt: Manage Forms
    Dashboard --> StudentRoster: Manage Students
    Dashboard --> Settings: Settings
    Dashboard --> Reports: Reports

    FormMgmt --> Dashboard: Back
    StudentRoster --> Dashboard: Back
    Settings --> Dashboard: Back
    Reports --> Dashboard: Back

    Dashboard --> SessionDetail: Click on student row
    SessionDetail --> Dashboard: Back
    SessionDetail --> TerminateConfirm: End Session
    TerminateConfirm --> Dashboard: Confirmed
```

### 2.2 Admin Dashboard Layout

```
┌────────────────────────────────────────────────────────────────┐
│  🛡️ ExamGuard Admin                      👤 prof@mu.edu  ⚙️   │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                                     │
│  📊 Dash │  Live Dashboard              Last updated: 10:23   │
│          │                                                     │
│  📝 Forms│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│          │  │Active  │ │Done    │ │Flagged │ │Total   │       │
│  👥 Stud.│  │  247   │ │  198   │ │   12   │ │  457   │       │
│          │  └────────┘ └────────┘ └────────┘ └────────┘       │
│  ⚙️ Set. │                                                     │
│          │  ┌─────────────────────────────────────────────┐     │
│  📈 Rep. │  │ Student        │Score│Violations│Status    │     │
│          │  ├────────────────┼─────┼──────────┼──────────┤     │
│          │  │ 🔴 R.Sharma    │  45 │    12    │ ACTIVE   │     │
│          │  │ 🟡 A.Patel     │  72 │     6    │ ACTIVE   │     │
│          │  │ 🟢 S.Singh     │  98 │     1    │ ACTIVE   │     │
│          │  │ ⬛ K.Kumar     │  88 │     3    │ COMPLETED│     │
│          │  │ ...            │     │          │          │     │
│          │  └─────────────────────────────────────────────┘     │
│          │                                                     │
│          │  [ End All Sessions ]   [ Generate Report ]         │
│          │                                                     │
│          │  Recent Activity                                    │
│          │  ┌─────────────────────────────────────────────┐     │
│          │  │ 10:22  R.Sharma  tab_switch  (3rd time)    │     │
│          │  │ 10:21  A.Patel   copy        Ctrl+C        │     │
│          │  │ 10:20  M.Verma   focus_loss  Alt+Tab        │     │
│          │  └─────────────────────────────────────────────┘     │
└──────────┴─────────────────────────────────────────────────────┘
```

---

## 3. System Sequence Diagrams

### 3.1 Session Start Flow

```mermaid
sequenceDiagram
    actor S as Student
    participant FE as Next.js Frontend
    participant EC as Edge Cache (Vercel)
    participant SB as Supabase
    participant GF as Google Forms

    S->>FE: Open exam URL
    FE->>EC: Request exam info
    EC-->>FE: Return cached exam info (ISR)
    FE->>S: Show landing page + exam details
    
    S->>FE: Enter email
    FE->>SB: signInAnonymously() or signInWithOtp()
    SB-->>FE: JWT token
    FE->>SB: SELECT * FROM students WHERE email = ?
    SB-->>FE: Student record (or null for OPEN roster)
    
    alt Student blocked/terminated
        FE->>S: Show BlockedScreen with reason
    else Student allowed
        FE->>S: Show PreExamChecklist
        S->>FE: Confirm checks + enter fullscreen
        FE->>SB: INSERT INTO sessions (email, form_id, status='ACTIVE', score=100)
        SB-->>FE: Session record with token
        FE->>FE: Build Google Form embed URL with email pre-fill
        FE->>S: Show ExamScreen (Google Form iframe + monitoring overlay)
        FE->>FE: Start monitoring engine
    end
```

### 3.2 Heartbeat & Violation Detection Flow

```mermaid
sequenceDiagram
    actor S as Student Browser
    participant ME as Monitoring Engine
    participant BT as Event Batcher
    participant IDB as IndexedDB
    participant SB as Supabase DB

    loop Every violation event
        S->>ME: Browser event (tab switch, copy, etc.)
        ME->>ME: Normalize event type
        ME->>ME: Calculate score deduction
        ME->>BT: Add to batch queue
        ME->>S: Show violation toast notification
    end

    loop Every 30 seconds
        BT->>BT: Check if batch has events
        alt Has events
            BT->>IDB: Write batch to IndexedDB (durability)
            BT->>SB: UPDATE sessions SET score=?, violations=? WHERE token=?
            BT->>SB: INSERT INTO activity_events (batch of events)
            SB-->>BT: Confirm write
            BT->>IDB: Clear flushed batch
            SB-->>BT: Return {shouldEnd, reason, score}
            alt shouldEnd = true
                BT->>ME: Trigger auto-termination
                ME->>S: Show termination screen
            end
        else No events (heartbeat only)
            BT->>SB: UPDATE sessions SET last_seen=NOW() WHERE token=?
            SB-->>BT: Return {status, score}
            alt status != 'ACTIVE'
                BT->>ME: Session ended externally (admin terminated)
                ME->>S: Show terminated screen
            end
        end
    end
```

### 3.3 Auto-Termination Flow

```mermaid
sequenceDiagram
    participant ME as Monitoring Engine
    participant SC as Score Calculator
    participant TH as Threshold Checker
    participant SB as Supabase
    actor S as Student

    ME->>SC: New violation event (e.g., 3rd tab switch)
    SC->>SC: score = score - deduction
    SC->>TH: Check thresholds
    
    alt Tab switch count > 2
        TH->>SB: UPDATE sessions SET status='TERMINATED', reason='Tab switch limit'
        SB-->>TH: Confirmed
        TH->>ME: Stop monitoring
        ME->>S: Show termination screen
    else Score below auto-end floor
        TH->>SB: UPDATE sessions SET status='TERMINATED', reason='Score too low'
        SB-->>TH: Confirmed
        TH->>ME: Stop monitoring
        ME->>S: Show termination screen
    else Total violations exceeded max
        TH->>SB: UPDATE sessions SET status='TERMINATED'
        SB-->>TH: Confirmed
        TH->>ME: Stop monitoring
        ME->>S: Show termination screen
    else Within limits
        TH->>ME: Continue monitoring
    end
```

### 3.4 Admin Real-Time Monitoring Flow

```mermaid
sequenceDiagram
    participant AD as Admin Dashboard
    participant RT as Supabase Realtime
    participant DB as Supabase DB
    participant SE as Student Events

    AD->>RT: Subscribe to channel 'sessions' (postgres_changes)
    AD->>RT: Subscribe to channel 'activity_events' (postgres_changes)

    loop Student sends heartbeat
        SE->>DB: UPDATE sessions SET score=?, violations=?
        DB->>RT: Postgres NOTIFY (row changed)
        RT->>AD: Push updated session row
        AD->>AD: Update session grid row in-place
        AD->>AD: Recalculate metrics (active, alert, etc.)
    end

    loop Student violation event
        SE->>DB: INSERT INTO activity_events
        DB->>RT: Postgres NOTIFY (new row)
        RT->>AD: Push new activity event
        AD->>AD: Prepend to activity feed
    end

    Note over AD: No polling needed — all updates are push-based
```

---

## 4. Data Flow Diagrams

### 4.1 Write Path (Student → Database)

```mermaid
graph LR
    subgraph "Student Browser"
        EV[Violation Event]
        BQ[Batch Queue<br/>in memory]
        IDB[(IndexedDB<br/>buffer)]
    end

    subgraph "Network"
        HTTPS[HTTPS POST]
    end

    subgraph "Supabase"
        PR[PostgREST<br/>API Layer]
        PG[(PostgreSQL)]
        NT[NOTIFY trigger]
        RT[Realtime<br/>WebSocket]
    end

    subgraph "Admin Browser"
        DASH[Dashboard UI]
    end

    EV --> BQ
    BQ -->|every 30s| IDB
    IDB --> HTTPS
    HTTPS --> PR
    PR --> PG
    PG --> NT
    NT --> RT
    RT --> DASH
```

### 4.2 Read Path (Database → Admin)

```mermaid
graph RL
    subgraph "Supabase"
        PG[(PostgreSQL)]
        RPC[RPC Functions]
        RT[Realtime Channel]
    end

    subgraph "Admin Browser"
        RC[React Components]
        RQ[Data Hooks]
        RT_SUB[Realtime Subscription]
    end

    PG --> RPC
    RPC --> RQ
    RQ --> RC
    PG --> RT
    RT --> RT_SUB
    RT_SUB --> RC
```

---

## 5. Error & Recovery Flows

### 5.1 Network Interruption Recovery

```mermaid
stateDiagram-v2
    [*] --> Online: Normal operation

    Online --> OfflineDetected: Network lost (fetch fails)
    
    OfflineDetected --> Buffering: Show "Offline" badge
    
    Buffering --> Buffering: Events stored in IndexedDB
    Buffering --> RetryConnect: Every 5 seconds
    
    RetryConnect --> Buffering: Still offline
    RetryConnect --> Flushing: Connection restored
    
    Flushing --> Online: All buffered events sent
    Flushing --> Buffering: Flush failed (partial)
    
    Note right of Buffering: Student can still<br/>see and answer<br/>the Google Form
```

### 5.2 Session Conflict Resolution

```mermaid
flowchart TD
    A[Student starts session] --> B{Check existing sessions<br/>for this email + form}
    
    B -->|No existing sessions| C[Create new session<br/>status = ACTIVE]
    
    B -->|Active session exists| D[Resume existing session<br/>return existing token + score]
    
    B -->|Terminated session exists| E[BLOCK<br/>Show termination message]
    
    B -->|Completed session exists<br/>+ one-submission ON| F[BLOCK<br/>Show already-submitted message]
    
    B -->|Completed session exists<br/>+ one-submission OFF| G[Create new session<br/>allow retake]
    
    C --> H[Return session token<br/>+ Google Form URL]
    D --> H
```

---

## 6. Page Routing Map

```mermaid
graph TD
    ROOT["/"] --> LANDING["/ (Landing)"]
    
    LANDING --> EXAM["/exam"]
    
    EXAM --> EXAM_LOGIN["Login Screen"]
    EXAM_LOGIN --> EXAM_INFO["Exam Info Screen"]
    EXAM_INFO --> EXAM_CHECK["Pre-Exam Checklist"]
    EXAM_CHECK --> EXAM_ACTIVE["Active Exam Screen"]
    EXAM_ACTIVE --> EXAM_DONE["Completion Screen"]
    
    ROOT --> ADMIN["/admin"]
    ADMIN --> ADMIN_LOGIN["Admin Login"]
    ADMIN_LOGIN --> DASH["/admin/dashboard"]
    DASH --> FORMS["/admin/forms"]
    DASH --> STUDENTS["/admin/students"]
    DASH --> SETTINGS["/admin/settings"]
    DASH --> REPORTS["/admin/reports"]
```

> [!NOTE]
> The student exam portal (`/exam`) is a **single-page flow** — all screens (login → checklist → exam → done) are managed by React state within one page component. This avoids page reloads that would disrupt the monitoring engine and fullscreen mode.

> [!IMPORTANT]
> The admin section (`/admin/*`) uses Next.js App Router with separate pages for each feature. Navigation between admin pages is standard — no fullscreen or monitoring constraints.
