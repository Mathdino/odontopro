"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Banknote,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  List,
  Settings,
  Folder,
  ChartNoAxesCombined,
  Menu,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LogoImg from "../../../../../public/logo-odonto.png";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

export function SidebarDashboard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleSheetClose = () => {
    setIsSheetOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full">
      <aside
        className={clsx(
          "flex flex-col border-r bg-background transition-all duration-300 p-4 h-full",
          {
            "w-20": isCollapsed,
            "w-64": !isCollapsed,
            "hidden md:flex md:fixed": true,
          }
        )}
      >
        <div className="mb-6 mt-4">
          {!isCollapsed && (
            <Image
              src={LogoImg}
              alt="Logo do OdontoPRO"
              priority
              quality={100}
            />
          )}
        </div>

        <Button
          className="bg-gray-100 hover:bg-gray-50 text-zinc-900 self-end mb-2"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {!isCollapsed ? (
            <ChevronLeft className="w-12 h-12" />
          ) : (
            <ChevronRight className="w-12 h-12" />
          )}
        </Button>

        {/*EXIBE SOMENTE OS ICONES QUANDO A SIDEBAR ESTIVER FECHADA */}
        {isCollapsed && (
          <nav className="flex flex-col gap-1 overflow-hidden mt-2">
            <SidebarLink
              href="/dashboard"
              label="Agendamentos"
              pathname={pathname}
              isCollapsed={isCollapsed}
              icon={<CalendarCheck className="w-6 h-6" />}
            />
            <SidebarLink
              href="/dashboard/services"
              label="Serviços"
              pathname={pathname}
              isCollapsed={isCollapsed}
              icon={<Folder className="w-6 h-6" />}
            />
            <SidebarLink
              href="/dashboard/financeiro"
              label="Financeiro"
              pathname={pathname}
              isCollapsed={isCollapsed}
              icon={<ChartNoAxesCombined className="w-6 h-6" />}
            />
            <SidebarLink
              href="/dashboard/profile"
              label="Configurações"
              pathname={pathname}
              isCollapsed={isCollapsed}
              icon={<Settings className="w-6 h-6" />}
            />
            <SidebarLink
              href="/dashboard/plans"
              label="Planos"
              pathname={pathname}
              isCollapsed={isCollapsed}
              icon={<Banknote className="w-6 h-6" />}
            />
          </nav>
        )}

        {/* SIDEBAR ABERTA */}
        <Collapsible open={!isCollapsed}>
          <CollapsibleContent>
            <nav className="flex flex-col gap-1 overflow-hidden">
              <span className="text-sm text-gray-400 font-medium mt-1 uppercase">
                Painel
              </span>
              <SidebarLink
                href="/dashboard"
                label="Agendamentos"
                pathname={pathname}
                isCollapsed={isCollapsed}
                icon={<CalendarCheck className="w-6 h-6" />}
              />
              <SidebarLink
                href="/dashboard/services"
                label="Serviços"
                pathname={pathname}
                isCollapsed={isCollapsed}
                icon={<Folder className="w-6 h-6" />}
              />
              <SidebarLink
                href="/dashboard/financeiro"
                label="Financeiro"
                pathname={pathname}
                isCollapsed={isCollapsed}
                icon={<ChartNoAxesCombined className="w-6 h-6" />}
              />
              <span className="text-sm text-gray-400 font-medium mt-1 uppercase">
                Minha Conta
              </span>
              <SidebarLink
                href="/dashboard/profile"
                label="Configurações"
                pathname={pathname}
                isCollapsed={isCollapsed}
                icon={<Settings className="w-6 h-6" />}
              />
              <SidebarLink
                href="/dashboard/plans"
                label="Planos"
                pathname={pathname}
                isCollapsed={isCollapsed}
                icon={<Banknote className="w-6 h-6" />}
              />
            </nav>
          </CollapsibleContent>
        </Collapsible>
      </aside>

      <div
        className={clsx("flex flex-1 flex-col transition-all duration-300", {
          "md:ml-20": isCollapsed,
          "md:ml-64": !isCollapsed,
        })}
      >
        <header className="md:hidden flex items-center justify-between border-b px-2 md:px-6 h-14 z-10 sticky top-0 bg-white">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <div className="flex items-center gap-4">
              <SheetTrigger>
                <Button
                  variant="outline"
                  asChild
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsCollapsed(false)}
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>

              <h1 className="text-base md:text-lg font-semibold">
                Menu OdontoPRO
              </h1>
            </div>

            <SheetContent
              side="right"
              className="sm:max-w-xs text-black px-4 pt-5"
            >
              <SheetTitle>OdontoPRO</SheetTitle>
              <SheetDescription>Menu Administrativo</SheetDescription>

              <nav className="grid gap-2 text-base pt-5">
                <SidebarLink
                  href="/dashboard"
                  label="Agendamentos"
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                  icon={<CalendarCheck className="w-6 h-6" />}
                  onClose={handleSheetClose}
                />
                <SidebarLink
                  href="/dashboard/services"
                  label="Serviços"
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                  icon={<Folder className="w-6 h-6" />}
                  onClose={handleSheetClose}
                />
                <SidebarLink
                  href="/dashboard/financeiro"
                  label="Financeiro"
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                  icon={<ChartNoAxesCombined className="w-6 h-6" />}
                  onClose={handleSheetClose}
                />

                <SidebarLink
                  href="/dashboard/profile"
                  label="Configurações"
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                  icon={<Settings className="w-6 h-6" />}
                  onClose={handleSheetClose}
                />
                <SidebarLink
                  href="/dashboard/plans"
                  label="Planos"
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                  icon={<Banknote className="w-6 h-6" />}
                  onClose={handleSheetClose}
                />
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 py-4 px-2 md:p-6">{children}</main>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
  isCollapsed: boolean;
  onClose?: () => void;
}

function SidebarLink({
  href,
  icon,
  label,
  pathname,
  isCollapsed,
  onClose,
}: SidebarLinkProps) {
  const handleClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Link href={href} onClick={handleClick}>
      <div
        className={clsx(
          "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
          {
            "bg-blue-500 text-white": pathname === href,
            "hover:bg-gray-100 text-gray-700": pathname !== href,
          }
        )}
      >
        <span className="w-6 h-6">{icon}</span>
        {!isCollapsed && <span>{label}</span>}
      </div>
    </Link>
  );
}
