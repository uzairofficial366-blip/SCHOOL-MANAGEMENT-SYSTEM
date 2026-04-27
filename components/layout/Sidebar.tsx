"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const NAV_BY_ROLE: Record<string, NavSection[]> = {
  SUPER_ADMIN: [
    { section: "Overview", items: [{ label: "Dashboard", href: "/super-admin", icon: "⊞" }] },
    { section: "System", items: [
      { label: "Tenants", href: "/super-admin/tenants", icon: "🏫" },
      { label: "RBAC & Roles", href: "/super-admin/rbac", icon: "🔐" },
      { label: "Gateways", href: "/super-admin/gateways", icon: "📡" },
      { label: "Audit Logs", href: "/super-admin/audit", icon: "📋" },
      { label: "Backups", href: "/super-admin/backups", icon: "💾" },
    ]},
  ],
  ADMIN: [
    { section: "Overview", items: [{ label: "Dashboard", href: "/admin", icon: "⊞" }] },
    { section: "Academic", items: [
      { label: "Admissions", href: "/admin/admissions", icon: "📝" },
      { label: "Classes & Sections", href: "/admin/sections", icon: "🏛️" },
      { label: "Subjects", href: "/admin/subjects", icon: "📚" },
      { label: "Timetable", href: "/admin/timetable", icon: "🗓️" },
      { label: "Class Assignment", href: "/admin/assignments", icon: "🤝" },
      { label: "Results", href: "/admin/results", icon: "📄" },
    ]},
    { section: "People", items: [
      { label: "Students", href: "/admin/students", icon: "🎓" },
      { label: "Staff", href: "/admin/staff", icon: "👥" },
    ]},
    { section: "Finance", items: [
      { label: "Fee Management", href: "/admin/fees", icon: "💳" },
      { label: "Salary Management", href: "/admin/salary", icon: "💰" },
    ]},
    { section: "Communication", items: [
      { label: "Announcements", href: "/admin/announcements", icon: "📢" },
      { label: "Calendar", href: "/admin/calendar", icon: "📅" },
    ]},
  ],
  TEACHER: [
    { section: "Overview", items: [{ label: "Dashboard", href: "/teacher", icon: "⊞" }] },
    { section: "Teaching", items: [
      { label: "Timetable", href: "/teacher/timetable", icon: "🗓️" },
      { label: "My Classes", href: "/teacher/classes", icon: "🏛️" },
      { label: "Attendance", href: "/teacher/attendance", icon: "✅" },
      { label: "Gradebook", href: "/teacher/gradebook", icon: "📊" },
      { label: "Assignments", href: "/teacher/assignments", icon: "📝" },
      { label: "LMS Content", href: "/teacher/lms", icon: "🎬" },
    ]},
    { section: "Communication", items: [
      { label: "Announcements", href: "/teacher/announcements", icon: "📢" },
      { label: "Calendar", href: "/teacher/calendar", icon: "📅" },
      { label: "Messages", href: "/teacher/messages", icon: "💬" },
    ]},
  ],
  STUDENT: [
    { section: "Overview", items: [{ label: "Dashboard", href: "/student", icon: "⊞" }] },
    { section: "Academics", items: [
      { label: "Timetable", href: "/student/timetable", icon: "🗓️" },
      { label: "My Courses", href: "/student/courses", icon: "📚" },
      { label: "Attendance", href: "/student/attendance", icon: "✅" },
      { label: "Grades", href: "/student/grades", icon: "📊" },
      { label: "Assignments", href: "/student/assignments", icon: "📝" },
      { label: "Results", href: "/student/results", icon: "📄" },
    ]},
    { section: "More", items: [
      { label: "Announcements", href: "/student/announcements", icon: "📢" },
      { label: "Calendar", href: "/student/calendar", icon: "📅" },
      { label: "Achievements", href: "/student/achievements", icon: "🏆" },
      { label: "Library", href: "/student/library", icon: "📖" },
      { label: "Messages", href: "/student/messages", icon: "💬" },
    ]},
  ],
  PARENT: [
    { section: "Overview", items: [{ label: "Dashboard", href: "/parent", icon: "⊞" }] },
    { section: "My Child", items: [
      { label: "Attendance", href: "/parent/attendance", icon: "✅" },
      { label: "Grades", href: "/parent/grades", icon: "📊" },
      { label: "Fee Payments", href: "/parent/fees", icon: "💳" },
      { label: "Transport", href: "/parent/transport", icon: "🚌" },
    ]},
    { section: "Communication", items: [
      { label: "Announcements", href: "/parent/announcements", icon: "📢" },
      { label: "Messages", href: "/parent/messages", icon: "💬" },
    ]},
  ],
  ACCOUNTANT: [
    { section: "Overview", items: [{ label: "Dashboard", href: "/accountant", icon: "⊞" }] },
    { section: "Finance", items: [
      { label: "Fee Structures", href: "/accountant/fee-structures", icon: "📋" },
      { label: "Student Fees", href: "/admin/fees", icon: "💳" },
      { label: "Salary", href: "/admin/salary", icon: "💰" },
      { label: "Payments", href: "/accountant/payments", icon: "💳" },
      { label: "Concessions", href: "/accountant/concessions", icon: "🏷️" },
      { label: "Reports", href: "/accountant/reports", icon: "📊" },
    ]},
    { section: "Communication", items: [
      { label: "Announcements", href: "/accountant/announcements", icon: "📢" },
    ]},
  ],
  LIBRARIAN: [
    { section: "Overview", items: [{ label: "Dashboard", href: "/librarian", icon: "⊞" }] },
    { section: "Library", items: [
      { label: "Book Catalog", href: "/librarian/books", icon: "📚" },
      { label: "Issue / Return", href: "/librarian/issues", icon: "🔄" },
      { label: "Fines", href: "/librarian/fines", icon: "💸" },
      { label: "Members", href: "/librarian/members", icon: "🎫" },
    ]},
  ],
  HOSTEL_WARDEN: [
    { section: "Overview", items: [{ label: "Dashboard", href: "/hostel", icon: "⊞" }] },
    { section: "Hostel", items: [
      { label: "Room Allocation", href: "/hostel/rooms", icon: "🏠" },
      { label: "Check In/Out", href: "/hostel/checkin", icon: "🔑" },
      { label: "Mess", href: "/hostel/mess", icon: "🍽️" },
    ]},
  ],
  RECEPTIONIST: [
    { section: "Overview", items: [{ label: "Dashboard", href: "/receptionist", icon: "⊞" }] },
    { section: "Front Desk", items: [
      { label: "Visitors", href: "/receptionist/visitors", icon: "👋" },
      { label: "Inquiries", href: "/receptionist/inquiries", icon: "❓" },
    ]},
  ],
  STORE_MANAGER: [
    { section: "Overview", items: [{ label: "Dashboard", href: "/store", icon: "⊞" }] },
    { section: "Inventory", items: [
      { label: "Items", href: "/store/items", icon: "📦" },
      { label: "Purchase Orders", href: "/store/orders", icon: "🛒" },
      { label: "Low Stock Alerts", href: "/store/alerts", icon: "⚠️" },
    ]},
  ],
};

