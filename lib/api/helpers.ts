import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Sets PostgreSQL session variables for RLS:
 *   app.current_tenant_id
 *   app.current_user_id
 *   app.current_ip
 *
 * Call at the top of every API route handler.
 */
export async function setTenantContext(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id") ?? "";
  const userId   = req.headers.get("x-user-id")   ?? "";
  const ip       = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "";

  await prisma.$executeRaw`
    SELECT
      set_config('app.current_tenant_id', ${tenantId}, TRUE),
      set_config('app.current_user_id',   ${userId},   TRUE),
      set_config('app.current_ip',        ${ip},       TRUE)
  `;

  return { tenantId, userId, ip };
}

/** Standard paginated query params */
export function parsePagination(req: NextRequest) {
  const url    = new URL(req.url);
  const page   = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit  = Math.min(100, parseInt(url.searchParams.get("limit") ?? "20"));
  const skip   = (page - 1) * limit;
  return { page, limit, skip };
}

/** Standard JSON success response */
export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return Response.json({ success: true, data, ...(meta ?? {}) });
}

/** Standard JSON error response */
export function err(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}
