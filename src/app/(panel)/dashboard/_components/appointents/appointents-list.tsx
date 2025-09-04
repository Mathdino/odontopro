"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface AppointentsListProps {
  times: string[];
}

export function AppointentsList({ times }: AppointentsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date");

  return (
    <div>
      <h1>LIstagem de horários</h1>
    </div>
  );
}
