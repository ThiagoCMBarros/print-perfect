import { Printer } from "lucide-react";

type Props = {
  label?: string;
  fullscreen?: boolean;
};

export function PageLoader({ label = "CARREGANDO", fullscreen = false }: Props) {
  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          : "flex w-full items-center justify-center py-20"
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <span
            className="grid h-16 w-16 place-items-center rounded-2xl text-brand-foreground shadow-soft animate-pulse"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            <Printer className="h-8 w-8" />
          </span>
          <span className="absolute -inset-1 rounded-2xl border-2 border-brand/40 border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-display text-base font-bold tracking-[0.2em] text-foreground">
            {label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Aguarde um instante…</p>
        </div>
      </div>
    </div>
  );
}
