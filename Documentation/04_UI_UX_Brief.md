# ExamGuard Cloud — UI/UX Brief

**Version**: 1.0  
**Date**: July 21, 2025  
**Author**: Solutions Architect  

---

## 1. Design Philosophy

### 1.1 Core Principles

| Principle | Description | Application |
|-----------|-------------|-------------|
| **Trust-First** | The interface should feel secure and institutional, not threatening | Use calm blues and professional typography; avoid aggressive reds for normal states |
| **Distraction-Free** | During exams, the UI must minimize cognitive load | Strip all unnecessary chrome; the Google Form iframe is the hero; monitoring is ambient |
| **Progressive Disclosure** | Show only what's needed at each step | Login → Info → Checklist → Exam → Done (linear flow, no branching navigation) |
| **Calm Technology** | Monitoring should be ambient, not anxiety-inducing | Score updates are subtle; violations use brief toasts, not modal interruptions |
| **Institutional Grade** | Must feel like a professional academic tool, not a hobby project | Clean spacing, consistent typography, professional color palette |

### 1.2 Design Inspiration

The design should draw from:
- **Linear App** — Clean, focused interfaces with purposeful animations
- **Vercel Dashboard** — Professional SaaS aesthetic with data-dense layouts
- **Google Classroom** — Familiar academic UI patterns students already know
- **Notion** — Clean sidebar navigation for admin panel

---

## 2. Design System

### 2.1 Color Palette

```
Core Brand Colors:
┌─────────────────────────────────────────────────────────┐
│  Brand Primary    #2454C6   (Institutional blue)        │
│  Brand Dark       #183A88   (Hover/active state)        │
│  Brand Light      #EBF0FF   (Subtle backgrounds)        │
│  Brand Alpha      rgba(36, 84, 198, 0.08)  (Focus ring) │
└─────────────────────────────────────────────────────────┘

Semantic Colors:
┌─────────────────────────────────────────────────────────┐
│  Success/OK       #168253   (Green — score > 80)        │
│  Success Light    #ECFDF5   (Background)                │
│  Warning          #A16207   (Yellow — score 60-80)      │
│  Warning Light    #FFFBEB   (Background)                │
│  Danger/Critical  #BE123C   (Red — score < 60)          │
│  Danger Light     #FFF1F2   (Background)                │
└─────────────────────────────────────────────────────────┘

Neutrals (Light Mode):
┌─────────────────────────────────────────────────────────┐
│  Ink (text)       #172033                               │
│  Muted (secondary)#667085                               │
│  Subtle (tertiary)#94A3B8                               │
│  Line (borders)   #D9E2EC                               │
│  Panel (surfaces) #FFFFFF                               │
│  Soft (bg)        #F6F8FB                               │
│  Canvas (page bg) #F1F5F9                               │
└─────────────────────────────────────────────────────────┘

Neutrals (Dark Mode):
┌─────────────────────────────────────────────────────────┐
│  Ink (text)       #F1F5F9                               │
│  Muted (secondary)#94A3B8                               │
│  Line (borders)   #334155                               │
│  Panel (surfaces) #1E293B                               │
│  Soft (bg)        #0F172A                               │
│  Canvas (page bg) #020617                               │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Typography

```
Primary Font:     Inter (Google Fonts) — UI text, headings
Monospace Font:   JetBrains Mono — scores, tokens, code

Type Scale:
┌────────────┬──────┬────────┬───────────────────────────────┐
│ Name       │ Size │ Weight │ Usage                         │
├────────────┼──────┼────────┼───────────────────────────────┤
│ Display    │ 42px │ 800    │ Landing page hero             │
│ H1         │ 28px │ 700    │ Page titles                   │
│ H2         │ 22px │ 700    │ Section headers               │
│ H3         │ 17px │ 650    │ Card titles                   │
│ Body       │ 15px │ 400    │ Default text                  │
│ Body Bold  │ 15px │ 600    │ Emphasis text                 │
│ Small      │ 13px │ 400    │ Secondary info, labels        │
│ Caption    │ 11px │ 500    │ Timestamps, metadata          │
│ Mono       │ 14px │ 500    │ Scores, tokens, data values   │
└────────────┴──────┴────────┴───────────────────────────────┘

