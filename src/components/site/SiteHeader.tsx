import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, User, Menu, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { to: "/produtos", label: "Produtos" },
  { to: "/orcamento", label: "Orçamento" },
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/contato", label: "Contato" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span
            className="grid h-9 w-9 place-items-center rounded-lg text-brand-foreground shadow-soft"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            <Printer className="h-5 w-5" />
          </span>
          <span>
            Gráfica<span className="text-brand">Pro</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-brand bg-brand-soft" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden flex-1 max-w-sm md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              className="h-10 rounded-full bg-surface-muted pl-9 border-transparent focus-visible:bg-background"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link to="/login">
              <User className="mr-1.5 h-4 w-4" /> Entrar
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative" aria-label="Carrinho">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">
              0
            </span>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
                >
                  Entrar / Cadastrar
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
