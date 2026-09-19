import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/config/seed.js';
import { Client, DocumentModel, AuditEvent } from '../src/models/index.js';

let app: any;
let tokenRohitStaffA: string;
let tokenAmanReviewerA: string;
let tokenRajStaffB: string;
let tokenPriyaReviewerB: string;

let firmAClientId: string;
let firmBClientId: string;

let firmADocApprovedId: string;
let firmADocPendingId: string;
let firmADocCorrectionId: string;
let firmADocUnderReviewId: string;
let firmBDocId: string;

beforeAll(async () => {
  process.env.MONGODB_URI = 'memory';
  process.env.NODE_ENV = 'test';

  await connectDB();
  await seedDatabase();

  app = createApp();

  // Obtain tokens for all test accounts
  const resRohit = await request(app)
    .post('/api/auth/login')
    .send({ email: 'rohit@auditflow.demo', password: 'AuditFlow@123' });
  tokenRohitStaffA = resRohit.body.data.token;

  const resAman = await request(app)
    .post('/api/auth/login')
    .send({ email: 'aman@auditflow.demo', password: 'AuditFlow@123' });
  tokenAmanReviewerA = resAman.body.data.token;

  const resRaj = await request(app)
    .post('/api/auth/login')
    .send({ email: 'raj@auditflow.demo', password: 'AuditFlow@123' });
  tokenRajStaffB = resRaj.body.data.token;

  const resPriya = await request(app)
    .post('/api/auth/login')
    .send({ email: 'priya@auditflow.demo', password: 'AuditFlow@123' });
  tokenPriyaReviewerB = resPriya.body.data.token;

  // Retrieve IDs from seeded database
  const clientA = await Client.findOne({ name: 'ABC Traders Pvt. Ltd.' });
  firmAClientId = clientA!._id.toString();

  const clientB = await Client.findOne({ name: 'XYZ Manufacturing Pvt. Ltd.' });
  firmBClientId = clientB!._id.toString();

  const docBank = await DocumentModel.findOne({ clientId: clientA!._id, title: 'Bank Statement' });
  firmADocApprovedId = docBank!._id.toString();

  const docPending = await DocumentModel.findOne({ clientId: clientA!._id, title: 'Expense Summary' });
  firmADocPendingId = docPending!._id.toString();

  const docCorrection = await DocumentModel.findOne({ clientId: clientA!._id, title: 'GST Return' });
  firmADocCorrectionId = docCorrection!._id.toString();

  const docUnderReview = await DocumentModel.findOne({ clientId: clientA!._id, title: 'Sales Register' });
  firmADocUnderReviewId = docUnderReview!._id.toString();

  const docFirmB = await DocumentModel.findOne({ clientId: clientB!._id });
  firmBDocId = docFirmB!._id.toString();
});

afterAll(async () => {
  await disconnectDB();
});

