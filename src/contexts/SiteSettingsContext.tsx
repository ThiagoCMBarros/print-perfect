import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  branding: {
    site_name: string;
    tagline: string;
    logo_url: string;
    logo_url_dark: string;
    favicon_url: string;
    primary_color: string;
    primary_foreground: string;
  };
  company: {
    trade_name: string;
    legal_name: string;
    cnpj: string;
    ie: string;
    address: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    whatsapp_message: string;
    email: string;
    business_hours: string;
  };
  social: { instagram: string; facebook: string; linkedin: string };
  seo: { meta_title: string; meta_description: string };
};

const DEFAULTS: SiteSettings = {
  branding: {
    site_name: "GráficaPro",
    tagline: "Impressão online rápida e de alta qualidade",
    logo_url: "",
    logo_url_dark: "",
    favicon_url: "",
    primary_color: "#2563eb",
    primary_foreground: "#ffffff",
  },
  company: { trade_name: "GráficaPro", legal_name: "GráficaPro Ltda", cnpj: "", ie: "", address: "" },
  contact: {
    phone: "(11) 4000-0000",
    whatsapp: "5511976905156",
    whatsapp_message: "Olá! Gostaria de mais informações.",
    email: "contato@graficapro.com.br",
    business_hours: "Seg a Sex, 9h às 18h",
  },
  social: { instagram: "", facebook: "", linkedin: "" },
  seo: {
    meta_title: "GráficaPro — Impressão online rápida e de alta qualidade",
    meta_description: "Cartões, banners, adesivos e muito mais com qualidade profissional.",
  },
};

const Ctx = createContext<{ settings: SiteSettings; loading: boolean; refresh: () => Promise<void> }>({
  settings: DEFAULTS,
  loading: true,
  refresh: async () => {},
});

// Converte hex (#rrggbb) → "r g b" para usar com color-mix/var()
function hexToRgb(hex: string): string | null {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("integration_settings")
      .select("category,key,value")
      .in("category", ["branding", "company", "contact", "social", "seo"]);

    if (data) {
      const next: SiteSettings = JSON.parse(JSON.stringify(DEFAULTS));
      for (const r of data) {
        const cat = r.category as keyof SiteSettings;
        if (next[cat] && r.key in next[cat]) {
          (next[cat] as Record<string, unknown>)[r.key] =
            typeof r.value === "string" ? r.value : (r.value as unknown);
        }
      }
      setSettings(next);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Aplica cor primária + favicon dinamicamente
  useEffect(() => {
    if (typeof document === "undefined") return;
    const rgb = hexToRgb(settings.branding.primary_color);
    if (rgb) {
      const root = document.documentElement;
      // Sobrescreve o token --brand do design-system
      root.style.setProperty("--brand", `rgb(${rgb})`);
      root.style.setProperty("--primary", `rgb(${rgb})`);
      const fgRgb = hexToRgb(settings.branding.primary_foreground);
      if (fgRgb) {
        root.style.setProperty("--brand-foreground", `rgb(${fgRgb})`);
        root.style.setProperty("--primary-foreground", `rgb(${fgRgb})`);
      }
    }
    if (settings.branding.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.branding.favicon_url;
    }
  }, [settings.branding.primary_color, settings.branding.primary_foreground, settings.branding.favicon_url]);

  const value = useMemo(() => ({ settings, loading, refresh: load }), [settings, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteSettings() {
  return useContext(Ctx);
}
