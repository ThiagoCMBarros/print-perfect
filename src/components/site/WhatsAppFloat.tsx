import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511976905156";
const DEFAULT_MESSAGE = "Olá! Gostaria de mais informações.";

export function WhatsAppFloat() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

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
