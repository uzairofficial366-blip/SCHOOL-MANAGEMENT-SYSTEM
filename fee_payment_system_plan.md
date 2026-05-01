# Fee Management & Payment System — Implementation Plan

## Overview
Extending the existing SMS (School Management System) with a full-stack fee ledger, Pakistani payment gateways (EasyPaisa & JazzCash), webhook reconciliation, a parent portal, and automated SMS notifications.

---

## Phase 1 — Database & Ledger Architecture

### 1.1 Schema Extensions (prisma/schema.prisma)

**New Models:**
- `FeeInvoice` — Master ledger entry per student per term; tracks gross tuition, sibling discount, deferred income, and net due
- `FeeLineItem` — Itemized breakdown (tuition, transport, hostel, library, sports, etc.)
- `DiscountRule` — Configurable discount rules (SIBLING_20, MERIT_SCHOLARSHIP, STAFF_WARD, etc.)
- `StudentDiscount` — Applied discount link between a student and a rule
- `DeferredIncome` — Tracks prepaid amounts that haven't been earned yet (deferred revenue)
- `PaymentGatewayLog` — Raw webhook/API log for audit trail

**Schema Enum Additions:**
- `PaymentMethod`: add `EASYPAISA`, `JAZZCASH`, `JAZZCASH_VOUCHER`
- `DiscountType`: `SIBLING`, `MERIT`, `STAFF_WARD`, `SCHOLARSHIP`, `MANUAL`

**Key Logic:**
- Sibling auto-detection: if a student shares a guardian phone or parent name with another enrolled student → auto-apply 20% tuition discount
- Deferred income: when a payment `dueDate` is in a future period, amount is posted to `DeferredIncome` table; monthly cron job recognizes it as earned income

### 1.2 Database Migration
Run `prisma migrate dev` after schema changes.

---

## Phase 2 — Payment Gateway API Integration

### 2.1 EasyPaisa

**Files to create:**
- `lib/payments/easypaisa.ts` — Server-side API client (Base64 signature generation, AES encryption)
- `app/api/payments/easypaisa/initiate/route.ts` — POST: creates payment request, returns signed payload for frontend iframe
- `app/api/payments/easypaisa/callback/route.ts` — GET: redirect-based callback from EasyPaisa

**Flow:**
1. Frontend calls `/api/payments/easypaisa/initiate` → receives `storeId`, `hashKey`, `orderRefNum`, `amount` as a signed JSON
2. Frontend injects EasyPaisa JS tag and renders iframe using the signed payload
3. EasyPaisa redirects to callback URL after payment
4. Webhook also fires (see Phase 3)

### 2.2 JazzCash

**Files to create:**
- `lib/payments/jazzcash.ts` — HMAC-SHA256 signature builder, sandbox/production URL toggle
- `app/api/payments/jazzcash/initiate/route.ts` — POST: supports CARD, MOBILE_WALLET, VOUCHER modes
- `app/api/payments/jazzcash/callback/route.ts` — POST: callback handler

**JazzCash Voucher:** Generates a 12-digit voucher number parents can pay at any shop (Kiryana store, etc.)

---

## Phase 3 — Webhook Security & Data Syncing

### Files:
- `app/api/webhooks/easypaisa/route.ts`
- `app/api/webhooks/jazzcash/route.ts`

### Security Measures:
1. **HMAC Signature Verification** — Each gateway signs its payload; backend re-computes the HMAC and rejects mismatches with `403`
2. **Idempotency** — Use `transactionId` unique constraint to prevent double-processing
3. **IP Allowlist** — Optional middleware to restrict webhook endpoints to gateway IP ranges
4. **Atomic DB Updates** — Use Prisma transaction: update `FeePayment.status = PAID`, create `AuditLog`, trigger notification queue

---

## Phase 4 — Parent Portal Dashboard

