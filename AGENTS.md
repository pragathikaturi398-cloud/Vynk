# Vynk: Smart Hostel Complaint Management Platform Rules

## Core Principles
1. **Modular Monolith**: One backend service with clean domain separation (`modules/`).
2. **Spec Compliance**: Adhere strictly to `architecture.md` data schemas, role permissions, and API contracts.
3. **Data Integrity & Audit**:
   - Every complaint status transition MUST record an immutable entry in `complaint_events`.
   - Never expose update or delete endpoints for `complaint_events`.
4. **Validation First**:
   - Every incoming request body and query must be strictly validated with Zod schemas.
5. **Role-Based Access Control (RBAC)**:
   - Always enforce `requireRole(...)` middleware.
   - Row-level scoping:
     - Students can only view or create their own complaints (`student_id = me`).
     - Wardens can only view and manage complaints and rooms in their assigned hostel.
     - Maintenance staff only view and transition complaints assigned to them or their team.
     - Super Admins have unrestricted system access.
6. **AI Reliability & Graceful Fallback**:
   - The AI service must wrap Gemini API calls with robust timeout and structured JSON parsing.
   - If the Gemini API key is missing or calls fail, seamlessly fall back to keyword-based classification and severity scoring.
   - Duplicate detection uses embedding similarity (cosine similarity >= 0.85) scoped to the same hostel/block/category.
7. **Clean Types**:
   - Strict TypeScript configuration across both backend and frontend. No untyped `any` where avoidable.
