import getSession from "@/lib/getSession";
import { redirect } from "next/navigation";
import PagamentosContent from "./_components/pagamentos-content";

export default async function Pagamentos() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return <PagamentosContent userId={session.user.id!} />;
}