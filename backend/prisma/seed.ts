import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const Role = {
  STUDENT: 'STUDENT',
  MAINTENANCE: 'MAINTENANCE',
  WARDEN: 'WARDEN',
  SUPERADMIN: 'SUPERADMIN',
} as const;

const HostelType = {
  BOYS: 'BOYS',
  GIRLS: 'GIRLS',
  COED: 'COED',
} as const;

const Severity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

const ComplaintStatus = {
  SUBMITTED: 'SUBMITTED',
  AI_PROCESSED: 'AI_PROCESSED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data in reverse order of dependencies
  await prisma.feedback.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.complaintEvent.deleteMany();
  await prisma.complaintAttachment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.roomAllocation.deleteMany();
  await prisma.room.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.block.deleteMany();
  await prisma.hostel.deleteMany();
  await prisma.user.deleteMany();
  await prisma.insight.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Sharma',
      email: 'admin@vynk.local',
      password_hash: passwordHash,
      role: Role.SUPERADMIN,
      phone: '+91 98765 00001',
    },
  });

  const wardenBoys = await prisma.user.create({
    data: {
      name: 'Prof. Suresh Nair',
      email: 'warden.boys@vynk.local',
      password_hash: passwordHash,
      role: Role.WARDEN,
      phone: '+91 98765 00002',
    },
  });

  const wardenGirls = await prisma.user.create({
    data: {
      name: 'Dr. Sunita Rao',
      email: 'warden.girls@vynk.local',
      password_hash: passwordHash,
      role: Role.WARDEN,
      phone: '+91 98765 00003',
    },
  });

  const techPlumbing = await prisma.user.create({
    data: {
      name: 'Ramesh Kumar (Plumbing Lead)',
      email: 'tech.plumbing@vynk.local',
      password_hash: passwordHash,
      role: Role.MAINTENANCE,
      phone: '+91 98765 00010',
    },
  });

  const techElectric = await prisma.user.create({
    data: {
      name: 'Manoj Patel (Electric Lead)',
      email: 'tech.electric@vynk.local',
      password_hash: passwordHash,
      role: Role.MAINTENANCE,
      phone: '+91 98765 00011',
    },
  });

  const techClean = await prisma.user.create({
    data: {
      name: 'Govind Ram (Sanitation Lead)',
      email: 'tech.clean@vynk.local',
      password_hash: passwordHash,
      role: Role.MAINTENANCE,
      phone: '+91 98765 00012',
    },
  });

  const techCarpentry = await prisma.user.create({
    data: {
      name: 'Kishan Singh (Carpentry Lead)',
      email: 'tech.carpentry@vynk.local',
      password_hash: passwordHash,
      role: Role.MAINTENANCE,
      phone: '+91 98765 00013',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'student1@vynk.local',
      password_hash: passwordHash,
      role: Role.STUDENT,
      phone: '+91 98765 10001',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Rohan Verma',
      email: 'student2@vynk.local',
      password_hash: passwordHash,
      role: Role.STUDENT,
      phone: '+91 98765 10002',
    },
  });

  const student3 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'student3@vynk.local',
      password_hash: passwordHash,
      role: Role.STUDENT,
      phone: '+91 98765 10003',
    },
  });

  const student4 = await prisma.user.create({
    data: {
      name: 'Ananya Iyer',
      email: 'student4@vynk.local',
      password_hash: passwordHash,
      role: Role.STUDENT,
      phone: '+91 98765 10004',
    },
  });

  console.log('✅ Created demo users for all roles');

  // 2. Create Hostels, Blocks, Floors, and 60 Rooms
  const hostelBoys = await prisma.hostel.create({
    data: {
      name: 'Aryabhata Boys Hostel',
      type: HostelType.BOYS,
      warden_id: wardenBoys.id,
    },
  });

  const hostelGirls = await prisma.hostel.create({
    data: {
      name: 'Sarojini Girls Hostel',
      type: HostelType.GIRLS,
      warden_id: wardenGirls.id,
    },
  });

  const blockA = await prisma.block.create({
    data: { hostel_id: hostelBoys.id, name: 'Block A' },
  });

  const blockB = await prisma.block.create({
    data: { hostel_id: hostelBoys.id, name: 'Block B' },
  });

  const blockC = await prisma.block.create({
    data: { hostel_id: hostelGirls.id, name: 'Block C' },
  });

  // Create floors and rooms (Total 60 rooms)
  // Block A: 2 floors, 10 rooms each = 20 rooms
  // Block B: 2 floors, 10 rooms each = 20 rooms
  // Block C: 2 floors, 10 rooms each = 20 rooms
  let demoRoom204Id = '';
  let demoRoom102Id = '';
  let demoRoom305Id = '';
  let blockBFloor2RoomId = '';

  const blocksList = [
    { block: blockA, prefix: 'A', floorsCount: 2 },
    { block: blockB, prefix: 'B', floorsCount: 2 },
    { block: blockC, prefix: 'C', floorsCount: 2 },
  ];

  for (const b of blocksList) {
    for (let f = 1; f <= b.floorsCount; f++) {
      const floor = await prisma.floor.create({
        data: {
          block_id: b.block.id,
          number: f,
        },
      });

      for (let r = 1; r <= 10; r++) {
        const roomNum = `${f}${r < 10 ? '0' + r : r}`;
        const room = await prisma.room.create({
          data: {
            floor_id: floor.id,
            room_no: `${b.prefix}-${roomNum}`,
            capacity: 2,
          },
        });

        if (b.prefix === 'A' && roomNum === '204') {
          demoRoom204Id = room.id;
        }
        if (b.prefix === 'C' && roomNum === '102') {
          demoRoom102Id = room.id;
        }
        if (b.prefix === 'C' && roomNum === '205') {
          demoRoom305Id = room.id;
        }
        if (b.prefix === 'B' && f === 2 && r === 1) {
          blockBFloor2RoomId = room.id;
        }
      }
    }
  }

  console.log('✅ Created 2 Hostels, 3 Blocks, Floors, and 60 Rooms');

  // Allocate students
  await prisma.roomAllocation.create({
    data: {
      room_id: demoRoom204Id,
      student_id: student1.id,
      from_date: new Date('2026-01-01'),
    },
  });

  await prisma.roomAllocation.create({
    data: {
      room_id: demoRoom204Id,
      student_id: student2.id,
      from_date: new Date('2026-01-01'),
    },
  });

  await prisma.roomAllocation.create({
    data: {
      room_id: demoRoom102Id,
      student_id: student3.id,
      from_date: new Date('2026-01-01'),
    },
  });

  await prisma.roomAllocation.create({
    data: {
      room_id: demoRoom305Id,
      student_id: student4.id,
      from_date: new Date('2026-01-01'),
    },
  });

  console.log('✅ Created Room Allocations');

  // 3. Create 8 Categories with Subcategories
  const catPlumbing = await prisma.category.create({
    data: {
      name: 'Plumbing',
      default_sla_hours: 24,
      subcategories: {
        create: [
          { name: 'Water Leakage', base_severity: Severity.HIGH },
          { name: 'Clogged Drain / Toilet', base_severity: Severity.MEDIUM },
          { name: 'Broken Tap / Flush Valve', base_severity: Severity.LOW },
          { name: 'No Water Supply', base_severity: Severity.CRITICAL },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catElectrical = await prisma.category.create({
    data: {
      name: 'Electrical',
      default_sla_hours: 24,
      subcategories: {
        create: [
          { name: 'Sparking / Short Circuit / Exposed Wire', base_severity: Severity.CRITICAL },
          { name: 'Power Outage in Room', base_severity: Severity.HIGH },
          { name: 'Switchboard / Socket Fault', base_severity: Severity.MEDIUM },
          { name: 'Fan / Tube Light Not Working', base_severity: Severity.LOW },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catSanitation = await prisma.category.create({
    data: {
      name: 'Sanitation & Cleanliness',
      default_sla_hours: 12,
      subcategories: {
        create: [
          { name: 'Bathroom Deep Cleaning Needed', base_severity: Severity.MEDIUM },
          { name: 'Pest / Insect Infestation', base_severity: Severity.HIGH },
          { name: 'Corridor Garbage / Dustbin Overflow', base_severity: Severity.LOW },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catInternet = await prisma.category.create({
    data: {
      name: 'Internet & Wi-Fi',
      default_sla_hours: 24,
      subcategories: {
        create: [
          { name: 'No Wi-Fi Signal / Access Point Down', base_severity: Severity.HIGH },
          { name: 'Slow Speed / Frequent Disconnects', base_severity: Severity.LOW },
          { name: 'LAN Port Not Working', base_severity: Severity.MEDIUM },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catFurniture = await prisma.category.create({
    data: {
      name: 'Furniture & Carpentry',
      default_sla_hours: 48,
      subcategories: {
        create: [
          { name: 'Broken Door Lock / Latch', base_severity: Severity.HIGH },
          { name: 'Damaged Bed Frame / Cot', base_severity: Severity.MEDIUM },
          { name: 'Study Table / Chair Broken', base_severity: Severity.LOW },
          { name: 'Cupboard Hinge / Shelf Damaged', base_severity: Severity.LOW },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catFood = await prisma.category.create({
    data: {
      name: 'Food & Mess',
      default_sla_hours: 12,
      subcategories: {
        create: [
          { name: 'Food Quality / Contamination Issue', base_severity: Severity.CRITICAL },
          { name: 'Water Cooler / RO Dispenser Malfunction', base_severity: Severity.HIGH },
          { name: 'Mess Hygiene & Dining Area', base_severity: Severity.MEDIUM },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catSecurity = await prisma.category.create({
    data: {
      name: 'Security & Access',
      default_sla_hours: 6,
      subcategories: {
        create: [
          { name: 'Unauthorized Intrusion / Suspicious Activity', base_severity: Severity.CRITICAL },
          { name: 'Lost Key / Locked Out Emergency', base_severity: Severity.MEDIUM },
          { name: 'Damaged Window Grill / Balcony Railing', base_severity: Severity.HIGH },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catInfra = await prisma.category.create({
    data: {
      name: 'Room Infrastructure',
      default_sla_hours: 72,
      subcategories: {
        create: [
          { name: 'Severe Wall Dampness / Seepage', base_severity: Severity.MEDIUM },
          { name: 'Ceiling Plaster Flaking', base_severity: Severity.LOW },
          { name: 'Window Glass Broken', base_severity: Severity.MEDIUM },
        ],
      },
    },
    include: { subcategories: true },
  });

  console.log('✅ Created 8 Categories with detailed Subcategories');

  // 4. Create 4 Teams & Members
  const teamPlumbing = await prisma.team.create({
    data: {
      name: 'Plumbing & Water Services',
      category_ids: JSON.stringify([catPlumbing.id, catSanitation.id]),
      head_id: techPlumbing.id,
      members: {
        create: [
          { user_id: techPlumbing.id, current_load: 1, active: true },
          { user_id: techClean.id, current_load: 0, active: true },
        ],
      },
    },
  });

  const teamElectrical = await prisma.team.create({
    data: {
      name: 'Electrical & Networks',
      category_ids: JSON.stringify([catElectrical.id, catInternet.id]),
      head_id: techElectric.id,
      members: {
        create: [
          { user_id: techElectric.id, current_load: 1, active: true },
        ],
      },
    },
  });

  const teamCarpentry = await prisma.team.create({
    data: {
      name: 'Carpentry & Infrastructure',
      category_ids: JSON.stringify([catFurniture.id, catInfra.id]),
      head_id: techCarpentry.id,
      members: {
        create: [
          { user_id: techCarpentry.id, current_load: 0, active: true },
        ],
      },
    },
  });

  const teamSecurity = await prisma.team.create({
    data: {
      name: 'Security & Mess Operations',
      category_ids: JSON.stringify([catSecurity.id, catFood.id]),
      head_id: admin.id,
      members: {
        create: [
          { user_id: admin.id, current_load: 0, active: true },
        ],
      },
    },
  });

  // Link default_team_id back to categories
  await prisma.category.update({ where: { id: catPlumbing.id }, data: { default_team_id: teamPlumbing.id } });
  await prisma.category.update({ where: { id: catSanitation.id }, data: { default_team_id: teamPlumbing.id } });
  await prisma.category.update({ where: { id: catElectrical.id }, data: { default_team_id: teamElectrical.id } });
  await prisma.category.update({ where: { id: catInternet.id }, data: { default_team_id: teamElectrical.id } });
  await prisma.category.update({ where: { id: catFurniture.id }, data: { default_team_id: teamCarpentry.id } });
  await prisma.category.update({ where: { id: catInfra.id }, data: { default_team_id: teamCarpentry.id } });
  await prisma.category.update({ where: { id: catSecurity.id }, data: { default_team_id: teamSecurity.id } });
  await prisma.category.update({ where: { id: catFood.id }, data: { default_team_id: teamSecurity.id } });

  console.log('✅ Created 4 Maintenance Teams and linked Default Teams');

  // 5. Create Realistic Seed Complaints for Demo Scripts
  // Complaint 1: Primary active complaint (Section 15 Demo Script step 1)
  const leakSubcat = catPlumbing.subcategories.find((s) => s.name === 'Water Leakage')!;
  const complaint1 = await prisma.complaint.create({
    data: {
      student_id: student1.id,
      room_id: demoRoom204Id,
      hostel_id: hostelBoys.id,
      category_id: catPlumbing.id,
      subcategory_id: leakSubcat.id,
      title: 'Water leaking near electrical socket in room 204',
      description: 'There is water actively dripping from the ceiling right next to the study desk power socket. Water is accumulating near electrical wiring.',
      severity: Severity.CRITICAL,
      priority_score: 9.5,
      status: ComplaintStatus.ASSIGNED,
      ai_category: 'Plumbing',
      ai_confidence: 0.94,
      ai_summary: 'Critical water seepage near power outlet posing electrical shock hazard.',
      assigned_team_id: teamPlumbing.id,
      assigned_to: techPlumbing.id,
      sla_due_at: new Date(Date.now() + 4 * 3600 * 1000), // 4h SLA for Critical
      escalation_level: 0,
      events: {
        create: [
          {
            actor_id: student1.id,
            action: 'SUBMITTED',
            to_status: ComplaintStatus.SUBMITTED,
            note: 'Complaint submitted by Aarav Sharma',
          },
          {
            action: 'AI_TRIAGE',
            from_status: ComplaintStatus.SUBMITTED,
            to_status: ComplaintStatus.AI_PROCESSED,
            note: 'AI classified as Plumbing / Water Leakage (Severity: CRITICAL, confidence 0.94)',
          },
          {
            actor_id: admin.id,
            action: 'ASSIGNED',
            from_status: ComplaintStatus.AI_PROCESSED,
            to_status: ComplaintStatus.ASSIGNED,
            note: 'Auto-routed to Plumbing & Water Services team; assigned to Ramesh Kumar',
          },
        ],
      },
      notifications: {
        create: [
          {
            user_id: techPlumbing.id,
            message: 'New Critical complaint assigned: Water leaking near socket in room A-204',
          },
        ],
      },
    },
  });

  // Complaint 2: Duplicate complaint from roommate (Section 15 Demo Script step 3)
  await prisma.complaint.create({
    data: {
      student_id: student2.id,
      room_id: demoRoom204Id,
      hostel_id: hostelBoys.id,
      category_id: catPlumbing.id,
      subcategory_id: leakSubcat.id,
      title: 'Ceiling leaking water close to socket',
      description: 'Water is dripping from the ceiling above the desk socket. Pls fix ASAP.',
      severity: Severity.CRITICAL,
      priority_score: 8.0,
      status: ComplaintStatus.AI_PROCESSED,
      ai_category: 'Plumbing',
      ai_confidence: 0.91,
      ai_summary: 'Duplicate ceiling leak report in Room 204.',
      duplicate_of_id: complaint1.id,
      events: {
        create: [
          {
            actor_id: student2.id,
            action: 'SUBMITTED',
            to_status: ComplaintStatus.SUBMITTED,
            note: 'Complaint submitted by Rohan Verma',
          },
          {
            action: 'AI_DUPLICATE_DETECTED',
            from_status: ComplaintStatus.SUBMITTED,
            to_status: ComplaintStatus.AI_PROCESSED,
            note: `AI detected 92% semantic similarity with complaint #${complaint1.id}. Linked as duplicate.`,
          },
        ],
      },
      notifications: {
        create: [
          {
            user_id: student2.id,
            message: `Your issue was identified as a duplicate of #${complaint1.id.slice(0, 8)} and linked to tracking.`,
          },
        ],
      },
    },
  });

  // Complaint 3: Electrical in-progress
  const sparkSubcat = catElectrical.subcategories.find((s) => s.name.includes('Sparking'))!;
  await prisma.complaint.create({
    data: {
      student_id: student3.id,
      room_id: demoRoom102Id,
      hostel_id: hostelGirls.id,
      category_id: catElectrical.id,
      subcategory_id: sparkSubcat.id,
      title: 'Switchboard sparking and burning smell',
      description: 'When switching on the ceiling fan, sparks flew out and there is a burning plastic smell.',
      severity: Severity.CRITICAL,
      priority_score: 9.8,
      status: ComplaintStatus.IN_PROGRESS,
      ai_category: 'Electrical',
      ai_confidence: 0.96,
      ai_summary: 'Hazardous sparking switchboard with burning smell.',
      assigned_team_id: teamElectrical.id,
      assigned_to: techElectric.id,
      sla_due_at: new Date(Date.now() + 2 * 3600 * 1000),
      events: {
        create: [
          {
            actor_id: student3.id,
            action: 'SUBMITTED',
            to_status: ComplaintStatus.SUBMITTED,
            note: 'Submitted by Priya Patel',
          },
          {
            actor_id: techElectric.id,
            action: 'STATUS_CHANGE',
            from_status: ComplaintStatus.ASSIGNED,
            to_status: ComplaintStatus.IN_PROGRESS,
            note: 'Technician on site inspecting MCB and wiring',
          },
        ],
      },
    },
  });

  // Complaint 4: Resolved with feedback
  const lockSubcat = catFurniture.subcategories.find((s) => s.name.includes('Door Lock'))!;
  const resolvedComplaint = await prisma.complaint.create({
    data: {
      student_id: student4.id,
      room_id: demoRoom305Id,
      hostel_id: hostelGirls.id,
      category_id: catFurniture.id,
      subcategory_id: lockSubcat.id,
      title: 'Broken door lock latch cannot latch shut',
      description: 'The internal latch came loose and room cannot be locked from inside.',
      severity: Severity.HIGH,
      priority_score: 6.5,
      status: ComplaintStatus.RESOLVED,
      ai_category: 'Furniture & Carpentry',
      ai_confidence: 0.88,
      ai_summary: 'Internal room lock latch detached.',
      assigned_team_id: teamCarpentry.id,
      assigned_to: techCarpentry.id,
      resolved_at: new Date(Date.now() - 3600 * 1000),
      events: {
        create: [
          {
            actor_id: student4.id,
            action: 'SUBMITTED',
            to_status: ComplaintStatus.SUBMITTED,
          },
          {
            actor_id: techCarpentry.id,
            action: 'STATUS_CHANGE',
            from_status: ComplaintStatus.IN_PROGRESS,
            to_status: ComplaintStatus.RESOLVED,
            note: 'Replaced screws and reinforced latch plate.',
          },
        ],
      },
      feedbacks: {
        create: {
          rating: 5,
          comment: 'Fixed within 2 hours! Very courteous technician.',
        },
      },
    },
  });

  // Additional complaints in Block B Floor 2 to trigger the recurring issue detector
  for (let i = 1; i <= 6; i++) {
    await prisma.complaint.create({
      data: {
        student_id: student1.id,
        room_id: blockBFloor2RoomId,
        hostel_id: hostelBoys.id,
        category_id: catPlumbing.id,
        subcategory_id: leakSubcat.id,
        title: `Pipe joint leakage #${i} in Block B corridor`,
        description: `Corridor pipeline joint ${i} showing persistent water leakage.`,
        severity: Severity.MEDIUM,
        status: ComplaintStatus.CLOSED,
        resolved_at: new Date(Date.now() - (7 - i) * 24 * 3600 * 1000),
        closed_at: new Date(Date.now() - (7 - i) * 24 * 3600 * 1000),
      },
    });
  }

  // Pre-seed an AI Insight
  await prisma.insight.create({
    data: {
      scope: 'HOSTEL',
      period: '30_DAYS',
      summary_text: 'Aryabhata Boys Hostel (Block B, Floor 2) has recorded 7 plumbing complaints over the last 14 days, primarily related to joint water leaks. Preventive inspection of the main distribution riser pipe is strongly recommended.',
    },
  });

  console.log('✅ Created Seed Complaints, Events, Feedbacks, and AI Insights');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
