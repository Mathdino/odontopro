import { getTimes } from "../../_data-access/get-times";
import { AppointentsList } from "./appointents-list";

export async function Appointents({ userId }: { userId: string }) {
  const { times } = await getTimes({ userId });
  return <AppointentsList times={times} />;
}