### Pages:
- `app/(dashboard)/parent/fees/page.tsx` — Fee overview: current balance, upcoming due dates, payment history
- `app/(dashboard)/parent/fees/pay/page.tsx` — Payment initiation (choose gateway)
- `app/(dashboard)/parent/fees/receipt/[id]/page.tsx` — PDF receipt download

### Features:
- **Itemized Breakdown**: Tuition + Hostel + Transport + Misc with discounts shown as line items
- **Overdue Alerts**: Red banner with days overdue count
- **Downloadable PDF Receipts**: Uses `jspdf` + `jspdf-autotable` (already in `package.json`)
- **Multi-child Support**: Parent with multiple children sees a tab per child
- **Payment Buttons**: "Pay via EasyPaisa" and "Pay via JazzCash" with gateway selector

### API Routes:
- `app/api/parent/fees/route.ts` — GET: fetch invoices for the logged-in parent's children
- `app/api/parent/receipt/[id]/route.ts` — GET: generate and stream PDF receipt

---

## Phase 5 — Automated Notifications

### SMS/WhatsApp Triggers (using Twilio — already in `.env`):
- **Invoice Generated**: "Dear [Parent], a fee invoice of PKR [amount] has been generated for [student] for [month]. Due date: [date]."
- **Payment Confirmed**: "Dear [Parent], we have received PKR [amount] for [student]. Transaction ID: [txId]. Thank you!"
- **Overdue Reminder**: "Dear [Parent], the fee of PKR [amount] for [student] is overdue. Please pay to avoid late charges."

### Files:
- `lib/notifications/sms.ts` — Twilio SMS client wrapper
- `lib/notifications/whatsapp.ts` — Twilio WhatsApp API (via `whatsapp:+92...` prefix)
- `lib/notifications/fee-events.ts` — Event dispatchers called from webhook handlers and cron jobs

### Queue (BullMQ — already in `package.json`):
- `lib/queues/notifications.queue.ts` — BullMQ queue for async notification dispatch
- Job types: `FEE_INVOICE_CREATED`, `PAYMENT_SUCCESS`, `PAYMENT_OVERDUE_REMINDER`

---

## File Creation Order

1. `prisma/schema.prisma` — Schema extensions
2. `lib/payments/easypaisa.ts`
3. `lib/payments/jazzcash.ts`
4. `lib/notifications/sms.ts`
5. `app/api/payments/easypaisa/initiate/route.ts`
6. `app/api/payments/easypaisa/callback/route.ts`
7. `app/api/payments/jazzcash/initiate/route.ts`
8. `app/api/payments/jazzcash/callback/route.ts`
9. `app/api/webhooks/easypaisa/route.ts`
10. `app/api/webhooks/jazzcash/route.ts`
11. `app/api/parent/fees/route.ts`
12. `app/api/parent/receipt/[id]/route.ts`
13. `app/(dashboard)/parent/fees/page.tsx`
14. `app/(dashboard)/parent/fees/pay/page.tsx`
15. `app/(dashboard)/parent/fees/receipt/[id]/page.tsx`
16. Update `.env` and `.env.example` with new gateway keys

---

## Environment Variables Required

```
# EasyPaisa
EASYPAISA_STORE_ID=
EASYPAISA_HASH_KEY=
EASYPAISA_SANDBOX=true
EASYPAISA_RETURN_URL=https://yourapp.vercel.app/api/payments/easypaisa/callback

# JazzCash
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=
JAZZCASH_SANDBOX=true
JAZZCASH_RETURN_URL=https://yourapp.vercel.app/api/payments/jazzcash/callback

# Twilio (SMS + WhatsApp)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE=+1234567890
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

## Notes on Pakistan-Specific Compliance
- All amounts in **PKR** (already set in `lib/finance.ts`)
- JazzCash Sandbox: `https://sandbox.jazzcash.com.pk/`
- EasyPaisa: Uses server-to-server + iframe model (no redirect-only option)
- SMS: WhatsApp Business API is preferred over SMS in Pakistan due to high WhatsApp adoption
