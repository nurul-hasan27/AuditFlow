import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Valid email address is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const createClientSchema = z.object({
  name: z.string().min(2, { message: 'Client company name must be at least 2 characters' }),
  industry: z.string().optional().default('General Trade'),
  financialYear: z.string().optional().default('2025-26'),
  gstin: z.string().optional(),
  pan: z.string().optional(),
});

export const createDocumentRequirementSchema = z.object({
  title: z.string().min(2, { message: 'Document title is required' }),
  category: z.string().optional().default('General'),
});

export const requestCorrectionSchema = z.object({
  comment: z
    .string({ required_error: 'Correction comment is required' })
    .trim()
    .min(3, { message: 'Correction comment cannot be empty and must specify what needs fixing' }),
});

export const approveDocumentSchema = z.object({
  comment: z.string().trim().optional(),
});
