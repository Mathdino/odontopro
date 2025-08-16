"use client"
import { useState } from "react";
import { ProfileFormData, useProfileForm } from "./profile-form"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import imgTeste from "../../../../../../public/foto1.png"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { string } from "zod";
import { cn } from "@/lib/utils";
import { Prisma } from "@/generated/prisma";
import { updateProfile } from "../_actions/update-profile";
import { toast } from "sonner";
import { formatPhone } from "@/utils/formatPhone";





type UserWithSubscription = Prisma.UserGetPayload<{
   include: {
    subscription: true
  }
}>
interface ProfileContentProps {
  user: UserWithSubscription;
}

export function ProfileContent({ user }: ProfileContentProps){
  const [selectedHours, setSelectedHours] = useState<string[]>(user.times ?? []);
  const [dialogIsOpen, setDialogIsOpen] = useState(false);


  const form = useProfileForm({
    name: user.name,
    address: user.address,
    phone: user.phone,
    status: user.status,
    timeZone: user.timezone,
  });

  function generateTimeSlots(): string[] {
    const hours : string[] = [];

    for(let i = 6; i <= 24; i++){
      for (let m = 0; m < 2; m++){
        const hour = i.toString().padStart(2, "0")
        const minute = (m * 30).toString().padStart(2, "0")
        hours.push(`${hour}:${minute}`)
      }
    }
    return hours;
  }

  const hours = generateTimeSlots();

  function toggleHour (hour : string){
    setSelectedHours((prev) => prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour].sort())
  }

  const timeZones = Intl.supportedValuesOf("timeZone").filter((zone) =>
    zone.startsWith("America/Sao_Paulo") ||
    zone.startsWith("America/Fortaleza") ||
    zone.startsWith("America/Recife") ||
    zone.startsWith("America/Bahia") ||
    zone.startsWith("America/Belem") ||
    zone.startsWith("America/Manaus") ||
    zone.startsWith("America/Cuiaba") ||
    zone.startsWith("America/Boa_Vista") 
  );

  async function onSubmit(values :ProfileFormData) {

    const response = await updateProfile({
      name: values.name,
      address: values.address,
      phone: values.phone,
      status: values.status === 'active' ? true : false,
      timeZone: values.timeZone,
      times: selectedHours || [], 
    })

    if(response.error){
      toast.error(response.error)

      return
    }

    toast.success(response.data)
  }


  return(
    <div className="mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className="flex justify-center">
                <div className="bg-gray-200 relative h-40 w-40 rounded-full overflow-hidden">
                  <Image 
                  src={user.image ? user.image : imgTeste}
                  alt="Foto da clinica"
                  fill
                  className="object-cover"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Digite o nome da clinica..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Endereço Completo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Digite o endereço da clinica..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(xx) xxxxx-xxxx" onChange={(e) => field.onChange(formatPhone(e.target.value))} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />

                <FormField 
                control={form.control} 
                name="status" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Status da clinica
                    </FormLabel>
                    <FormControl>

                      <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value ? "active" : "inactive"}
                      >
                        <SelectTrigger className="w-full">

                          <SelectValue placeholder="Selecione o status da clinica"/>
                        </SelectTrigger>
                        <SelectContent >
                          <SelectItem value="active">ATIVO (clinica aberta)</SelectItem>
                          <SelectItem value="inactive">INATIVO (clinica fechada)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
                />

                <div className="space-y-2">
                  <Label className="font-semibold">
                    Configurar Horários da Clinica
                  </Label>

                  <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        Clique aqui para selecionar Horários
                        <ArrowRight />
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Horários da Clincia</DialogTitle>
                        <DialogDescription>
                          Selecione abaixo os horários de funcionamento da clincia:
                        </DialogDescription>
                      </DialogHeader>

                      <section className="py-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Clique nos horários abaixo para marcar ou desmarcar:
                        </p>

                        <div className="grid grid-cols-5 gap-2">
                          {hours.map((hour) =>(
                            <Button 
                            key={hour} 
                            variant="outline" 
                            className={cn('h-10', selectedHours.includes(hour) && 'border-2 border-emerald-500 text-primary bg-emerald-200')}
                            onClick={() => toggleHour(hour)}> 
                              {hour}
                            </Button>
                          ))}
                        </div>
                      </section>

                      <Button 
                      className="w-full bg-emerald-500" 
                      onClick={() => setDialogIsOpen(false)}
                      >
                        Salvar Horários
                      </Button>

                    </DialogContent>
                  </Dialog>
                </div>

                <FormField control={form.control} name="timeZone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Selecione o fuso horário</FormLabel>
                    <FormControl>

                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione seu fuso horário"/>
                        </SelectTrigger>
                        <SelectContent>
                          {timeZones.map((zone) => (
                            <SelectItem key={zone} value={zone}>
                              {zone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
                />

                <Button 
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400"
                >
                  Salvar Alterações
                </Button>

              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}