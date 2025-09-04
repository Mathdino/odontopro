"use client"

import { Button } from "@/components/ui/button"
import { LinkIcon } from "lucide-react"
import { toast } from "sonner"



export function ButtonCopyLink({ useId }: { useId: string }) {

  async function handleCopyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/clinica/${useId}`)
    toast.success("Link de agendamento copiado com sucesso!")
  }



  return (
    <Button onClick={handleCopyLink}>
      <LinkIcon className="w-5 h-5" />
    </Button>
  )
}