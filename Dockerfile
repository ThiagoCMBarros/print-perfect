# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install bun (mais rápido que npm) — opcional, pode usar npm também
RUN apk add --no-cache bash curl

# Copia manifests primeiro para aproveitar cache de layers
COPY package.json package-lock.json* bun.lockb* ./

# Instala dependências
RUN npm install --legacy-peer-deps

# Copia o restante do código
COPY . .

# Variáveis públicas do Vite precisam estar disponíveis no build
# Passe via --build-arg ou docker-compose
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

# Build da aplicação
RUN npm run build

# ---------- Stage 2: Runtime (Nginx) ----------
FROM nginx:1.27-alpine AS runtime

# Remove config default
RUN rm /etc/nginx/conf.d/default.conf

# Copia config customizada do Nginx (SPA fallback + cache)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build do TanStack Start
# O output do build do TanStack/Vite com Cloudflare é em .output/public ou dist/
# Ajuste se seu output for diferente
COPY --from=builder /app/dist /usr/share/nginx/html

# Caso o output seja em .output/public (TanStack Start padrão), descomente:
# COPY --from=builder /app/.output/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
