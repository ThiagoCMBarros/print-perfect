# Deploy via Docker na VPS

Esta aplicação está pronta para rodar em qualquer VPS com Docker instalado.

## ⚠️ Arquitetura

- **Frontend**: Buildado e servido como estático via Nginx (dentro do container)
- **Backend**: Continua rodando no **Lovable Cloud** (Supabase) — o Docker NÃO substitui o backend
- **Edge Functions**: Continuam rodando no Supabase (não no Docker)
- **Storage / Auth / Database**: Tudo permanece no Supabase

A VPS apenas serve a interface web. Toda a lógica de backend continua centralizada na Lovable Cloud.

---

## 📋 Pré-requisitos na VPS

```bash
# Instalar Docker + Compose (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo apt install docker-compose-plugin -y

# (Opcional) adicionar seu usuário ao grupo docker
sudo usermod -aG docker $USER
```

---

## 🚀 Deploy passo a passo

### 1. Clone o repositório na VPS
```bash
git clone <seu-repo> graficarelli
cd graficarelli
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.docker.example .env
nano .env   # ajuste se necessário (já vem preenchido)
```

### 3. Build e start
```bash
docker compose up -d --build
```

A aplicação estará disponível em `http://SEU_IP_VPS:8080`.

### 4. Atualizar deploy (após mudanças no código)
```bash
git pull
docker compose up -d --build
```

### 5. Ver logs
```bash
docker compose logs -f web
```

### 6. Parar
```bash
docker compose down
```

---

## 🌐 HTTPS / Domínio próprio

Recomendado usar **Nginx Proxy Manager** ou **Traefik** ou **Caddy** como proxy reverso na frente do container, fazendo HTTPS com Let's Encrypt automaticamente.

### Exemplo com Caddy (mais simples)

`/etc/caddy/Caddyfile`:
```
graficarelli.com.br {
    reverse_proxy localhost:8080
}
```

```bash
sudo systemctl reload caddy
```

Pronto — HTTPS automático.

### Exemplo com Nginx Proxy Manager
1. Adicione um Proxy Host
2. Domain: `graficarelli.com.br`
3. Forward Hostname/IP: `web` (se na mesma rede docker) ou `localhost`
4. Forward Port: `8080`
5. Aba SSL: ative "Request a new SSL certificate" + "Force SSL"

---

## 📁 Estrutura

```
.
├── Dockerfile              # Build multi-stage (node → nginx)
├── docker-compose.yml      # Orquestração
├── nginx.conf              # Config do nginx (SPA fallback + cache)
├── .dockerignore           # Arquivos ignorados no build
└── .env.docker.example     # Template de variáveis
```

---

## 🔧 Troubleshooting

**Build falha por falta de memória:**
```bash
# Em VPS pequenas (1GB RAM), criar swap antes do build
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**Output do build não está em `dist/`:**
Se o TanStack Start gerar em `.output/public`, edite o `Dockerfile` e troque a linha:
```dockerfile
COPY --from=builder /app/dist /usr/share/nginx/html
```
por:
```dockerfile
COPY --from=builder /app/.output/public /usr/share/nginx/html
```

**Mudanças não aparecem:**
Force rebuild sem cache:
```bash
docker compose build --no-cache
docker compose up -d
```