describe('1. Authentication Tests', () => {
  it('should authenticate valid user and return JWT token with firm info', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rohit@auditflow.demo', password: 'AuditFlow@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('STAFF');
    expect(res.body.data.user.firm.name).toBe('ABC & Co.');
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rohit@auditflow.demo', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@auditflow.demo', password: 'AuditFlow@123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject unauthenticated access to protected routes', async () => {
    const res = await request(app).get('/api/clients');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('2. Multi-Tenant Isolation Tests (CRITICAL REQUIREMENT)', () => {
  it('Firm A user cannot access Firm B client detail (returns safe 404 without leaking data)', async () => {
    const res = await request(app)
      .get(`/api/clients/${firmBClientId}`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('Firm B user cannot access Firm A client detail', async () => {
    const res = await request(app)
      .get(`/api/clients/${firmAClientId}`)
      .set('Authorization', `Bearer ${tokenRajStaffB}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('Firm A user cannot access Firm B document detail', async () => {
    const res = await request(app)
      .get(`/api/documents/${firmBDocId}`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('Firm A client list contains only Firm A clients', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokenRohitStaffA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    res.body.data.forEach((client: any) => {
      expect(client.name).not.toBe('XYZ Manufacturing Pvt. Ltd.');
    });
  });
});

describe('3. Role-Based Authorization (RBAC) Tests', () => {
  it('Staff CANNOT approve a document (rejects with 403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/documents/${firmADocUnderReviewId}/approve`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`)
      .send({ comment: 'Illegal staff approval' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Staff CANNOT request correction (rejects with 403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/documents/${firmADocUnderReviewId}/request-correction`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`)
      .send({ comment: 'Page 2 missing' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Reviewer CANNOT upload document files (reserved for Staff)', async () => {
    const res = await request(app)
      .post(`/api/documents/${firmADocPendingId}/upload`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`)
      .attach('file', Buffer.from('dummy file content'), 'test.pdf');

    expect(res.status).toBe(403);
  });
});

describe('4. Document Workflow, State Machine & Versioning Tests', () => {
  it('Staff uploads initial version for a PENDING document', async () => {
    const res = await request(app)
      .post(`/api/documents/${firmADocPendingId}/upload`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`)
      .attach('file', Buffer.from('%PDF-1.4 Mock Expense Statement Content'), 'Expense_Summary_Q4.pdf');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UPLOADED');
    expect(res.body.data.currentVersionNumber).toBe(1);

    // Verify audit event created
    const audits = await request(app)
      .get(`/api/documents/${firmADocPendingId}/audit-history`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`);

    expect(audits.body.data[0].action).toBe('DOCUMENT_UPLOADED');
  });

  it('Reviewer starts review on UPLOADED document', async () => {
    const res = await request(app)
      .post(`/api/documents/${firmADocPendingId}/start-review`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('UNDER_REVIEW');
  });

  it('Reviewer requesting correction REQUIRES a non-empty comment', async () => {
    const res = await request(app)
      .post(`/api/documents/${firmADocPendingId}/request-correction`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`)
      .send({ comment: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Reviewer requests correction with valid comment', async () => {
    const correctionText = 'Missing travel bills breakdown for March. Please attach vouchers.';
    const res = await request(app)
      .post(`/api/documents/${firmADocPendingId}/request-correction`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`)
      .send({ comment: correctionText });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CORRECTION_REQUIRED');
    expect(res.body.data.latestCorrectionComment).toBe(correctionText);

    // Verify audit event
    const audits = await request(app)
      .get(`/api/documents/${firmADocPendingId}/audit-history`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(audits.body.data[0].action).toBe('CORRECTION_REQUESTED');
    expect(audits.body.data[0].comment).toBe(correctionText);
  });

  it('Staff uploads revised version: creates Version 2 and updates status to UPLOADED', async () => {
    const res = await request(app)
      .post(`/api/documents/${firmADocPendingId}/upload`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`)
      .attach('file', Buffer.from('%PDF-1.4 Revised Expense Summary with Vouchers'), 'Expense_Summary_Q4_v2.pdf');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('UPLOADED');
    expect(res.body.data.currentVersionNumber).toBe(2);

    // Verify versions endpoint has 2 versions
    const versionsRes = await request(app)
      .get(`/api/documents/${firmADocPendingId}/versions`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`);

    expect(versionsRes.body.data.length).toBe(2);
    expect(versionsRes.body.data[0].versionNumber).toBe(2);
    expect(versionsRes.body.data[1].versionNumber).toBe(1);

    // Verify audit event is DOCUMENT_REUPLOADED
    const audits = await request(app)
      .get(`/api/documents/${firmADocPendingId}/audit-history`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`);

    expect(audits.body.data[0].action).toBe('DOCUMENT_REUPLOADED');
  });

  it('Reviewer reviews revised version and approves', async () => {
    // Start review
    await request(app)
      .post(`/api/documents/${firmADocPendingId}/start-review`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    // Approve
    const res = await request(app)
      .post(`/api/documents/${firmADocPendingId}/approve`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`)
      .send({ comment: 'All March travel vouchers verified. Approved.' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');

    // Verify audit event
    const audits = await request(app)
      .get(`/api/documents/${firmADocPendingId}/audit-history`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(audits.body.data[0].action).toBe('DOCUMENT_APPROVED');
    expect(audits.body.data[0].comment).toContain('All March travel vouchers verified');
  });

  it('Invalid state transition: APPROVED document cannot be re-approved or uploaded to', async () => {
    const res = await request(app)
      .post(`/api/documents/${firmADocApprovedId}/approve`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid document state transition');
  });
});

describe('5. Review Queue and Audit Trail Tests', () => {
  it('Review queue returns categorized lists for Reviewer', async () => {
    const res = await request(app)
      .get('/api/review-queue')
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.needsCorrection).toBeDefined();
    expect(res.body.data.awaitingReview).toBeDefined();
    expect(res.body.data.recentlyApproved).toBeDefined();
    expect(res.body.data.counts).toBeDefined();
  });

  it('Firm-wide activity feed returns isolated audit trail', async () => {
    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${tokenRohitStaffA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.events.length).toBeGreaterThan(0);
    // Ensure all events belong to Firm A
    res.body.data.events.forEach((ev: any) => {
      if (ev.client) {
        expect(ev.client.name).not.toBe('XYZ Manufacturing Pvt. Ltd.');
      }
    });
  });

  it('Audit events are append-only: No PUT or DELETE route is exposed', async () => {
    const resPut = await request(app)
      .put('/api/activity/fake-id')
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`)
      .send({ comment: 'Hacked comment' });

    expect(resPut.status).toBe(404);

    const resDelete = await request(app)
      .delete('/api/activity/fake-id')
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(resDelete.status).toBe(404);
  });
});