Line Heights:
  - Headings: 1.1 - 1.2
  - Body: 1.5 - 1.6
  - Small/Caption: 1.4
```

### 2.3 Spacing Scale

```
4px   — xs    (inner padding, icon gaps)
8px   — sm    (compact padding, small gaps)
12px  — md    (standard padding, form gaps)
16px  — lg    (section padding, card gaps)
24px  — xl    (large section gaps)
32px  — 2xl   (page sections)
48px  — 3xl   (hero sections)
64px  — 4xl   (page vertical padding)
```

### 2.4 Elevation System

```
Level 0:  none                                    (flat elements)
Level 1:  0 1px 3px rgba(15, 23, 42, 0.06)       (cards, inputs)
Level 2:  0 4px 12px rgba(15, 23, 42, 0.08)      (dropdowns, popovers)
Level 3:  0 12px 36px rgba(15, 23, 42, 0.10)     (modals, floating panels)
Level 4:  0 24px 48px rgba(15, 23, 42, 0.14)     (fullscreen overlays)
```

### 2.5 Border Radius

```
Radius XS:   4px   (tags, badges)
Radius SM:   6px   (buttons, inputs)
Radius MD:   8px   (cards)
Radius LG:   12px  (large cards, modals)
Radius XL:   16px  (hero sections)
Radius Full:  9999px (pills, avatars)
```

---

## 3. Student Portal Screens

### 3.1 Landing Page

**Purpose**: First impression — establish trust, show exam details, guide to login.

**Layout**: Centered single-column, max-width 640px.

**Key Elements**:
- Shield icon + "ExamGuard" branding (top-left or centered)
- Institution name (configurable)
- Exam card showing: form name, time window, monitoring features enabled
- "Enter Exam Portal" CTA button (brand primary, full-width on mobile)
- Footer: version number, "Desktop browser required" warning

**Micro-interactions**:
- Shield icon: subtle pulse animation on load (1x, 0.5s)
- CTA button: scale(1.02) on hover, 150ms transition
- Exam card: fade-in on mount (300ms ease-out)

**States**:
- No active exam: Show "No exam is scheduled right now" with grey card
- Exam active: Show exam details with blue card border
- Mobile device: Show "Please use a desktop computer" blocking screen

---

### 3.2 Email Login Screen

**Purpose**: Identify the student with minimal friction.

**Layout**: Centered form, max-width 440px.

**Key Elements**:
- Email input (large, auto-focused, with @ icon prefix)
- "Continue" button (full-width)
- Privacy note: "Your email is used to verify your identity"
- Loading state: Button shows spinner + "Verifying..."

**Validation**:
- Client-side: Email format check (Zod schema)
- Server-side: Roster check + session conflict check
- Error states: "Not enrolled", "Not allowed", "Already submitted", "Session terminated"

**Micro-interactions**:
- Input focus: border transitions to brand blue with glow ring
- Error: input border turns red, error message slides in from top
- Success: form fades out, next screen fades in (300ms)

---

### 3.3 Pre-Exam Checklist

**Purpose**: Ensure browser environment is ready; set expectations for monitoring.

**Layout**: Centered checklist, max-width 540px.

**Key Elements**:
- Checklist grid (2 columns on desktop, 1 on narrow):
  - ✅ Browser supported
  - ✅ Screen size adequate
  - ✅ Clipboard monitoring ready
  - ✅ Tab switch detection ready
  - ⬜ / ✅ Fullscreen mode (interactive — click to toggle)
  - ⬜ / ✅ Webcam access (interactive — click to grant, if enabled)
- Warning box: "During this exam, the following will be monitored..."
- "Start Exam" button (disabled until all checks pass)

**Micro-interactions**:
- Checks animate in sequentially (staggered 100ms each)
- Passed checks: green checkmark with scale-in animation
- Failed checks: grey square, clickable to retry
- "Start Exam" button: transitions from disabled (grey) to enabled (blue) when all pass

---

### 3.4 Active Exam Screen (Most Critical)

**Purpose**: Maximize Google Form visibility; monitoring is ambient/minimal.

**Layout**: Full viewport, no scrollbars on the outer page.

```
┌────────────────────────────────────────────────┐
│  [Score Bar - 48px height, semi-transparent]    │
│  Score: 95  |  ⏱ 47:23  |  🔴 Recording       │
├────────────────────────────────────────────────┤
│                                                │
│                                                │
│           Google Form (iframe)                 │
│           100% width, calc(100vh - 96px) height│
│                                                │
│                                                │
│                                                │
├────────────────────────────────────────────────┤
│  [Bottom Bar - 48px height]                    │
│  [Submit & End Exam]                           │
└────────────────────────────────────────────────┘
```

**Design Decisions**:
- Score bar is **fixed top**, semi-transparent (backdrop-blur), 48px height
- Score display uses **monospace font** and color-codes: green (>80), yellow (60-80), red (<60)
- Timer shows remaining time (if end time set) or elapsed time
- Recording indicator: red dot with pulse animation when webcam active
- Google Form iframe: fills remaining viewport with `border: none`
- Bottom bar: fixed bottom, contains only "Submit & End" button
- **No sidebar, no navigation, no distractions** — the exam screen is maximally focused

**Violation Toast Notifications**:
- Position: top-right, below score bar
- Duration: 4 seconds, then auto-dismiss
- Style: semi-transparent card with colored left border (yellow/red)
- Content: violation type + score deduction (e.g., "⚠️ Tab switch detected (-5)")
- Stack: max 3 toasts visible, oldest dismissed first
- Animation: slide in from right (200ms), fade out (300ms)

**Score Animation**:
- When score decreases: number briefly flashes red, then returns to appropriate color
- When score color threshold crosses (e.g., green → yellow): background tint shifts

---

### 3.5 Completion Screen

**Purpose**: Confirm submission; show integrity summary; provide closure.

**Layout**: Centered card, max-width 540px.

**Key Elements**:
- Status icon: ✅ (completed) or 🚫 (terminated)
- Large score display with ring chart (circular progress)
- Status badge: "COMPLETED" (green) or "TERMINATED" (red)
- Violation breakdown table (type → count)
- Duration display
- "You may close this window" message

**Micro-interactions**:
- Score ring animates from 0 to final value (1s ease-out)
- Violation counts stagger in (100ms each)
- Confetti effect for score > 95 (subtle, academic-appropriate — blue dots only)

---

### 3.6 Blocked Screen

**Purpose**: Clear communication when student cannot proceed.

**Variants**:
- **Not Enrolled**: "You are not enrolled in this exam. Contact your instructor."
- **Not Allowed**: "Your access has been restricted. Contact your instructor."
- **Already Submitted**: "You have already completed this exam. Only one submission is allowed."
- **Terminated**: "Your session was terminated due to integrity violations. You cannot retake this exam."

**Design**: Red/yellow accent depending on severity. Shield icon with ✗. Contact email shown.

---

## 4. Admin Dashboard Screens

### 4.1 Layout Structure

```
┌──────────────────────────────────────────────────────┐
│  🛡️ ExamGuard Admin    [Exam Selector ▼]    👤 ⚙️   │
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│  📊 Dash   │   [Main Content Area]                   │
│  📝 Forms  │                                         │
│  👥 Students│                                         │
│  ⚙️ Settings│                                         │
│  📈 Reports │                                         │
│            │                                         │
│            │                                         │
│            │                                         │
│            │                                         │
│   ─────── │                                         │
│  v3.0     │                                         │
│  Cloud    │                                         │
└────────────┴─────────────────────────────────────────┘
```

- **Sidebar**: 240px wide, collapsible to 60px (icon-only mode)
- **Top bar**: 56px, contains logo, active exam selector, user avatar, settings gear
- **Main content**: Scrollable, with 24px padding

### 4.2 Dashboard Page

**Metrics Bar**: 4 stat cards in a row
- Active (blue dot), Completed (green dot), Flagged/Alert (yellow dot), Total (grey)
- Each card: number in large mono font, label below, subtle background tint

**Session Grid**: 
- Full-width table with columns: Student, Score, Violations, Status, Last Seen, Actions
- Row highlighting: red row for score < 60, yellow for 60-80, default for > 80
- Row actions: "End Session" button, "Flag" button
- Sorting: default by severity (critical first), then by violations
- Search/filter bar above table
- Real-time updates: rows animate when data changes (subtle highlight flash, 500ms)

**Activity Feed**:
- Right sidebar or bottom panel (collapsible)
- Scrolling list of recent events
- Each event: timestamp, student name, event type (with icon), detail
- Color-coded by severity

### 4.3 Forms Management Page

- List of connected Google Forms as cards
- Each card shows: form name, status badge (Active/Scheduled/Expired/Inactive), time window, session stats
- "Add Form" button opens a modal with URL input + auto-detection
- Edit modal: form name, Google Form URL/ID, email field mapping, start/end times, active toggle, webcam override
- Delete confirmation modal

### 4.4 Student Roster Page

- Table of enrolled students: Email, Name, Roll No, Section, Allowed (toggle)
- Import options: CSV upload, paste emails (textarea)
- Clear Roster button (with confirmation)
- Roster Mode toggle: OPEN / CLOSED

### 4.5 Settings Page

- Grouped settings in expandable sections:
  - **General**: Institution name, portal URL
  - **Monitoring**: Toggle each violation type
  - **Scoring**: Deduction values per violation type
  - **Thresholds**: Max violations before auto-termination
  - **Notifications**: Email toggle for start/alert/end
  - **Webcam**: Enable/disable, interval
- Each setting: label, input/toggle, helper text, default value indicator
- "Save Settings" button with success toast

### 4.6 Reports Page

- "Generate Report" button
- Full-width table with all report columns from the current `EG_Report` schema
- Export to CSV button
- Filter by: form, status, score range, date range
- Visual score distribution chart (histogram using recharts)

---

## 5. Exam-Specific UX Considerations

### 5.1 Fullscreen Behavior

```
Student clicks "Start Exam"
  → Request fullscreen via document.documentElement.requestFullscreen()
  → If granted: proceed to exam screen
  → If denied: show inline prompt "Please allow fullscreen"
  → If exited during exam: trigger fullscreen_exit violation + show re-enter prompt

