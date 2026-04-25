import { MessageCircle } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export function WhatsAppFloat() {
  const location = useLocation();
  const { settings } = useSiteSettings();
  if (location.pathname.startsWith("/admin")) return null;
  const number = settings.contact.whatsapp?.replace(/\D/g, "");
  if (!number) return null;
  const message = settings.contact.whatsapp_message || "Olá!";
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 hover:bg-[#1ebe57] hover:shadow-xl sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-30" />
      <MessageCircle className="relative h-7 w-7 sm:h-8 sm:w-8" fill="currentColor" strokeWidth={0} />
      <span className="sr-only">Falar no WhatsApp</span>
    </a>
  );
}
