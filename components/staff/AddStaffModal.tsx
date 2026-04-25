"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddStaffModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();
  
  // Core fields
  const [formData, setFormData] = useState<any>({
    name: "", email: "", phone: "", role: "",
    dob: "", gender: "", bloodGroup: "",
    currentAddress: "", permanentAddress: "",
    joinDate: "", emergencyContactName: "", emergencyContactPhone: "",
    nationalId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (!formData.name || !formData.email || !formData.role) {
      setError("Please fill out Name, Email, and Role to proceed.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation checks
    if (formData.role === "DRIVER" && !formData.licenseExpiryDate) {
      setError("Driver License Expiry Date is mandatory.");
      return;
    }

    if (formData.role === "TEACHER" && !formData.degreeFile) {
      setError("Degree Certificate upload is mandatory for Teachers.");
      return;
    }

    if (formData.role === "ACCOUNTANT" && !formData.certFile) {
      setError("Professional Certificate upload is mandatory for Accountants.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff");
      }

      setIsOpen(false);
      setFormData({ name: "", email: "", phone: "", role: "" });
      setStep(1);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setIsOpen(true)}>
        + Add New Staff
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>{step === 1 ? "Step 1: Core Information" : `Step 2: ${formData.role} Details`}</h3>
              <button className="btn-close" onClick={() => setIsOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: "1rem", color: "red" }}>{error}</div>}

              {step === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Role *</label>
                    <select name="role" value={formData.role} onChange={handleChange} required className="form-control">
                      <option value="">Select Role</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="DRIVER">Driver</option>
                      <option value="ADMIN">Admin</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="form-control">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="form-control" placeholder="e.g. O+" />
                  </div>
                  <div className="form-group">
                    <label>Date of Joining</label>
                    <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>National ID / SSN</label>
                    <input type="text" name="nationalId" value={formData.nationalId} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Current Address</label>
                    <input type="text" name="currentAddress" value={formData.currentAddress} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Permanent Address</label>
                    <input type="text" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact Person</label>
                    <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact Number</label>
                    <input type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Passport-sized Photo</label>
                    <input type="file" name="photoFile" onChange={(e) => setFormData({...formData, photoFile: e.target.value})} className="form-control" />
                  </div>
                </div>
              )}

              {step === 2 && formData.role === "TEACHER" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <h4>Academic Focus</h4>
                  </div>
                  <div className="form-group">
                    <label>Highest Degree</label>
                    <input type="text" name="highestDegree" value={formData.highestDegree || ""} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>University Name</label>
                    <input type="text" name="university" value={formData.university || ""} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Year of Graduation</label>
                    <input type="number" name="gradYear" value={formData.gradYear || ""} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Primary Subjects (Specialization)</label>
                    <input type="text" name="subjects" value={formData.subjects || ""} onChange={handleChange} placeholder="e.g. Math, Physics" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Grade Levels</label>
                    <input type="text" name="gradeLevels" value={formData.gradeLevels || ""} onChange={handleChange} placeholder="e.g. 9-12" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Teaching License Number</label>
                    <input type="text" name="licenseNumber" value={formData.licenseNumber || ""} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Certifications (TESOL/TEFL)</label>
                    <input type="text" name="certifications" value={formData.certifications || ""} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input type="number" name="experience" value={formData.experience || ""} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Previous Schools</label>
                    <input type="text" name="previousSchools" value={formData.previousSchools || ""} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Resume / CV Upload</label>
                    <input type="file" name="resumeFile" onChange={(e) => setFormData({...formData, resumeFile: e.target.value})} className="form-control" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Degree Certificate Upload *</label>
                    <input type="file" name="degreeFile" onChange={(e) => setFormData({...formData, degreeFile: e.target.value})} className="form-control" required />
                  </div>
                </div>
              )}

              {step === 2 && formData.role === "ACCOUNTANT" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <h4>Financial Focus</h4>
                  </div>
                  <div className="form-group">
                    <label>Professional Qualification</label>
                    <select name="qualification" value={formData.qualification || ""} onChange={handleChange} className="form-control">
                      <option value="">Select</option>
                      <option value="CPA">CPA</option>
                      <option value="ACCA">ACCA</option>
                      <option value="CA">CA</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Software Skills</label>
                    <input type="text" name="softwareSkills" value={formData.softwareSkills || ""} onChange={handleChange} placeholder="QuickBooks, Excel, SAP" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Background Check Status</label>
                    <input type="text" name="backgroundCheck" value={formData.backgroundCheck || ""} onChange={handleChange} placeholder="Financial Bonding Status" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Departmental Role</label>
                    <input type="text" name="deptRole" value={formData.deptRole || ""} onChange={handleChange} placeholder="Payroll, Auditing, General Ledger" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Years of Accounting Exp.</label>
                    <input type="number" name="experience" value={formData.experience || ""} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Professional Certificate Upload *</label>
                    <input type="file" name="certFile" onChange={(e) => setFormData({...formData, certFile: e.target.value})} className="form-control" required />
                  </div>
                </div>
              )}

              {step === 2 && formData.role === "DRIVER" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <h4>Safety & Compliance Focus</h4>
                  </div>
                  <div className="form-group">
                    <label>Driving License Number</label>
                    <input type="text" name="drivingLicense" value={formData.drivingLicense || ""} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>License Class</label>
                    <input type="text" name="licenseClass" value={formData.licenseClass || ""} onChange={handleChange} placeholder="Heavy Vehicle, Commercial" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>License Expiry Date *</label>
                    <input type="date" name="licenseExpiryDate" value={formData.licenseExpiryDate || ""} onChange={handleChange} className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label>Years of Commercial Exp.</label>
                    <input type="number" name="experience" value={formData.experience || ""} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Knowledge</label>
                    <input type="text" name="vehicleKnowledge" value={formData.vehicleKnowledge || ""} onChange={handleChange} placeholder="Bus, Van, Car" className="form-control" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Accident History (Self Declaration)</label>
                    <textarea name="accidentHistory" value={formData.accidentHistory || ""} onChange={handleChange} className="form-control" rows={3}></textarea>
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Medical Fitness / Eyesight Cert Upload</label>
                    <input type="file" name="medicalFitnessFile" onChange={(e) => setFormData({...formData, medicalFitnessFile: e.target.value})} className="form-control" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Police Clearance Upload</label>
                    <input type="file" name="policeClearanceFile" onChange={(e) => setFormData({...formData, policeClearanceFile: e.target.value})} className="form-control" />
                  </div>
                </div>
              )}

              {step === 2 && !["TEACHER", "ACCOUNTANT", "DRIVER"].includes(formData.role) && (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  <p>No specific requirements for this role.</p>
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between" }}>
                {step === 2 ? (
                  <button type="button" className="btn btn-secondary" onClick={handleBack}>Back</button>
                ) : (
                  <div></div>
                )}
                
                {step === 1 ? (
                  <button type="button" className="btn btn-primary" onClick={handleNext}>Next</button>
                ) : (
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Save Staff"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #eaeaea;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 { margin: 0; font-size: 1.25rem; }
        .btn-close {
          background: none; border: none; font-size: 1.5rem; cursor: pointer;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-control {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      `}</style>
    </>
  );
}
