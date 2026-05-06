# Data Dictionary

This dictionary summarizes the main purpose, keys, and critical relationships for each table in [prisma/schema.prisma](../prisma/schema.prisma).

## Platform and Identity

### `tenants`
- Purpose: top-level school/workspace boundary for multi-tenant isolation
- Primary key: `id`
- Important uniques: `slug`, `domain`
- Main children: `users`, `academicYears`, `grades`, `subjects`, `students`, `staff`, `feeStructures`, `announcements`, `rooms`, `vehicles`, `inventoryItems`, `books`, `events`

### `users`
- Purpose: authentication and role-bearing identity record
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`
- Important uniques: `(tenantId, email)`
- Main relationships: `sessions`, `auditLogs`, sent and received `messages`, `notifications`, optional `staffProfile`, optional `studentProfile`

### `sessions`
- Purpose: persisted login sessions
- Primary key: `id`
- Foreign keys: `userId -> users.id`
- Important uniques: `token`

### `audit_logs`
- Purpose: cross-cutting audit trail for user/system actions
- Primary key: `id`
- Foreign keys: optional `userId -> users.id`
- Notes: stores `tableName`, `recordId`, and old/new JSON payloads

## Academic Core

### `academic_years`
- Purpose: yearly academic boundary
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`
- Main children: `terms`, `sections`, `enrollments`, `examSchedules`, `admissionCycles`

### `terms`
- Purpose: subdivisions within an academic year
- Primary key: `id`
- Foreign keys: `academicYearId -> academic_years.id`
- Main children: `exams`

### `grades`
- Purpose: grade levels within a tenant
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`
- Important uniques: `(tenantId, level)`
- Main children: `sections`, `subject_grades`

### `sections`
- Purpose: concrete class groups for a grade in a specific year
- Primary key: `id`
- Foreign keys: `gradeId -> grades.id`, `academicYearId -> academic_years.id`, optional `classTeacherId -> staff.id`
- Important uniques: `(tenantId, academicYearId, gradeId, name)`
- Main children: `enrollments`, `timetableSlots`, `attendanceRecords`, `subjectAllocations`

### `subjects`
- Purpose: academic subjects taught by the school
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`
- Important uniques: `(tenantId, code)`
- Main children: `subject_grades`, `timetableSlots`, `lmsContent`, `exams`, `gradeRecords`, `subjectAllocations`

### `subject_grades`
- Purpose: join table mapping subjects to grades
- Composite key: `(subjectId, gradeId)`
- Foreign keys: `subjectId -> subjects.id`, `gradeId -> grades.id`

### `subject_allocations`
- Purpose: assigns a subject in a section to a staff member
- Primary key: `id`
- Foreign keys: `subjectId -> subjects.id`, `sectionId -> sections.id`, `staffId -> staff.id`
- Important uniques: `(tenantId, subjectId, sectionId)`

## People

### `staff`
- Purpose: employee profile for a `user`
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`, `userId -> users.id`
- Important uniques: `userId`, `(tenantId, employeeId)`
- Main children: `timetableSlots`, teacher `attendanceRecords`, `subjectAllocations`, class-teacher `sections`, `salaryPayments`

### `students`
- Purpose: learner profile for a `user`
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`, `userId -> users.id`
- Important uniques: `userId`, `(tenantId, admissionNo)`
- Main children: `enrollments`, `attendanceRecords`, `gradeRecords`, `feePayments`, `feeInvoices`, `studentDiscounts`, `submissions`, `guardians`, optional `gamification`, `libraryCards`, optional `hostelAllocation`, optional `transportAssignment`, `aiPredictions`, `achievements`

### `guardians`
- Purpose: parent/guardian contacts attached to students
- Primary key: `id`
- Foreign keys: `studentId -> students.id`
- Soft link: optional `userId` is used by the app for parent portal linkage

### `enrollments`
- Purpose: places a student into a section for a specific academic year
- Primary key: `id`
- Foreign keys: `studentId -> students.id`, `sectionId -> sections.id`, `academicYearId -> academic_years.id`
- Important uniques: `(tenantId, studentId, academicYearId)`

## Timetable, Attendance, Exams, and LMS

### `timetable_slots`
- Purpose: weekly timetable rows
- Primary key: `id`
- Foreign keys: `sectionId -> sections.id`, `subjectId -> subjects.id`, `staffId -> staff.id`

### `attendance_records`
- Purpose: daily or period attendance entries
- Primary key: `id`
- Foreign keys: `studentId -> students.id`, `sectionId -> sections.id`, `takenById -> staff.id`
- Important uniques: `(tenantId, studentId, date, period)`

### `exam_schedules`
- Purpose: exam campaigns such as midterm or final
- Primary key: `id`
- Foreign keys: `academicYearId -> academic_years.id`
- Main children: `exams`

### `exams`
- Purpose: subject-specific exams within a schedule and term
- Primary key: `id`
- Foreign keys: `examScheduleId -> exam_schedules.id`, `termId -> terms.id`, `subjectId -> subjects.id`
- Main children: `gradeRecords`

### `grade_records`
- Purpose: marks/results for a student in a subject, optionally tied to an exam
- Primary key: `id`
- Foreign keys: `studentId -> students.id`, `subjectId -> subjects.id`, optional `examId -> exams.id`

### `lms_content`
- Purpose: uploaded learning materials
- Primary key: `id`
- Foreign keys: `subjectId -> subjects.id`
- Soft link: `uploadedById` behaves like a user reference in app logic
- Main children: `assignments`

### `assignments`
- Purpose: coursework tasks, optionally based on LMS content
- Primary key: `id`
- Foreign keys: optional `contentId -> lms_content.id`
- Main children: `submissions`

