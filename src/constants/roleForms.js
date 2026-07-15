/**
 * Role-first signup configuration.
 *
 * `ROLES` drives the role picker (step 1). `ROLE_FIELDS` declares the extra fields
 * rendered per role in the signup form (step 2) — every role also gets the shared
 * name / email / password fields from the Signup shell.
 *
 * Field descriptor:
 *   { name, label, type, scope, required?, placeholder?, options? }
 *   - type:  'text' | 'tel' | 'url' | 'select' | 'multiselect' | 'tags' | 'date' | 'file'
 *   - scope: 'base'    → top-level of the register payload (phone, dateOfBirth)
 *            'profile' → nested under payload.profile
 *            'file'    → handled client-side (uploaded after account creation)
 */

export const ROLES = [
  { id: 'SCHOOL_STUDENT',  label: 'School Students',           emoji: '🎒', desc: 'Classes, coding & early skills' },
  { id: 'COLLEGE_STUDENT', label: 'Higher Education Students', emoji: '🎓', desc: 'Internships, hackathons & networking' },
  { id: 'PROFESSIONAL',    label: 'Professionals',             emoji: '💼', desc: 'Jobs, upskilling & opportunities' },
  { id: 'HR_RECRUITER',    label: 'HR & Recruiters',           emoji: '🧑‍💼', desc: 'Hire interns, freshers & experts' },
  { id: 'FOUNDER',         label: 'Founders & Entrepreneurs',  emoji: '🚀', desc: 'Build, connect & grow your startup' },
];

export const ROLE_LABELS = ROLES.reduce((acc, r) => ({ ...acc, [r.id]: r.label }), {});

export const SCHOOL_INTERESTS = [
  'AI Explorer (Age 8–16)',
  'Scratch Coding',
  'Python Programming',
  'Public Speaking',
  'Robotics',
  'Roblox Game Development',
  'Financial Literacy',
  'Young Entrepreneurs',
  'Web Development',
  'App Development',
];

export const COLLEGE_INTERESTS = [
  'Internship Opportunities',
  'Participation in Hackathons & Ideathons',
  'Networking, Mentorship & Skill Development',
  'Others',
];

const EXPERIENCE_OPTIONS = ['Fresher', '1 Year', '3 Years', '5+ Years'];
const NOTICE_OPTIONS = ['Immediate', '15 Days', '30 Days', '60 Days', '90 Days'];
const COMPANY_SIZE_OPTIONS = ['1–10', '11–50', '51–200', '201–500', '500+ Employees'];
const HR_INDUSTRY_OPTIONS = ['IT', 'Healthcare', 'Finance', 'Manufacturing', 'EdTech', 'Other'];
const HIRING_OPTIONS = ['Interns', 'Freshers', 'Experienced Professionals'];
const FOUNDER_ROLE_OPTIONS = ['Founder', 'Co-Founder', 'CEO', 'CTO', 'Other'];
const STARTUP_STAGE_OPTIONS = ['Idea', 'MVP', 'Revenue', 'Growth'];
const SECTOR_OPTIONS = [
  'Artificial Intelligence (AI)',
  'Software as a Service (SaaS)',
  'FinTech',
  'HealthTech',
  'EdTech',
  'E-commerce',
  'Robotics',
  'Internet of Things (IoT)',
  'AgriTech',
  'Cybersecurity',
  'Other',
];

const f = (name, label, type, opts = {}) => ({ name, label, type, scope: 'profile', ...opts });

