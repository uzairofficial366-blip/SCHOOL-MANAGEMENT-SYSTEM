# Project ERD

This document captures the database model defined in [prisma/schema.prisma](../prisma/schema.prisma).

## Scope

- Source of truth: Prisma schema
- App-level lifecycle references included where they materially affect the model
- `SOFT_FK` means the app treats a field like a reference, but Prisma does not enforce it as a foreign key

## Full ERD

```mermaid
erDiagram
  TENANT {
    string id PK
    string slug UK
    string name
  }

  USER {
    string id PK
    string tenantId FK
    string email
    string role
  }

  SESSION {
    string id PK
    string userId FK
    string token UK
  }

  STAFF {
    string id PK
    string tenantId FK
    string userId FK_UK
    string employeeId
  }

  STUDENT {
    string id PK
    string tenantId FK
    string userId FK_UK
    string admissionNo
  }

  GUARDIAN {
    string id PK
    string tenantId
    string studentId FK
    string userId SOFT_FK
  }

  ACADEMIC_YEAR {
    string id PK
    string tenantId FK
    boolean isCurrent
  }

  TERM {
    string id PK
    string academicYearId FK
  }

  GRADE {
    string id PK
    string tenantId FK
    int level
  }

  SECTION {
    string id PK
    string tenantId
    string gradeId FK
    string academicYearId FK
    string classTeacherId FK
  }

  SUBJECT {
    string id PK
    string tenantId FK
    string code
  }

  SUBJECT_GRADE {
    string subjectId PK_FK
    string gradeId PK_FK
  }

  SUBJECT_ALLOCATION {
    string id PK
    string tenantId
    string subjectId FK
    string sectionId FK
    string staffId FK
  }

  ENROLLMENT {
    string id PK
    string tenantId
    string studentId FK
    string sectionId FK
    string academicYearId FK
    string status
  }

  TIMETABLE_SLOT {
    string id PK
    string tenantId
    string sectionId FK
    string subjectId FK
    string staffId FK
  }

  ATTENDANCE_RECORD {
    string id PK
    string tenantId
    string studentId FK
    string sectionId FK
    string takenById FK
    date date
  }

  EXAM_SCHEDULE {
    string id PK
    string tenantId
    string academicYearId FK
    string type
  }

  EXAM {
    string id PK
    string tenantId
    string examScheduleId FK
    string termId FK
    string subjectId FK
  }

  GRADE_RECORD {
    string id PK
    string tenantId
    string studentId FK
    string subjectId FK
    string examId FK
  }

  LMS_CONTENT {
    string id PK
    string tenantId
    string subjectId FK
    string uploadedById SOFT_FK
  }

  ASSIGNMENT {
    string id PK
    string tenantId
    string contentId FK
  }

  SUBMISSION {
    string id PK
    string tenantId
    string assignmentId FK
    string studentId FK
  }

  FEE_STRUCTURE {
    string id PK
    string tenantId FK
    string frequency
  }

  FEE_INVOICE {
    string id PK
    string tenantId
    string studentId FK
    string academicYearId SOFT_FK
    string invoiceNo
    string status
  }

  FEE_LINE_ITEM {
    string id PK
    string tenantId
    string invoiceId FK
    string feeStructureId FK
  }

  DISCOUNT_RULE {
    string id PK
    string tenantId
    string type
  }

  STUDENT_DISCOUNT {
    string id PK
    string tenantId
    string studentId FK
    string discountRuleId FK
    string approvedById SOFT_FK
  }

  DEFERRED_INCOME {
    string id PK
    string tenantId
    string invoiceId FK
  }

  PAYMENT_GATEWAY_LOG {
    string id PK
    string tenantId
    string invoiceId FK
  }

  FEE_PAYMENT {
    string id PK
    string tenantId
    string studentId FK
    string feeStructureId FK
    string invoiceId FK
    string transactionId UK
  }

  SALARY_PAYMENT {
    string id PK
    string tenantId
    string staffId FK
    date salaryMonth
  }

  MESSAGE {
    string id PK
    string tenantId
    string senderId FK
    string receiverId FK
  }

  NOTIFICATION {
    string id PK
    string tenantId
    string userId FK
  }

  ANNOUNCEMENT {
    string id PK
    string tenantId FK
  }

  EVENT {
    string id PK
    string tenantId FK
  }

  GAMIFICATION {
    string id PK
    string tenantId
    string studentId FK_UK
  }

  BOOK {
    string id PK
    string tenantId FK
    string isbn
  }

  LIBRARY_CARD {
    string id PK
    string tenantId
    string studentId FK
    string cardNo UK
  }

  BOOK_ISSUE {
    string id PK
    string tenantId
    string bookId FK
    string cardId FK
  }

  ROOM {
    string id PK
    string tenantId FK
    string number
  }

  HOSTEL_ALLOCATION {
    string id PK
    string tenantId
    string studentId FK_UK
    string roomId FK
  }

  VEHICLE {
    string id PK
    string tenantId FK
    string plateNo UK
  }

  TRANSPORT_ASSIGNMENT {
    string id PK
    string tenantId
    string studentId FK_UK
    string vehicleId FK
  }

  INVENTORY_ITEM {
    string id PK
    string tenantId FK
    string sku
  }

  AUDIT_LOG {
    string id PK
    string tenantId
    string userId FK
    string tableName
  }

  AI_PREDICTION {
    string id PK
    string tenantId
    string studentId FK
  }

  VISITOR {
    string id PK
    string tenantId
  }

  ADMISSION_CYCLE {
    string id PK
    string tenantId
    string academicYearId FK
    string status
  }

  ADMISSION_APPLICATION {
    string id PK
    string tenantId
    string cycleId FK
    string applicationNo
    string status
  }

  ADMISSION_DOCUMENT {
    string id PK
    string tenantId
    string applicationId FK
    string verifiedById SOFT_FK
  }

  ADMISSION_REVIEW {
    string id PK
    string tenantId
    string applicationId FK
    string reviewerId SOFT_FK
  }

  ADMISSION_FEE {
    string id PK
    string tenantId
    string applicationId FK
    string status
  }

  ACHIEVEMENT {
    string id PK
    string tenantId
    string studentId FK
  }

  TENANT ||--o{ USER : has
  TENANT ||--o{ ACADEMIC_YEAR : has
  TENANT ||--o{ GRADE : has
  TENANT ||--o{ SUBJECT : has
  TENANT ||--o{ STUDENT : has
  TENANT ||--o{ STAFF : has
  TENANT ||--o{ FEE_STRUCTURE : has
  TENANT ||--o{ ANNOUNCEMENT : has
  TENANT ||--o{ EVENT : has
  TENANT ||--o{ BOOK : has
  TENANT ||--o{ ROOM : has
  TENANT ||--o{ VEHICLE : has
  TENANT ||--o{ INVENTORY_ITEM : has

  USER ||--o{ SESSION : owns
  USER ||--o| STAFF : profile
  USER ||--o| STUDENT : profile
  USER ||--o{ MESSAGE : sends
  USER ||--o{ MESSAGE : receives
  USER ||--o{ NOTIFICATION : gets
  USER ||--o{ AUDIT_LOG : acts_in

  ACADEMIC_YEAR ||--o{ TERM : contains
  ACADEMIC_YEAR ||--o{ SECTION : organizes
  ACADEMIC_YEAR ||--o{ ENROLLMENT : scoped_to
  ACADEMIC_YEAR ||--o{ EXAM_SCHEDULE : schedules
  ACADEMIC_YEAR ||--o{ ADMISSION_CYCLE : drives

  GRADE ||--o{ SECTION : contains
  SUBJECT ||--o{ SUBJECT_GRADE : maps
  GRADE ||--o{ SUBJECT_GRADE : maps

  STAFF ||--o{ SECTION : class_teacher
  STAFF ||--o{ SUBJECT_ALLOCATION : teaches
  SUBJECT ||--o{ SUBJECT_ALLOCATION : assigned
  SECTION ||--o{ SUBJECT_ALLOCATION : assigned

  STUDENT ||--o{ ENROLLMENT : has
  SECTION ||--o{ ENROLLMENT : has

  SECTION ||--o{ TIMETABLE_SLOT : has
  SUBJECT ||--o{ TIMETABLE_SLOT : scheduled
  STAFF ||--o{ TIMETABLE_SLOT : teaches

  STUDENT ||--o{ ATTENDANCE_RECORD : gets
  SECTION ||--o{ ATTENDANCE_RECORD : for
  STAFF ||--o{ ATTENDANCE_RECORD : takes

  EXAM_SCHEDULE ||--o{ EXAM : contains
  TERM ||--o{ EXAM : in
  SUBJECT ||--o{ EXAM : for
  EXAM ||--o{ GRADE_RECORD : produces
  STUDENT ||--o{ GRADE_RECORD : receives
  SUBJECT ||--o{ GRADE_RECORD : in

  SUBJECT ||--o{ LMS_CONTENT : owns
  LMS_CONTENT ||--o{ ASSIGNMENT : source
  ASSIGNMENT ||--o{ SUBMISSION : receives
  STUDENT ||--o{ SUBMISSION : submits

  STUDENT ||--o{ GUARDIAN : has
  STUDENT ||--o{ FEE_INVOICE : billed
  FEE_INVOICE ||--o{ FEE_LINE_ITEM : itemizes
  FEE_STRUCTURE ||--o{ FEE_LINE_ITEM : references
  STUDENT ||--o{ FEE_PAYMENT : pays
  FEE_STRUCTURE ||--o{ FEE_PAYMENT : type
  FEE_INVOICE ||--o{ FEE_PAYMENT : settles
  FEE_INVOICE ||--o{ DEFERRED_INCOME : defers
  FEE_INVOICE ||--o{ PAYMENT_GATEWAY_LOG : logs

  STUDENT ||--o{ STUDENT_DISCOUNT : gets
  DISCOUNT_RULE ||--o{ STUDENT_DISCOUNT : applied_as

  STAFF ||--o{ SALARY_PAYMENT : paid_to

  STUDENT ||--o| GAMIFICATION : has
  STUDENT ||--o{ LIBRARY_CARD : owns
  BOOK ||--o{ BOOK_ISSUE : issued
  LIBRARY_CARD ||--o{ BOOK_ISSUE : borrows

  ROOM ||--o{ HOSTEL_ALLOCATION : assigned
  STUDENT ||--o| HOSTEL_ALLOCATION : hostel

  VEHICLE ||--o{ TRANSPORT_ASSIGNMENT : assigned
  STUDENT ||--o| TRANSPORT_ASSIGNMENT : transport

  STUDENT ||--o{ AI_PREDICTION : scored
  STUDENT ||--o{ ACHIEVEMENT : earns

  ADMISSION_CYCLE ||--o{ ADMISSION_APPLICATION : receives
  ADMISSION_APPLICATION ||--o{ ADMISSION_DOCUMENT : has
  ADMISSION_APPLICATION ||--o{ ADMISSION_REVIEW : reviewed_by
  ADMISSION_APPLICATION ||--o{ ADMISSION_FEE : charged
```

## Soft Links To Keep In Mind

- `guardian.userId` is used for parent portal linkage
- `lmsContent.uploadedById` is a user reference but not a Prisma relation
- `studentDiscount.approvedById` is an app-level approver reference
- `admissionDocument.verifiedById` and `admissionReview.reviewerId` are app-level reviewer references
- `feeInvoice.academicYearId` behaves like a scoped reference but is not modeled as a Prisma relation
