
Plano para resolver os bugs P0/P1 encontrados na auditoria QA. Foco: deixar o sistema funcional ponta-a-ponta antes de produção. Vou agrupar por sprints de prioridade.

## Sprint 1 — P0 Bloqueadores (essencial antes de produção)

### 1. BUG-001: Cálculo do carrinho ao alterar quantidade
**Arquivo:** `src/contexts/CartContext.tsx`
- Reescrever `updateQty` usando o preço unitário real (`unit_price`) e os modificadores já gravados.
- Calcular `total_price = unit_price * qty * urgency_modifier` de forma consistente.
- Adicionar guarda contra `qty` inválido (mín 1, máx 9999).

### 2. BUG-005: Persistir arte do editor
**Arquivos:** `src/components/site/CardEditor.tsx`, `src/routes/produtos.$slug.tsx`, migration nova
- Criar bucket `cart-artworks` (privado) via migration + RLS (usuário só lê/escreve seus próprios arquivos por prefixo `user_id/`).
- Adicionar coluna `artwork_path text` em `cart_items`.
- No `CardEditor`, expor callback `onSave(blob)` que faz upload para `cart-artworks/{user_id}/{uuid}.png` e devolve o path.
- Na página do produto, salvar `artwork_path` ao adicionar ao carrinho.
- No checkout, copiar `artwork_path` para `order_items.artwork_path` e marcar `artwork_status='approved'`.

### 3. BUG-003: Pagamento real (Stripe)
**Decisão:** usar Lovable Payments (Stripe built-in) — não pede conta do usuário.
- Rodar `recommend_payment_provider` → habilitar Stripe.
- Criar produtos dinâmicos via Checkout Session (line_items ad-hoc, pois preços variam por configuração).
- Server function `create-checkout-session` recebe `order_id` e cria sessão Stripe.
- Server route `/api/stripe-webhook` valida assinatura e atualiza `orders.status` para `pago` + insere em `order_status_history`.
- Adicionar Pix via Stripe (método nativo BR) e cartão. Boleto fica para depois.

### 4. BUG-010/011/012: Hardening de segurança
- `src/routes/admin.tsx`: adicionar `beforeLoad` que valida `has_role(admin)` server-side via server function (hoje só checa client-side).
- Bucket `quote-references`: trocar para privado + criar política de leitura via signed URL gerada por server function ao admin.
- Validar tamanho/tipo de upload no servidor (não confiar no client).

---

## Sprint 2 — P1 Regras de negócio

### 5. BUG-002: Frete real por CEP
**Arquivos:** `src/routes/checkout.tsx`, nova server function
- Server function `calculate-shipping(cep, subtotal)` que retorna valor + prazo.
- MVP: tabela fixa por região (S/SE/CO/N/NE) com base nos 3 primeiros dígitos do CEP.
- Frete grátis acima de R$ 250 mantém-se.
- Próxima iteração (fora deste plano): integração Melhor Envio / Correios.

### 6. BUG-008: Prazo de entrega real
- Calcular `estimated_days` no checkout = `max(production_days dos itens) + dias_frete`.
- Salvar em `orders.estimated_days` (coluna já existe).
- Exibir em `/conta/pedidos` e `/pedido/$id`.

### 7. Imagens de produtos (seed)
- Substituir emojis em `src/data/products.ts` / banco por URLs reais do bucket `product-images`.
- Adicionar SVG placeholder em `src/components/site/ProductCard.tsx` e demais consumidores quando `image` for nulo.

### 8. Esconder WhatsApp flutuante em /admin
**Arquivo:** `src/components/site/WhatsAppFloat.tsx`
- Usar `useLocation()` e retornar `null` se path começar com `/admin`.

---

## Sprint 3 — P2 Funcionalidades faltantes (módulos inexistentes)

Estes módulos foram listados na auditoria como ausentes. Cada um vira um épico separado — listo aqui apenas o esqueleto para o usuário priorizar depois:

- **Cupons:** tabela `coupons` + aplicação no carrinho/checkout + CRUD admin.
- **Banners CMS:** tabela `banners` + CRUD admin + render na home.
- **Configurações gerais:** tabela `site_settings` (logo, contatos, SEO, redes) + tela admin.
- **Aprovação de arte pelo cliente:** fluxo em `/conta/pedidos/$id` (já existe `artwork_status`, falta UI).
- **Recuperação/alteração de senha:** página `/conta` precisa do fluxo de change password.
- **Confirmação de e-mail:** habilitar no auth + página de aviso pós-cadastro.

---

## Ordem de execução proposta

```text
Sprint 1 (P0) → testar ponta-a-ponta → Sprint 2 (P1) → testar → Sprint 3 (P2 por demanda)
```

## O que vou precisar do usuário

1. Confirmar habilitar **Stripe (Lovable Payments)** para BUG-003.
2. Confirmar a tabela MVP de frete por região (ou aceitar valores que eu sugerir).
3. Confirmar se quero atacar **todos os P0+P1 numa rodada só** ou **só P0 primeiro**.

## Resumo técnico das mudanças

- **Migrations novas:** bucket `cart-artworks` + RLS, coluna `artwork_path` em `cart_items`, ajuste de policies do `quote-references`.
- **Server functions novas:** `create-checkout-session`, `calculate-shipping`, `get-quote-reference-url` (admin).
- **Server route nova:** `/api/stripe-webhook`.
- **Arquivos editados:** `CartContext.tsx`, `CardEditor.tsx`, `produtos.$slug.tsx`, `checkout.tsx`, `admin.tsx`, `WhatsAppFloat.tsx`, `ProductCard.tsx`, `pedido.$id.tsx`, `conta.pedidos.tsx`.

Antes de começar preciso saber: **executo só o Sprint 1 (P0) ou Sprint 1+2 de uma vez?** E **confirma habilitar Stripe agora?**
