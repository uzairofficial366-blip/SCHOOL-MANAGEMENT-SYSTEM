"use client";

import { useState } from "react";
import { Plus, FileText, Sliders, X, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  instructions: z.string().min(10, "Instructions must be detailed"),
  dueDate: z.string().min(1, "Due date is required"),
  totalMarks: z.coerce.number().min(1, "Must be greater than 0"),
});

export default function TeacherAssignmentsClient({ assignments, totalStudents }: any) {
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "", instructions: "", dueDate: "", totalMarks: 100
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: any = [];
    if (step === 1) fieldsToValidate = ["title", "instructions"];
    if (step === 2) fieldsToValidate = ["dueDate", "totalMarks"];
    
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setStep(step + 1);
  };

  const onSubmit = async (data: any) => {
    // In real app, FormData logic would go here
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (selectedFile) formData.append("file", selectedFile);

    console.log("Submitting:", data, selectedFile);
    alert("Assignment created successfully!");
    setShowWizard(false);
    setStep(1);
  };

  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem" }}>
      <div className="card flex justify-between items-center mb-6" style={{ background: "linear-gradient(to right, hsl(var(--bg-card)), hsl(var(--accent)/0.05))" }}>
        <div>
          <h3 className="text-2xl font-extrabold">Workflow Manager</h3>
          <p className="text-muted-foreground">Creation Wizard, Submission Tracking, Online Grading.</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn btn-primary"><Plus size={18} /> Create Assignment</button>
      </div>

      {showWizard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl bg-card shadow-2xl animate-fade-up">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold">Create Assignment - Step {step} of 3</h3>
              <button onClick={() => setShowWizard(false)} className="text-muted-foreground hover:text-text"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Assignment Title</label>
                    <input {...register("title")} className="form-input" placeholder="e.g. Physics Lab Report" />
                    {errors.title && <span className="text-danger text-sm">{errors.title.message as string}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Detailed Instructions</label>
                    <textarea {...register("instructions")} className="form-input" rows={4} placeholder="Describe the requirements..."></textarea>
                    {errors.instructions && <span className="text-danger text-sm">{errors.instructions.message as string}</span>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Due Date & Time</label>
                      <input type="datetime-local" {...register("dueDate")} className="form-input" />
                      {errors.dueDate && <span className="text-danger text-sm">{errors.dueDate.message as string}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Marks</label>
                      <input type="number" {...register("totalMarks")} className="form-input" />
                      {errors.totalMarks && <span className="text-danger text-sm">{errors.totalMarks.message as string}</span>}
                    </div>
                  </div>
                  <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg text-sm">
                    <strong>Late Policy:</strong> By default, a 10% deduction applies per day late.
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-primary/5 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-primary/10 text-primary rounded-full"><Upload size={24} /></div>
                      <div className="font-bold">Click or drag file to attach</div>
                      <div className="text-sm text-muted-foreground">PDF, Word, or ZIP up to 50MB</div>
                      {selectedFile && <div className="mt-2 p-2 bg-success/20 text-success rounded-md font-medium text-sm">Selected: {selectedFile.name}</div>}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-4 border-t border-border">
                {step > 1 ? (
                  <button type="button" onClick={() => setStep(step - 1)} className="btn btn-ghost">Back</button>
                ) : <div></div>}
                
                {step < 3 ? (
                  <button type="button" onClick={nextStep} className="btn btn-primary">Next Step</button>
                ) : (
                  <button type="submit" className="btn btn-success">Publish Assignment</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments?.map((assign: any) => (
          <div key={assign.id} className="card glass">
            <div className="flex justify-between mb-4">
              <h4 className="text-xl font-bold">{assign.title}</h4>
              <span className="badge badge-warning">Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
              {assign.instructions || "No instructions provided."}
            </p>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <strong>Submission Tracking</strong>
                <span>{assign.submissions.length} / {totalStudents} Submitted</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(assign.submissions.length / Math.max(1, totalStudents)) * 100}%` }}></div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button className="btn btn-sm btn-ghost"><FileText size={14} /> Annotate PDF</button>
              <button className="btn btn-sm btn-ghost"><Sliders size={14} /> Late Policy</button>
            </div>
          </div>
        ))}
        {(!assignments || assignments.length === 0) && <p className="col-span-2 text-muted-foreground">No assignments found.</p>}
      </div>
    </div>
  );
}
