import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Roles ──────────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({ where: { code: 'super_admin' }, update: {}, create: { name: 'Super Admin', code: 'super_admin', description: 'Full system access' } }),
    prisma.role.upsert({ where: { code: 'program_manager' }, update: {}, create: { name: 'Program Manager', code: 'program_manager', description: 'Oversees assessments across associations' } }),
    prisma.role.upsert({ where: { code: 'facilitator' }, update: {}, create: { name: 'Facilitator', code: 'facilitator', description: 'Supports associations in completing assessments' } }),
    prisma.role.upsert({ where: { code: 'association_leader' }, update: {}, create: { name: 'Association Leader', code: 'association_leader', description: 'Completes self-assessments for their association' } }),
    prisma.role.upsert({ where: { code: 'reviewer' }, update: {}, create: { name: 'Reviewer', code: 'reviewer', description: 'Validates submitted assessments' } }),
  ]);
  console.log('✓ Roles seeded');

  // ── Permissions ────────────────────────────────────────────────────────────
  const permissionDefs = [
    { name: 'Create Association', code: 'create_association', module: 'associations' },
    { name: 'Edit Association', code: 'edit_association', module: 'associations' },
    { name: 'Delete Association', code: 'delete_association', module: 'associations' },
    { name: 'View Association', code: 'view_association', module: 'associations' },
    { name: 'Create Assessment', code: 'create_assessment', module: 'assessments' },
    { name: 'Submit Assessment', code: 'submit_assessment', module: 'assessments' },
    { name: 'Review Assessment', code: 'review_assessment', module: 'assessments' },
    { name: 'Approve Assessment', code: 'approve_assessment', module: 'assessments' },
    { name: 'Manage Reports', code: 'manage_reports', module: 'reports' },
    { name: 'Manage Settings', code: 'manage_settings', module: 'settings' },
    { name: 'Manage Users', code: 'manage_users', module: 'users' },
    { name: 'View Dashboard', code: 'view_dashboard', module: 'dashboard' },
    { name: 'Manage Action Plans', code: 'manage_action_plans', module: 'action_plans' },
  ];

  const createdPermissions = {};
  for (const p of permissionDefs) {
    const perm = await prisma.permission.upsert({ where: { code: p.code }, update: {}, create: p });
    createdPermissions[p.code] = perm;
  }
  console.log('✓ Permissions seeded');

  // ── Role → Permission mappings ─────────────────────────────────────────────
  const superAdminRole = roles.find(r => r.code === 'super_admin');
  const programManagerRole = roles.find(r => r.code === 'program_manager');
  const facilitatorRole = roles.find(r => r.code === 'facilitator');
  const assocLeaderRole = roles.find(r => r.code === 'association_leader');
  const reviewerRole = roles.find(r => r.code === 'reviewer');

  const rolePermMap = {
    super_admin: Object.keys(createdPermissions), // all permissions
    program_manager: ['create_association','edit_association','view_association','create_assessment','submit_assessment','review_assessment','approve_assessment','manage_reports','view_dashboard','manage_action_plans'],
    facilitator: ['view_association','create_assessment','submit_assessment','view_dashboard','manage_action_plans'],
    association_leader: ['view_association','submit_assessment','view_dashboard','manage_action_plans'],
    reviewer: ['view_association','review_assessment','approve_assessment','view_dashboard'],
  };

  const roleMap = { super_admin: superAdminRole, program_manager: programManagerRole, facilitator: facilitatorRole, association_leader: assocLeaderRole, reviewer: reviewerRole };

  for (const [roleCode, permCodes] of Object.entries(rolePermMap)) {
    const role = roleMap[roleCode];
    for (const permCode of permCodes) {
      const perm = createdPermissions[permCode];
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
  console.log('✓ Role permissions seeded');

  // ── Score Bands ────────────────────────────────────────────────────────────
  const bands = [
    { name: 'Weak', minScore: 0.0, maxScore: 1.4, colorCode: '#EF4444', interpretationText: 'Significant gaps in inclusion. Immediate action required.' },
    { name: 'Emerging', minScore: 1.5, maxScore: 2.4, colorCode: '#F97316', interpretationText: 'Some inclusion practices exist but are inconsistent.' },
    { name: 'Functional', minScore: 2.5, maxScore: 3.4, colorCode: '#EAB308', interpretationText: 'Inclusion practices are in place and mostly functional.' },
    { name: 'Strong', minScore: 3.5, maxScore: 4.0, colorCode: '#22C55E', interpretationText: 'Strong inclusive leadership practices demonstrated.' },
  ];

  for (const b of bands) {
    await prisma.scoreBand.upsert({ where: { id: b.name }, update: b, create: b }).catch(async () => {
      const existing = await prisma.scoreBand.findFirst({ where: { name: b.name } });
      if (!existing) await prisma.scoreBand.create({ data: b });
    });
  }
  console.log('✓ Score bands seeded');

  // ── ILM Domains ────────────────────────────────────────────────────────────
  const domains = [
    { code: 'D01', title: 'Leadership Structure & Power Distribution', description: 'Assesses how leadership roles and decision-making power are distributed across gender and age groups.', sortOrder: 1 },
    { code: 'D02', title: 'Representation & Participation', description: 'Measures the presence and active involvement of women and youth in leadership positions.', sortOrder: 2 },
    { code: 'D03', title: 'Access to Opportunities and Resources', description: 'Evaluates equitable access to training, finance, land, and other resources.', sortOrder: 3 },
    { code: 'D04', title: 'Meeting Dynamics & Timing Determinants', description: 'Examines whether meeting schedules, venues, and formats are inclusive.', sortOrder: 4 },
    { code: 'D05', title: 'Leadership Culture & Behavioral Norms', description: 'Assesses the cultural environment and norms that support or hinder inclusive leadership.', sortOrder: 5 },
    { code: 'D06', title: 'Accountability & Monitoring Mechanisms', description: 'Reviews systems for tracking and enforcing inclusion commitments.', sortOrder: 6 },
    { code: 'D07', title: 'Partnerships & External Environment', description: 'Looks at external relationships and how they support inclusion goals.', sortOrder: 7 },
    { code: 'D08', title: 'Value Propositions', description: 'Examines the tangible benefits offered to women and youth to encourage participation.', sortOrder: 8 },
    { code: 'D09', title: 'Sustainability & Learning', description: 'Assesses capacity building, knowledge transfer, and long-term inclusion sustainability.', sortOrder: 9 },
    { code: 'D10', title: 'Overall Outcomes', description: 'Measures the observable results of inclusion efforts across the organization.', sortOrder: 10 },
  ];

  const createdDomains = {};
  for (const d of domains) {
    const domain = await prisma.assessmentDomain.upsert({ where: { code: d.code }, update: d, create: d });
    createdDomains[d.code] = domain;
  }
  console.log('✓ ILM Domains seeded');

  // ── Indicators per Domain ──────────────────────────────────────────────────
  const indicators = [
    // D01 - Leadership Structure
    { domainCode: 'D01', code: 'D01-I01', title: 'Formal leadership positions held by women', weight: 1.0, scoringType: 'numeric_scale', sortOrder: 1 },
    { domainCode: 'D01', code: 'D01-I02', title: 'Formal leadership positions held by youth', weight: 1.0, scoringType: 'numeric_scale', sortOrder: 2 },
    { domainCode: 'D01', code: 'D01-I03', title: 'Decision-making authority of women leaders', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 3 },
    // D02 - Representation
    { domainCode: 'D02', code: 'D02-I01', title: 'Percentage of women in executive roles', weight: 1.5, scoringType: 'numeric_scale', sortOrder: 1 },
    { domainCode: 'D02', code: 'D02-I02', title: 'Percentage of youth in executive roles', weight: 1.5, scoringType: 'numeric_scale', sortOrder: 2 },
    { domainCode: 'D02', code: 'D02-I03', title: 'Active participation in meetings and decisions', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 3 },
    // D03 - Access to Opportunities
    { domainCode: 'D03', code: 'D03-I01', title: 'Equal access to training and capacity building', weight: 1.0, scoringType: 'yes_no', sortOrder: 1 },
    { domainCode: 'D03', code: 'D03-I02', title: 'Access to financial resources and credit', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 2 },
    { domainCode: 'D03', code: 'D03-I03', title: 'Access to land and productive assets', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 3 },
    // D04 - Meeting Dynamics
    { domainCode: 'D04', code: 'D04-I01', title: 'Meeting times accommodate women and youth', weight: 1.0, scoringType: 'yes_no', sortOrder: 1 },
    { domainCode: 'D04', code: 'D04-I02', title: 'Meeting venues are accessible and safe', weight: 1.0, scoringType: 'yes_no', sortOrder: 2 },
    { domainCode: 'D04', code: 'D04-I03', title: 'Childcare or transport support provided', weight: 0.5, scoringType: 'yes_no', sortOrder: 3 },
    // D05 - Leadership Culture
    { domainCode: 'D05', code: 'D05-I01', title: 'Organizational culture supports inclusion', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 1 },
    { domainCode: 'D05', code: 'D05-I02', title: 'Leadership openly promotes gender equity', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 2 },
    { domainCode: 'D05', code: 'D05-I03', title: 'Absence of discriminatory norms or practices', weight: 1.0, scoringType: 'yes_no', sortOrder: 3 },
    // D06 - Accountability
    { domainCode: 'D06', code: 'D06-I01', title: 'Inclusion targets are formally documented', weight: 1.0, scoringType: 'yes_no', sortOrder: 1 },
    { domainCode: 'D06', code: 'D06-I02', title: 'Regular monitoring of inclusion indicators', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 2 },
    { domainCode: 'D06', code: 'D06-I03', title: 'Grievance mechanism for inclusion issues', weight: 1.0, scoringType: 'yes_no', sortOrder: 3 },
    // D07 - Partnerships
    { domainCode: 'D07', code: 'D07-I01', title: 'External partners support inclusion goals', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 1 },
    { domainCode: 'D07', code: 'D07-I02', title: 'Government or NGO collaboration on inclusion', weight: 0.5, scoringType: 'yes_no', sortOrder: 2 },
    // D08 - Value Propositions
    { domainCode: 'D08', code: 'D08-I01', title: 'Tangible benefits offered to women members', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 1 },
    { domainCode: 'D08', code: 'D08-I02', title: 'Tangible benefits offered to youth members', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 2 },
    // D09 - Sustainability
    { domainCode: 'D09', code: 'D09-I01', title: 'Mentorship and succession planning for women/youth', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 1 },
    { domainCode: 'D09', code: 'D09-I02', title: 'Inclusion embedded in organizational strategy', weight: 1.0, scoringType: 'yes_no', sortOrder: 2 },
    { domainCode: 'D09', code: 'D09-I03', title: 'Learning and reflection on inclusion practices', weight: 0.5, scoringType: 'weighted_choice', sortOrder: 3 },
    // D10 - Overall Outcomes
    { domainCode: 'D10', code: 'D10-I01', title: 'Measurable improvement in women leadership over time', weight: 1.5, scoringType: 'numeric_scale', sortOrder: 1 },
    { domainCode: 'D10', code: 'D10-I02', title: 'Measurable improvement in youth leadership over time', weight: 1.5, scoringType: 'numeric_scale', sortOrder: 2 },
    { domainCode: 'D10', code: 'D10-I03', title: 'Member satisfaction with inclusion efforts', weight: 1.0, scoringType: 'weighted_choice', sortOrder: 3 },
  ];

  for (const ind of indicators) {
    const domain = createdDomains[ind.domainCode];
    await prisma.domainIndicator.upsert({
      where: { code: ind.code },
      update: {},
      create: {
        domainId: domain.id,
        code: ind.code,
        title: ind.title,
        weight: ind.weight,
        scoringType: ind.scoringType,
        sortOrder: ind.sortOrder,
      },
    });
  }
  console.log('✓ Indicators seeded');

  // ── Default Recommendations ────────────────────────────────────────────────
  const d02 = createdDomains['D02'];
  const d04 = createdDomains['D04'];
  const d06 = createdDomains['D06'];
  const d09 = createdDomains['D09'];

  const recommendations = [
    { domainId: d02.id, title: 'Introduce Leadership Quotas', recommendationText: 'Consider reserved seats or leadership quotas for women and youth in executive positions.', conditionType: 'score_below', conditionValue: '2.0', priorityLevel: 'high' },
    { domainId: d04.id, title: 'Improve Meeting Accessibility', recommendationText: 'Review meeting times, venues, and provide transport or childcare support to improve attendance.', conditionType: 'score_below', conditionValue: '2.0', priorityLevel: 'high' },
    { domainId: d06.id, title: 'Establish Grievance Mechanisms', recommendationText: 'Create formal grievance and feedback channels for inclusion-related concerns.', conditionType: 'score_below', conditionValue: '2.0', priorityLevel: 'medium' },
    { domainId: d09.id, title: 'Launch Mentorship Programs', recommendationText: 'Develop mentorship and training programs targeting women and youth for leadership roles.', conditionType: 'score_below', conditionValue: '2.0', priorityLevel: 'medium' },
  ];

  for (const rec of recommendations) {
    await prisma.recommendation.create({ data: rec }).catch(() => {});
  }
  console.log('✓ Recommendations seeded');

  // ── Super Admin User ───────────────────────────────────────────────────────
  const adminRole = roles.find(r => r.code === 'super_admin');
  const passwordHash = await bcrypt.hash('Admin@1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ildp.org' },
    update: {},
    create: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@ildp.org',
      passwordHash,
      status: 'active',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  console.log('✓ Super admin seeded (admin@ildp.org / Admin@1234)');
  console.log('\nSeeding complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
