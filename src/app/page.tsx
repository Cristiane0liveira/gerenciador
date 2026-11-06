import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const user = await getSession();
  if (!user) redirect("/login");
  return <Dashboard initialUser={user} />;
}
