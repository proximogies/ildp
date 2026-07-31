# Inclusive Leadership Digital Platform (ILDP)

A web-based platform to digitize the ILM Canvas for agricultural associations — enabling structured assessments, scoring, action planning, and reporting.

## Stack

- **Frontend**: React + Vite + TailwindCSS + Recharts
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string)

---

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Backend runs on `http://localhost:5000`

Default admin: `admin@ildp.org` / `Admin@1234`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Project Structure

```
ildp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Full DB schema (25+ tables)
│   │   └── seed.js             # Roles, domains, indicators, score bands
│   └── src/
│       ├── index.js            # Express app entry
│       ├── lib/prisma.js       # Prisma client
│       ├── middleware/         # Auth, error handler, logger
│       ├── routes/             # All API routes
│       └── services/
│           └── scoringEngine.js  # ILM scoring logic
└── frontend/
    └── src/
        ├── pages/              # All 11 pages
        ├── components/         # Layout, modals, badges
        ├── context/            # Auth context
        └── lib/api.js          # Axios instance
```

## API Endpoints

| Module | Endpoints |
|---|---|
| Auth | POST /auth/login, /logout, /me |
| Users | CRUD /users |
| Associations | CRUD /associations |
| Rounds | CRUD /assessment-rounds |
| Assessments | CRUD + submit/review/approve |
| Responses | POST/PUT /responses |
| Uploads | POST /uploads, link-evidence |
| Scores | GET scorecard, calculate |
| Action Plans | CRUD + updates |
| Reports | Generate + download |
| Dashboard | Summary + analytics |

## Scoring Logic

- Indicator score = weighted average of question scores (0–4 scale)
- Domain score = weighted average of indicator scores
- Overall score = average of domain scores
- Bands: Weak (0–1.4) · Emerging (1.5–2.4) · Functional (2.5–3.4) · Strong (3.5–4.0)
- Action plans auto-generated for domains scoring below threshold
