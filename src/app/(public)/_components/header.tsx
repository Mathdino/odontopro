"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CircleUser, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { handleRegister } from "../_actions/login";

export function Header() {
  const { data: session, status } = useSession();

  //QUANDO CLICAR NO LINK DO MENU MOBILE ELE FECHA AUTOMATICAMENTE
  const [isOpen, setIsOpen] = useState(false);

  

  //ARRAY DE LISTAS DO MENU
  const navItems = [
    { href: "#profissionais", label: "Profissionais" },
    // {href: "/contatos", label:"Contatos"}
  ];

  async function handleLogin() {
    await handleRegister("github");
  }

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Button
          onClick={() => setIsOpen(false)}
          key={item.href}
          asChild
          className="bg-transparent hover:bg-transparent text-black shadow-none"
        >
          <Link href={item.href} className="text-base">
            {item.label}
          </Link>
        </Button>
      ))}

      {status === "loading" ? (
        <></>
      ) : session ? (
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white py-1 rounded-md px-4"
        >
          Acessar Clinica
        </Link>
      ) : (
        <Button onClick={handleLogin}>
          <CircleUser />
          Portal da Clinica
        </Button>
      )}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-[999] py-4 px-6 bg-white shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold text-zinc-900">
          Odonto<span className="text-emerald-500">PRO</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-4">
          <NavLinks />
        </nav>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button
              className="text-black hover:text-emerald-500"
              variant={"ghost"}
              size={"icon"}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[240px] sm:w-[300px] z-[9999] px-4"
          >
            <SheetHeader></SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Veja nossos Links</SheetDescription>
            <nav className="flex flex-col space-y-4 mt-6">
              <NavLinks />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
