"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import prisma from "@/lib/prisma";
import { Reminder } from "@prisma/client";
import { Plus, Trash } from "lucide-react";
import { deleteReminder } from "../../_actions/delete-reminder";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReminderContent } from "./reminder-content";
import { useState } from "react";

interface ReminderListProps {
  reminder: Reminder[];
}

export function ReminderList({ reminder }: ReminderListProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  async function handleDeleteReminder(id: string) {
    const response = await deleteReminder({
      reminderId: id,
    });
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success("Lembrete deletado com sucesso");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl md:text-2xl font-bold">
            Lembretes
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-9 p-0">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Novo Lembrete</DialogTitle>
                <DialogDescription>
                  Crie um novo lembrete para sua lista
                </DialogDescription>
              </DialogHeader>
              <ReminderContent closeDialog={() => setIsOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {reminder.length === 0 && (
            <p className="text-center text-sm text-gray-500">
              Nenhum lembrete encontrado
            </p>
          )}
          <ScrollArea className="h-[340px] lg:max-h-[cal(100vh-15rem)] pr-0 w-full flex-1">
            {reminder.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap flex-row items-center justify-between py-2 bg-yellow-100 mb-2 px-2 rounded-md"
              >
                <p className="text-sm lg:text-base">{item.description}</p>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-400 shadow-none rounded-full p-2"
                  onClick={() => handleDeleteReminder(item.id)}
                >
                  <Trash className="w-4 h-4 text-white" />
                </Button>
              </article>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
