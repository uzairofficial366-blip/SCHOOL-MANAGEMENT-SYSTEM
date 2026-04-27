import { PaymentStatus, Prisma } from "@prisma/client";

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: Prisma.Decimal | number | string | null | undefined) {
  if (value == null) return currencyFormatter.format(0);
  return currencyFormatter.format(Number(value));
}

export function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(value);
}

export function getPaymentBadgeStyle(status: PaymentStatus) {
  switch (status) {
    case "PAID":
      return {
        background: "#dcfce7",
        color: "#15803d",
      };
    case "PENDING":
      return {
        background: "#fef3c7",
        color: "#b45309",
      };
    case "OVERDUE":
      return {
        background: "#fee2e2",
        color: "#b91c1c",
      };
    case "PARTIAL":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    default:
      return {
        background: "#e5e7eb",
        color: "#374151",
      };
  }
}

export function getNetSalaryAmount({
  grossAmount,
  deductions,
  bonus,
}: {
  grossAmount: Prisma.Decimal | number | string;
  deductions: Prisma.Decimal | number | string;
  bonus: Prisma.Decimal | number | string;
}) {
  return Number(grossAmount) - Number(deductions) + Number(bonus);
}
