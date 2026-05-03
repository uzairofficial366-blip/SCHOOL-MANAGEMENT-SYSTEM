"use client";

import { Eye, Share2, FileUp, Layers, Video, FileText, Calendar, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function TeacherLmsClient({ initialContent }: any) {
  const [lmsContent, setLmsContent] = useState<any[]>(initialContent || []);
  const [loading, setLoading] = useState(false);

  // Dynamic Data Fetching Simulation
  useEffect(() => {
    if (!initialContent) {
      Promise.resolve().then(() => setLoading(true));
      setTimeout(() => {
        setLmsContent([
          { id: '1', title: 'Intro to Thermodynamics', type: 'PDF', description: 'Chapter 1 notes' },
          { id: '2', title: 'Lab Safety Video', type: 'VIDEO', description: 'Required watching before lab 1' }
        ]);
        setLoading(false);
      }, 800);
    }
  }, [initialContent]);

  return (
    <div className="page-body fade-up p-4 sm:p-6 lg:p-8">
      <div className="card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold">Digital Library (LMS)</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Modular Folders, Multimedia Support, Drip Content.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button className="btn btn-ghost flex-1 sm:flex-none justify-center"><Eye size={18} /> Student View</button>
          <button className="btn btn-ghost flex-1 sm:flex-none justify-center"><Share2 size={18} /> Common Pool</button>
          <button className="btn btn-primary flex-1 sm:flex-none justify-center"><FileUp size={18} /> Upload</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Modular Folder */}
        <div className="card glass">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-accent/10 text-accent rounded-xl">
              <Layers size={28} />
            </div>
            <div>
              <h4 className="font-bold text-lg">Unit 1: Thermodynamics</h4>
              <div className="text-xs sm:text-sm text-muted-foreground">4 Resources • Drip: Active</div>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            <li className="flex items-center gap-3 text-sm p-2 sm:p-3 bg-background rounded-lg hover:bg-primary/5 cursor-pointer transition-colors">
              <Video size={16} className="text-primary flex-shrink-0" /> <span className="truncate">Lecture 1 Recording</span>
            </li>
            <li className="flex items-center gap-3 text-sm p-2 sm:p-3 bg-background rounded-lg hover:bg-primary/5 cursor-pointer transition-colors">
              <FileText size={16} className="text-danger flex-shrink-0" /> <span className="truncate">Formula Sheet PDF</span>
            </li>
            <li className="flex items-center gap-3 text-sm p-2 sm:p-3 bg-background rounded-lg opacity-60">
              <Calendar size={16} className="flex-shrink-0" /> <span className="truncate">Quiz 1 (Unlocks Oct 15)</span>
            </li>
          </ul>
        </div>

        {loading ? (
          <div className="col-span-full py-12 flex justify-center text-primary">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          lmsContent.map((content: any) => (
            <div key={content.id} className="card glass flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  {content.type === 'VIDEO' ? <Video size={28} /> : <FileText size={28} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg truncate">{content.title}</h4>
                  <div className="text-xs sm:text-sm text-muted-foreground">{content.type}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                {content.description || "No description"}
              </p>
              <button className="btn btn-sm btn-ghost w-full justify-center">Manage Visibility</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
