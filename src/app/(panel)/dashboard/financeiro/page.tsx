import getSession from "@/lib/getSession";
import { redirect } from "next/navigation";
import FinanceiroContent from "./_components/financeiro-content";

export default async function Financeiro() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return <FinanceiroContent userId={session.user.id!} />;
}
