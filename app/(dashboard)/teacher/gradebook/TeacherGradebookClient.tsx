"use client";

import { useState } from "react";
import { Settings, Download, FileText, Table as TableIcon } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function TeacherGradebookClient({ roster }: any) {
  // Using a flat list for demonstration; in reality, you'd filter by selected section.
  const allStudents = roster?.flatMap((sec: any) => 
    sec.enrollments.map((e: any) => ({
      id: e.student.id,
      name: e.student.user.name,
      initials: e.student.user.name.substring(0, 2).toUpperCase(),
      scores: { exam: 0, quiz: 0, homework: 0 }
    }))
  ) || [];

  const [students, setStudents] = useState(allStudents);

  const handleScoreChange = (id: string, field: keyof typeof students[0]['scores'], value: string) => {
    const numVal = Math.min(100, Math.max(0, Number(value) || 0));
    setStudents((prev: any[]) => prev.map(s => {
      if (s.id === id) {
        return { ...s, scores: { ...s.scores, [field]: numVal } };
      }
      return s;
    }));
  };

  const getAverageAndStatus = (scores: any) => {
    const avg = (scores.exam * 0.4) + (scores.quiz * 0.3) + (scores.homework * 0.3);
    const status = avg >= 90 ? { text: "Excellent", class: "badge-success" }
                 : avg >= 75 ? { text: "Good", class: "badge-info" }
                 : avg >= 50 ? { text: "Pass", class: "badge-warning" }
                 : { text: "Needs Help", class: "badge-danger" };
    return { avg: avg.toFixed(1), status };
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Class Gradebook Report", 14, 15);
    
    const tableData = students.map((s: any) => {
      const { avg, status } = getAverageAndStatus(s.scores);
      return [s.name, s.scores.exam, s.scores.quiz, s.scores.homework, avg, status.text];
    });

    autoTable(doc, {
      head: [['Student Name', 'Exam (40%)', 'Quiz (30%)', 'Homework (30%)', 'Final Average', 'Status']],
      body: tableData,
      startY: 25,
    });
    
    doc.save("gradebook_report.pdf");
  };

  const exportExcel = () => {
    const worksheetData = students.map((s: any) => {
      const { avg, status } = getAverageAndStatus(s.scores);
      return {
        "Student Name": s.name,
        "Exam (40%)": s.scores.exam,
        "Quiz (30%)": s.scores.quiz,
        "Homework (30%)": s.scores.homework,
        "Final Average": avg,
        "Status": status.text
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");
    XLSX.writeFile(workbook, "gradebook_export.xlsx");
  };

  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem" }}>
      <div className="card flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-extrabold">Robust Gradebook</h3>
          <p className="text-muted-foreground">Automated calculations, custom scales, and flagging.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-ghost"><Settings size={18} /> Grading Weights</button>
          <div className="flex bg-primary rounded-lg overflow-hidden text-white shadow-lg">
            <button onClick={exportPDF} className="px-4 py-2 hover:bg-primary-dark transition-colors flex items-center gap-2 border-r border-white/20">
              <FileText size={18} /> PDF
            </button>
            <button onClick={exportExcel} className="px-4 py-2 hover:bg-primary-dark transition-colors flex items-center gap-2">
              <TableIcon size={18} /> Excel
            </button>
          </div>
        </div>
      </div>

      <div className="card glass">
        <div className="flex gap-4 mb-6 items-center">
          <select className="form-input w-64">
            <option>Select Section</option>
            {roster?.map((s: any) => <option key={s.id}>{s.grade.name} - {s.name}</option>)}
          </select>
          <select className="form-input w-64">
            <option>Percentage Scale (0-100)</option>
            <option>Letter Grades (A-F)</option>
          </select>
        </div>
        
        <div className="table-wrapper">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b">Student Name</th>
                <th className="p-4 border-b w-32">Exam (40%)</th>
                <th className="p-4 border-b w-32">Quiz (30%)</th>
                <th className="p-4 border-b w-32">Homework (30%)</th>
                <th className="p-4 border-b w-32">Final Average</th>
                <th className="p-4 border-b w-32">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => {
                const { avg, status } = getAverageAndStatus(s.scores);
                const isFailing = Number(avg) < 50;

                return (
                  <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className={`avatar w-8 h-8 text-xs ${isFailing ? 'bg-danger text-white' : ''}`}>
                          {s.initials}
                        </div>
                        <strong className="text-sm">{s.name}</strong>
                      </div>
                    </td>
                    <td className="p-4 border-b">
                      <input 
                        type="number" 
                        className={`form-input w-20 p-1 text-center ${s.scores.exam < 50 ? 'border-danger text-danger' : ''}`} 
                        value={s.scores.exam} 
                        onChange={(e) => handleScoreChange(s.id, 'exam', e.target.value)}
                        min={0} max={100}
                      />
                    </td>
                    <td className="p-4 border-b">
                      <input 
                        type="number" 
                        className={`form-input w-20 p-1 text-center ${s.scores.quiz < 50 ? 'border-danger text-danger' : ''}`} 
                        value={s.scores.quiz} 
                        onChange={(e) => handleScoreChange(s.id, 'quiz', e.target.value)}
                        min={0} max={100}
                      />
                    </td>
                    <td className="p-4 border-b">
                      <input 
                        type="number" 
                        className={`form-input w-20 p-1 text-center ${s.scores.homework < 50 ? 'border-danger text-danger' : ''}`} 
                        value={s.scores.homework} 
                        onChange={(e) => handleScoreChange(s.id, 'homework', e.target.value)}
                        min={0} max={100}
                      />
                    </td>
                    <td className="p-4 border-b">
                      <strong className={`text-lg ${isFailing ? 'text-danger' : ''}`}>{avg}%</strong>
                    </td>
                    <td className="p-4 border-b">
                      <span className={`badge ${status.class}`}>{status.text}</span>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
