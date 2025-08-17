"use client"

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react"
import { DialogService } from "./dialog-service";
export function ServicesList() {

  const [isDialogOpen, setIsDialogOpen] = useState(false);


  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <section className="mx-auto">

        <Card>
          <CardHeader className="flex justify-between items-center space-y-0 pb-2">

            <CardTitle className="text-xl md:text-2xl font-bold">Serviços</CardTitle>

            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4"/></Button>
            </DialogTrigger>

            <DialogContent>
              <DialogService /> 

            </DialogContent>
          </CardHeader>
        </Card>
      </section>
    </Dialog>
  )
}
