# AuditFlow

> **"Audit document review, without the scattered workflow."**

AuditFlow is a lightweight, multi-tenant audit document review and compliance system designed specifically for small and mid-sized Chartered Accountant (CA) firms. It replaces scattered email chains, WhatsApp attachments, and untracked file revisions with a centralized, state-machine-driven review pipeline backed by an immutable, append-only audit trail.

This project was developed for the **OBLIQ-in Technical Evaluation**.

---

## The Problem

Small and mid-sized CA firms handle thousands of critical audit documents every financial year (bank statements, sales registers, purchase books, GST returns, depreciation schedules). Currently, this workflow suffers from acute operational friction:

1. **Scattered Communication Channels**: Documents are sent via personal WhatsApp, client emails, or physical flash drives.
2. **Version Chaos**: Staff work on outdated spreadsheets while clients send revised files with identical names (`Bank_Stmt_Final_v2_really_final.pdf`).
3. **Lost Review Feedback**: Reviewers request corrections verbally or in email threads, leaving no traceable record of why a document was rejected.
4. **Zero Audit Defense**: During peer reviews or regulatory scrutiny (e.g., NFRA, ICAI, Peer Review Board), firms struggle to prove *who uploaded a document, who reviewed it, what was rectified, and when approval occurred*.
5. **Cross-Tenant Risk**: Managing multiple clients within an unpartitioned system creates severe risks of data spillage.

---

## The Solution

AuditFlow solves this by implementing an opinionated, disciplined review pipeline:

- **Strict Multi-Tenancy**: Every database query is tenant-scoped by `firmId`, ensuring complete isolation between firms (e.g., *ABC & Co.* vs. *XYZ & Co.*).
- **Enforced State Machine**: Documents transition only through valid audit states: `PENDING` → `UPLOADED` → `UNDER_REVIEW` → `CORRECTION_REQUIRED` → `UPLOADED` (revision) → `APPROVED`.
- **Non-Destructive Versioning**: Correcting a document never overwrites the previous file. Version history is preserved with timestamps, uploader identity, and reviewer feedback.
- **Append-Only Audit Trail**: Every meaningful action creates an immutable audit event (`DOCUMENT_UPLOADED`, `REVIEW_STARTED`, `CORRECTION_REQUESTED`, `DOCUMENT_REUPLOADED`, `DOCUMENT_APPROVED`). No `PUT` or `DELETE` endpoints exist for audit logs.
- **Reviewer Workload Queue**: Reviewers get a prioritized queue ordered by waiting time and urgency, preventing bottlenecks during tax deadlines.

---

## Core Workflow

```text
Firm
  ↓
User Login (Staff or Reviewer)
  ↓
Client Engagement (e.g., ABC Traders Pvt. Ltd.)
  ↓
Required Audit Documents Checklist (Bank Statement, Sales Register, etc.)
  ↓
Upload Document (Staff uploads Version 1)
  ↓
Reviewer Opens Document & Starts Review
  ↓
Approve  ─── OR ───►  Request Correction (Mandatory Audit Comment)
  │                          ↓
  │                   Staff Uploads Revised Version (Version 2)
  │                          ↓
  │                   Reviewer Reviews Revision
  │                          ↓
  └──────────────────► Approve (Certified)
                             ↓
             All Events Recorded in Immutable Audit History
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, React Router v7, Tailwind CSS, Lucide Icons, TanStack Query v5, React Hook Form, Zod |
| **Backend** | Node.js, Express, TypeScript, Mongoose (MongoDB ODM), JWT Auth, bcryptjs, Multer, Zod |
| **Database** | MongoDB Atlas (with automated in-memory MongoDB fallback for instant zero-dependency testing) |
| **Storage** | Cloudinary (with robust base64 Data-URI fallback for test/offline evaluation) |
| **Testing** | Vitest, Supertest, React Testing Library, jsdom |
| **Deployment** | Vercel (Frontend), Render (Backend), MongoDB Atlas (Database), Cloudinary (Files) |

---

## Architecture

```text
                   ┌───────────────────────────┐
                   │  React / Vite SPA Client  │
                   │ (TanStack Query + Tailwind)│
                   └─────────────┬─────────────┘
                                 │
                         REST API (JWT Auth)
                                 │
                   ┌─────────────▼─────────────┐
                   │   Express TypeScript API  │
                   └─────────────┬─────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
   ┌─────▼─────┐           ┌─────▼─────┐           ┌─────▼─────┐
   │ Auth/RBAC │           │ Business  │           │   Audit   │
   │Middleware │           │ Services  │           │  Service  │
   └─────┬─────┘           └─────┬─────┘           └─────┬─────┘
         │                       │                       │
         │         ┌─────────────┴─────────────┐         │
         │         │                           │         │
         ▼         ▼                           ▼         ▼
   ┌─────────────────────────────────────────────────────────┐
   │                     MongoDB Database                    │
   │  (Firms, Users, Clients, Documents, Versions, Audit)    │
   └─────────────────────────────────────────────────────────┘
                           ▲
                           │ file buffer
                   ┌───────┴───────┐
                   │  Cloudinary   │
                   │ (File Storage)│
                   └───────────────┘
