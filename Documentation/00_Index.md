# ExamGuard Cloud — Project Documentation Index

**Project**: ExamGuard Cloud Migration  
**Target**: 500 concurrent students | ₹0 infrastructure cost  
**Stack**: Next.js 16 (Vercel) + Supabase (PostgreSQL)  
**Status**: Documentation Complete — Ready for Implementation  

---

## 📚 Document Suite

| # | Document | Description |
|---|----------|-------------|
| 0 | [Initial Assessment](file:///C:/Users/mitta/.gemini/antigravity-ide/brain/a6032652-cfbc-4f82-b59a-00d4afa417f8/initial_assessment.md) | Codebase analysis, clarifying questions, Firebase vs Supabase comparison, optimization strategies, risk matrix |
| 1 | [PRD — Product Requirements](file:///C:/Users/mitta/.gemini/antigravity-ide/brain/a6032652-cfbc-4f82-b59a-00d4afa417f8/01_PRD.md) | User personas, 40+ feature requirements (prioritized P0-P2), success metrics, free-tier constraints, non-functional requirements |
| 2 | [TRD — Technical Requirements](file:///C:/Users/mitta/.gemini/antigravity-ide/brain/a6032652-cfbc-4f82-b59a-00d4afa417f8/02_TRD.md) | Architecture decisions (ADRs), technology stack, API design, monitoring engine architecture, security model, caching strategy, deployment setup |
| 3 | [App Flow](file:///C:/Users/mitta/.gemini/antigravity-ide/brain/a6032652-cfbc-4f82-b59a-00d4afa417f8/03_App_Flow.md) | Student journey (7 screens), admin journey, 4 system sequence diagrams, data flow diagrams, error recovery flows, routing map |
| 4 | [UI/UX Brief](file:///C:/Users/mitta/.gemini/antigravity-ide/brain/a6032652-cfbc-4f82-b59a-00d4afa417f8/04_UI_UX_Brief.md) | Design system (colors, typography, spacing, elevation), component specs for all screens, exam-specific UX, accessibility, animation specs, dark mode |
| 5 | [Backend Schema](file:///C:/Users/mitta/.gemini/antigravity-ide/brain/a6032652-cfbc-4f82-b59a-00d4afa417f8/05_Backend_Schema.md) | 8 PostgreSQL tables with full SQL, ER diagram, indexing strategy, RLS policies, 4 database functions, Supabase Storage config, migration mapping, storage budget |
| 6 | [Implementation Workflow](file:///C:/Users/mitta/.gemini/antigravity-ide/brain/a6032652-cfbc-4f82-b59a-00d4afa417f8/06_Implementation_Workflow.md) | 6-sprint plan (12 weeks), testing strategy (unit/integration/E2E/load), risk mitigation per sprint, deployment checklist, Gantt timeline |

---

## 🏗️ Architecture at a Glance

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  500 Students    │────▶│  Vercel Edge     │────▶│  Supabase        │
│  (REST only)     │     │  (CDN + Cache)   │     │  (PostgreSQL)    │
└──────────────────┘     └──────────────────┘     │  + Auth          │
                                                   │  + Realtime      │
┌──────────────────┐     ┌──────────────────┐     │  + Storage       │
│  5-10 Admins     │────▶│  Supabase        │────▶│                  │
│  (WebSocket)     │     │  Realtime        │     └──────────────────┘
└──────────────────┘     └──────────────────┘

Cost: ₹0 (all free tier)
```

---

## 📊 Key Numbers

| Metric | Value |
|--------|-------|
| Concurrent students | 500 |
| Heartbeat interval | 30 seconds |
| Writes per exam | ~61,000 operations |
| DB storage per semester | ~95 MB / 500 MB (19%) |
| Bandwidth per month | ~132 MB / 5 GB (2.6%) |
| Realtime connections | 5-10 / 200 (5%) |
| Development timeline | 12 weeks (6 sprints) |
| Total estimated effort | ~243 hours |

---

## ▶️ Recommended Next Steps

1. **Review all documents** — especially the PRD assumptions (Section 2) and Backend Schema (SQL)
2. **Set up Supabase project** — create free-tier project and run the migration SQL from Document 5
3. **Begin Sprint 0** — follow the Implementation Workflow (Document 6) starting with foundation setup
4. **Deploy MVP early** — Sprint 0-2 delivers a working student portal; test with a small group before building admin features
