import type { Field, Profile, FieldType } from '../schemas/vault';
import type { CanonicalKey } from '../canonical';

function makeField(
  key: CanonicalKey | string,
  label: string,
  type: FieldType = 'text',
  category = 'general',
  sensitive = false,
  value = '',
): Field {
  const now = Date.now();
  return {
    id: `f_${now}_${Math.random().toString(36).substring(2, 8)}`,
    key,
    label,
    type,
    category,
    value,
    tags: [category],
    sensitive,
    createdAt: now,
    updatedAt: now,
    useCount: 0,
    lastUsedAt: null,
  };
}

export function createPersonalTemplate(name = 'Personal'): Profile {
  return {
    id: `prof_personal_${Date.now()}`,
    name,
    icon: 'user',
    fields: [
      makeField('full_name', 'Full Name', 'text', 'personal'),
      makeField('first_name', 'First Name', 'text', 'personal'),
      makeField('last_name', 'Last Name', 'text', 'personal'),
      makeField('email', 'Email Address', 'email', 'contact'),
      makeField('phone', 'Phone Number', 'tel', 'contact'),
      makeField('date_of_birth', 'Date of Birth', 'date', 'personal'),
      makeField('username', 'Username', 'text', 'personal'),
      makeField('bio', 'Bio', 'multiline', 'personal'),
    ],
  };
}

export function createAddressTemplate(name = 'Address'): Profile {
  return {
    id: `prof_address_${Date.now()}`,
    name,
    icon: 'map-pin',
    fields: [
      makeField('address_line1', 'Street Address', 'text', 'address'),
      makeField('address_line2', 'Apartment / Suite', 'text', 'address'),
      makeField('city', 'City', 'text', 'address'),
      makeField('state', 'State / Province', 'text', 'address'),
      makeField('postal_code', 'Postal / ZIP Code', 'text', 'address'),
      makeField('country', 'Country', 'text', 'address'),
    ],
  };
}

export function createWorkTemplate(name = 'Work'): Profile {
  return {
    id: `prof_work_${Date.now()}`,
    name,
    icon: 'briefcase',
    fields: [
      makeField('company', 'Company', 'text', 'work'),
      makeField('job_title', 'Job Title', 'text', 'work'),
      makeField('email', 'Work Email', 'email', 'contact'),
      makeField('phone', 'Work Phone', 'tel', 'contact'),
      makeField('website', 'Company Website', 'url', 'work'),
      makeField('linkedin', 'LinkedIn Profile', 'url', 'social'),
    ],
  };
}

export function createSocialLinksTemplate(name = 'Social Links'): Profile {
  return {
    id: `prof_social_${Date.now()}`,
    name,
    icon: 'share-2',
    fields: [
      makeField('website', 'Personal Website', 'url', 'social'),
      makeField('github', 'GitHub', 'url', 'social'),
      makeField('linkedin', 'LinkedIn', 'url', 'social'),
      makeField('twitter', 'Twitter / X', 'url', 'social'),
    ],
  };
}

export function createFreelancerTemplate(name = 'Freelancer'): Profile {
  return {
    id: `prof_freelancer_${Date.now()}`,
    name,
    icon: 'code',
    fields: [
      makeField('full_name', 'Full Name', 'text', 'personal'),
      makeField('email', 'Contact Email', 'email', 'contact'),
      makeField('job_title', 'Specialty / Role', 'text', 'work'),
      makeField('website', 'Portfolio URL', 'url', 'work'),
      makeField('github', 'GitHub Profile', 'url', 'social'),
      makeField('custom_hourly_rate', 'Hourly Rate ($)', 'text', 'work'),
      makeField('bio', 'Summary Pitch', 'multiline', 'personal'),
    ],
  };
}

export function createJobApplicantTemplate(name = 'Job Applicant'): Profile {
  return {
    id: `prof_applicant_${Date.now()}`,
    name,
    icon: 'file-text',
    fields: [
      makeField('full_name', 'Full Name', 'text', 'personal'),
      makeField('email', 'Email Address', 'email', 'contact'),
      makeField('phone', 'Phone Number', 'tel', 'contact'),
      makeField('address_line1', 'Street Address', 'text', 'address'),
      makeField('city', 'City', 'text', 'address'),
      makeField('postal_code', 'Postal Code', 'text', 'address'),
      makeField('linkedin', 'LinkedIn Profile', 'url', 'social'),
      makeField('github', 'GitHub / Portfolio', 'url', 'social'),
      makeField('website', 'Personal Website', 'url', 'social'),
      makeField('job_title', 'Current / Desired Title', 'text', 'work'),
      makeField('bio', 'Professional Summary', 'multiline', 'personal'),
    ],
  };
}

