import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/config/seed.js';
import { Client, DocumentModel, DocumentRequirement, AuditEvent } from '../src/models/index.js';

let app: any;
let tokenRohitStaffA: string;
let tokenAmanReviewerA: string;
let tokenRajStaffB: string;
let tokenPriyaReviewerB: string;

let firmAClientId: string;
let firmBClientId: string;

beforeAll(async () => {
  process.env.MONGODB_URI = 'memory';
  process.env.NODE_ENV = 'test';

  await connectDB();
  await seedDatabase();

  app = createApp();

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

  const clientA = await Client.findOne({ name: 'ABC Traders Pvt. Ltd.' });
  firmAClientId = clientA!._id.toString();

  const clientB = await Client.findOne({ name: 'XYZ Manufacturing Pvt. Ltd.' });
  firmBClientId = clientB!._id.toString();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Document Requirements System Tests', () => {
  let createdRequirementId: string;
  let firmBRequirementId: string;

  it('1. Seed verification: Each client has its own configurable requirements list', async () => {
    // Firm A has ABC Traders requirements
    const resA = await request(app)
      .get(`/api/clients/${firmAClientId}/requirements`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.length).toBe(5);
    const namesA = resA.body.data.map((r: any) => r.name);
    expect(namesA).toContain('Bank Statement');
    expect(namesA).toContain('Sales Register');

    // Firm B has XYZ Manufacturing requirements (including TDS Certificate & Inventory Report)
    const resB = await request(app)
      .get(`/api/clients/${firmBClientId}/requirements`)
      .set('Authorization', `Bearer ${tokenPriyaReviewerB}`);

    expect(resB.status).toBe(200);
    const namesB = resB.body.data.map((r: any) => r.name);
    expect(namesB).toContain('TDS Certificate');
    expect(namesB).toContain('Inventory Report');
    firmBRequirementId = resB.body.data[0]._id;
  });

  it('2. Reviewer can create a new document requirement', async () => {
    const res = await request(app)
      .post(`/api/clients/${firmAClientId}/requirements`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`)
      .send({
        name: 'Fixed Asset Register',
        category: 'Assets & Depreciation',
        description: 'Schedule of plant, machinery and additions during FY25',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Fixed Asset Register');
    expect(res.body.data.isActive).toBe(true);
    expect(res.body.data.document).toBeDefined();
    expect(res.body.data.document.status).toBe('PENDING');

    createdRequirementId = res.body.data.id;

    // Verify audit event created
    const audit = await AuditEvent.findOne({
      requirementId: createdRequirementId,
      action: 'REQUIREMENT_CREATED',
    });
    expect(audit).toBeDefined();
    expect(audit?.comment).toContain('Fixed Asset Register');
  });

  it('3. Duplicate active requirement name is rejected with 400', async () => {
    const res = await request(app)
      .post(`/api/clients/${firmAClientId}/requirements`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`)
      .send({
        name: 'Fixed Asset Register', // Duplicate name
        category: 'Assets',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('already exists');
  });

  it('4. Staff CANNOT create requirement (rejects with 403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/clients/${firmAClientId}/requirements`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`)
      .send({
        name: 'Unauthorized Staff Requirement',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('5. Reviewer can update/rename an existing requirement', async () => {
    const res = await request(app)
      .patch(`/api/requirements/${createdRequirementId}`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`)
      .send({
        name: 'Fixed Asset & Depreciation Register',
        description: 'Updated description for depreciation schedule',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Fixed Asset & Depreciation Register');
    expect(res.body.data.document.title).toBe('Fixed Asset & Depreciation Register');

    // Verify audit event
    const audit = await AuditEvent.findOne({
      requirementId: createdRequirementId,
      action: 'REQUIREMENT_UPDATED',
    });
    expect(audit).toBeDefined();
    expect(audit?.comment).toContain('renamed');
  });

  it('6. Staff CANNOT update requirement (rejects with 403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/requirements/${createdRequirementId}`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`)
      .send({
        name: 'Illegal Staff Rename',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('7. Reviewer can deactivate requirement (preserves historical data)', async () => {
    const res = await request(app)
      .patch(`/api/requirements/${createdRequirementId}/deactivate`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);

    // Verify audit event
    const audit = await AuditEvent.findOne({
      requirementId: createdRequirementId,
      action: 'REQUIREMENT_DEACTIVATED',
    });
    expect(audit).toBeDefined();
    expect(audit?.comment).toContain('deactivated');

    // Verify historical document still exists in database
    const doc = await DocumentModel.findOne({ requirementId: createdRequirementId });
    expect(doc).toBeDefined();
    expect(doc?.isActive).toBe(false);
  });

  it('8. Staff CANNOT deactivate requirement (rejects with 403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/requirements/${createdRequirementId}/deactivate`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`);

    expect(res.status).toBe(403);
  });

  it('9. Reviewer can reactivate requirement', async () => {
    const res = await request(app)
      .patch(`/api/requirements/${createdRequirementId}/activate`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(true);

    // Verify audit event
    const audit = await AuditEvent.findOne({
      requirementId: createdRequirementId,
      action: 'REQUIREMENT_REACTIVATED',
    });
    expect(audit).toBeDefined();
  });

  it('10. Multi-tenancy: Firm A cannot modify or access Firm B requirement', async () => {
    // Firm A Reviewer attempts to modify Firm B requirement
    const resPatch = await request(app)
      .patch(`/api/requirements/${firmBRequirementId}`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`)
      .send({ name: 'Hacked Requirement' });

    expect(resPatch.status).toBe(404);
    expect(resPatch.body.error).toContain('not found or inaccessible');

    // Firm A Reviewer attempts to deactivate Firm B requirement
    const resDeact = await request(app)
      .patch(`/api/requirements/${firmBRequirementId}/deactivate`)
      .set('Authorization', `Bearer ${tokenAmanReviewerA}`);

    expect(resDeact.status).toBe(404);

    // Firm A Staff attempts to read Firm B requirements
    const resGet = await request(app)
      .get(`/api/clients/${firmBClientId}/requirements`)
      .set('Authorization', `Bearer ${tokenRohitStaffA}`);

    expect(resGet.status).toBe(404);
  });
});
