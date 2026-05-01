"use client";
import { useState, useEffect } from "react";

interface LineItem { id: string; description: string; amount: number; discountAmount: number; discountRemarks: string | null; netAmount: number; }
interface Payment { id: string; amountPaid: number; paymentDate: string | null; method: string | null; transactionId: string | null; status: string; }
interface Invoice { id: string; invoiceNo: string; periodLabel: string; issueDate: string; dueDate: string; grossAmount: number; totalDiscount: number; lateFee: number; netDue: number; amountPaid: number; status: string; notes: string | null; lineItems: LineItem[]; payments: Payment[]; }
interface Discount { name: string; type: string; percentage: number; }
interface Child { id: string; name: string; admissionNo: string; grade: string; section: string; outstanding: number; totalPaid: number; overdueCount: number; overdueAmount: number; discounts: Discount[]; invoices: Invoice[]; }

const PKR = (n: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);
const fmtDate = (s: string | null) => s ? new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(s)) : "N/A";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PAID:    { bg: "#dcfce7", color: "#15803d" },
  PENDING: { bg: "#fef3c7", color: "#b45309" },
  OVERDUE: { bg: "#fee2e2", color: "#b91c1c" },
  PARTIAL: { bg: "#dbeafe", color: "#1d4ed8" },
  WAIVED:  { bg: "#f3f4f6", color: "#6b7280" },
};

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem 1.5rem", minWidth: 160 }}>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: accent ?? "var(--text-primary)" }}>{value}</p>
      {sub && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function PaymentModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [mode, setMode] = useState<"CARD" | "WALLET" | "VOUCHER">("CARD");
  const [mobileNo, setMobileNo] = useState("");
  const [cnic, setCnic] = useState("");
  const [gateway, setGateway] = useState<"easypaisa" | "jazzcash">("easypaisa");
  const [loading, setLoading] = useState(false);
  const [voucher, setVoucher] = useState<{ number: string; expiry: string } | null>(null);
  const [error, setError] = useState("");

  const netRemaining = invoice.netDue - invoice.amountPaid;

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      if (gateway === "easypaisa") {
        const res = await fetch("/api/payments/easypaisa/initiate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId: invoice.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        // EasyPaisa: inject JS tag and open iframe
        openEasyPaisaCheckout(data.payload);
      } else {
        const body: Record<string, string> = { invoiceId: invoice.id, mode };
        if (mode === "VOUCHER") { body.mobileNo = mobileNo; body.cnic = cnic; }
        const res = await fetch("/api/payments/jazzcash/initiate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (mode === "VOUCHER") {
          setVoucher({ number: data.voucherNumber, expiry: data.voucherExpiry });
        } else {
          // POST to JazzCash hosted page
          submitJazzCashForm(data.checkoutUrl, data.params);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openEasyPaisaCheckout(payload: Record<string, string>) {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:none;z-index:9999;background:#fff";
    const html = `<!DOCTYPE html><html><body>
      <script src="https://www.easypaisa.com.pk/merchant/js/merchant.js"><\/script>
      <script>
        var c = ${JSON.stringify(payload)};
        window.onload = function(){ ep.merchant.create(c); }
      <\/script></body></html>`;
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  }

  function submitJazzCashForm(url: string, params: Record<string, string>) {
    const form = document.createElement("form");
    form.method = "POST"; form.action = url;
    Object.entries(params).forEach(([k, v]) => {
      const i = document.createElement("input");
      i.type = "hidden"; i.name = k; i.value = v;
      form.appendChild(i);
    });
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: "2rem", width: "min(480px,90vw)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Pay Fee — {invoice.invoiceNo}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--text-muted)" }}>✕</button>
        </div>

        {voucher ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: 8 }}>Pay at any JazzCash retail outlet</p>
            <p style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "0.1em", color: "var(--accent)" }}>{voucher.number}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>Expires: {voucher.expiry}</p>
            <p style={{ marginTop: 16, fontWeight: 600 }}>Amount: {PKR(netRemaining)}</p>
            <button onClick={onClose} className="btn btn-primary" style={{ marginTop: 20 }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ background: "var(--surface)", borderRadius: 10, padding: "1rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Amount Due</span>
              <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#b91c1c" }}>{PKR(netRemaining)}</span>
            </div>

            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: "0.875rem" }}>Gateway</label>
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {(["easypaisa", "jazzcash"] as const).map((gw) => (
                <button key={gw} onClick={() => setGateway(gw)} style={{ flex: 1, padding: "0.75rem", borderRadius: 10, border: `2px solid ${gateway === gw ? "var(--accent)" : "var(--border)"}`, background: gateway === gw ? "color-mix(in srgb,var(--accent) 10%,transparent)" : "var(--surface)", cursor: "pointer", fontWeight: 600, textTransform: "capitalize", color: "var(--text-primary)" }}>
                  {gw === "easypaisa" ? "⚡ EasyPaisa" : "🎵 JazzCash"}
                </button>
              ))}
            </div>

            {gateway === "jazzcash" && (
              <>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: "0.875rem" }}>Payment Mode</label>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                  {(["CARD", "WALLET", "VOUCHER"] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)} style={{ flex: 1, minWidth: 90, padding: "0.6rem", borderRadius: 8, border: `2px solid ${mode === m ? "var(--accent)" : "var(--border)"}`, background: mode === m ? "color-mix(in srgb,var(--accent) 10%,transparent)" : "var(--surface)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {m === "CARD" ? "💳 Card" : m === "WALLET" ? "📱 Wallet" : "🧾 Voucher"}
                    </button>
                  ))}
                </div>

                {mode === "VOUCHER" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    <input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="Mobile No (03XXXXXXXXX)" className="input" style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "0.875rem" }} />
                    <input value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="Last 6 digits of CNIC" maxLength={6} className="input" style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "0.875rem" }} />
                  </div>
                )}
              </>
            )}

            {error && <p style={{ color: "#b91c1c", fontSize: "0.8rem", marginBottom: "1rem" }}>⚠ {error}</p>}

            <button onClick={handlePay} disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "0.875rem", fontSize: "1rem" }}>
              {loading ? "Processing…" : `Pay ${PKR(netRemaining)}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InvoiceCard({ invoice, childId }: { invoice: Invoice; childId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [paying, setPaying] = useState(false);
  const st = STATUS_STYLE[invoice.status] ?? STATUS_STYLE.PENDING;
  const remaining = invoice.netDue - invoice.amountPaid;
  const daysOverdue = invoice.status !== "PAID" && new Date(invoice.dueDate) < new Date()
    ? Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000) : 0;

  return (
    <>
      {paying && <PaymentModal invoice={invoice} onClose={() => setPaying(false)} />}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: "0.75rem" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1rem", cursor: "pointer", background: "var(--card-bg)" }} onClick={() => setExpanded(!expanded)}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{invoice.periodLabel}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>#{invoice.invoiceNo} · Due {fmtDate(invoice.dueDate)}</p>
          </div>
          {daysOverdue > 0 && <span style={{ fontSize: "0.7rem", background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>{daysOverdue}d overdue</span>}
          <span style={{ ...st, padding: "3px 10px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700 }}>{invoice.status}</span>
          <span style={{ fontWeight: 700 }}>{PKR(invoice.netDue)}</span>
          <span style={{ color: "var(--text-muted)", fontSize: "1rem" }}>{expanded ? "▲" : "▼"}</span>
        </div>

        {expanded && (
          <div style={{ borderTop: "1px solid var(--border)", padding: "1rem" }}>
            {/* Line Items */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "1rem" }}>
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  {["Description", "Amount", "Discount", "Net"].map((h) => (
                    <th key={h} style={{ textAlign: h === "Description" ? "left" : "right", padding: "6px 10px", fontWeight: 600, fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((li) => (
                  <tr key={li.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "7px 10px" }}>{li.description}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>{PKR(li.amount)}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", color: "#15803d" }}>{li.discountAmount > 0 ? `−${PKR(li.discountAmount)}` : "—"}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600 }}>{PKR(li.netAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 260 }}>
                {[
                  ["Gross Amount", PKR(invoice.grossAmount)],
                  ["Discount", `−${PKR(invoice.totalDiscount)}`],
                  ...(invoice.lateFee > 0 ? [["Late Fee", `+${PKR(invoice.lateFee)}`]] : []),
                  ["Net Due", PKR(invoice.netDue)],
                  ["Paid", PKR(invoice.amountPaid)],
                  ["Balance", PKR(Math.max(remaining, 0))],
                ].map(([l, v], idx) => {
                  const isTotal = l === "Balance" || l === "Net Due";
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: isTotal ? "2px solid var(--border)" : undefined, fontWeight: isTotal ? 700 : 400, fontSize: isTotal ? "0.95rem" : "0.85rem" }}>
                      <span style={{ color: isTotal ? "var(--text-primary)" : "var(--text-muted)" }}>{l}</span>
                      <span style={{ color: l === "Balance" && remaining > 0 ? "#b91c1c" : l === "Paid" ? "#15803d" : "var(--text-primary)" }}>{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <a href={`/api/parent/receipt/${invoice.id}`} target="_blank" className="btn btn-secondary btn-sm" style={{ fontSize: "0.8rem" }}>⬇ Download Receipt</a>
              {invoice.status !== "PAID" && invoice.status !== "WAIVED" && remaining > 0 && (
                <button onClick={() => setPaying(true)} className="btn btn-primary btn-sm" style={{ fontSize: "0.8rem" }}>💳 Pay Now</button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function ParentFeesClient({ initialData }: { initialData: Child[] }) {
  const [children] = useState<Child[]>(initialData);
  const [activeChild, setActiveChild] = useState(initialData[0]?.id ?? "");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PAID" | "OVERDUE">("ALL");

  const child = children.find((c) => c.id === activeChild);
  if (!child) return <p style={{ padding: "2rem", color: "var(--text-muted)" }}>No students linked to your account.</p>;

  const filtered = child.invoices.filter((inv) => filter === "ALL" || inv.status === filter);

  return (
    <div style={{ padding: "0 0 3rem" }}>
      {/* Child Tabs */}
      {children.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {children.map((c) => (
            <button key={c.id} onClick={() => setActiveChild(c.id)} style={{ padding: "0.5rem 1.25rem", borderRadius: 99, border: `2px solid ${activeChild === c.id ? "var(--accent)" : "var(--border)"}`, background: activeChild === c.id ? "var(--accent)" : "var(--surface)", color: activeChild === c.id ? "#fff" : "var(--text-primary)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
              {c.name} <span style={{ opacity: 0.75 }}>({c.grade})</span>
            </button>
          ))}
        </div>
      )}

      {/* Overdue Alert */}
      {child.overdueCount > 0 && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "0.875rem 1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.25rem" }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 700, color: "#b91c1c", fontSize: "0.95rem" }}>{child.overdueCount} Overdue Invoice{child.overdueCount > 1 ? "s" : ""}</p>
            <p style={{ fontSize: "0.8rem", color: "#991b1b" }}>Total overdue: {PKR(child.overdueAmount)}. Please pay immediately to avoid late charges.</p>
          </div>
        </div>
      )}

      {/* Discount Badges */}
      {child.discounts.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {child.discounts.map((d, i) => (
            <span key={i} style={{ padding: "4px 12px", borderRadius: 99, background: "#dcfce7", color: "#15803d", fontSize: "0.75rem", fontWeight: 600 }}>
              ✓ {d.name} ({d.percentage}%)
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <StatCard label="Outstanding Balance" value={PKR(child.outstanding)} accent={child.outstanding > 0 ? "#b91c1c" : "#15803d"} />
        <StatCard label="Total Paid" value={PKR(child.totalPaid)} accent="#15803d" />
        <StatCard label="Class / Section" value={`${child.grade} — ${child.section}`} />
        <StatCard label="Admission No" value={child.admissionNo} />
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {(["ALL", "PENDING", "OVERDUE", "PAID"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "0.4rem 1rem", borderRadius: 99, border: `2px solid ${filter === f ? "var(--accent)" : "var(--border)"}`, background: filter === f ? "var(--accent)" : "var(--surface)", color: filter === f ? "#fff" : "var(--text-primary)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
            {f}
          </button>
        ))}
      </div>

      {/* Invoices */}
      {filtered.length === 0
        ? <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>No invoices found for this filter.</p>
        : filtered.map((inv) => <InvoiceCard key={inv.id} invoice={inv} childId={child.id} />)
      }
    </div>
  );
}
