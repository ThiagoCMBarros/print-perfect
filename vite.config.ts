import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    preview: {
      allowedHosts: [
        "graficarelli.com.br",
        "www.graficarelli.com.br",
        "localhost",
        "127.0.0.1"
      ],
      host: "0.0.0.0",
      port: 3000
    },
    server: {
      allowedHosts: [
        "graficarelli.com.br",
        "www.graficarelli.com.br",
        "localhost",
        "127.0.0.1"
      ]
    }
  }
});