export const ROLE_FIELDS = {
  SCHOOL_STUDENT: [
    f('phone', 'Phone Number', 'tel', { scope: 'base', required: true, placeholder: '+91-99999-99999' }),
    f('whatsappNumber', 'WhatsApp Number', 'tel', { placeholder: '+91-99999-99999' }),
    f('className', 'Class', 'text', { required: true, placeholder: 'e.g. Grade 8' }),
    f('dateOfBirth', 'Date of Birth', 'date', { scope: 'base', required: true }),
    f('country', 'Country', 'text', { required: true, placeholder: 'Country' }),
    f('purpose', 'Purpose', 'text', { required: true, placeholder: 'e.g. Basic Foundation classes' }),
    f('interests', 'Interests', 'multiselect', { options: SCHOOL_INTERESTS }),
    f('otherInterests', 'Other interests', 'text', { placeholder: 'Anything else? (optional)' }),
  ],
  COLLEGE_STUDENT: [
    f('phone', 'Phone Number', 'tel', { scope: 'base', required: true, placeholder: '+91-99999-99999' }),
    f('college', 'College / University', 'text', { scope: 'base', required: true, placeholder: 'e.g. IIT Delhi' }),
    f('dateOfBirth', 'Date of Birth', 'date', { scope: 'base', required: true }),
    f('interests', 'I am interested in', 'multiselect', { options: COLLEGE_INTERESTS }),
    f('otherInterests', 'Other', 'text', { placeholder: 'Other (optional)' }),
  ],
  PROFESSIONAL: [
    f('phone', 'Mobile Number', 'tel', { scope: 'base', required: true, placeholder: '+91 98765 43210' }),
    f('jobTitle', 'Current Job Title / Desired Role', 'text', { required: true, placeholder: 'e.g. Software Developer' }),
    f('yearsOfExperience', 'Total Years of Experience', 'select', { required: true, options: EXPERIENCE_OPTIONS }),
    f('keySkills', 'Key Skills', 'tags', { placeholder: 'e.g. Python, React, Excel (comma separated)' }),
    f('noticePeriod', 'Notice Period / Availability', 'select', { required: true, options: NOTICE_OPTIONS }),
    f('currentCompany', 'Current Company Name (optional)', 'text', { placeholder: 'Current company' }),
    f('resume', 'Resume (PDF/DOC, max 5 MB)', 'file', { scope: 'file', required: true, accept: '.pdf,.doc,.docx' }),
  ],
  HR_RECRUITER: [
    f('phone', 'Mobile Number', 'tel', { scope: 'base', required: true, placeholder: '+91 98765 43210' }),
    f('companyName', 'Company Name', 'text', { required: true, placeholder: 'e.g. ABC Technologies Pvt. Ltd.' }),
    f('jobTitle', 'Job Title / Designation', 'text', { required: true, placeholder: 'e.g. HR Manager' }),
    f('companySize', 'Company Size', 'select', { required: true, options: COMPANY_SIZE_OPTIONS }),
    f('industry', 'Industry', 'select', { required: true, options: HR_INDUSTRY_OPTIONS }),
    f('hiringRequirement', 'Hiring Requirement', 'select', { required: true, options: HIRING_OPTIONS }),
    f('companyWebsite', 'Official Company Website (optional)', 'url', { placeholder: 'https://company.com' }),
    f('linkedinProfile', 'LinkedIn Profile (optional)', 'url', { placeholder: 'https://linkedin.com/in/…' }),
  ],
  FOUNDER: [
    f('phone', 'Mobile Number', 'tel', { scope: 'base', required: true, placeholder: '+91 98765 43210' }),
    f('companyName', 'Company Name', 'text', { required: true, placeholder: 'Your company / startup' }),
    f('founderRole', 'Founder Role', 'select', { required: true, options: FOUNDER_ROLE_OPTIONS }),
    f('startupStage', 'Startup Stage', 'select', { required: true, options: STARTUP_STAGE_OPTIONS }),
    f('industry', 'Industry / Sector', 'select', { required: true, options: SECTOR_OPTIONS }),
    f('otherIndustry', 'If "Other", specify', 'text', { placeholder: 'Your sector (optional)' }),
    f('linkedin', 'LinkedIn', 'url', { placeholder: 'https://linkedin.com/in/…' }),
    f('github', 'GitHub', 'url', { placeholder: 'https://github.com/…' }),
    f('twitter', 'X / Twitter', 'url', { placeholder: 'https://x.com/…' }),
    f('portfolio', 'Portfolio', 'url', { placeholder: 'https://…' }),
    f('startupWebsite', 'Startup Website', 'url', { placeholder: 'https://…' }),
  ],
};
