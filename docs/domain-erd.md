# Domain ERD

This is the same project model, split into smaller domain-focused diagrams for easier reading.

## 1. Identity, People, and Academic Structure

```mermaid
flowchart LR
  classDef core fill:#f3f4f6,stroke:#4b5563,color:#111827
  classDef people fill:#dbeafe,stroke:#1d4ed8,color:#111827
  classDef academic fill:#dcfce7,stroke:#15803d,color:#111827

  TENANT[Tenant]
  USER[User]
  SESSION[Session]
  STAFF[Staff]
  STUDENT[Student]
  GUARDIAN[Guardian]
  AY[AcademicYear]
  TERM[Term]
  GRADE[Grade]
  SECTION[Section]
  SUBJECT[Subject]
  SG[SubjectGrade]
  SA[SubjectAllocation]
  ENROLLMENT[Enrollment]

  TENANT -->|1:N| USER
  USER -->|1:N| SESSION
  USER -->|1:1 optional| STAFF
  USER -->|1:1 optional| STUDENT
  TENANT -->|1:N| STAFF
  TENANT -->|1:N| STUDENT
  STUDENT -->|1:N| GUARDIAN

  TENANT -->|1:N| AY
  AY -->|1:N| TERM
  TENANT -->|1:N| GRADE
  GRADE -->|1:N| SECTION
  AY -->|1:N| SECTION
  STAFF -->|1:N optional class teacher| SECTION
  TENANT -->|1:N| SUBJECT
  SUBJECT -->|N:M via| SG
  GRADE -->|N:M via| SG
  SUBJECT -->|1:N| SA
  SECTION -->|1:N| SA
  STAFF -->|1:N| SA
  STUDENT -->|1:N| ENROLLMENT
  SECTION -->|1:N| ENROLLMENT
  AY -->|1:N| ENROLLMENT

  class TENANT core
  class USER,SESSION,STAFF,STUDENT,GUARDIAN people
  class AY,TERM,GRADE,SECTION,SUBJECT,SG,SA,ENROLLMENT academic
```

## 2. Teaching, Assessment, and Student Experience

```mermaid
flowchart LR
  classDef scheduling fill:#fef3c7,stroke:#b45309,color:#111827
  classDef learning fill:#fae8ff,stroke:#a21caf,color:#111827
  classDef outcomes fill:#fee2e2,stroke:#b91c1c,color:#111827
  classDef support fill:#e0f2fe,stroke:#0369a1,color:#111827

  SECTION[Section]
  SUBJECT[Subject]
  STAFF[Staff]
  STUDENT[Student]
  TT[TimetableSlot]
  ATT[AttendanceRecord]
  ES[ExamSchedule]
  EXAM[Exam]
  TERM[Term]
  GR[GradeRecord]
  LMS[LmsContent]
  ASG[Assignment]
  SUB[Submission]
  GAME[Gamification]
  AI[AiPrediction]
  ACH[Achievement]

  SECTION -->|1:N| TT
  SUBJECT -->|1:N| TT
  STAFF -->|1:N| TT

  STUDENT -->|1:N| ATT
  SECTION -->|1:N| ATT
  STAFF -->|1:N taken by| ATT

  ES -->|1:N| EXAM
  TERM -->|1:N| EXAM
  SUBJECT -->|1:N| EXAM
  STUDENT -->|1:N| GR
  SUBJECT -->|1:N| GR
  EXAM -->|1:N optional| GR

  SUBJECT -->|1:N| LMS
  LMS -->|1:N optional| ASG
  ASG -->|1:N| SUB
  STUDENT -->|1:N| SUB

  STUDENT -->|1:1 optional| GAME
  STUDENT -->|1:N| AI
  STUDENT -->|1:N| ACH

  class TT,ATT,ES,EXAM scheduling
  class LMS,ASG,SUB learning
  class GR,GAME,AI,ACH outcomes
  class SECTION,SUBJECT,STAFF,STUDENT,TERM support
```

## 3. Finance and Parent Operations

```mermaid
flowchart LR
  classDef finance fill:#dcfce7,stroke:#15803d,color:#111827
  classDef fees fill:#dbeafe,stroke:#1d4ed8,color:#111827
  classDef comms fill:#fee2e2,stroke:#b91c1c,color:#111827
  classDef people fill:#f3f4f6,stroke:#4b5563,color:#111827

  STUDENT[Student]
  GUARDIAN[Guardian]
  FS[FeeStructure]
  FI[FeeInvoice]
  FLI[FeeLineItem]
  FP[FeePayment]
  DR[DiscountRule]
  SD[StudentDiscount]
  DI[DeferredIncome]
  PGL[PaymentGatewayLog]
  SP[SalaryPayment]
  STAFF[Staff]
  USER[User]
  MSG[Message]
  NOTIF[Notification]
  ANN[Announcement]
  EVENT[Event]
  AUDIT[AuditLog]

  STUDENT -->|1:N| GUARDIAN
  STUDENT -->|1:N| FI
  FI -->|1:N| FLI
  FS -->|1:N optional reference| FLI
  STUDENT -->|1:N| FP
  FS -->|1:N| FP
  FI -->|1:N optional| FP
  FI -->|1:N| DI
  FI -->|1:N optional| PGL
  STUDENT -->|1:N| SD
  DR -->|1:N| SD

  STAFF -->|1:N| SP

  USER -->|1:N sender| MSG
  USER -->|1:N receiver| MSG
  USER -->|1:N| NOTIF
  USER -->|1:N optional actor| AUDIT

  class STUDENT,GUARDIAN,STAFF,USER people
  class FS,FI,FLI,FP,DR,SD,DI,PGL,SP finance
  class MSG,NOTIF,ANN,EVENT,AUDIT comms
```

## 4. Campus Services and Admissions

```mermaid
flowchart LR
  classDef services fill:#fef3c7,stroke:#b45309,color:#111827
  classDef admissions fill:#e0e7ff,stroke:#4338ca,color:#111827
  classDef people fill:#f3f4f6,stroke:#4b5563,color:#111827

  STUDENT[Student]
  BOOK[Book]
  CARD[LibraryCard]
  ISSUE[BookIssue]
  ROOM[Room]
  HOSTEL[HostelAllocation]
  VEHICLE[Vehicle]
  TRANSPORT[TransportAssignment]
  ITEM[InventoryItem]
  VISITOR[Visitor]
  AY[AcademicYear]
  CYCLE[AdmissionCycle]
  APP[AdmissionApplication]
  DOC[AdmissionDocument]
  REV[AdmissionReview]
  ADFEE[AdmissionFee]

  STUDENT -->|1:N| CARD
  BOOK -->|1:N| ISSUE
  CARD -->|1:N| ISSUE

  ROOM -->|1:N| HOSTEL
  STUDENT -->|1:1 optional| HOSTEL

  VEHICLE -->|1:N| TRANSPORT
  STUDENT -->|1:1 optional| TRANSPORT

  AY -->|1:N| CYCLE
  CYCLE -->|1:N| APP
  APP -->|1:N| DOC
  APP -->|1:N| REV
  APP -->|1:N| ADFEE

  class BOOK,CARD,ISSUE,ROOM,HOSTEL,VEHICLE,TRANSPORT,ITEM,VISITOR services
  class AY,CYCLE,APP,DOC,REV,ADFEE admissions
  class STUDENT people
```

## Notes

- Parent linkage is app-managed through `Guardian.userId`
- Admissions enrollment later creates `User`, `Student`, `Enrollment`, and `Guardian`
- Fee invoicing uses `FeeInvoice` as the ledger center
