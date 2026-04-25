import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// DEPLOY_TARGET controla qual configuração é aplicada:
// - "lovable" (ou ausente): usa a configuração padrão da Lovable (preview funciona normalmente)
// - "vps": aplica overrides de host/porta necessários para rodar atrás do nginx na VPS
//
// Na VPS, defina no ambiente (docker-compose / Dockerfile):
//   DEPLOY_TARGET=vps
// Na Lovable, NÃO defina essa variável — assim o preview continua funcionando.
const deployTarget = process.env.DEPLOY_TARGET ?? "lovable";

export default deployTarget === "vps"
  ? defineConfig({
      server: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,
        allowedHosts: true,
      },
      preview: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,
        allowedHosts: true,
      },
    })
  : defineConfig();
