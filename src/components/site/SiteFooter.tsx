import { Link } from "@tanstack/react-router";
import { Printer, Instagram, Facebook, Linkedin, Mail, Phone } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export function SiteFooter() {
  const { settings } = useSiteSettings();
  const { branding, company, contact, social } = settings;
  const socials = [
    { url: social.instagram, Icon: Instagram, label: "Instagram" },
    { url: social.facebook, Icon: Facebook, label: "Facebook" },
    { url: social.linkedin, Icon: Linkedin, label: "LinkedIn" },
  ].filter((s) => s.url);

  return (
    <footer className="mt-24 border-t bg-surface-muted">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.site_name} className="h-9 w-auto object-contain" />
            ) : (
              <>
                <span className="grid h-9 w-9 place-items-center rounded-lg text-brand-foreground" style={{ backgroundImage: "var(--gradient-brand)" }}>
                  <Printer className="h-5 w-5" />
                </span>
                {branding.site_name}
              </>
            )}
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">{branding.tagline}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(({ url, Icon, label }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold">Produtos</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/produtos" className="hover:text-brand">Cartões de visita</Link></li>
            <li><Link to="/produtos" className="hover:text-brand">Panfletos e flyers</Link></li>
            <li><Link to="/produtos" className="hover:text-brand">Banners e faixas</Link></li>
            <li><Link to="/produtos" className="hover:text-brand">Adesivos e etiquetas</Link></li>
            <li><Link to="/produtos" className="hover:text-brand">Convites</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Institucional</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/como-funciona" className="hover:text-brand">Como funciona</Link></li>
            <li><Link to="/sobre" className="hover:text-brand">Sobre nós</Link></li>
            <li><Link to="/faq" className="hover:text-brand">Perguntas frequentes</Link></li>
            <li><Link to="/orcamento" className="hover:text-brand">Orçamento sob medida</Link></li>
            <li><Link to="/contato" className="hover:text-brand">Contato</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Contato</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {contact.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand" /><span>{contact.phone}</span></li>}
            {contact.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand" /><span>{contact.email}</span></li>}
            {contact.business_hours && <li className="text-xs">{contact.business_hours}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {company.legal_name || branding.site_name}. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/privacidade" className="hover:text-brand">Privacidade</Link>
            <Link to="/termos" className="hover:text-brand">Termos</Link>
            {company.cnpj && <span>CNPJ {company.cnpj}</span>}
          </div>
        </div>
      </div>
    </footer>
  );
}
