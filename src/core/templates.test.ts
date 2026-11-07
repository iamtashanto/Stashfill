import { describe, it, expect } from 'vitest';
import {
  createPersonalTemplate,
  createAddressTemplate,
  createWorkTemplate,
  createSocialLinksTemplate,
  createFreelancerTemplate,
  createJobApplicantTemplate,
  createStudentTemplate,
  createBangladeshPack,
  createIndiaPack,
  createUSPack,
  createUKPack,
  TEMPLATE_REGISTRY,
} from './templates';
import { ProfileSchema } from './schemas/vault';

describe('Profile Templates & Regional Packs', () => {
  it('generates valid Personal template', () => {
    const prof = createPersonalTemplate();
    ProfileSchema.parse(prof);
    expect(prof.name).toBe('Personal');
    expect(prof.fields.some((f) => f.key === 'full_name')).toBe(true);
    expect(prof.fields.some((f) => f.key === 'email')).toBe(true);
  });

  it('generates valid Address template', () => {
    const prof = createAddressTemplate();
    ProfileSchema.parse(prof);
    expect(prof.fields.some((f) => f.key === 'address_line1')).toBe(true);
    expect(prof.fields.some((f) => f.key === 'city')).toBe(true);
    expect(prof.fields.some((f) => f.key === 'postal_code')).toBe(true);
  });

  it('generates valid Work template', () => {
    const prof = createWorkTemplate();
    ProfileSchema.parse(prof);
    expect(prof.fields.some((f) => f.key === 'company')).toBe(true);
    expect(prof.fields.some((f) => f.key === 'job_title')).toBe(true);
  });

  it('generates valid Social Links template', () => {
    const prof = createSocialLinksTemplate();
    ProfileSchema.parse(prof);
    expect(prof.fields.some((f) => f.key === 'github')).toBe(true);
    expect(prof.fields.some((f) => f.key === 'linkedin')).toBe(true);
  });

  it('generates valid Freelancer, Job Applicant, and Student templates', () => {
    const freelancer = createFreelancerTemplate();
    const applicant = createJobApplicantTemplate();
    const student = createStudentTemplate();

    ProfileSchema.parse(freelancer);
    ProfileSchema.parse(applicant);
    ProfileSchema.parse(student);

    expect(freelancer.fields.some((f) => f.key === 'custom_hourly_rate')).toBe(true);
    expect(applicant.fields.some((f) => f.key === 'job_title')).toBe(true);
    expect(student.fields.some((f) => f.key === 'custom_student_id')).toBe(true);
  });

  it('generates valid Bangladesh regional pack with NID and upazila', () => {
    const bd = createBangladeshPack();
    ProfileSchema.parse(bd);
    expect(bd.fields.some((f) => f.key === 'custom_nid')).toBe(true);
    expect(bd.fields.some((f) => f.key === 'custom_upazila')).toBe(true);
    expect(bd.fields.find((f) => f.key === 'country')?.value).toBe('Bangladesh');
  });

  it('generates valid India, US, and UK regional packs', () => {
    const inPack = createIndiaPack();
    const usPack = createUSPack();
    const ukPack = createUKPack();

    ProfileSchema.parse(inPack);
    ProfileSchema.parse(usPack);
    ProfileSchema.parse(ukPack);

    expect(inPack.fields.some((f) => f.key === 'custom_aadhaar')).toBe(true);
    expect(usPack.fields.some((f) => f.key === 'custom_ssn_last4')).toBe(true);
    expect(ukPack.fields.some((f) => f.key === 'custom_nino')).toBe(true);
  });

  it('provides a complete template registry', () => {
    expect(TEMPLATE_REGISTRY.length).toBeGreaterThanOrEqual(10);
    for (const t of TEMPLATE_REGISTRY) {
      const prof = t.create();
      expect(() => ProfileSchema.parse(prof)).not.toThrow();
    }
  });
});
