"use client";

import { useState, useCallback, useRef } from "react";
import { ChevronRight, CheckCircle, XCircle } from "lucide-react";

export default function TeacherAttendanceClient({ roster }: any) {
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSync = useCallback((data: Record<string, string>) => {
    setSyncStatus("syncing");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      try {
        // Optimistic API Call: await fetch('/api/attendance/batch', { method: 'POST', body: JSON.stringify(data) })
        await new Promise(r => setTimeout(r, 600)); // Simulated network latency
        setSyncStatus("synced");
        setTimeout(() => setSyncStatus("idle"), 2000);
      } catch (err) {
        console.error(err);
      }
    }, 1500);
  }, []);

  const markAll = (status: string) => {
    const newAtt = { ...attendance };
    roster?.forEach((sec: any) => {
      sec.enrollments.forEach((enr: any) => {
        newAtt[enr.student.id] = status;
      });
    });
    setAttendance(newAtt);
    triggerSync(newAtt);
  };

  const markStudent = (studentId: string, status: string) => {
    const newAtt = { ...attendance, [studentId]: status };
    setAttendance(newAtt);
    triggerSync(newAtt);
  };

  const sparklineData = [80, 85, 90, 88, 92, 95, 90];
  const renderSparkline = () => (
    <div className="flex items-end h-10 gap-1 opacity-80" title="7-day Attendance Trend">
      {sparklineData.map((val, i) => (
        <div key={i} style={{ width: '8px', height: `${val}%`, background: 'hsl(var(--success))', borderRadius: '2px 2px 0 0' }} />
      ))}
    </div>
  );

  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem" }}>
      <div className="card flex justify-between items-center mb-6" style={{ background: "linear-gradient(to right, hsl(var(--bg-card)), hsl(var(--primary)/0.05))" }}>
        <div>
          <h3 className="text-2xl font-extrabold">Attendance: {new Date().toLocaleDateString()}</h3>
          <p className="text-muted-foreground flex items-center gap-2">
            Status: 
            {syncStatus === "syncing" && <span className="text-warning text-sm">Syncing...</span>}
            {syncStatus === "synced" && <span className="text-success text-sm">Saved</span>}
            {syncStatus === "idle" && <span className="text-muted-foreground text-sm">Up to date</span>}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right mr-4">
            <div className="text-xs font-bold text-muted-foreground uppercase">7-Day Trend</div>
            {renderSparkline()}
          </div>
          <button onClick={() => markAll('P')} className="btn btn-success"><CheckCircle size={18} /> Mark All Present</button>
          <button onClick={() => markAll('A')} className="btn btn-danger"><XCircle size={18} /> Mark All Absent</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roster?.map((section: any) => (
          <div key={section.id} className="card glass col-span-1 md:col-span-3">
            <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ChevronRight size={20} className="text-primary" /> {section.grade.name} - {section.name} 
              <span className="badge ml-auto">{section.enrollments.length} Students</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.enrollments.map((enr: any) => {
                const sId = enr.student.id;
                const currentStatus = attendance[sId];
                
                return (
                  <div key={enr.id} className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border transition-all hover:shadow-md">
                    <div className="avatar w-12 h-12 text-lg">
                      {enr.student.user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{enr.student.user.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {enr.student.admissionNo}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex bg-card rounded-lg overflow-hidden border border-border">
                        <button 
                          onClick={() => markStudent(sId, 'P')}
                          className={`px-3 py-1 font-bold border-none cursor-pointer transition-colors ${currentStatus === 'P' ? 'bg-success/20 text-success' : 'bg-transparent text-muted-foreground hover:bg-success/10'}`}
                        >P</button>
                        <button 
                          onClick={() => markStudent(sId, 'A')}
                          className={`px-3 py-1 font-bold border-none border-l border-border cursor-pointer transition-colors ${currentStatus === 'A' ? 'bg-danger/20 text-danger' : 'bg-transparent text-muted-foreground hover:bg-danger/10'}`}
                        >A</button>
                        <button 
                          onClick={() => markStudent(sId, 'L')}
                          className={`px-3 py-1 font-bold border-none border-l border-border cursor-pointer transition-colors ${currentStatus === 'L' ? 'bg-warning/20 text-warning' : 'bg-transparent text-muted-foreground hover:bg-warning/10'}`}
                        >L</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
