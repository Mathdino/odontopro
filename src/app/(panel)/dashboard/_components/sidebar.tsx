"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { clsx } from "clsx";


export function SidebarDashboard({ children }: { children: React.ReactNode }) {

  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);





  return (
    <div className="flex min-h-screen w-full">
      
      <div className={}>

      </div>

    </div>
  )
}