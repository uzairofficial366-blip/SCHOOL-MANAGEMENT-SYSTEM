/* eslint-disable */
"use client";

import { useState, useEffect } from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PAID:    { bg: "#dcfce7", color: "#15803d", label: "Paid" },
  PENDING: { bg: "#fef3c7", color: "#b45309", label: "Pending" },
  OVERDUE: { bg: "#fee2e2", color: "#b91c1c", label: "Overdue" },
  PARTIAL: { bg: "#dbeafe", color: "#1d4ed8", label: "Partial" },
  WAIVED:  { bg: "#f3f4f6", color: "#6b7280", label: "Waived"  },
};

interface FeePayment {
  id: string;
  amount: number;
  discount?: number;
  discountRemarks?: string | null;
  amountPaid: number;
  dueDate: string;
  paymentDate: string | null;
  status: string;
  method: string | null;
  transactionId: string | null;
  feeStructure: { name: string; amount: number };
}

interface Student {
  id: string;
  admissionNo: string;
  user: { name: string; email: string; phone?: string };
  enrollments: { section: { name: string; grade: { name: string } } }[];
  feePayments: FeePayment[];
}

export default function FeeManagementClient({ feeStructures }: { feeStructures: { id: string; name: string; amount: number; frequency: string; gradeName?: string | null }[] }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<FeePayment | null>(null);
  const [payMethod, setPayMethod] = useState("CASH");
  const [payTxId, setPayTxId] = useState("");
  const [payDiscountType, setPayDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [payDiscountValue, setPayDiscountValue] = useState("0");
  const [payDiscountRemarks, setPayDiscountRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [newFee, setNewFee] = useState({ feeStructureId: "", dueDate: "", amount: "", amountPaid: "0", method: "CASH", status: "PENDING", discountType: "FIXED", discountValue: "0", discountRemarks: "" });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fees");
      const data = await res.json();
      if (res.ok) setStudents(data.students || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const getStudentStatus = (s: Student) => {
    if (!s.feePayments.length) return "NO_RECORDS";
    const pending = s.feePayments.filter(p => p.status === "PENDING" || p.status === "OVERDUE");
    if (pending.length === 0) return "PAID";
    if (pending.length === s.feePayments.length) return "UNPAID";
    return "PARTIAL";
  };

  const getUnpaidMonths = (s: Student) => {
    return s.feePayments
      .filter(p => p.status === "PENDING" || p.status === "OVERDUE")
      .map(p => {
        const d = new Date(p.dueDate);
        return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      });
  };

  const handleMarkPaid = async () => {
    if (!payTarget) return;
    const discountValue = Number(payDiscountValue || 0);
    const discount = payDiscountType === "PERCENTAGE" ? Number(payTarget.amount) * (discountValue / 100) : discountValue;
    const netPayable = Math.max(Number(payTarget.amount) - discount, 0);
    setSaving(true);
    try {
      const res = await fetch("/api/fees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payTarget.id,
          amountPaid: netPayable,
          method: payMethod,
          transactionId: payTxId,
          status: "PAID",
          discountType: payDiscountType,
          discountValue,
          discountRemarks: payDiscountRemarks,
        }),
      });
      if (res.ok) {
        setIsPayModalOpen(false);
        fetchStudents();
        if (selectedStudent) {
          const updated = await fetch(`/api/fees?studentId=${selectedStudent.id}`);
          const data = await updated.json();
          // refresh selected student payments
          setSelectedStudent(prev => prev ? { ...prev, feePayments: data.payments || [] } : null);
        }
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleAddFee = async () => {
    if (!selectedStudent || !newFee.feeStructureId || !newFee.dueDate) return;
    const fs = feeStructures.find(f => f.id === newFee.feeStructureId);
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          feeStructureId: newFee.feeStructureId,
          amount: newFee.amount || fs?.amount,
          amountPaid: newFee.amountPaid,
          dueDate: newFee.dueDate,
          method: newFee.method,
          status: newFee.status,
          discountType: newFee.discountType,
          discountValue: newFee.discountValue,
          discountRemarks: newFee.discountRemarks,
        }),
      });
      if (res.ok) {
        setIsAddFeeModalOpen(false);
        setNewFee({ feeStructureId: "", dueDate: "", amount: "", amountPaid: "0", method: "CASH", status: "PENDING", discountType: "FIXED", discountValue: "0", discountRemarks: "" });
        fetchStudents();
      }
    } catch (err) { console.error(err); }
  };

  const filtered = students.filter(s =>
    s.user.name.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(search.toLowerCase())
  );

  const paidCount = students.filter(s => getStudentStatus(s) === "PAID").length;
  const unpaidCount = students.filter(s => getStudentStatus(s) === "UNPAID" || getStudentStatus(s) === "PARTIAL").length;
  const totalDue = students.reduce((sum, s) => sum + s.feePayments.filter(p => p.status !== "PAID" && p.status !== "WAIVED").reduce((a, p) => a + (Number(p.amount) - Number(p.discount || 0) - Number(p.amountPaid)), 0), 0);

  return (
    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
      {/* Left Panel: Student List */}
      <div style={{ flex: "1 1 500px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Fully Paid", value: paidCount, color: "#16a34a" },
            { label: "Pending/Partial", value: unpaidCount, color: "#d97706" },
            { label: "Total Due", value: `Rs. ${totalDue.toLocaleString()}`, color: "#dc2626" },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "1rem", border: `1px solid ${s.color}25` }}>
              <div style={{ fontWeight: 800, fontSize: "1.4rem", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Student Fee Status</h3>
          </div>

          <input
            className="form-control"
            placeholder="Search by name or admission no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: "1rem" }}
          />

          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "600px", overflowY: "auto" }}>
              {filtered.map(student => {
                const status = getStudentStatus(student);
                const unpaid = getUnpaidMonths(student);
                const section = student.enrollments[0]?.section;
                const isSelected = selectedStudent?.id === student.id;
                const st = STATUS_STYLES[status === "UNPAID" ? "PENDING" : status === "PAID" ? "PAID" : status === "PARTIAL" ? "PARTIAL" : "PENDING"];

                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    style={{
                      padding: "0.875rem 1rem",
                      borderRadius: "8px",
                      border: `1px solid ${isSelected ? "hsl(var(--primary))" : "#eaeaea"}`,
                      background: isSelected ? "hsl(var(--primary) / 0.05)" : "white",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{student.user.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {student.admissionNo} {section ? `• ${section.grade.name}-${section.name}` : ""}
                        </div>
                        {unpaid.length > 0 && (
                          <div style={{ fontSize: "0.7rem", color: "#b91c1c", marginTop: "0.2rem" }}>
                            Unpaid: {unpaid.slice(0, 3).join(", ")}{unpaid.length > 3 ? ` +${unpaid.length - 3} more` : ""}
                          </div>
                        )}
                      </div>
                      <span style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, background: st?.bg, color: st?.color, whiteSpace: "nowrap" }}>
                        {status === "NO_RECORDS" ? "No Records" : st?.label}
                        {unpaid.length > 0 ? ` (${unpaid.length})` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No students found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Student Detail */}
      <div style={{ flex: "1 1 380px" }}>
        {selectedStudent ? (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.2rem" }}>{selectedStudent.user.name}</h3>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selectedStudent.admissionNo} • {selectedStudent.user.email}</div>
                {selectedStudent.enrollments[0] && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {selectedStudent.enrollments[0].section.grade.name} - {selectedStudent.enrollments[0].section.name}
                  </div>
                )}
              </div>
              <button className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }} onClick={() => setIsAddFeeModalOpen(true)}>
                + Add Fee
              </button>
            </div>

            <h4 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Payment History</h4>

            {selectedStudent.feePayments.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", background: "#f8f9fa", borderRadius: "8px" }}>
                No fee records found for this student.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {selectedStudent.feePayments.map(payment => {
                  const st = STATUS_STYLES[payment.status] || STATUS_STYLES.PENDING;
                  const d = new Date(payment.dueDate);
                  return (
                    <div key={payment.id} style={{ padding: "0.875rem", border: "1px solid #eaeaea", borderRadius: "8px", borderLeft: `3px solid ${st.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{payment.feeStructure?.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Due: {MONTHS[d.getMonth()]} {d.getFullYear()}
                            {payment.paymentDate && ` • Paid: ${new Date(payment.paymentDate).toLocaleDateString()}`}
                          </div>
                          {payment.method && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Method: {payment.method}</div>}
                          {Number(payment.discount || 0) > 0 && <div style={{ fontSize: "0.7rem", color: "#15803d" }}>Discount: Rs. {Number(payment.discount).toLocaleString()}{payment.discountRemarks ? ` (${payment.discountRemarks})` : ""}</div>}
                          {payment.transactionId && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>TxID: {payment.transactionId}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Rs. {Number(payment.amountPaid).toLocaleString()} <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.75rem" }}>/ {Number(payment.amount).toLocaleString()}</span></div>
                          <span style={{ padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                          {(payment.status === "PENDING" || payment.status === "OVERDUE" || payment.status === "PARTIAL") && (
                            <button
                              onClick={() => { setPayTarget(payment); setPayMethod("CASH"); setPayTxId(""); setPayDiscountType("FIXED"); setPayDiscountValue(String(payment.discount || 0)); setPayDiscountRemarks(payment.discountRemarks || ""); setIsPayModalOpen(true); }}
                              style={{ display: "block", marginTop: "0.4rem", fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: "4rem 2rem", textAlign: "center", height: "100%" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👤</div>
            <h4 style={{ fontWeight: 600 }}>Select a Student</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Click on a student from the list to view their payment details.</p>
          </div>
        )}
      </div>

      {/* Mark Paid Modal */}
      {isPayModalOpen && payTarget && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "1.5rem", borderRadius: "8px", width: "100%", maxWidth: "420px" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>Mark Fee as Paid</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              <strong>{payTarget.feeStructure?.name}</strong> — Rs. {Number(payTarget.amount).toLocaleString()}
            </p>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>Payment Method</label>
              <select className="form-control" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="STRIPE">Stripe</option>
                <option value="RAZORPAY">Razorpay</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div className="form-group">
                <label>Discount Type</label>
                <select className="form-control" value={payDiscountType} onChange={e => setPayDiscountType(e.target.value as "FIXED" | "PERCENTAGE")}>
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>
              <div className="form-group">
                <label>Discount</label>
                <input className="form-control" type="number" min="0" value={payDiscountValue} onChange={e => setPayDiscountValue(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>Discount Remarks</label>
              <input className="form-control" placeholder="Reason for discount" value={payDiscountRemarks} onChange={e => setPayDiscountRemarks(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label>Transaction ID (Optional)</label>
              <input className="form-control" placeholder="e.g. TXN-001" value={payTxId} onChange={e => setPayTxId(e.target.value)} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setIsPayModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleMarkPaid} disabled={saving}>{saving ? "Saving..." : "Confirm Payment"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Fee Modal */}
      {isAddFeeModalOpen && selectedStudent && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "1.5rem", borderRadius: "8px", width: "100%", maxWidth: "440px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: 700 }}>Add Fee — {selectedStudent.user.name}</h3>
              <button onClick={() => setIsAddFeeModalOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>Fee Structure *</label>
              <select className="form-control" value={newFee.feeStructureId} onChange={e => {
                const fs = feeStructures.find(f => f.id === e.target.value);
                setNewFee({ ...newFee, feeStructureId: e.target.value, amount: fs ? String(fs.amount) : "" });
              }}>
                <option value="">Select Fee Type</option>
                {feeStructures.map(fs => <option key={fs.id} value={fs.id}>{fs.gradeName ? `${fs.gradeName} - ` : ""}{fs.name} — Rs. {Number(fs.amount).toLocaleString()}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div className="form-group">
                <label>Amount (Rs.) *</label>
                <input className="form-control" type="number" value={newFee.amount} onChange={e => setNewFee({ ...newFee, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Amount Paid</label>
                <input className="form-control" type="number" value={newFee.amountPaid} onChange={e => setNewFee({ ...newFee, amountPaid: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div className="form-group">
                <label>Discount Type</label>
                <select className="form-control" value={newFee.discountType} onChange={e => setNewFee({ ...newFee, discountType: e.target.value })}>
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>
              <div className="form-group">
                <label>Discount</label>
                <input className="form-control" type="number" min="0" value={newFee.discountValue} onChange={e => setNewFee({ ...newFee, discountValue: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>Discount Remarks</label>
              <input className="form-control" placeholder="Reason for discount" value={newFee.discountRemarks} onChange={e => setNewFee({ ...newFee, discountRemarks: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>Due Date *</label>
              <input className="form-control" type="date" value={newFee.dueDate} onChange={e => setNewFee({ ...newFee, dueDate: e.target.value })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={newFee.status} onChange={e => setNewFee({ ...newFee, status: e.target.value })}>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partial</option>
                </select>
              </div>
              <div className="form-group">
                <label>Method</label>
                <select className="form-control" value={newFee.method} onChange={e => setNewFee({ ...newFee, method: e.target.value })}>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setIsAddFeeModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddFee}>Add Fee Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

