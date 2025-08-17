"use client"

import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDialogServiceForm } from "./service-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function DialogService() { 


  const form = useDialogServiceForm()

  return(
    <>
    <DialogHeader>
      <DialogTitle>Novo Serviço</DialogTitle>
      <DialogDescription>Adicione um novo serviço</DialogDescription>
    </DialogHeader>

    <Form {...form}>
      <form className="space-y-2">
        <div className="flex flex-col">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem  className="my-2">
                <FormLabel className="font-semibold">Nome do serviço</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Digite o nome do serviço..."/>

                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="my-2">
                <FormLabel className="font-semibold">Valor do serviço</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: 100,00"/>

                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="font-semibold">Tempo de duração do serviço</p>
        <div className="grid grid-cols-2 gap-3">

          <FormField
            control={form.control}
            name="hours"
            render={({ field }) => (
              <FormItem className="my-2">
                <FormLabel className="font-semibold">Horas</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: 1" min="0" max="24" type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minutes"
            render={({ field }) => (
              <FormItem className="my-2">
                <FormLabel className="font-semibold">Minutos</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: 20" min="0" max="59" type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
        type="submit" 
        className="w-full font-semibold text-white bg-emerald-500 hover:bg-emerald-400">
          Adicionar Serviço
        </Button>





      </form>
    </Form>
    </>
  )
}