### `submissions`
- Purpose: student responses to assignments
- Primary key: `id`
- Foreign keys: `assignmentId -> assignments.id`, `studentId -> students.id`
- Important uniques: `(assignmentId, studentId)`

## Fees and Finance

### `fee_structures`
- Purpose: reusable fee definitions such as tuition or transport
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`
- Main children: `feePayments`, `feeLineItems`

### `fee_invoices`
- Purpose: master billing ledger record per student and billing period
- Primary key: `id`
- Foreign keys: `studentId -> students.id`
- Soft link: optional `academicYearId` is stored but not modeled as a Prisma relation
- Important uniques: `(tenantId, invoiceNo)`
- Main children: `lineItems`, `payments`, `deferred`, `gatewayLogs`

### `fee_line_items`
- Purpose: itemized invoice components
- Primary key: `id`
- Foreign keys: `invoiceId -> fee_invoices.id`, optional `feeStructureId -> fee_structures.id`

### `discount_rules`
- Purpose: configurable discount definitions
- Primary key: `id`
- Main children: `studentDiscounts`

### `student_discounts`
- Purpose: applied discount-rule assignment for a student
- Primary key: `id`
- Foreign keys: `studentId -> students.id`, `discountRuleId -> discount_rules.id`
- Soft link: optional `approvedById`
- Important uniques: `(tenantId, studentId, discountRuleId)`

### `deferred_income`
- Purpose: future revenue recognition tracking
- Primary key: `id`
- Foreign keys: `invoiceId -> fee_invoices.id`

### `payment_gateway_logs`
- Purpose: raw payment gateway audit trail
- Primary key: `id`
- Foreign keys: optional `invoiceId -> fee_invoices.id`

### `fee_payments`
- Purpose: payment transactions against fee structures and optionally invoices
- Primary key: `id`
- Foreign keys: `studentId -> students.id`, `feeStructureId -> fee_structures.id`, optional `invoiceId -> fee_invoices.id`
- Important uniques: optional `transactionId`

### `salary_payments`
- Purpose: payroll entries for staff by month
- Primary key: `id`
- Foreign keys: `staffId -> staff.id`
- Important uniques: `(tenantId, staffId, salaryMonth)`

## Communication and Calendar

### `messages`
- Purpose: direct user-to-user inbox messaging
- Primary key: `id`
- Foreign keys: `senderId -> users.id`, `receiverId -> users.id`

### `notifications`
- Purpose: user-targeted alerts
- Primary key: `id`
- Foreign keys: `userId -> users.id`

### `announcements`
- Purpose: role-targeted school-wide notices
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`
- Notes: `targetRoles` stored as JSON

### `events`
- Purpose: calendar events for school operations
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`

## Student Engagement and Services

### `gamification`
- Purpose: points, levels, badges, and streaks for a student
- Primary key: `id`
- Foreign keys: `studentId -> students.id`
- Important uniques: `studentId`

### `books`
- Purpose: library book catalog
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`
- Important uniques: `(tenantId, isbn)`

### `library_cards`
- Purpose: borrowing identity for students
- Primary key: `id`
- Foreign keys: `studentId -> students.id`
- Important uniques: `cardNo`

### `book_issues`
- Purpose: issue/return transactions for library books
- Primary key: `id`
- Foreign keys: `bookId -> books.id`, `cardId -> library_cards.id`

### `rooms`
- Purpose: hostel room inventory
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`
- Important uniques: `(tenantId, number)`

### `hostel_allocations`
- Purpose: student-to-room hostel assignment
- Primary key: `id`
- Foreign keys: `studentId -> students.id`, `roomId -> rooms.id`
- Important uniques: `studentId`

### `vehicles`
- Purpose: transport fleet records
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`
- Important uniques: `plateNo`

### `transport_assignments`
- Purpose: student-to-vehicle route assignment
- Primary key: `id`
- Foreign keys: `studentId -> students.id`, `vehicleId -> vehicles.id`
- Important uniques: `studentId`

### `inventory_items`
- Purpose: stock items for store/inventory tracking
- Primary key: `id`
- Foreign keys: `tenantId -> tenants.id`
- Important uniques: `(tenantId, sku)`

### `visitors`
- Purpose: receptionist visitor log
- Primary key: `id`
- Notes: no Prisma relations; tenant-scoped operational table

### `ai_predictions`
- Purpose: ML/analytics outputs per student
- Primary key: `id`
- Foreign keys: `studentId -> students.id`

### `achievements`
- Purpose: awards and accomplishments earned by students
- Primary key: `id`
- Foreign keys: `studentId -> students.id`

## Admissions

### `admission_cycles`
- Purpose: admission campaign for a given academic year
- Primary key: `id`
- Foreign keys: `academicYearId -> academic_years.id`
- Main children: `applications`

### `admission_applications`
- Purpose: applicant record from submission through enrollment
- Primary key: `id`
- Foreign keys: `cycleId -> admission_cycles.id`
- Important uniques: `(tenantId, applicationNo)`
- Main children: `documents`, `reviews`, `fees`
- Lifecycle note: when status moves to `ENROLLED`, the app creates downstream `users`, `students`, `enrollments`, and `guardians`

### `admission_documents`
- Purpose: uploaded admission proofs and documents
- Primary key: `id`
- Foreign keys: `applicationId -> admission_applications.id`
- Soft link: optional `verifiedById`

### `admission_reviews`
- Purpose: review workflow records for an application
- Primary key: `id`
- Foreign keys: `applicationId -> admission_applications.id`
- Soft link: `reviewerId`

### `admission_fees`
- Purpose: fee items charged during the admission process
- Primary key: `id`
- Foreign keys: `applicationId -> admission_applications.id`
