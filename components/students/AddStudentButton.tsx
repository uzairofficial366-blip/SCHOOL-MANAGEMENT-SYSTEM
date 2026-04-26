"use client";

import { useState } from "react";
import NewStudentModal from "./NewStudentModal";

export default function AddStudentButton({ grades, sections, academicYears }: { grades: any[], sections: any[], academicYears: any[] }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
        + Add New Student
      </button>
      {showModal && <NewStudentModal onClose={() => setShowModal(false)} grades={grades} sections={sections} academicYears={academicYears} />}
    </>
  );
}
