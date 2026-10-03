import assert from 'assert';
import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../config/prisma';
import { Role } from '../types';

async function runAuthFlowTests() {
  console.log('\n=============================================');
  console.log('🧪 RUNNING AUTHENTICATION & ONBOARDING TESTS');
  console.log('=============================================\n');

  try {
    const testEmail = `test_student_${Date.now()}@campus.edu`;
    const testPassword = 'studentPassword123';

    // 1. Student Signup (email + password only)
    console.log('▶ Test Group 1: Student Self-Registration (Email + Password only)');
    const signupRes = await AuthService.registerStudent(testEmail, testPassword);
    assert(signupRes.accessToken, 'Access token should be issued');
    assert.strictEqual(signupRes.user.email, testEmail);
    assert.strictEqual(signupRes.user.role, Role.STUDENT);
    assert.strictEqual(signupRes.user.is_first_login, true, 'is_first_login must be true for new student');
    console.log(`  ✅ PASS: Student signed up with email & password. is_first_login = true.`);

    // 2. Student First Login Onboarding
    console.log('\n▶ Test Group 2: Student First Login Profile Onboarding');
    const onboardingRes = await AuthService.completeStudentOnboarding(signupRes.user.id, {
      name: 'Aditya Sharma',
      studentId: 'STU-2026-99',
      hostelName: 'Kaveri Residency',
      roomNumber: '305',
    });
    assert.strictEqual(onboardingRes.user.name, 'Aditya Sharma');
    assert.strictEqual(onboardingRes.user.student_id_number, 'STU-2026-99');
    assert.strictEqual(onboardingRes.user.is_first_login, false, 'is_first_login must be false after onboarding');
    assert(onboardingRes.user.room, 'Room must be allocated');
    assert.strictEqual(onboardingRes.user.room.roomNo, '305');
    assert.strictEqual(onboardingRes.user.room.hostelName, 'Kaveri Residency');
    console.log(`  ✅ PASS: Profile saved. Room 305 in Kaveri Residency allocated.`);

    // 3. Subsequent Student Login
    console.log('\n▶ Test Group 3: Subsequent Student Login');
    const loginRes = await AuthService.login(testEmail, testPassword);
    assert.strictEqual(loginRes.user.name, 'Aditya Sharma');
    assert.strictEqual(loginRes.user.is_first_login, false, 'is_first_login should remain false');
    assert.strictEqual(loginRes.user.room?.roomNo, '305');
    console.log('  ✅ PASS: Subsequent login returns completed profile without onboarding prompt.');

    // 4. Super Admin Login & First-time Password Setup
    console.log('\n▶ Test Group 4: Super Admin First-time Password Setup');
    // Ensure admin is in initial state
    await prisma.user.updateMany({
      where: { email: 'admin@vynk.local' },
      data: { is_first_login: true },
    });

    const adminLogin1 = await AuthService.login('admin@vynk.local', 'password123');
    assert.strictEqual(adminLogin1.user.role, Role.SUPERADMIN);
    assert.strictEqual(adminLogin1.user.is_first_login, true, 'Admin should require first-time password set');

    const updatedAdmin = await AuthService.setFirstTimePassword(
      adminLogin1.user.id,
      'password123',
      'SuperAdminPermanentPass@2026'
    );
    assert.strictEqual(updatedAdmin.user.is_first_login, false, 'is_first_login must be false after password set');

    // Verify new password works
    const adminLogin2 = await AuthService.login('admin@vynk.local', 'SuperAdminPermanentPass@2026');
    assert.strictEqual(adminLogin2.user.is_first_login, false);
    console.log('  ✅ PASS: Super admin successfully updated permanent password on first login.');

    // Reset admin password back to 'password123' for standard demo consistency
    await AuthService.setFirstTimePassword(
      adminLogin1.user.id,
      'SuperAdminPermanentPass@2026',
      'password123'
    );

    // 5. Maintenance Staff Login (Through Super Admin / Staff Portal)
    console.log('\n▶ Test Group 5: Maintenance Staff Login');
    const staffLogin = await AuthService.login('tech.plumbing@vynk.local', 'password123');
    assert.strictEqual(staffLogin.user.role, Role.MAINTENANCE, 'Staff role must be MAINTENANCE');
    assert.strictEqual(staffLogin.user.is_first_login, false);
    console.log('  ✅ PASS: Maintenance staff successfully authenticated with role MAINTENANCE.');

    // Clean up test student
    await prisma.user.delete({ where: { id: signupRes.user.id } });
    console.log('\n  ✅ PASS: Cleaned up test student account.');

    console.log('\n---------------------------------------------');
    console.log('Results: All Auth & Onboarding tests passed! (100%)');
    console.log('---------------------------------------------\n');
  } catch (err) {
    console.error('❌ Auth test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthFlowTests();
