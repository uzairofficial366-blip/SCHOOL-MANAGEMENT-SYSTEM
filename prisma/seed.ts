import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding...");
  const hash = await bcrypt.hash("Admin@1234", 12);
  const parentHash = await bcrypt.hash("Parent@1234", 12);

  // TENANT
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-school" },
    update: {},
    create: { name: "Demo School", slug: "demo-school", locale: "en", timezone: "Asia/Karachi", isActive: true },
  });
  const tid = tenant.id;

  // ACADEMIC YEAR
  const ay = await prisma.academicYear.upsert({
    where: { id: "ay-2024" },
    update: {},
    create: { id: "ay-2024", tenantId: tid, name: "2024-2025", startDate: new Date("2024-04-01"), endDate: new Date("2025-03-31"), isCurrent: true },
  });

  // TERMS
  const term1 = await prisma.term.upsert({
    where: { id: "term-1" },
    update: {},
    create: { id: "term-1", academicYearId: ay.id, name: "Term 1", startDate: new Date("2024-04-01"), endDate: new Date("2024-08-31") },
  });

  // GRADES
  const grade8 = await prisma.grade.upsert({
    where: { tenantId_level: { tenantId: tid, level: 8 } },
    update: {},
    create: { tenantId: tid, name: "Grade 8", level: 8 },
  });
  const grade9 = await prisma.grade.upsert({
    where: { tenantId_level: { tenantId: tid, level: 9 } },
    update: {},
    create: { tenantId: tid, name: "Grade 9", level: 9 },
  });

  // SUBJECTS
  const subMath = await prisma.subject.upsert({
    where: { tenantId_code: { tenantId: tid, code: "MATH8" } },
    update: {},
    create: { tenantId: tid, name: "Mathematics", code: "MATH8", creditHours: 2 },
  });
  const subSci = await prisma.subject.upsert({
    where: { tenantId_code: { tenantId: tid, code: "SCI8" } },
    update: {},
    create: { tenantId: tid, name: "Science", code: "SCI8", creditHours: 2 },
  });
  const subEng = await prisma.subject.upsert({
    where: { tenantId_code: { tenantId: tid, code: "ENG8" } },
    update: {},
    create: { tenantId: tid, name: "English", code: "ENG8", creditHours: 2 },
  });

  // SUBJECT-GRADE links
  for (const sid of [subMath.id, subSci.id, subEng.id]) {
    for (const gid of [grade8.id, grade9.id]) {
      await prisma.subjectGrade.upsert({
        where: { subjectId_gradeId: { subjectId: sid, gradeId: gid } },
        update: {},
        create: { subjectId: sid, gradeId: gid },
      });
    }
  }

  // USERS: admin, teachers, students, parent, accountant, librarian
  const roles = [
    { email: "admin@demo-school.edu",      name: "School Administrator", role: "ADMIN" },
    { email: "teacher1@demo-school.edu",   name: "Ms. Sarah Khan",       role: "TEACHER" },
    { email: "teacher2@demo-school.edu",   name: "Mr. Bilal Ahmed",      role: "TEACHER" },
    { email: "student1@demo-school.edu",   name: "Ahmed Ali",            role: "STUDENT" },
    { email: "student2@demo-school.edu",   name: "Fatima Raza",          role: "STUDENT" },
    { email: "student3@demo-school.edu",   name: "Hamza Khan",           role: "STUDENT" },
    { email: "student4@demo-school.edu",   name: "Aisha Malik",          role: "STUDENT" },
    { email: "student5@demo-school.edu",   name: "Omar Farooq",          role: "STUDENT" },
    { email: "parent1@demo-school.edu",    name: "Mr. Ali (Parent)",     role: "PARENT" },
    { email: "accountant@demo-school.edu", name: "Tariq Accountant",     role: "ACCOUNTANT" },
    { email: "librarian@demo-school.edu",  name: "Zara Librarian",       role: "LIBRARIAN" },
    { email: "warden@demo-school.edu",     name: "Hostel Warden",        role: "HOSTEL_WARDEN" },
    { email: "store@demo-school.edu",      name: "Store Manager",        role: "STORE_MANAGER" },
    { email: "reception@demo-school.edu",  name: "Receptionist",         role: "RECEPTIONIST" },
  ] as const;

  const userMap: Record<string, string> = {};
  for (const r of roles) {
    const passwordHash = r.role === "PARENT" ? parentHash : hash;
    const u = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tid, email: r.email } },
      update: { name: r.name, passwordHash, role: r.role, isActive: true },
      create: { tenantId: tid, email: r.email, name: r.name, passwordHash, role: r.role, isActive: true },
    });
    userMap[r.email] = u.id;
  }

  const staff1 = await prisma.staff.upsert({
    where: { tenantId_employeeId: { tenantId: tid, employeeId: "EMP-001" } },
    update: {
      userId: userMap["teacher1@demo-school.edu"],
      department: "Mathematics",
      designation: "Senior Teacher",
      salary: 75000,
    },
    create: {
      tenantId: tid,
      userId: userMap["teacher1@demo-school.edu"],
      employeeId: "EMP-001",
      department: "Mathematics",
      designation: "Senior Teacher",
      salary: 75000,
    },
  });
  const staff2 = await prisma.staff.upsert({
    where: { tenantId_employeeId: { tenantId: tid, employeeId: "EMP-002" } },
    update: {
      userId: userMap["teacher2@demo-school.edu"],
      department: "Science",
      designation: "Teacher",
      salary: 65000,
    },
    create: {
      tenantId: tid,
      userId: userMap["teacher2@demo-school.edu"],
      employeeId: "EMP-002",
      department: "Science",
      designation: "Teacher",
      salary: 65000,
    },
  });

  await prisma.salaryPayment.deleteMany({ where: { tenantId: tid } });
  const salaryMonths = [
    new Date("2026-01-01"),
    new Date("2026-02-01"),
    new Date("2026-03-01"),
    new Date("2026-04-01"),
  ];
  for (const [index, month] of salaryMonths.entries()) {
    const teacher1Paid = index < 3;
    const teacher2Paid = index < 2;

    await prisma.salaryPayment.create({
      data: {
        tenantId: tid,
        staffId: staff1.id,
        salaryMonth: month,
        grossAmount: 75000,
        deductions: 1500,
        bonus: index === 1 ? 2500 : 0,
        amountPaid: teacher1Paid ? (index === 1 ? 76000 : 73500) : 0,
        paymentDate: teacher1Paid ? new Date(month.getFullYear(), month.getMonth(), 28) : null,
        method: teacher1Paid ? "BANK_TRANSFER" : null,
        transactionId: teacher1Paid ? `SAL-EMP-001-${month.getMonth() + 1}` : null,
        status: teacher1Paid ? "PAID" : "PENDING",
      },
    }).catch(() => {});

    await prisma.salaryPayment.create({
      data: {
        tenantId: tid,
        staffId: staff2.id,
        salaryMonth: month,
        grossAmount: 65000,
        deductions: 1000,
        bonus: index === 0 ? 1500 : 0,
        amountPaid: teacher2Paid ? (index === 0 ? 65500 : 64000) : 0,
        paymentDate: teacher2Paid ? new Date(month.getFullYear(), month.getMonth(), 27) : null,
        method: teacher2Paid ? "BANK_TRANSFER" : null,
        transactionId: teacher2Paid ? `SAL-EMP-002-${month.getMonth() + 1}` : null,
        status: teacher2Paid ? "PAID" : "PENDING",
      },
    }).catch(() => {});
  }

  // SECTIONS
  const sec8A = await prisma.section.upsert({
    where: { id: "sec-8a" },
    update: {},
    create: { id: "sec-8a", tenantId: tid, gradeId: grade8.id, academicYearId: ay.id, name: "8-A", capacity: 35, classTeacherId: staff1.id },
  });
  const sec9A = await prisma.section.upsert({
    where: { id: "sec-9a" },
    update: {},
    create: { id: "sec-9a", tenantId: tid, gradeId: grade9.id, academicYearId: ay.id, name: "9-A", capacity: 35, classTeacherId: staff2.id },
  });

  // TIMETABLE
  const slots = [
    { sectionId: sec8A.id, subjectId: subMath.id, staffId: staff1.id, dayOfWeek: 0, startTime: "08:00", endTime: "09:00" },
    { sectionId: sec8A.id, subjectId: subSci.id,  staffId: staff2.id, dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
    { sectionId: sec8A.id, subjectId: subEng.id,  staffId: staff1.id, dayOfWeek: 2, startTime: "10:00", endTime: "11:00" },
    { sectionId: sec9A.id, subjectId: subMath.id, staffId: staff1.id, dayOfWeek: 0, startTime: "10:00", endTime: "11:00" },
    { sectionId: sec9A.id, subjectId: subSci.id,  staffId: staff2.id, dayOfWeek: 2, startTime: "08:00", endTime: "09:00" },
  ];
  for (const s of slots) {
    await prisma.timetableSlot.create({ data: { tenantId: tid, ...s } }).catch(() => {});
  }

  // STUDENTS
  const studentEmails = ["student1@demo-school.edu","student2@demo-school.edu","student3@demo-school.edu","student4@demo-school.edu","student5@demo-school.edu"];
  const admNos = ["ADM-001","ADM-002","ADM-003","ADM-004","ADM-005"];
  const genders = ["male","female","male","female","male"];
  const studentIds: string[] = [];
  for (let i = 0; i < studentEmails.length; i++) {
    const s = await prisma.student.upsert({
      where: { userId: userMap[studentEmails[i]] },
      update: {},
      create: { tenantId: tid, userId: userMap[studentEmails[i]], admissionNo: admNos[i], gender: genders[i], dateOfBirth: new Date("2010-06-15") },
    });
    studentIds.push(s.id);
  }

  // GUARDIANS
  for (let i = 0; i < studentIds.length; i++) {
    const linkedToDemoParent = i < 2;
    const existingGuardian = await prisma.guardian.findFirst({
      where: {
        tenantId: tid,
        studentId: studentIds[i],
        ...(linkedToDemoParent ? { userId: userMap["parent1@demo-school.edu"] } : { userId: null }),
      },
    });
    const data = {
      tenantId: tid,
      studentId: studentIds[i],
      name: linkedToDemoParent ? "Mr. Ali (Parent)" : `Guardian ${i + 1}`,
      relation: "Father",
      phone: linkedToDemoParent ? "0300-1110001" : `0300-111000${i + 1}`,
      email: linkedToDemoParent ? "parent1@demo-school.edu" : `parent${i + 1}@gmail.com`,
      isEmergency: true,
      userId: linkedToDemoParent ? userMap["parent1@demo-school.edu"] : null,
    };

    if (existingGuardian) {
      await prisma.guardian.update({ where: { id: existingGuardian.id }, data });
    } else {
      await prisma.guardian.create({ data });
    }
  }

  // ENROLLMENTS (first 3 in 8A, last 2 in 9A)
  const enrolData = [
    { studentId: studentIds[0], sectionId: sec8A.id, rollNo: 1 },
    { studentId: studentIds[1], sectionId: sec8A.id, rollNo: 2 },
    { studentId: studentIds[2], sectionId: sec8A.id, rollNo: 3 },
    { studentId: studentIds[3], sectionId: sec9A.id, rollNo: 1 },
    { studentId: studentIds[4], sectionId: sec9A.id, rollNo: 2 },
  ];
  for (const e of enrolData) {
    await prisma.enrollment.upsert({
      where: { tenantId_studentId_academicYearId: { tenantId: tid, studentId: e.studentId, academicYearId: ay.id } },
      update: {},
      create: { tenantId: tid, ...e, academicYearId: ay.id, status: "ACTIVE" },
    });
  }

  // ATTENDANCE (last 7 days)
  const today = new Date();
  for (let d = 6; d >= 0; d--) {
    const date = new Date(today); date.setDate(today.getDate() - d);
    const dateOnly = new Date(date.toDateString());
    for (const sid of studentIds) {
      const status = Math.random() > 0.15 ? "PRESENT" : "ABSENT";
      await prisma.attendanceRecord.upsert({
        where: { tenantId_studentId_date_period: { tenantId: tid, studentId: sid, date: dateOnly, period: 0 } },
        update: {},
        create: { tenantId: tid, studentId: sid, sectionId: sec8A.id, takenById: staff1.id, date: dateOnly, period: 0, status: status as any },
      });
    }
  }

  // EXAM SCHEDULE + EXAMS
  const examSched = await prisma.examSchedule.upsert({
    where: { id: "exam-mid-2024" },
    update: {},
    create: { id: "exam-mid-2024", tenantId: tid, academicYearId: ay.id, name: "Midterm 2024", type: "MIDTERM", startDate: new Date("2024-08-01"), endDate: new Date("2024-08-10"), isPublished: true },
  });
  const exams = [];
  for (const sub of [subMath, subSci, subEng]) {
    const ex = await prisma.exam.upsert({
      where: { id: `exam-${sub.code}` },
      update: {},
      create: { id: `exam-${sub.code}`, tenantId: tid, examScheduleId: examSched.id, termId: term1.id, subjectId: sub.id, date: new Date("2024-08-05"), duration: 90, totalMarks: 100, passingMarks: 40 },
    });
    exams.push(ex);
  }

  // GRADE RECORDS
  const markSets = [[88,72,91],[75,83,67],[92,95,89],[61,58,70],[45,52,48]];
  for (let i = 0; i < studentIds.length; i++) {
    for (let j = 0; j < exams.length; j++) {
      await prisma.gradeRecord.create({
        data: { tenantId: tid, studentId: studentIds[i], subjectId: exams[j].subjectId, examId: exams[j].id, marksObtained: markSets[i][j], totalMarks: 100, grade: markSets[i][j] >= 80 ? "A" : markSets[i][j] >= 60 ? "B" : "C", gpa: parseFloat((markSets[i][j] / 25).toFixed(2)) },
      }).catch(() => {});
    }
  }

  // FEE STRUCTURES
  const feeTuition = await prisma.feeStructure.upsert({
    where: { id: "fee-tuition" },
    update: {},
    create: { id: "fee-tuition", tenantId: tid, name: "Tuition Fee", amount: 8500, frequency: "MONTHLY", dueDay: 10, lateFee: 500 },
  });
  const feeTransport = await prisma.feeStructure.upsert({
    where: { id: "fee-transport" },
    update: {},
    create: { id: "fee-transport", tenantId: tid, name: "Transport Fee", amount: 2000, frequency: "MONTHLY", dueDay: 10, lateFee: 200 },
  });

  // FEE PAYMENTS - Commented out to remove demo data
  // const months = [new Date("2024-04-10"), new Date("2024-05-10"), new Date("2024-06-10")];
  // for (const sid of studentIds) {
  //   for (const m of months) {
  //     const paid = Math.random() > 0.2;
  //     await prisma.feePayment.create({
  //       data: { tenantId: tid, studentId: sid, feeStructureId: feeTuition.id, amount: 8500, amountPaid: paid ? 8500 : 0, dueDate: m, paymentDate: paid ? m : null, method: paid ? "CASH" : null, status: paid ? "PAID" : "PENDING" },
  //     }).catch(() => {});
  //   }
  // }

  // LMS CONTENT + ASSIGNMENTS
  const lms1 = await prisma.lmsContent.create({
    data: { tenantId: tid, subjectId: subMath.id, uploadedById: userMap["teacher1@demo-school.edu"], title: "Chapter 1: Algebra Basics", type: "DOCUMENT", fileUrl: "https://example.com/algebra.pdf", isPublished: true },
  }).catch(() => null);
  const lms2 = await prisma.lmsContent.create({
    data: { tenantId: tid, subjectId: subSci.id,  uploadedById: userMap["teacher2@demo-school.edu"], title: "Physics: Newton's Laws", type: "VIDEO", fileUrl: "https://example.com/newton.mp4", isPublished: true },
  }).catch(() => null);

  const asgn = await prisma.assignment.create({
    data: { tenantId: tid, contentId: lms1?.id, title: "Algebra Worksheet", instructions: "Solve all questions from Chapter 1.", dueDate: new Date("2024-07-15"), totalMarks: 20 },
  }).catch(() => null);

  if (asgn) {
    for (let i = 0; i < 3; i++) {
      await prisma.submission.upsert({
        where: { assignmentId_studentId: { assignmentId: asgn.id, studentId: studentIds[i] } },
        update: {},
        create: { tenantId: tid, assignmentId: asgn.id, studentId: studentIds[i], content: "Submitted answers", marksObtained: 15 + i, submittedAt: new Date("2024-07-14"), gradedAt: new Date("2024-07-16") },
      });
    }
  }

  // MESSAGES
  await prisma.message.createMany({
    data: [
      { tenantId: tid, senderId: userMap["teacher1@demo-school.edu"], receiverId: userMap["admin@demo-school.edu"], subject: "Meeting Request", body: "Can we schedule a parent-teacher meeting for next week?", isRead: false },
      { tenantId: tid, senderId: userMap["admin@demo-school.edu"],    receiverId: userMap["teacher1@demo-school.edu"], subject: "Re: Meeting Request", body: "Sure, let's meet on Thursday at 10am.", isRead: true },
      { tenantId: tid, senderId: userMap["teacher2@demo-school.edu"], receiverId: userMap["student1@demo-school.edu"], subject: "Assignment Feedback", body: "Good work on your algebra worksheet!", isRead: false },
    ],
    skipDuplicates: true,
  });

  // ANNOUNCEMENTS
  await prisma.announcement.createMany({
    data: [
      { tenantId: tid, title: "Annual Sports Day", content: "Annual Sports Day will be held on 15th August 2024. All students must participate.", targetRoles: ["STUDENT","TEACHER","PARENT"], publishedAt: new Date(), expiresAt: new Date("2024-08-16") },
      { tenantId: tid, title: "Fee Reminder", content: "Please submit your monthly tuition fee before 10th of every month.", targetRoles: ["PARENT","STUDENT"], publishedAt: new Date() },
      { tenantId: tid, title: "Staff Meeting", content: "Mandatory staff meeting on Monday 9am in the conference room.", targetRoles: ["TEACHER","ADMIN"], publishedAt: new Date() },
    ],
    skipDuplicates: true,
  });

  // NOTIFICATIONS
  await prisma.notification.createMany({
    data: studentIds.map(sid => ({
      tenantId: tid, userId: userMap["student1@demo-school.edu"],
      title: "New Assignment Posted", body: "Algebra Worksheet has been assigned. Due: July 15.", type: "ASSIGNMENT", isRead: false,
    })),
    skipDuplicates: true,
  });

  // GAMIFICATION
  const gamData = [
    { points: 1250, level: 5, badges: ["Top Scorer","Perfect Attendance"], streak: 14 },
    { points:  980, level: 4, badges: ["Bookworm"], streak: 7 },
    { points: 1500, level: 6, badges: ["Top Scorer","Math Wizard","Streak Master"], streak: 21 },
    { points:  420, level: 2, badges: [], streak: 3 },
    { points:  650, level: 3, badges: ["Science Star"], streak: 5 },
  ];
  for (let i = 0; i < studentIds.length; i++) {
    await prisma.gamification.upsert({
      where: { studentId: studentIds[i] },
      update: {},
      create: { tenantId: tid, studentId: studentIds[i], ...gamData[i] },
    });
  }

  // LIBRARY
  const books = [
    { isbn: "978-0-13-110362-7", title: "The C Programming Language", author: "Kernighan & Ritchie", category: "Technology", totalCopies: 3, available: 2 },
    { isbn: "978-0-06-112008-4", title: "To Kill a Mockingbird",       author: "Harper Lee",            category: "Literature",  totalCopies: 5, available: 4 },
    { isbn: "978-0-7432-7356-5", title: "The Great Gatsby",            author: "F. Scott Fitzgerald",   category: "Literature",  totalCopies: 4, available: 3 },
    { isbn: "978-0-14-028329-7", title: "Mathematics for Class 8",     author: "NCERT",                 category: "Academic",    totalCopies: 20, available: 15 },
    { isbn: "978-0-19-852535-8", title: "Science Textbook Grade 8",    author: "Oxford",                category: "Academic",    totalCopies: 20, available: 17 },
  ];
  const bookIds: string[] = [];
  for (const b of books) {
    const bk = await prisma.book.upsert({
      where: { tenantId_isbn: { tenantId: tid, isbn: b.isbn } },
      update: {},
      create: { tenantId: tid, ...b },
    });
    bookIds.push(bk.id);
  }

  const card1 = await prisma.libraryCard.upsert({
    where: { cardNo: "LIB-001" },
    update: {},
    create: { tenantId: tid, studentId: studentIds[0], cardNo: "LIB-001", isActive: true },
  });
  const card2 = await prisma.libraryCard.upsert({
    where: { cardNo: "LIB-002" },
    update: {},
    create: { tenantId: tid, studentId: studentIds[1], cardNo: "LIB-002", isActive: true },
  });

  await prisma.bookIssue.create({
    data: { tenantId: tid, bookId: bookIds[0], cardId: card1.id, issuedAt: new Date("2024-06-01"), dueDate: new Date("2024-06-15"), returnedAt: new Date("2024-06-14") },
  }).catch(() => {});
  await prisma.bookIssue.create({
    data: { tenantId: tid, bookId: bookIds[1], cardId: card2.id, issuedAt: new Date("2024-06-10"), dueDate: new Date("2024-06-24"), fine: 50, finePaid: false },
  }).catch(() => {});

  // HOSTEL
  const rooms = ["R-101","R-102","R-103","R-201","R-202"];
  const roomIds: string[] = [];
  for (const r of rooms) {
    const rm = await prisma.room.upsert({
      where: { tenantId_number: { tenantId: tid, number: r } },
      update: {},
      create: { tenantId: tid, number: r, floor: parseInt(r[2]), capacity: 2, type: "SHARED", isAvailable: true },
    });
    roomIds.push(rm.id);
  }
  await prisma.hostelAllocation.upsert({
    where: { studentId: studentIds[3] },
    update: {},
    create: { tenantId: tid, studentId: studentIds[3], roomId: roomIds[0], checkIn: new Date("2024-04-01"), status: "ACTIVE" },
  });
  await prisma.hostelAllocation.upsert({
    where: { studentId: studentIds[4] },
    update: {},
    create: { tenantId: tid, studentId: studentIds[4], roomId: roomIds[1], checkIn: new Date("2024-04-01"), status: "ACTIVE" },
  });

  // TRANSPORT
  const vehicle = await prisma.vehicle.upsert({
    where: { plateNo: "LHR-1234" },
    update: {},
    create: { tenantId: tid, plateNo: "LHR-1234", model: "Toyota Coaster", capacity: 30, driverName: "Imran Driver", driverPhone: "0300-9876543", routeName: "Route A - Model Town", isActive: true },
  });
  await prisma.transportAssignment.upsert({
    where: { studentId: studentIds[0] },
    update: {},
    create: { tenantId: tid, studentId: studentIds[0], vehicleId: vehicle.id, pickupStop: "Model Town Stop 3", dropStop: "School Gate" },
  });
  await prisma.transportAssignment.upsert({
    where: { studentId: studentIds[1] },
    update: {},
    create: { tenantId: tid, studentId: studentIds[1], vehicleId: vehicle.id, pickupStop: "Gulberg Stop 1", dropStop: "School Gate" },
  });

  // INVENTORY
  const items = [
    { name: "A4 Paper Ream",   sku: "STK-001", category: "Stationery", quantity: 150, minStock: 20, unitPrice: 1200, supplier: "Paper World" },
    { name: "Ball Point Pen",  sku: "STK-002", category: "Stationery", quantity: 500, minStock: 100, unitPrice: 25, supplier: "Pen Co." },
    { name: "Whiteboard Marker",sku:"STK-003", category: "Stationery", quantity: 80,  minStock: 30, unitPrice: 60, supplier: "Marker Ltd." },
    { name: "Projector Bulb",  sku: "ELC-001", category: "Electronics",quantity: 5,   minStock: 2,  unitPrice: 4500, supplier: "Tech Supply" },
    { name: "Printer Cartridge",sku:"ELC-002", category: "Electronics",quantity: 12,  minStock: 3,  unitPrice: 3200, supplier: "Print Hub" },
    { name: "Desk Chair",      sku: "FRN-001", category: "Furniture",  quantity: 8,   minStock: 2,  unitPrice: 8500, supplier: "Furniture Plus" },
  ];
  for (const it of items) {
    await prisma.inventoryItem.upsert({
      where: { tenantId_sku: { tenantId: tid, sku: it.sku } },
      update: {},
      create: { tenantId: tid, ...it },
    });
  }

  // VISITORS
  await prisma.visitor.createMany({
    data: [
      { tenantId: tid, name: "Mr. Khalid (Parent)", phone: "0321-5566778", purpose: "Parent-Teacher Meeting", hostName: "Ms. Sarah Khan", checkIn: new Date("2024-06-20T09:00:00"), checkOut: new Date("2024-06-20T10:00:00"), badgeNo: "V-001" },
      { tenantId: tid, name: "ABC Textbook Rep",    phone: "0333-1122334", purpose: "Book Delivery",          hostName: "School Admin",   checkIn: new Date("2024-06-21T11:00:00"), checkOut: new Date("2024-06-21T11:30:00"), badgeNo: "V-002" },
      { tenantId: tid, name: "Inspector General",   phone: "042-99200001", purpose: "School Inspection",      hostName: "Principal",      checkIn: new Date("2024-06-22T08:00:00"), badgeNo: "V-003" },
    ],
    skipDuplicates: true,
  });

  // AI PREDICTIONS
  const riskScores = [0.82, 0.45, 0.91, 0.23, 0.31];
  for (let i = 0; i < studentIds.length; i++) {
    await prisma.aiPrediction.create({
      data: {
        tenantId: tid, studentId: studentIds[i],
        predictionType: "success",
        score: riskScores[i],
        features: { attendance_rate: 0.85 + i * 0.02, lms_engagement: 0.7, grade_avg: markSets[i].reduce((a,b)=>a+b,0)/3 },
        recommendation: riskScores[i] < 0.5 ? "Schedule parent meeting, assign tutoring sessions." : "Student is on track. Encourage advanced coursework.",
      },
    }).catch(() => {});
  }

  console.log("✅ All dummy data seeded!");
  console.log("\n📋 Login — School Code: demo-school | Password: Admin@1234");
  console.log("   admin@demo-school.edu | teacher1@demo-school.edu | teacher2@demo-school.edu");
  console.log("   student1@demo-school.edu .. student5@demo-school.edu");
  console.log("   accountant@demo-school.edu | librarian@demo-school.edu | warden@demo-school.edu");
  console.log("   parent1@demo-school.edu | Password: Parent@1234");
}

main()
  .catch(e => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