```

---

## Multi-Tenancy & Tenant Isolation

Multi-tenancy is enforced at the **database query boundary** on the server. Frontend button hiding is purely for user experience and is never treated as a security barrier.

### How Tenant Isolation Works:
1. **Server-Derived Identity**: The client sends a signed JWT in the `Authorization: Bearer <token>` header.
2. The authentication middleware verifies the token signature and extracts `req.user.firmId` and `req.user.userId`.
3. **Query Scoping**: Every query to tenant-owned collections (`Client`, `Document`, `DocumentVersion`, `AuditEvent`) injects `firmId: req.user.firmId`:
   ```typescript
   // Correct multi-tenant enforcement:
   const client = await Client.findOne({
     _id: clientId,
     firmId: req.user.firmId
   });
   ```
4. **Cross-Tenant Defense**: If a user from Firm A attempts to access an ID belonging to Firm B (`GET /api/clients/<firm-B-id>`), the query returns `null`, resulting in a safe `404 Not Found`. This prevents timing attacks and identifier enumeration.

### Authentication vs. Authorization
- **Authentication**: Confirms *who* the user is (email + password verified via bcrypt, signed JWT generated).
- **Authorization**: Determines *what* the user is allowed to do. AuditFlow enforces two orthogonal authorization layers:
  1. **Tenant Authorization**: Does the resource belong to the user's `firmId`?
  2. **Role-Based Access Control (RBAC)**: Does the user have the required role (`STAFF` or `REVIEWER`)? For example, a Staff user attempting `POST /api/documents/:id/approve` is blocked with HTTP `403 Forbidden`.

---

## Document State Machine

The document lifecycle is strictly controlled by a state transition matrix in `documentService.ts`:

```text
       ┌─────────┐
       │ PENDING │
       └────┬────┘
            │ Staff uploads initial file
            ▼
       ┌──────────┐
       │ UPLOADED │◄────────────────────────────┐
       └────┬─────┘                             │
            │ Reviewer starts review             │ Staff uploads
            ▼                                   │ revised version
     ┌──────────────┐                           │
     │ UNDER_REVIEW ├─► Reviewer requests ──────┤
     └──────┬───────┘   correction with comment │
            │                                   │
            │ Reviewer approves          ┌──────┴──────────────┐
            ▼                            │ CORRECTION_REQUIRED │
       ┌──────────┐                      └─────────────────────┘
       │ APPROVED │ (Terminal audit state)
       └──────────┘
