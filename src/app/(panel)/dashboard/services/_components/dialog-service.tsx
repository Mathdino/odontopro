"use client"

import { useState } from "react"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDialogServiceForm, DialogServiceFormData } from "./service-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import React from "react"
import { convertRealToCents } from "@/utils/convertCurrency"
import { createService } from "../_actions/create-service"
import { toast } from "sonner"


interface DialogServiceProps{
  closeModal: () => void
}

export function DialogService({closeModal}: DialogServiceProps) { 


  const form = useDialogServiceForm()
  const [loading, setLoading] = useState(false);

  async function onSubmit(values: DialogServiceFormData) {
   setLoading(true);
   const priceInCents = convertRealToCents(values.price)
   const hours = parseInt(values.hours) || 0;
   const minutes = parseInt(values.minutes) || 0;

   const duration = (hours * 60) + minutes;

   const response = await createService({
    name: values.name,
    price: priceInCents,
    duration: duration
   })

   setLoading(false);

   if(response.error){
    toast.error(response.error)
    return;
   }

   toast.success("Serviço cadastrado com sucesso")
   handleCloseModal();

  }

  function handleCloseModal(){
    form.reset();
    closeModal();
  }


  function changeCurrency(event: React.ChangeEvent<HTMLInputElement>) {
    let { value } = event.target
    value = value.replace(/\D/g, "")

    if(value){
      value = (parseInt(value, 10) / 100).toFixed(2)
      value = value.replace('.', ",")
      value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      value = `R$ ${value}`

    }

    event.target.value = value
    form.setValue("price", value)
  }



  return(
    <>
    <DialogHeader>
      <DialogTitle>Novo Serviço</DialogTitle>
      <DialogDescription>Adicione um novo serviço</DialogDescription>
    </DialogHeader>

    <Form {...form}>
      <form className="space-y-2" onSubmit={form.handleSubmit(onSubmit)}>

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
                  <Input {...field} onChange={changeCurrency} placeholder="Ex: 100,00"/>
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
        className="w-full font-semibold text-white bg-emerald-500 hover:bg-emerald-400" disabled={loading}>
          {loading ? "Cadastrando..." : "Adicionar Serviço"}
        </Button>
        
      </form>
    </Form>
    </>
  )
}