Fullscreen re-entry prompt:
┌─────────────────────────────────────┐
│ ⚠️ You exited fullscreen mode      │
│                                     │
│ Please return to fullscreen to      │
│ continue your exam.                 │
│                                     │
│ [ Return to Fullscreen ]            │
│                                     │
│ Score deduction: -5 applied         │
└─────────────────────────────────────┘
```

### 5.2 Violation Notification Design

| Severity | Color | Duration | Sound |
|----------|-------|----------|-------|
| Info (right-click blocked) | Blue | 3s | None |
| Warning (tab switch, copy) | Yellow | 4s | None |
| Critical (3rd tab switch, devtools) | Red | 6s | Optional beep |
| Terminal (auto-end) | Red full-screen overlay | Permanent | None |

### 5.3 Score Display Strategy

- Score starts at 100 (displayed in green)
- As violations occur, score decreases with animated counter
- Color transitions: green (100-80) → yellow (79-60) → red (59-0)
- Optional: hide score from student (configurable setting "Show Score to Student")
- When hidden: replace with a generic "Monitoring Active" indicator

### 5.4 Timer Behavior

- If exam has an end time: show countdown timer (⏱ 47:23 remaining)
- At 10 minutes remaining: timer turns yellow
- At 2 minutes remaining: timer turns red + subtle pulse
- At 0: exam auto-submits (same as manual "Submit & End")
- If no end time: show elapsed time (⏱ 23:45 elapsed)

---

## 6. Responsive Design Strategy

### 6.1 Breakpoints

```
Mobile:    < 768px    → BLOCKED for student portal; simplified for admin
Tablet:    768-1024px → Single-column admin; student portal functional
Desktop:   1024-1440px → Full layout
Wide:      > 1440px   → Max-width constrained (1280px content)
```

### 6.2 Mobile Blocking (Student Portal)

Students on mobile devices see a blocking screen:

```
┌─────────────────────┐
│                     │
│    🖥️               │
│                     │
│  Desktop Required   │
│                     │
│  ExamGuard requires │
│  a desktop browser  │
│  for proctored      │
│  exams.             │
│                     │
│  Please switch to   │
│  a laptop or        │
│  desktop computer.  │
│                     │
└─────────────────────┘
```

Detection: `window.innerWidth < 768 || 'ontouchstart' in window` (with user-agent fallback)

### 6.3 Admin Responsive Behavior

| Breakpoint | Sidebar | Session Grid | Activity Feed |
|-----------|---------|-------------|---------------|
| Desktop | 240px expanded | Full table | Side panel |
| Tablet | 60px collapsed (icons only) | Simplified (3 cols) | Bottom drawer |
| Mobile | Hidden (hamburger menu) | Card layout | Full-page view |

---

## 7. Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|---------------|
| Color contrast | All text meets 4.5:1 ratio (tested with WebAIM) |
| Keyboard navigation | All interactive elements focusable; visible focus ring |
| Screen reader | ARIA labels on all buttons, inputs, status indicators |
| Focus management | Focus trapped in modals; restored on dismiss |
| Reduced motion | `prefers-reduced-motion: reduce` disables animations |
| Error identification | Errors announced via `aria-live="polite"` regions |
| Form labels | All inputs have associated `<label>` elements |

> [!NOTE]
> During the active exam screen, keyboard shortcuts are restricted for monitoring purposes. This is documented in the pre-exam checklist and is an intentional accessibility tradeoff for exam integrity.

---

## 8. Animation & Micro-Interaction Specs

### 8.1 Transition Defaults

```css
/* Standard transition */
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Entrance animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
animation: fadeIn 300ms ease-out;