```

Arbitrary or backward transitions (e.g., `APPROVED` → `PENDING` or `PENDING` → `APPROVED`) are rejected with `400 Bad Request`.

---

## Append-Only Audit Trail

Audit events are **strictly append-only**:
- The `AuditEvent` Mongoose schema disables `updatedAt` (`timestamps: { createdAt: true, updatedAt: false }`).
- The API intentionally exposes **no `PUT` or `DELETE` endpoints** for audit logs.
- Audit records can only be generated through internal business service actions:
  - `CLIENT_CREATED`
  - `DOCUMENT_UPLOADED`
  - `REVIEW_STARTED`
  - `CORRECTION_REQUESTED`
  - `DOCUMENT_REUPLOADED`
  - `DOCUMENT_APPROVED`
  - `USER_LOGIN`
- Each audit event captures: **Who** (actor name, email, role), **What** (action enum), **When** (server-derived ISO timestamp), **Which Client/Document/Version**, and **What Reason/Comment** was provided.

---

## Seeded Demo Credentials

| Firm | Role | Name | Email | Password |
|---|---|---|---|---|
| **Firm A (ABC & Co.)** | Staff | Rohit Sharma | `rohit@auditflow.demo` | `AuditFlow@123` |
| **Firm A (ABC & Co.)** | Reviewer | Aman Verma | `aman@auditflow.demo` | `AuditFlow@123` |
| **Firm B (XYZ & Co.)** | Staff | Raj Patel | `raj@auditflow.demo` | `AuditFlow@123` |
| **Firm B (XYZ & Co.)** | Reviewer | Priya Nair | `priya@auditflow.demo` | `AuditFlow@123` |

*Note: The login page includes 1-click demo account buttons for instant evaluation.*

---

## REST API Specification

| Method | Endpoint | Purpose | Access / Role |
|---|---|---|---|
| `GET` | `/api/health` | Service health status check | Public |
| `POST` | `/api/auth/login` | Email/password authentication | Public |
| `GET` | `/api/auth/me` | Current authenticated session identity | Authenticated |
| `GET` | `/api/clients` | List all firm clients with audit progress stats | Authenticated |
| `POST` | `/api/clients` | Create new client & initialize 5 audit requirements | Authenticated |
| `GET` | `/api/clients/:id` | Client detail with full document checklist | Authenticated |
| `GET` | `/api/documents/:id` | Document details, latest version & client info | Authenticated |
| `POST` | `/api/documents/:id/upload` | Upload initial or revised document file | `STAFF` |
| `POST` | `/api/documents/:id/start-review` | Begin review of uploaded document | `REVIEWER` |
| `POST` | `/api/documents/:id/request-correction`| Request document correction (comment required) | `REVIEWER` |
| `POST` | `/api/documents/:id/approve` | Approve and certify audit document | `REVIEWER` |
| `GET` | `/api/documents/:id/versions` | List complete historical document versions | Authenticated |
| `GET` | `/api/documents/:id/audit-history` | Fetch chronological audit timeline for document | Authenticated |
| `GET` | `/api/review-queue` | Get prioritized reviewer queue by waiting time | Authenticated |
| `GET` | `/api/activity` | Firm-wide compliance audit activity feed | Authenticated |

---

## Local Setup & Quickstart

### Prerequisites
- Node.js v18+ (tested on v20 and v24)
- npm v9+

### 1. Clone & Install
```bash
git clone https://github.com/your-username/AuditFlow.git
cd AuditFlow

# Install dependencies for both server and client:
npm run install:all
```

### 2. Environment Variables Setup
Create `.env` in `server/`:
```bash
cp server/.env.example server/.env
```
*(Default settings use in-memory MongoDB if no `MONGODB_URI` is provided, allowing instant out-of-the-box evaluation without installing MongoDB locally).*

Create `.env` in `client/`:
```bash
cp client/.env.example client/.env
```

### 3. Run Automated Test Suites
Run all backend and frontend tests (25 tests covering authentication, tenant isolation, RBAC, versioning, state machine, and audit logs):
```bash
npm run test
```

### 4. Seed Database with Realistic Demo Data
```bash
npm run seed
```

### 5. Start Development Servers
Run both backend API (port 5001) and frontend Vite app (port 5173):
```bash
# Terminal 1 (or root concurrent command):
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## Evaluator Guided Demo Script

Follow this sequence to test the complete workflow in 3 minutes:

