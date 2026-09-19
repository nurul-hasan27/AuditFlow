import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { Firm, User, Client, DocumentModel, DocumentVersion, AuditEvent } from '../models/index.js';

export async function seedDatabase() {
  console.log('🌱 Starting AuditFlow database seeding...');
  await connectDB();

  // Clear existing data
  await Promise.all([
    Firm.deleteMany({}),
    User.deleteMany({}),
    Client.deleteMany({}),
    DocumentModel.deleteMany({}),
    DocumentVersion.deleteMany({}),
    AuditEvent.deleteMany({}),
  ]);

  console.log('🧹 Cleared existing database records.');

  // 1. Create Firms
  const firmA = await Firm.create({
    name: 'ABC & Co.',
    code: 'ABC_CO',
  });

  const firmB = await Firm.create({
    name: 'XYZ & Co.',
    code: 'XYZ_CO',
  });

  console.log('🏢 Created Firms: ABC & Co. and XYZ & Co.');

  // 2. Create Seed Users
  // Password for all: AuditFlow@123
  const rohitStaffA = await User.create({
    firmId: firmA._id,
    name: 'Rohit Sharma',
    email: 'rohit@auditflow.demo',
    password: 'AuditFlow@123',
    role: 'STAFF',
  });

  const amanReviewerA = await User.create({
    firmId: firmA._id,
    name: 'Aman Verma',
    email: 'aman@auditflow.demo',
    password: 'AuditFlow@123',
    role: 'REVIEWER',
  });

  const rajStaffB = await User.create({
    firmId: firmB._id,
    name: 'Raj Patel',
    email: 'raj@auditflow.demo',
    password: 'AuditFlow@123',
    role: 'STAFF',
  });

  const priyaReviewerB = await User.create({
    firmId: firmB._id,
    name: 'Priya Nair',
    email: 'priya@auditflow.demo',
    password: 'AuditFlow@123',
    role: 'REVIEWER',
  });

  console.log('👥 Created Demo Users: Rohit & Aman (Firm A), Raj & Priya (Firm B)');

  // 3. Create Demo Clients
  const clientA1 = await Client.create({
    firmId: firmA._id,
    name: 'ABC Traders Pvt. Ltd.',
    industry: 'Wholesale & Retail Trading',
    financialYear: '2025-26',
    gstin: '27AABCA1234F1Z5',
    pan: 'AABCA1234F',
    assignedStaffId: rohitStaffA._id,
  });

  const clientB1 = await Client.create({
    firmId: firmB._id,
    name: 'XYZ Manufacturing Pvt. Ltd.',
    industry: 'Precision Engineering & Manufacturing',
    financialYear: '2025-26',
    gstin: '29XYZAB5678K1Z9',
    pan: 'XYZAB5678K',
    assignedStaffId: rajStaffB._id,
  });

  // Log client created events
  await AuditEvent.create([
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      actorId: amanReviewerA._id,
      action: 'CLIENT_CREATED',
      comment: 'Initial client audit engagement created for ABC Traders Pvt. Ltd.',
      metadata: { clientName: clientA1.name, financialYear: clientA1.financialYear },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      firmId: firmB._id,
      clientId: clientB1._id,
      actorId: priyaReviewerB._id,
      action: 'CLIENT_CREATED',
      comment: 'Initial client audit engagement created for XYZ Manufacturing Pvt. Ltd.',
      metadata: { clientName: clientB1.name, financialYear: clientB1.financialYear },
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log('📊 Created Demo Clients with Audit Events.');

  // 4. Create Documents for Firm A (ABC Traders Pvt. Ltd.)
  // Document 1: Bank Statement (APPROVED through 2 versions)
  const docBankStatement = await DocumentModel.create({
    firmId: firmA._id,
    clientId: clientA1._id,
    title: 'Bank Statement',
    category: 'Banking',
    status: 'APPROVED',
    currentVersionNumber: 2,
    reviewedBy: amanReviewerA._id,
    reviewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  });

  // Version 1 of Bank Statement
  const docBankStatementV1 = await DocumentVersion.create({
    firmId: firmA._id,
    clientId: clientA1._id,
    documentId: docBankStatement._id,
    versionNumber: 1,
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/samples/sample.pdf',
    fileName: 'Bank_Statement_FY25_Q4_v1.pdf',
    fileSize: 1048576,
    fileType: 'application/pdf',
    uploadedBy: rohitStaffA._id,
    reviewStatus: 'CORRECTION_REQUIRED',
    reviewComment: 'Page 3 is missing. Please upload the complete 12-page bank statement.',
    reviewedBy: amanReviewerA._id,
    reviewedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  });

  // Version 2 of Bank Statement (Approved)
  const docBankStatementV2 = await DocumentVersion.create({
    firmId: firmA._id,
    clientId: clientA1._id,
    documentId: docBankStatement._id,
    versionNumber: 2,
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/samples/sample.pdf',
    fileName: 'Bank_Statement_FY25_Q4_v2_complete.pdf',
    fileSize: 1572864,
    fileType: 'application/pdf',
    uploadedBy: rohitStaffA._id,
    reviewStatus: 'APPROVED',
    reviewComment: 'Verified complete statement. Reconciled with ledger.',
    reviewedBy: amanReviewerA._id,
    reviewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  });

  docBankStatement.latestVersionId = docBankStatementV2._id as any;
  await docBankStatement.save();

  // Audit Events for Bank Statement
  await AuditEvent.create([
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docBankStatement._id,
      documentVersionId: docBankStatementV1._id,
      actorId: rohitStaffA._id,
      action: 'DOCUMENT_UPLOADED',
      comment: 'Initial upload of Bank Statement FY25 Q4',
      metadata: { version: 1, fileName: docBankStatementV1.fileName },
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docBankStatement._id,
      documentVersionId: docBankStatementV1._id,
      actorId: amanReviewerA._id,
      action: 'REVIEW_STARTED',
      comment: 'Review initiated by reviewer',
      metadata: { version: 1 },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000 - 30 * 60 * 1000),
    },
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docBankStatement._id,
      documentVersionId: docBankStatementV1._id,
      actorId: amanReviewerA._id,
      action: 'CORRECTION_REQUESTED',
      comment: 'Page 3 is missing. Please upload the complete 12-page bank statement.',
      metadata: { version: 1 },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docBankStatement._id,
      documentVersionId: docBankStatementV2._id,
      actorId: rohitStaffA._id,
      action: 'DOCUMENT_REUPLOADED',
      comment: 'Uploaded corrected statement with all 12 pages included.',
      metadata: { version: 2, fileName: docBankStatementV2.fileName },
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docBankStatement._id,
      documentVersionId: docBankStatementV2._id,
      actorId: amanReviewerA._id,
      action: 'REVIEW_STARTED',
      comment: 'Reviewing re-uploaded statement',
      metadata: { version: 2 },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 - 15 * 60 * 1000),
    },
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docBankStatement._id,
      documentVersionId: docBankStatementV2._id,
      actorId: amanReviewerA._id,
      action: 'DOCUMENT_APPROVED',
      comment: 'Verified complete statement. Reconciled with ledger.',
      metadata: { version: 2 },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ]);

  // Document 2: Sales Register (UNDER_REVIEW)
  const docSalesRegister = await DocumentModel.create({
    firmId: firmA._id,
    clientId: clientA1._id,
    title: 'Sales Register',
    category: 'Sales & Invoicing',
    status: 'UNDER_REVIEW',
    currentVersionNumber: 1,
  });

  const docSalesRegisterV1 = await DocumentVersion.create({
    firmId: firmA._id,
    clientId: clientA1._id,
    documentId: docSalesRegister._id,
    versionNumber: 1,
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/samples/sample.pdf',
    fileName: 'Sales_Register_2025_26.xlsx',
    fileSize: 845200,
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedBy: rohitStaffA._id,
    reviewStatus: 'UNDER_REVIEW',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  });

  docSalesRegister.latestVersionId = docSalesRegisterV1._id as any;
  await docSalesRegister.save();

  await AuditEvent.create([
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docSalesRegister._id,
      documentVersionId: docSalesRegisterV1._id,
      actorId: rohitStaffA._id,
      action: 'DOCUMENT_UPLOADED',
      comment: 'Uploaded Q4 Sales Register with GST breakup',
      metadata: { version: 1, fileName: docSalesRegisterV1.fileName },
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docSalesRegister._id,
      documentVersionId: docSalesRegisterV1._id,
      actorId: amanReviewerA._id,
      action: 'REVIEW_STARTED',
      comment: 'Cross-checking with tax audit Annexure B',
      metadata: { version: 1 },
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    },
  ]);

  // Document 3: Purchase Register (APPROVED)
  const docPurchaseRegister = await DocumentModel.create({
    firmId: firmA._id,
    clientId: clientA1._id,
    title: 'Purchase Register',
    category: 'Procurement & Expenses',
    status: 'APPROVED',
    currentVersionNumber: 1,
    reviewedBy: amanReviewerA._id,
    reviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });

  const docPurchaseRegisterV1 = await DocumentVersion.create({
    firmId: firmA._id,
    clientId: clientA1._id,
    documentId: docPurchaseRegister._id,
    versionNumber: 1,
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/samples/sample.pdf',
    fileName: 'Purchase_Register_FY25.pdf',
    fileSize: 1205300,
    fileType: 'application/pdf',
    uploadedBy: rohitStaffA._id,
    reviewStatus: 'APPROVED',
    reviewComment: 'Verified 2B matching and vendor ITC claims.',
    reviewedBy: amanReviewerA._id,
    reviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
  });

  docPurchaseRegister.latestVersionId = docPurchaseRegisterV1._id as any;
  await docPurchaseRegister.save();

  await AuditEvent.create([
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docPurchaseRegister._id,
      documentVersionId: docPurchaseRegisterV1._id,
      actorId: rohitStaffA._id,
      action: 'DOCUMENT_UPLOADED',
      comment: 'Uploaded vendor purchase invoices and register',
      metadata: { version: 1, fileName: docPurchaseRegisterV1.fileName },
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    },
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docPurchaseRegister._id,
      documentVersionId: docPurchaseRegisterV1._id,
      actorId: amanReviewerA._id,
      action: 'DOCUMENT_APPROVED',
      comment: 'Verified 2B matching and vendor ITC claims.',
      metadata: { version: 1 },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ]);

  // Document 4: GST Return (CORRECTION_REQUIRED)
  const docGstReturn = await DocumentModel.create({
    firmId: firmA._id,
    clientId: clientA1._id,
    title: 'GST Return',
    category: 'Statutory & Tax',
    status: 'CORRECTION_REQUIRED',
    currentVersionNumber: 1,
    latestCorrectionComment: 'GSTR-3B table 4(A) ITC does not match GSTR-2B summary. Please reconcile and re-upload.',
    reviewedBy: amanReviewerA._id,
    reviewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  });

  const docGstReturnV1 = await DocumentVersion.create({
    firmId: firmA._id,
    clientId: clientA1._id,
    documentId: docGstReturn._id,
    versionNumber: 1,
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/samples/sample.pdf',
    fileName: 'GSTR_3B_March_2025.pdf',
    fileSize: 490200,
    fileType: 'application/pdf',
    uploadedBy: rohitStaffA._id,
    reviewStatus: 'CORRECTION_REQUIRED',
    reviewComment: 'GSTR-3B table 4(A) ITC does not match GSTR-2B summary. Please reconcile and re-upload.',
    reviewedBy: amanReviewerA._id,
    reviewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  });

  docGstReturn.latestVersionId = docGstReturnV1._id as any;
  await docGstReturn.save();

  await AuditEvent.create([
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docGstReturn._id,
      documentVersionId: docGstReturnV1._id,
      actorId: rohitStaffA._id,
      action: 'DOCUMENT_UPLOADED',
      comment: 'Uploaded March 2025 GSTR-3B return copy',
      metadata: { version: 1, fileName: docGstReturnV1.fileName },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      firmId: firmA._id,
      clientId: clientA1._id,
      documentId: docGstReturn._id,
      documentVersionId: docGstReturnV1._id,
      actorId: amanReviewerA._id,
      action: 'CORRECTION_REQUESTED',
      comment: 'GSTR-3B table 4(A) ITC does not match GSTR-2B summary. Please reconcile and re-upload.',
      metadata: { version: 1 },
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ]);

  // Document 5: Expense Summary (PENDING)
  await DocumentModel.create({
    firmId: firmA._id,
    clientId: clientA1._id,
    title: 'Expense Summary',
    category: 'Financial Summary',
    status: 'PENDING',
    currentVersionNumber: 0,
  });

  // 5. Create Documents for Firm B (XYZ Manufacturing Pvt. Ltd.)
  const docBankStatementB = await DocumentModel.create({
    firmId: firmB._id,
    clientId: clientB1._id,
    title: 'Bank Statement',
    category: 'Banking',
    status: 'UNDER_REVIEW',
    currentVersionNumber: 1,
  });

  const docBankStatementBV1 = await DocumentVersion.create({
    firmId: firmB._id,
    clientId: clientB1._id,
    documentId: docBankStatementB._id,
    versionNumber: 1,
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/samples/sample.pdf',
    fileName: 'HDFC_Bank_Statement_XYZ.pdf',
    fileSize: 980100,
    fileType: 'application/pdf',
    uploadedBy: rajStaffB._id,
    reviewStatus: 'UNDER_REVIEW',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  });

  docBankStatementB.latestVersionId = docBankStatementBV1._id as any;
  await docBankStatementB.save();

  await AuditEvent.create([
    {
      firmId: firmB._id,
      clientId: clientB1._id,
      documentId: docBankStatementB._id,
      documentVersionId: docBankStatementBV1._id,
      actorId: rajStaffB._id,
      action: 'DOCUMENT_UPLOADED',
      comment: 'Uploaded annual statement for HDFC primary CC account',
      metadata: { version: 1, fileName: docBankStatementBV1.fileName },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      firmId: firmB._id,
      clientId: clientB1._id,
      documentId: docBankStatementB._id,
      documentVersionId: docBankStatementBV1._id,
      actorId: priyaReviewerB._id,
      action: 'REVIEW_STARTED',
      comment: 'Beginning verification of interest and charges',
      metadata: { version: 1 },
      createdAt: new Date(Date.now() - 40 * 60 * 1000),
    },
  ]);

  // Other pending documents for Firm B
  await DocumentModel.create([
    {
      firmId: firmB._id,
      clientId: clientB1._id,
      title: 'Sales Register',
      category: 'Sales & Invoicing',
      status: 'PENDING',
      currentVersionNumber: 0,
    },
    {
      firmId: firmB._id,
      clientId: clientB1._id,
      title: 'Purchase Register',
      category: 'Procurement & Expenses',
      status: 'PENDING',
      currentVersionNumber: 0,
    },
    {
      firmId: firmB._id,
      clientId: clientB1._id,
      title: 'GST Return',
      category: 'Statutory & Tax',
      status: 'PENDING',
      currentVersionNumber: 0,
    },
    {
      firmId: firmB._id,
      clientId: clientB1._id,
      title: 'Expense Summary',
      category: 'Financial Summary',
      status: 'PENDING',
      currentVersionNumber: 0,
    },
  ]);

  console.log('✅ Seed completed successfully!');
  console.log('Demo Credentials:');
  console.log('  Firm A (ABC & Co.):');
  console.log('    Staff: rohit@auditflow.demo / AuditFlow@123');
  console.log('    Reviewer: aman@auditflow.demo / AuditFlow@123');
  console.log('  Firm B (XYZ & Co.):');
  console.log('    Staff: raj@auditflow.demo / AuditFlow@123');
  console.log('    Reviewer: priya@auditflow.demo / AuditFlow@123');
}

// Allow direct execution if run from CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Seeding error:', err);
      process.exit(1);
    });
}
