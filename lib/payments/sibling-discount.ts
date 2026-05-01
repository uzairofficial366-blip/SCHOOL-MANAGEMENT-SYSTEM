/**
 * Sibling Discount Detection Utility
 *
 * Detects if a student qualifies for the sibling discount by checking
 * if any of their guardian phone numbers match another active student's guardian.
 *
 * Returns the applicable discount percentage (default 20%) or 0 if no sibling.
 */

import { prisma } from "@/lib/db/prisma";

const SIBLING_DISCOUNT_PCT = 20; // 20% flat

/**
 * Checks all guardians of a student; if any guardian phone matches
 * another enrolled student in the same tenant → sibling qualifies.
 *
 * @returns discount percentage (e.g. 20) or 0
 */
export async function detectSiblingDiscount(
  tenantId: string,
  studentId: string,
): Promise<number> {
  // Get this student's guardian phones
  const guardians = await prisma.guardian.findMany({
    where: { tenantId, studentId },
    select: { phone: true },
  });

  if (guardians.length === 0) return 0;

  const phones = guardians.map((g) => g.phone).filter(Boolean);

  // Find any other student sharing the same guardian phone
  const siblingGuardian = await prisma.guardian.findFirst({
    where: {
      tenantId,
      phone: { in: phones },
      studentId: { not: studentId },
      student: {
        deletedAt: null,
        enrollments: {
          some: { status: "ACTIVE" },
        },
      },
    },
  });

  return siblingGuardian ? SIBLING_DISCOUNT_PCT : 0;
}

/**
 * Auto-apply sibling discount rule to a student if not already applied.
 * Looks up or creates a SIBLING DiscountRule in the DB.
 */
export async function autoApplySiblingDiscount(
  tenantId: string,
  studentId: string,
): Promise<void> {
  const pct = await detectSiblingDiscount(tenantId, studentId);
  if (pct === 0) return;

  // Ensure the sibling rule exists
  let rule = await prisma.discountRule.findFirst({
    where: { tenantId, type: "SIBLING", isActive: true },
  });

  if (!rule) {
    rule = await prisma.discountRule.create({
      data: {
        tenantId,
        name:       "Sibling Discount",
        type:       "SIBLING",
        percentage: SIBLING_DISCOUNT_PCT,
        applyToAll: true,
        description: "Automatic 20% tuition discount for siblings enrolled simultaneously.",
      },
    });
  }

  // Apply if not already applied
  await prisma.studentDiscount.upsert({
    where: {
      tenantId_studentId_discountRuleId: {
        tenantId,
        studentId,
        discountRuleId: rule.id,
      },
    },
    create: {
      tenantId,
      studentId,
      discountRuleId: rule.id,
      effectiveFrom:  new Date(),
    },
    update: {}, // no-op if already exists
  });
}

/**
 * Calculate the total discount amount for a student on a given gross tuition.
 * Sums all active StudentDiscounts (percentage + flat).
 */
export async function calculateStudentDiscount(
  tenantId: string,
  studentId: string,
  grossAmount: number,
): Promise<{ totalDiscount: number; breakdown: { name: string; amount: number }[] }> {
  const now = new Date();

  const discounts = await prisma.studentDiscount.findMany({
    where: {
      tenantId,
      studentId,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      discountRule: { isActive: true },
    },
    include: { discountRule: true },
  });

  let totalDiscount = 0;
  const breakdown: { name: string; amount: number }[] = [];

  for (const sd of discounts) {
    const rule = sd.discountRule;
    let amount = 0;
    if (rule.percentage != null) {
      amount = (grossAmount * Number(rule.percentage)) / 100;
    } else if (rule.flatAmount != null) {
      amount = Number(rule.flatAmount);
    }
    amount = Math.min(amount, grossAmount - totalDiscount); // cap at remaining
    totalDiscount += amount;
    breakdown.push({ name: rule.name, amount });
  }

  return { totalDiscount, breakdown };
}
