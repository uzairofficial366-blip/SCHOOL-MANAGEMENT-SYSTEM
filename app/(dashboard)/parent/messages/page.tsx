import Topbar from "@/components/layout/Topbar";
import ParentModuleClient from "@/components/parent/ParentModuleClient";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function ParentMessagesPage() {
  const session = await auth();
  if (!session || session.user?.role !== "PARENT") redirect("/login");

  return (
    <>
      <Topbar title="Messages" breadcrumbs={[{ label: "Home" }, { label: "Parent", href: "/parent" }, { label: "Messages" }]} />
      <div className="page-body fade-up">
        <ParentModuleClient endpoint="/api/parent/messages" type="messages" />
      </div>
    </>
  );
}