1. **Login as Staff**:
   - On the login screen, click **"Rohit (Staff)"** or enter `rohit@auditflow.demo` / `AuditFlow@123`.
   - Open **ABC Traders Pvt. Ltd.** from the dashboard or Clients page.
   - Observe the 5-item checklist. Notice **GST Return** has status `CORRECTION_REQUIRED`.
   - Click **View Audit History** on **GST Return**. See the reviewer's previous feedback: *"GSTR-3B table 4(A) ITC does not match GSTR-2B summary"*.
   - Click **Upload Revision**. Attach a revised PDF file and submit.
   - Notice status changes to `UPLOADED` and version increments to `v2`.
   - Click **Sign Out**.

2. **Login as Reviewer**:
   - Click **"Aman (Reviewer)"** or enter `aman@auditflow.demo` / `AuditFlow@123`.
   - Go to **Review Queue**. Notice the newly uploaded GST Return is in **Awaiting Review** with an active waiting timer.
   - Click **Start Review** on the document.
   - Status changes to `UNDER_REVIEW`.
   - Enter an audit note: *"Reconciled with 2B. Approved."*
   - Click **Approve Document**.
   - Review the **Immutable Audit Trail** at the bottom: verify the complete timeline from Version 1 upload → Correction Requested → Version 2 Revision → Approval.

3. **Demonstrate Strict Tenant Isolation**:
   - Click the user switcher in the sidebar and select **Raj (Firm B Staff)**.
   - Raj is authenticated under **XYZ & Co.** (Tenant B).
   - Only **XYZ Manufacturing Pvt. Ltd.** is visible. ABC Traders does not appear anywhere.
   - Attempting to query Firm A's client ID directly yields HTTP 404.

---

## Deployment Guide

### Backend on Render
1. Create a Web Service on Render pointing to the `server/` directory.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Set Environment Variables: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `CLOUDINARY_*`.

### Frontend on Vercel
1. Import repository on Vercel, set Root Directory to `client`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variable: `VITE_API_URL=https://your-render-api.onrender.com/api`.

---

## AI Usage Statement

**AI Tools Used:**
- **ChatGPT**: Used for product/architecture planning, debugging, technical reasoning, and documentation assistance.
- **Claude**: Not used.
- **Gemini**: Not used.
- **Cursor**: Not used.
- **GitHub Copilot**: Not used.
- **Antigravity**: Used as the primary implementation/development environment for generating, testing, and refining the application.

**How AI was used:**
AI tools were used for development assistance, debugging, documentation, and implementation support. The final architecture, data design, and implementation decisions were reviewed, verified with automated tests, and understood by the developer.

---

## What would I improve with one more week?

With one additional week of engineering time, I would prioritize these high-leverage product capabilities:

1. **Document Requirement Templates & Industry Presets**: Currently, each client initializes with a fixed 5-item checklist. I would introduce firm-configurable templates (e.g., *Private Limited Statutory Audit*, *Tax Audit u/s 44AB*, *LLP Audit*, *Partnership Firm*) so firms can create custom checklist profiles with mandatory vs. optional requirements.
2. **Granular Staff-Client Assignment & Scoped Permissions**: Restrict junior staff members to only see clients explicitly assigned to them by a Partner, while Reviewers and Partners maintain firm-wide visibility.
3. **Signed Document Download URLs & Ephemeral Access**: Implement time-limited Cloudinary signed URLs (e.g., expiring in 15 minutes) for document downloads, preventing persistent external link sharing.
4. **Audit Pack Export (ZIP with PDF Summary Report)**: Add a one-click *"Download Certified Audit Pack"* feature that bundles all approved document versions along with an auto-generated, cryptographically signed PDF summary sheet detailing every review action and timestamp for submission to the ICAI Peer Review Board.
5. **Reviewer Workload Balancing & Turnaround SLA Alerts**: Add automated SLA flags (e.g., highlight documents awaiting review for more than 48 hours) to help firm partners track review turnaround times ahead of tax filing deadlines.
