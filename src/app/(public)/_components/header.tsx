import { Button } from "@/components/ui/button";
import { SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sheet } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[999] py-4 px-6 bg-white shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link 
        href="/" 
        className="text-3xl font-bold text-zinc-900">

        Odonto<span className="text-emerald-500">PRO</span>
        </Link>

        <nav className="hidden md:flex items-center"> 
          <a href="">Profissionais</a>
        </nav>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button className="text-black hover:text-emerald-500" variant={"ghost"} size={"icon"}>
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[240px] sm:w-[300px] z-[9999]">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Veja nossos Links</SheetDescription>
            <nav>
              <a href="">Profissionais</a>
            </nav>

          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}