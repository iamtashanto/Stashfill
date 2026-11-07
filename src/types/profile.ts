import { z } from 'zod';

export const CustomFieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  value: z.string(),
  tag: z.string().optional(),
});

export const CustomLinkSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  url: z.string(),
});

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  isDefault: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),

  // Personal info
  fullName: z.string().default(''),
  firstName: z.string().default(''),
  lastName: z.string().default(''),
  title: z.string().default(''),
  gender: z.string().default(''),

  // Contact info
  email: z.string().default(''),
  phone: z.string().default(''),
  altPhone: z.string().default(''),

  // Address
  address1: z.string().default(''),
  address2: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().default(''),
  country: z.string().default(''),

  // Online / Links
  website: z.string().default(''),
  linkedin: z.string().default(''),
  github: z.string().default(''),
  twitter: z.string().default(''),
  customLinks: z.array(CustomLinkSchema).default([]),

  // Custom snippets / fields
  customFields: z.array(CustomFieldSchema).default([]),
});

export type CustomField = z.infer<typeof CustomFieldSchema>;
export type CustomLink = z.infer<typeof CustomLinkSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

export function createDefaultProfile(name = 'Personal'): Profile {
  const now = Date.now();
  return {
    id: `prof_${now}_${Math.random().toString(36).substring(2, 9)}`,
    name,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
    fullName: '',
    firstName: '',
    lastName: '',
    title: '',
    gender: '',
    email: '',
    phone: '',
    altPhone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
    customLinks: [],
    customFields: [],
  };
}

