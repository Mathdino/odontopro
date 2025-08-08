import getSession from "@/lib/getSession";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div>
      <h1>Welcome to the Page Dashboard</h1>
    </div>
  );
}