export function createStudentTemplate(name = 'Student'): Profile {
  return {
    id: `prof_student_${Date.now()}`,
    name,
    icon: 'book-open',
    fields: [
      makeField('full_name', 'Full Name', 'text', 'personal'),
      makeField('email', 'Student Email (.edu)', 'email', 'contact'),
      makeField('phone', 'Phone Number', 'tel', 'contact'),
      makeField('company', 'University / Institution', 'text', 'education'),
      makeField('custom_major', 'Major / Field of Study', 'text', 'education'),
      makeField('custom_student_id', 'Student ID', 'text', 'education', true),
      makeField('custom_grad_year', 'Graduation Year', 'text', 'education'),
    ],
  };
}

// Regional Packs
export function createBangladeshPack(name = 'Bangladesh Pack'): Profile {
  return {
    id: `prof_regional_bd_${Date.now()}`,
    name,
    icon: 'flag',
    fields: [
      makeField('custom_nid', 'National ID (NID)', 'text', 'regional', true),
      makeField('mobile', 'Mobile Number (+880)', 'tel', 'contact'),
      makeField('custom_upazila', 'Upazila / Thana', 'text', 'address'),
      makeField('city', 'District (জেলা)', 'text', 'address'),
      makeField('state', 'Division (বিভাগ)', 'text', 'address'),
      makeField('postal_code', 'Post Code', 'text', 'address'),
      makeField('country', 'Country', 'text', 'address', false, 'Bangladesh'),
    ],
  };
}

export function createIndiaPack(name = 'India Pack'): Profile {
  return {
    id: `prof_regional_in_${Date.now()}`,
    name,
    icon: 'flag',
    fields: [
      makeField('custom_aadhaar', 'Aadhaar Number (UIDAI)', 'text', 'regional', true),
      makeField('custom_pan', 'PAN Card Number', 'text', 'regional', true),
      makeField('mobile', 'Mobile Number (+91)', 'tel', 'contact'),
      makeField('city', 'City / District', 'text', 'address'),
      makeField('state', 'State', 'text', 'address'),
      makeField('postal_code', 'PIN Code', 'text', 'address'),
      makeField('country', 'Country', 'text', 'address', false, 'India'),
    ],
  };
}

export function createUSPack(name = 'US Pack'): Profile {
  return {
    id: `prof_regional_us_${Date.now()}`,
    name,
    icon: 'flag',
    fields: [
      makeField('custom_ssn_last4', 'SSN (Last 4 Digits)', 'text', 'regional', true),
      makeField('phone', 'Phone Number', 'tel', 'contact'),
      makeField('address_line1', 'Street Address', 'text', 'address'),
      makeField('city', 'City', 'text', 'address'),
      makeField('state', 'State (2-letter)', 'text', 'address'),
      makeField('postal_code', 'ZIP Code', 'text', 'address'),
      makeField('country', 'Country', 'text', 'address', false, 'United States'),
    ],
  };
}

export function createUKPack(name = 'UK Pack'): Profile {
  return {
    id: `prof_regional_uk_${Date.now()}`,
    name,
    icon: 'flag',
    fields: [
      makeField('custom_nino', 'National Insurance No (NINO)', 'text', 'regional', true),
      makeField('phone', 'Phone Number', 'tel', 'contact'),
      makeField('address_line1', 'Street Address', 'text', 'address'),
      makeField('city', 'Town / City', 'text', 'address'),
      makeField('state', 'County', 'text', 'address'),
      makeField('postal_code', 'Postcode', 'text', 'address'),
      makeField('country', 'Country', 'text', 'address', false, 'United Kingdom'),
    ],
  };
}

export const TEMPLATE_REGISTRY = [
  { id: 'personal', label: 'Personal', create: createPersonalTemplate },
  { id: 'address', label: 'Address', create: createAddressTemplate },
  { id: 'work', label: 'Work', create: createWorkTemplate },
  { id: 'social', label: 'Social Links', create: createSocialLinksTemplate },
  { id: 'freelancer', label: 'Freelancer', create: createFreelancerTemplate },
  { id: 'job_applicant', label: 'Job Applicant', create: createJobApplicantTemplate },
  { id: 'student', label: 'Student', create: createStudentTemplate },
  { id: 'pack_bd', label: 'Bangladesh Pack', create: createBangladeshPack },
  { id: 'pack_in', label: 'India Pack', create: createIndiaPack },
  { id: 'pack_us', label: 'US Pack', create: createUSPack },
  { id: 'pack_uk', label: 'UK Pack', create: createUKPack },
] as const;
