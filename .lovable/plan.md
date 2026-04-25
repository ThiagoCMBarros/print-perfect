# Refatoração — Catálogo dinâmico por composição

## Decisões
- **Reset limpo**: apaga products, product_options, materials, finishes, cart_items. Pedidos antigos preservados (snapshot em config).
- **Margem % por produto** + faixas de quantidade com desconto.
- **Acabamentos**: quantidade informada pelo cliente (valor unitário × qtd informada).
- Dimensões em **mm**, preço de gramatura em **R$/mm²**.

## Modelo
- `produtos`: nome, slug, largura_mm, altura_mm, area_mm2 (gerada), margem_percent, ativo, categoria, imagem, descrição, complexidade, dias_producao
- `tipos_material` (Papel, Vinil, Plástico…)
- `materiais` (FK tipo) — Couchê, Matte…
- `gramaturas` (FK material) — nome + valor_mm2 (preço base)
- `revestimentos` (nome, valor_mm2)
- `revestimento_aplicacoes` (nome, multiplicador) — Frente=1, Verso=1, F+V=2
- `acabamentos` (nome, valor_unitario, descrição)
- `produto_materiais_permitidos` (produto, material)
- `produto_gramaturas_permitidas` (produto, gramatura)
- `produto_revestimentos_permitidos` (produto, revestimento)
- `produto_acabamentos_permitidos` (produto, acabamento, qtd_padrao)
- `produto_faixas_quantidade` (produto, qtd_min, qtd_max, desconto_tipo, desconto_valor)
- `cart_items_v2` / `order_items` adaptado para guardar a composição em jsonb

## Fórmula
```
area_mm2 = largura × altura
valor_base = area_mm2 × gramatura.valor_mm2
valor_revestimento = area_mm2 × revestimento.valor_mm2 × aplicacao.multiplicador
valor_acabamentos = Σ (acabamento.valor_unitario × qtd_informada)
unitario = (valor_base + valor_revestimento + valor_acabamentos) × (1 + margem%)
subtotal = unitario × qtd
total = subtotal − desconto_faixa
```

## Fases
1. **Schema + reset** (migration única): drop seguro do antigo + criação do novo + RLS + função SQL `calc_product_price`.
2. **Admin globals**: telas para CRUD de tipos_material, materiais, gramaturas, revestimentos, aplicações, acabamentos.
3. **Admin produto**: cadastro do produto + multi-select de permissões + faixas de quantidade.
4. **Frontend público**: página do produto com fluxo step-by-step e cálculo em tempo real (lib `pricing.ts`).
5. **Carrinho/Checkout/Pedido**: salvar composição em jsonb, recalcular no servidor antes de criar pedido.
6. **Seed mínimo + QA**.
