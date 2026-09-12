# ProofStack

**Don't trust what a candidate claims. Trust what they can prove.**

A verified-skill and team-discovery platform: candidates claim skills, back them with
GitHub evidence and a graded assessment, get a transparent Verification Score, and
team captains can test candidates with a practical challenge *before* adding them to
a team. A third role — **Recruiter** — posts jobs and searches only verified candidates.

This is a real, working full-stack app: PostgreSQL + Express/TypeScript backend,
React + TypeScript frontend. It was built, installed, migrated, seeded, and
smoke-tested end-to-end against a live database while being written — not just
written and hoped to work.

---

## 1. Stack

| Layer | Tech |
|---|---|
| Database | PostgreSQL (raw SQL via `pg`, no ORM) |
| Backend | Node.js, Express, TypeScript, JWT auth, bcrypt |
| Frontend | React 18, TypeScript, Vite, TanStack Query |
| Styling | Hand-rolled CSS using Atlassian-style design tokens (color, spacing, radius) — **CSS Grid only, no `display: flex` anywhere** |
| Data fetching | TanStack Query exclusively — **no `useEffect` anywhere in the app** |

### Why those two constraints matter for the codebase
- **No flexbox:** every layout (nav bars, card grids, button clusters, forms) is
  built with CSS Grid utility classes (`.stack-*` for vertical rhythm, `.cluster-*`
  for horizontal rhythm — see `frontend/src/styles/global.css`). This was a
  deliberate ask and the whole UI is responsive down to mobile widths using grid
  breakpoints, not flex-wrap.
- **No useEffect:** all server data is fetched via `useQuery`/`useMutation`
  (TanStack Query), including the "who am I" session check on load. The one place
  that *would* traditionally reach for `useEffect` — the challenge countdown timer
  — is instead started explicitly from a button click and stored in a `useRef`
  interval handle (`CodeEditorStub.tsx`). That's a legitimate pattern, but it does
  mean the interval isn't cleaned up on unmount — fine for a single challenge flow,
  worth knowing if you reuse the component elsewhere.

---

## 2. What's real vs. what's a labeled placeholder

Being upfront about this so nobody — including you, in front of judges — gets
caught out by a question.

| Feature | Status |
|---|---|
| Auth, JWT, bcrypt | Real |
| Skill Passport, verification scoring | Real (formula: `Assessment × 0.6 + Evidence × 0.4`) |
| GitHub evidence | Real, but shallow — fetches only the repo's language breakdown, not README/deps/package.json parsing. Falls back to a conservative default score if GitHub is unreachable, so a live demo never breaks on network flakiness. |
| MCQ Assessments | Real, auto-graded, seeded question bank |
| Verification Chain | Real — this is the "why should I trust this score" screen |
| Team discovery & matching | Real — transparent single formula (see `matching.service.ts`), not multi-factor AI |
| Pre-join Challenge | Real submission + storage. Scoring is **human rubric-based by design**, not auto-graded |
| **Code compiler in the challenge editor** | **Explicitly NOT implemented.** The "Run Code" button is visibly disabled with a "Phase 2" tooltip. This is intentional — a fake compiler that silently does nothing is worse than an honest roadmap item at a hackathon demo. |
| Recruiter dashboard & job matching | Real — added per your request as a third full role |
| AI / LLM features | None. Deliberately excluded per your instruction — nothing in this build calls an LLM. |

---

## 3. Project structure

```
proofstack/
  backend/         Express + TypeScript API, PostgreSQL schema, seed script
  frontend/        React + TypeScript app (Vite)
  README.md        this file
```

---

## 4. Running it locally

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or update `DATABASE_URL`)

### Backend

```bash
cd backend
cp .env.example .env      # edit JWT_SECRET and DATABASE_URL if needed
npm install
npm run build              # compiles TS and copies schema/seed .sql into dist/
npm run db:init             # creates all tables
npm run db:seed             # seeds skills, questions, a demo team, and demo users
npm start                   # runs on http://localhost:4000
```

Demo accounts (all use password `password123`):

| Email | Role |
|---|---|
| manu@demo.dev | Candidate (fullest Skill Passport) |
| rahul@demo.dev, sneha@demo.dev, aman@demo.dev, arjun@demo.dev | Candidates |
| priya@demo.dev | Captain (owns the seeded "Code Titans" team) |
| neha@demo.dev | Recruiter (owns the seeded "SDE Intern" job) |

### Frontend

```bash
cd frontend
npm install
npm run dev                 # runs on http://localhost:5173, proxies /api to :4000
```

Open `http://localhost:5173`, log in as any demo account above.

### For a live demo day
Run backend and frontend in two terminals ahead of time and leave them running —
don't start them cold on stage. The seed script gives you a populated, coherent
demo state (a team with one gap-filled skill and three open ones, a job with
ranked candidates) so the app is never empty on first load.

---

## 5. The core loop this app demonstrates

```
Claim skill → Add GitHub evidence → Take assessment → Verification Score computed
   → Browse/discover teams ↔ Team captain discovers candidates
   → Captain assigns a pre-join Challenge → Candidate submits code
   → Captain scores against a rubric → Accept/Reject → Team Dashboard updates
```

Recruiter track runs in parallel: post a job with required skills and a minimum
verification bar → see only candidates who clear that bar, ranked → shortlist.

---

## 6. Known limitations (say these proactively, don't wait to be asked)

- GitHub evidence detection is shallow by design (languages only) — stated above and in code comments.
- Challenge scoring is human-in-the-loop, not an automated compiler/grader — also intentional, and clearly labeled in the UI as a Phase 2 item.
- No email verification, password reset, or rate limiting — out of scope for a hackathon MVP.
- The interval timer in `CodeEditorStub` isn't cleaned up on component unmount (see constraint note above).
- No automated test suite was written; validation here was done by actually running the app against a live Postgres instance and exercising every endpoint by hand (see section 7).

---

## 7. What was actually verified before this was handed to you

This wasn't just written and assumed to work. While building it, the backend was:
- installed with real npm dependencies
- compiled with `tsc` (zero errors)
- run against a **real, installed PostgreSQL server** (schema created, seed data inserted)
- started as a live process and hit with real `curl` requests for login, skill
  passport, verification chain, team matching, and recruiter stats

The frontend was:
- installed with real npm dependencies
- type-checked with `tsc --noEmit` (zero errors)
- built for production with `vite build` (zero errors)
- run as a live dev server, proxying real API calls through to the live backend

In the process, **two real bugs were found and fixed**, not left for you to discover:
1. Team-matching "gap" detection was checking "is this person on the team" instead of "does this person actually hold the required skill" — would have silently broken the team-coverage feature.
2. An async route error (e.g. a dropped DB connection) was crashing the entire Node process instead of just failing that one request — fixed with `express-async-errors` plus top-level safety nets, so one bad request can't take down a live demo.
