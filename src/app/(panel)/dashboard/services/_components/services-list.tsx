"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react"
import { DialogService } from "./dialog-service";
import { Service } from "@/generated/prisma";
import { formatCurrency } from "@/utils/formatCurrency";


  interface ServiceListProps{
    services: Service[]

  }

export function ServicesList({services}: ServiceListProps) {

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
              <DialogService closeModal={() => {
                setIsDialogOpen(false)
              }} /> 
            </DialogContent>
          </CardHeader>

          <CardContent >
            <div className="space-y-4 mt-5">
              {services.map((service) => (
                <article key={service.id} className="flex justify-between items-center">
                  <div className="flex space-x-2 items-center">
                    <span className="font-medium">{service.name}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-gray-500">{formatCurrency((service.price / 100))}</span>

                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="icon" onClick={() => {}}>
                      <Pencil className="w-4 h-4"/>
                    </Button>
                    <Button className="bg-red-500 hover:bg-red-400" variant="ghost" size="icon" onClick={() => {}}>
                      <X className="w-4 h-4"/>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </CardContent>


        </Card>
      </section>
    </Dialog>
  )
}
