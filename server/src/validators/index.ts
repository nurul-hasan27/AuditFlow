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

export const createRequirementSchema = z.object({
  name: z
    .string({ required_error: 'Requirement name is required' })
    .trim()
    .min(2, { message: 'Requirement name must be at least 2 characters' })
    .max(100, { message: 'Requirement name must be at most 100 characters' }),
  description: z.string().trim().max(500, { message: 'Description cannot exceed 500 characters' }).optional(),
  category: z.string().trim().optional().default('General'),
});

export const updateRequirementSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Requirement name must be at least 2 characters' })
    .max(100, { message: 'Requirement name must be at most 100 characters' })
    .optional(),
  description: z.string().trim().max(500, { message: 'Description cannot exceed 500 characters' }).optional(),
  category: z.string().trim().optional(),
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