interface SidebarProps {
  role: string;
  userName: string;
  userEmail: string;
  avatarInitials: string;
  tenantName: string;
}

export default function Sidebar({ role, userName, userEmail, avatarInitials, tenantName }: SidebarProps) {
  const pathname = usePathname();
  const sections = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.STUDENT;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.1rem", flexShrink: 0,
        }}>🎓</div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem", color: "white" }}>EduERP</div>
          <div style={{ fontSize: "0.68rem", color: "hsl(0 0% 100% / 0.4)", marginTop: "0.1rem" }}>{tenantName}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sections.map((sec) => (
          <div key={sec.section}>
            <div className="nav-section-label">{sec.section}</div>
            {sec.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "active" : ""}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div style={{
        padding: "1rem 1.25rem",
        borderTop: "1px solid hsl(0 0% 100% / 0.08)",
        display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        <div className="avatar" style={{ width: 38, height: 38, fontSize: "0.875rem" }}>
          {avatarInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {userName}
          </div>
          <div style={{ fontSize: "0.7rem", color: "hsl(0 0% 100% / 0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {userEmail}
          </div>
        </div>
        <LogoutButton
          style={{ color: "hsl(0 0% 100% / 0.4)", fontSize: "1rem", flexShrink: 0 }}
        />
      </div>
    </aside>
  );
}
