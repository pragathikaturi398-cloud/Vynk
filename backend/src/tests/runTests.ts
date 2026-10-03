import { AIService } from '../modules/ai/ai.service';
import { WorkflowService, SLA_BY_SEVERITY } from '../modules/workflow/workflow.service';
import { cosineSimilarity } from '../utils/vector';
import { generateAccessToken, verifyAccessToken } from '../utils/jwt';
import { ComplaintStatus, Severity } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n=============================================');
  console.log('🧪 RUNNING VYNK BACKEND UNIT TEST SUITE');
  console.log('=============================================\n');

  // Test 1: Vector Cosine Similarity
  console.log('▶ Test Group 1: Vector Cosine Similarity');
  const v1 = [1, 0, 0];
  const v2 = [1, 0, 0];
  const v3 = [0, 1, 0];
  const v4 = [0.8, 0.6, 0];

  assert(Math.abs(cosineSimilarity(v1, v2) - 1.0) < 0.001, 'Identical vectors have similarity 1.0');
  assert(Math.abs(cosineSimilarity(v1, v3) - 0.0) < 0.001, 'Orthogonal vectors have similarity 0.0');
  assert(cosineSimilarity(v1, v4) > 0.79, 'Partially aligned vectors yield expected similarity');

  // Test 2: AI Keyword Fallback Classification
  console.log('\n▶ Test Group 2: AI Keyword Fallback Rules (Section 6)');
  const c1 = AIService.ruleBasedClassifier('Active water leak near electric socket in room 204');
  assert(c1.category === 'Plumbing', `Leak correctly categorized as Plumbing (got ${c1.category})`);
  assert(c1.severity === Severity.CRITICAL, `Leak near electric socket marked CRITICAL (got ${c1.severity})`);

  const c2 = AIService.ruleBasedClassifier('Ceiling fan and tube light not working');
  assert(c2.category === 'Electrical', `Tube light categorized as Electrical (got ${c2.category})`);
  assert(c2.severity === Severity.LOW, `Broken light marked LOW severity (got ${c2.severity})`);

  const c3 = AIService.ruleBasedClassifier('Wi-Fi disconnected in entire block A floor 2');
  assert(c3.category === 'Internet & Wi-Fi', `Wi-Fi issue categorized as Internet (got ${c3.category})`);

  const c4 = AIService.ruleBasedClassifier('Broken door lock latch cannot lock room');
  assert(c4.category === 'Furniture & Carpentry', `Door lock categorized as Furniture & Carpentry`);
  assert(c4.severity === Severity.HIGH, `Broken door lock marked HIGH severity`);

  // Test 3: Priority Score Calculation
  console.log('\n▶ Test Group 3: Priority Score Calculation');
  const prioCritical = AIService.calculatePriorityScore({
    severity: Severity.CRITICAL,
    isSafetyIssue: true,
    duplicateCount: 2,
  });
  const prioLow = AIService.calculatePriorityScore({
    severity: Severity.LOW,
    isSafetyIssue: false,
    duplicateCount: 0,
  });
  assert(prioCritical > prioLow, `Critical safety priority (${prioCritical}) > Low priority (${prioLow})`);
  assert(prioCritical >= 10.0, `Priority score reaches >= 10 for critical duplicate issues`);

  // Test 4: State Machine Transitions
  console.log('\n▶ Test Group 4: Workflow State Machine Transitions');
  assert(
    WorkflowService.isValidTransition(ComplaintStatus.SUBMITTED, ComplaintStatus.AI_PROCESSED),
    'SUBMITTED -> AI_PROCESSED is allowed'
  );
  assert(
    WorkflowService.isValidTransition(ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS),
    'ASSIGNED -> IN_PROGRESS is allowed'
  );
  assert(
    WorkflowService.isValidTransition(ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED),
    'IN_PROGRESS -> RESOLVED is allowed'
  );
  assert(
    WorkflowService.isValidTransition(ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED),
    'RESOLVED -> CLOSED is allowed'
  );
  assert(
    WorkflowService.isValidTransition(ComplaintStatus.RESOLVED, ComplaintStatus.REOPENED),
    'RESOLVED -> REOPENED is allowed'
  );
  assert(
    !WorkflowService.isValidTransition(ComplaintStatus.SUBMITTED, ComplaintStatus.RESOLVED),
    'SUBMITTED directly to RESOLVED is prohibited'
  );
  assert(
    !WorkflowService.isValidTransition(ComplaintStatus.CLOSED, ComplaintStatus.IN_PROGRESS),
    'CLOSED directly to IN_PROGRESS is prohibited without reopening'
  );

  // Test 5: SLA Configuration
  console.log('\n▶ Test Group 5: SLA Windows by Severity');
  assert(SLA_BY_SEVERITY[Severity.CRITICAL].resolutionHours === 4, 'Critical resolution SLA is 4 hours');
  assert(SLA_BY_SEVERITY[Severity.HIGH].resolutionHours === 24, 'High resolution SLA is 24 hours');
  assert(SLA_BY_SEVERITY[Severity.MEDIUM].resolutionHours === 48, 'Medium resolution SLA is 48 hours');
  assert(SLA_BY_SEVERITY[Severity.LOW].resolutionHours === 120, 'Low resolution SLA is 5 days');

  // Test 6: JWT Token Handling
  console.log('\n▶ Test Group 6: JWT Sign & Verify');
  const dummyPayload = { userId: 'usr-123', email: 'test@vynk.local', role: 'STUDENT' };
  const token = generateAccessToken(dummyPayload);
  const decoded = verifyAccessToken(token);
  assert(decoded.userId === dummyPayload.userId, 'JWT decodes correct userId');
  assert(decoded.role === dummyPayload.role, 'JWT decodes correct role');

  console.log('\n---------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('---------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
