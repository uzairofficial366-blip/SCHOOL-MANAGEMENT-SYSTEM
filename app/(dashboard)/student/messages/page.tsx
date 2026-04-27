import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import MessagesClient from "./MessagesClient";

export const metadata = { title: "My Messages" };

export default async function StudentMessagesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as any).id;

  return (
    <>
      <Topbar 
        title="Messages" 
        breadcrumbs={[{ label: "Home" }, { label: "Student", href: "/student" }, { label: "Messages" }]} 
      />
      <div className="page-body fade-up">
        <MessagesClient currentUserId={userId} />
      </div>
    </>
  );
}
