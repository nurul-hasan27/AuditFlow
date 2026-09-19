# AuditFlow

> Audit document review, without the scattered workflow.

A lightweight, multi-tenant audit document review platform designed for small and mid-sized CA firms. It centralizes client document requirements, versioned file uploads, review/correction workflows, and immutable audit logs with firm-level data isolation.

**Live Deployment:**
- **Web App**: [https://audit-flow-topaz.vercel.app](https://audit-flow-topaz.vercel.app/)
- **API Server**: [https://auditflow-api-etbb.onrender.com](https://auditflow-api-etbb.onrender.com/)

---

## Demo Accounts

The database is pre-seeded with two independent CA firms to test multi-tenancy:

| Firm | Role | Name | Email | Password |
|---|---|---|---|---|
| **Firm A (ABC & Co.)** | Reviewer | Aman Verma | `aman@auditflow.demo` | `AuditFlow@123` |
| **Firm A (ABC & Co.)** | Staff | Rohit Sharma | `rohit@auditflow.demo` | `AuditFlow@123` |
| **Firm B (XYZ & Co.)** | Reviewer | Priya Nair | `priya@auditflow.demo` | `AuditFlow@123` |
| **Firm B (XYZ & Co.)** | Staff | Raj Patel | `raj@auditflow.demo` | `AuditFlow@123` |

*Both the login screen and the navigation bar include a one-click demo account switcher.*

---

## Core Workflow

AuditFlow focuses strictly on the audit document review pipeline:

```
[Client Requirements] ──► [Staff Upload (v1)] ──► [Reviewer Inspection]
                                                         │
                           ┌─────────────────────────────┴─────────────────────────────┐
                           ▼                                                           ▼
                [Correction Requested]                                            [Approved]
                           │                                                           │
              [Staff Uploads Revision (v2)]                                 [Certified Document]
                           │
                 [Review & Approval]
```

### Document State Machine

| Status | Trigger | Actor | Notes |
|---|---|:---:|---|
| `PENDING` | Requirement created | `REVIEWER` | Awaiting initial upload |
| `UPLOADED` | File uploaded | `STAFF` | Added to Reviewer's FIFO queue |
| `UNDER_REVIEW` | Review started | `REVIEWER` | Claimed by reviewer |
| `CORRECTION_REQUIRED` | Correction requested | `REVIEWER` | Requires explanatory note; returns to staff |
| `APPROVED` | Approved | `REVIEWER` | Terminal state; certified |

Invalid state jumps (e.g., approving a `PENDING` document directly or re-uploading to an `APPROVED` document) are rejected at the service layer with HTTP 400.

---

## Key Capabilities

- **Configurable Client Requirements**: Requirements belong to individual clients, not the system. Reviewers can add, rename, or soft-deactivate requirements per engagement. Deactivated requirements preserve past file versions and audit history.
- **Strict Multi-Tenancy**: All database queries (`Client`, `DocumentRequirement`, `Document`, `DocumentVersion`, `AuditEvent`) inject `firmId` from the verified JWT. Cross-firm queries return HTTP 404.
- **Document Versioning**: Re-uploading a corrected file increments the version (`v1` $\rightarrow$ `v2`) without overwriting previous submissions.
- **FIFO Review Queue**: Triage board for reviewers sorted by upload timestamp with waiting timers.
- **Append-Only Audit Trail**: Every upload, review action, correction comment, and requirement change is logged with actor attribution, timestamp, and metadata. Audit records cannot be edited or deleted via the API.
- **Dual-Mode Storage**: Streams uploads directly to Cloudinary CDN in production; safely falls back to local data buffers in offline/test mode.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router |
| **Backend** | Node.js, Express, TypeScript, Zod (validation), Multer, Cloudinary SDK |
| **Database** | MongoDB Atlas with Mongoose ODM (in-memory MongoDB for local test suite) |
| **Hosting** | Vercel (Frontend SPA Edge) + Render (Backend API Web Service) |

---

## API Overview

All routes except `/api/auth/login` require a `Bearer <token>` header:

| Route | Method | Description | Role |
|---|:---:|---|:---:|
| `/api/auth/login` | `POST` | Authenticate and issue JWT | Public |
| `/api/auth/me` | `GET` | Current user session & firm info | Any |
| `/api/clients` | `GET` / `POST` | List firm clients / Register client | Any / Reviewer |
| `/api/clients/:id` | `GET` | Client details & requirements | Any |
| `/api/clients/:id/requirements` | `GET` / `POST` | List requirements / Add requirement | Any / Reviewer |
| `/api/requirements/:id` | `PATCH` | Rename requirement | Reviewer |
| `/api/requirements/:id/deactivate` | `PATCH` | Soft-deactivate requirement | Reviewer |
| `/api/requirements/:id/activate` | `PATCH` | Reactivate requirement | Reviewer |
| `/api/documents/:id` | `GET` | Document details and version history | Any |
| `/api/documents/:id/upload` | `POST` | Upload initial or revised file | Staff |
| `/api/documents/:id/start-review` | `POST` | Claim document for review | Reviewer |
| `/api/documents/:id/request-correction` | `POST` | Request correction with comment | Reviewer |
| `/api/documents/:id/approve` | `POST` | Certify and approve document | Reviewer |
| `/api/review-queue` | `GET` | FIFO triage queue with wait durations | Any |
| `/api/activity` | `GET` | Paginated firm-wide audit ledger | Any |

---

## Local Development & Testing

### 1. Installation
```bash
git clone https://github.com/nurul-hasan27/AuditFlow.git
cd AuditFlow
npm run install:all
```

### 2. Environment Configuration
Create `server/.env` (or copy from `server/.env.example`):
```ini
PORT=5001
MONGODB_URI=memory  # Uses embedded in-memory MongoDB if omitted
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

### 3. Run Automated Tests
AuditFlow includes 38 automated tests (31 backend integration tests + 7 frontend UI tests):
```bash
npm test
```

### 4. Run Development Servers
```bash
npm run dev
```
- Client runs at: `http://localhost:5173`
- Server API runs at: `http://localhost:5001`
- Seed test data anytime: `npm run seed`
