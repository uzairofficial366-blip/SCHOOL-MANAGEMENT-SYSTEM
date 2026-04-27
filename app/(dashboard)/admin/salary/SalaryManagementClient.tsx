"use client";

import { useState, useEffect } from "react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PAID:    { bg: "#dcfce7", color: "#15803d", label: "Paid" },
  PENDING: { bg: "#fef3c7", color: "#b45309", label: "Pending" },
  PARTIAL: { bg: "#dbeafe", color: "#1d4ed8", label: "Partial" },
  WAIVED:  { bg: "#f3f4f6", color: "#6b7280", label: "Waived" },
};

interface SalaryPayment {
  id: string;
  salaryMonth: string;
  grossAmount: number;
  deductions: number;
  bonus: number;
  amountPaid: number;
  paymentDate: string | null;
  method: string | null;
  transactionId: string | null;
  status: string;
}

interface StaffMember {
  id: string;
  employeeId: string;
  designation: string | null;
  department: string | null;
  salary: number | null;
  user: { name: string; email: string; role: string };
  salaryPayments: SalaryPayment[];
}

export default function SalaryManagementClient() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAddSalaryModal, setIsAddSalaryModal] = useState(false);
  const [payTarget, setPayTarget] = useState<SalaryPayment | null>(null);
  const [payMethod, setPayMethod] = useState("CASH");
  const [payTxId, setPayTxId] = useState("");
  const [saving, setSaving] = useState(false);
  const [newSalary, setNewSalary] = useState({ salaryMonth: "", grossAmount: "", deductions: "0", bonus: "0" });

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/salary");
      const data = await res.json();
      if (res.ok) setStaff(data.staff || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getStaffStatus = (s: StaffMember) => {
    if (!s.salaryPayments.length) return "NO_RECORDS";
    const pending = s.salaryPayments.filter(p => p.status === "PENDING");
    if (pending.length === 0) return "PAID";
    return "PENDING";
  };

  const getPendingMonths = (s: StaffMember) => {
    return s.salaryPayments
      .filter(p => p.status === "PENDING")
      .map(p => {
        const d = new Date(p.salaryMonth);
        return `${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
      });
  };

  const handleMarkPaid = async () => {
    if (!payTarget) return;
    setSaving(true);
    try {
      const res = await fetch("/api/salary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: payTarget.id, amountPaid: Number(payTarget.grossAmount) - Number(payTarget.deductions) + Number(payTarget.bonus), method: payMethod, transactionId: payTxId }),
      });
      if (res.ok) {
        setIsPayModalOpen(false);
        fetchStaff();
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleAddSalary = async () => {
    if (!selectedStaff || !newSalary.salaryMonth || !newSalary.grossAmount) return;
    try {
      const net = parseFloat(newSalary.grossAmount) - parseFloat(newSalary.deductions || "0") + parseFloat(newSalary.bonus || "0");
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          salaryMonth: `${newSalary.salaryMonth}-01`,
          grossAmount: newSalary.grossAmount,
          deductions: newSalary.deductions || 0,
          bonus: newSalary.bonus || 0,
          amountPaid: 0,
          status: "PENDING",
        }),
      });
      if (res.ok) {
        setIsAddSalaryModal(false);
        setNewSalary({ salaryMonth: "", grossAmount: selectedStaff.salary ? String(selectedStaff.salary) : "", deductions: "0", bonus: "0" });
        fetchStaff();
      }
    } catch (err) { console.error(err); }
  };

  const filtered = staff.filter(s =>
    s.user.name.toLowerCase().includes(search.toLowerCase()) ||
    s.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const paidCount = staff.filter(s => getStaffStatus(s) === "PAID").length;
  const pendingCount = staff.filter(s => getStaffStatus(s) === "PENDING").length;
  const totalPending = staff.reduce((sum, s) => sum + s.salaryPayments.filter(p => p.status === "PENDING").reduce((a, p) => a + (Number(p.grossAmount) - Number(p.deductions) + Number(p.bonus)), 0), 0);

  return (
    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
      {/* Left Panel */}
      <div style={{ flex: "1 1 500px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Up to Date", value: paidCount, color: "#16a34a" },
            { label: "Pending", value: pendingCount, color: "#d97706" },
            { label: "Total Pending", value: `Rs. ${Math.round(totalPending).toLocaleString()}`, color: "#dc2626" },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "1rem", border: `1px solid ${s.color}25` }}>
              <div style={{ fontWeight: 800, fontSize: "1.4rem", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>Staff Salary Status</h3>
          <input
            className="form-control"
            placeholder="Search by name or employee ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: "1rem" }}
          />

          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "580px", overflowY: "auto" }}>
              {filtered.map(member => {
                const status = getStaffStatus(member);
                const pending = getPendingMonths(member);
                const isSelected = selectedStaff?.id === member.id;
                const st = STATUS_STYLES[status === "NO_RECORDS" ? "PENDING" : status] || STATUS_STYLES.PENDING;

                return (
                  <div
                    key={member.id}
                    onClick={() => { setSelectedStaff(member); setNewSalary(prev => ({ ...prev, grossAmount: member.salary ? String(member.salary) : "" })); }}
                    style={{
                      padding: "0.875rem 1rem",
                      borderRadius: "8px",
                      border: `1px solid ${isSelected ? "hsl(var(--primary))" : "#eaeaea"}`,
                      background: isSelected ? "hsl(var(--primary) / 0.05)" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{member.user.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {member.employeeId} • {member.user.role} {member.department ? `• ${member.department}` : ""}
                        </div>
                        {member.salary && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Base Salary: Rs. {Number(member.salary).toLocaleString()}/mo</div>
                        )}
                        {pending.length > 0 && (
                          <div style={{ fontSize: "0.7rem", color: "#b91c1c", marginTop: "0.2rem" }}>
                            Pending: {pending.slice(0, 3).join(", ")}{pending.length > 3 ? ` +${pending.length - 3} more` : ""}
                          </div>
                        )}
                      </div>
                      <span style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>
                        {status === "NO_RECORDS" ? "No Records" : st.label}
                        {pending.length > 0 ? ` (${pending.length})` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No staff members found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Staff Detail */}
      <div style={{ flex: "1 1 380px" }}>
        {selectedStaff ? (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.2rem" }}>{selectedStaff.user.name}</h3>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selectedStaff.employeeId} • {selectedStaff.user.email}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selectedStaff.user.role}{selectedStaff.department ? ` • ${selectedStaff.department}` : ""}</div>
                {selectedStaff.salary && (
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "hsl(var(--primary))", marginTop: "0.25rem" }}>
                    Base: Rs. {Number(selectedStaff.salary).toLocaleString()}/month
                  </div>
                )}
              </div>
              <button className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }} onClick={() => setIsAddSalaryModal(true)}>
                + Add Month
              </button>
            </div>

            <h4 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Payment History</h4>

            {selectedStaff.salaryPayments.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", background: "#f8f9fa", borderRadius: "8px" }}>
                No salary records found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {selectedStaff.salaryPayments.map(payment => {
                  const st = STATUS_STYLES[payment.status] || STATUS_STYLES.PENDING;
                  const d = new Date(payment.salaryMonth);
                  const net = Number(payment.grossAmount) - Number(payment.deductions) + Number(payment.bonus);
                  return (
                    <div key={payment.id} style={{ padding: "0.875rem", border: "1px solid #eaeaea", borderRadius: "8px", borderLeft: `3px solid ${st.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{MONTHS[d.getMonth()]} {d.getFullYear()}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Gross: Rs. {Number(payment.grossAmount).toLocaleString()}
                            {Number(payment.deductions) > 0 && ` - Rs. ${Number(payment.deductions).toLocaleString()}`}
                            {Number(payment.bonus) > 0 && ` + Bonus Rs. ${Number(payment.bonus).toLocaleString()}`}
                          </div>
                          {payment.paymentDate && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Paid on: {new Date(payment.paymentDate).toLocaleDateString()}</div>}
                          {payment.method && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Via: {payment.method}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Rs. {Math.round(net).toLocaleString()}</div>
                          <span style={{ padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                          {payment.status === "PENDING" && (
                            <button
                              onClick={() => { setPayTarget(payment); setPayMethod("CASH"); setPayTxId(""); setIsPayModalOpen(true); }}
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
          <div className="card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
            <h4 style={{ fontWeight: 600 }}>Select a Staff Member</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Click on a staff member to view their salary history.</p>
          </div>
        )}
      </div>

      {/* Mark Paid Modal */}
      {isPayModalOpen && payTarget && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "1.5rem", borderRadius: "8px", width: "100%", maxWidth: "420px" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Mark Salary as Paid</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Net payable: <strong>Rs. {Math.round(Number(payTarget.grossAmount) - Number(payTarget.deductions) + Number(payTarget.bonus)).toLocaleString()}</strong>
            </p>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>Payment Method</label>
              <select className="form-control" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label>Transaction ID (Optional)</label>
              <input className="form-control" placeholder="e.g. TXN-2024-001" value={payTxId} onChange={e => setPayTxId(e.target.value)} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setIsPayModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleMarkPaid} disabled={saving}>{saving ? "Saving..." : "Confirm Payment"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Salary Month Modal */}
      {isAddSalaryModal && selectedStaff && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "1.5rem", borderRadius: "8px", width: "100%", maxWidth: "440px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: 700 }}>Add Salary — {selectedStaff.user.name}</h3>
              <button onClick={() => setIsAddSalaryModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>Salary Month *</label>
              <input className="form-control" type="month" value={newSalary.salaryMonth} onChange={e => setNewSalary({ ...newSalary, salaryMonth: e.target.value })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div className="form-group">
                <label>Gross (Rs.) *</label>
                <input className="form-control" type="number" value={newSalary.grossAmount} onChange={e => setNewSalary({ ...newSalary, grossAmount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Deductions</label>
                <input className="form-control" type="number" value={newSalary.deductions} onChange={e => setNewSalary({ ...newSalary, deductions: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Bonus</label>
                <input className="form-control" type="number" value={newSalary.bonus} onChange={e => setNewSalary({ ...newSalary, bonus: e.target.value })} />
              </div>
            </div>
            {newSalary.grossAmount && (
              <div style={{ padding: "0.75rem", background: "#f0fdf4", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "#15803d" }}>
                Net Payable: Rs. {Math.round(parseFloat(newSalary.grossAmount || "0") - parseFloat(newSalary.deductions || "0") + parseFloat(newSalary.bonus || "0")).toLocaleString()}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setIsAddSalaryModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddSalary}>Create Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
