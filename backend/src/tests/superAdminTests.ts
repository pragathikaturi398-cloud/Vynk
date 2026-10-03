import assert from 'assert';
import { prisma } from '../config/prisma';
import { AnalyticsService } from '../modules/analytics/analytics.service';
import { Role } from '../types';

async function runSuperAdminTests() {
  console.log('\n=============================================');
  console.log('🧪 RUNNING SUPER ADMIN BACKEND TESTS');
  console.log('=============================================\n');

  try {
    // 1. Analytics super admin metrics
    console.log('▶ Test Group 1: Super Admin Overview Metrics');
    const metrics = await AnalyticsService.getSuperAdminMetrics();
    assert.strictEqual(typeof metrics.total, 'number', 'metrics.total should be a number');
    assert.strictEqual(typeof metrics.pending, 'number', 'metrics.pending should be a number');
    assert.strictEqual(typeof metrics.assigned, 'number', 'metrics.assigned should be a number');
    assert.strictEqual(typeof metrics.solved, 'number', 'metrics.solved should be a number');
    assert.strictEqual(typeof metrics.totalHostels, 'number', 'metrics.totalHostels should be a number');
    assert.strictEqual(typeof metrics.totalRooms, 'number', 'metrics.totalRooms should be a number');
    assert.strictEqual(typeof metrics.totalStudents, 'number', 'metrics.totalStudents should be a number');
    assert.strictEqual(typeof metrics.totalStaff, 'number', 'metrics.totalStaff should be a number');
    assert(Array.isArray(metrics.recentComplaints), 'metrics.recentComplaints should be an array');
    console.log(`  ✅ PASS: Super admin metrics returned successfully: total=${metrics.total}, pending=${metrics.pending}, assigned=${metrics.assigned}, solved=${metrics.solved}`);

    // 2. User Management
    console.log('\n▶ Test Group 2: User Provisioning and Scoping');
    const testEmail = `superadmin_test_${Date.now()}@vynk.campus`;
    const createdUser = await prisma.user.create({
      data: {
        name: 'Test Staff User',
        email: testEmail,
        password_hash: 'testhash123',
        role: Role.MAINTENANCE,
        phone: '9988776655',
      },
    });
    assert.strictEqual(createdUser.email, testEmail);
    assert.strictEqual(createdUser.role, Role.MAINTENANCE);
    console.log('  ✅ PASS: Created test user successfully');

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: createdUser.id },
      data: { role: Role.WARDEN },
    });
    assert.strictEqual(updatedUser.role, Role.WARDEN);
    console.log('  ✅ PASS: Updated user role to WARDEN');

    // Clean up user
    await prisma.user.delete({ where: { id: createdUser.id } });
    console.log('  ✅ PASS: Deleted test user');

    // 3. Infrastructure Management
    console.log('\n▶ Test Group 3: Infrastructure Hierarchy (Hostel -> Block -> Floor -> Room)');
    const testHostel = await prisma.hostel.create({
      data: {
        name: `Test Hostel ${Date.now()}`,
        type: 'BOYS',
      },
    });
    assert(testHostel.id);

    const testBlock = await prisma.block.create({
      data: {
        name: 'Block Z',
        hostel_id: testHostel.id,
      },
    });
    assert(testBlock.id);

    const testFloor = await prisma.floor.create({
      data: {
        number: 9,
        block_id: testBlock.id,
      },
    });
    assert(testFloor.id);

    const testRoom = await prisma.room.create({
      data: {
        room_no: '901',
        capacity: 3,
        floor_id: testFloor.id,
      },
    });
    assert.strictEqual(testRoom.room_no, '901');
    assert.strictEqual(testRoom.capacity, 3);
    console.log('  ✅ PASS: Created Hostel -> Block -> Floor -> Room hierarchy');

    // Delete hierarchy
    await prisma.room.delete({ where: { id: testRoom.id } });
    await prisma.floor.delete({ where: { id: testFloor.id } });
    await prisma.block.delete({ where: { id: testBlock.id } });
    await prisma.hostel.delete({ where: { id: testHostel.id } });
    console.log('  ✅ PASS: Successfully deleted test infrastructure');

    // 4. Category & Team Management
    console.log('\n▶ Test Group 4: Category and Team Creation');
    const testCatName = `Test Category ${Date.now()}`;
    const testCat = await prisma.category.create({
      data: {
        name: testCatName,
        default_sla_hours: 12,
      },
    });
    assert.strictEqual(testCat.name, testCatName);
    assert.strictEqual(testCat.default_sla_hours, 12);

    const testSubcat = await prisma.subcategory.create({
      data: {
        name: 'Test Subissue',
        category_id: testCat.id,
        base_severity: 'HIGH',
      },
    });
    assert.strictEqual(testSubcat.base_severity, 'HIGH');

    const testTeamName = `Test Team ${Date.now()}`;
    const testTeam = await prisma.team.create({
      data: {
        name: testTeamName,
        category_ids: JSON.stringify([testCat.id]),
      },
    });
    assert.strictEqual(testTeam.name, testTeamName);

    // Clean up
    await prisma.team.delete({ where: { id: testTeam.id } });
    await prisma.subcategory.delete({ where: { id: testSubcat.id } });
    await prisma.category.delete({ where: { id: testCat.id } });
    console.log('  ✅ PASS: Created and cleaned up Category, Subcategory, and Team');

    console.log('\n---------------------------------------------');
    console.log('Results: All Super Admin tests passed! (100%)');
    console.log('---------------------------------------------\n');
  } catch (err) {
    console.error('❌ Super Admin test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSuperAdminTests();