/* Score change */
@keyframes scorePulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.15); color: var(--red); }
  100% { transform: scale(1); }
}

/* Violation toast slide-in */
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
```

### 8.2 Loading States

| Context | Loading Indicator |
|---------|------------------|
| Page load | Full-screen skeleton with shimmer effect |
| Button action | Button text replaced with spinner + "Loading..." |
| Table data | Row-shaped skeleton placeholders (3-5 rows) |
| Form submission | Button disabled + spinner; form inputs greyed out |
| Dashboard metrics | Number placeholders with pulse animation |

### 8.3 Empty States

| Context | Empty State Message |
|---------|-------------------|
| No active exam | "No exam is scheduled right now. Check back later." + clock icon |
| No sessions | "No students have started the exam yet." + users icon |
| No activity | "No activity recorded yet. Events will appear as students begin." |
| No students imported | "No students in the roster. Import students or set roster to OPEN." |
| No forms linked | "No Google Forms connected. Add a form to get started." |

---

## 9. Dark Mode

- Default: Follow system preference (`prefers-color-scheme`)
- Toggle: Available in admin panel (user preference stored in localStorage)
- Student portal: Follows system preference only (no toggle — minimize distractions)
- Implementation: CSS custom properties swapped via `data-theme="dark"` on `<html>`
- All color values in the design system have light/dark variants defined in Section 2.1

> [!TIP]
> During exams, dark mode reduces eye strain for students in dimly-lit classrooms and reduces screen glare that could interfere with webcam snapshots.
