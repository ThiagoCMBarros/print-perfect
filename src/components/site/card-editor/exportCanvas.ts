import type { Background, Layer, TemplateMeta } from "./types";

export async function renderToBlob(
  t: TemplateMeta,
  bg: Background,
  layers: Layer[],
): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = t.w;
  c.height = t.h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas context indisponível");

  // Background
  if (bg.type === "transparent") {
    // Não pinta nada — canvas permanece transparente.
  } else if (bg.type === "solid") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, t.w, t.h);
  } else if (bg.type === "image") {
    try {
      const img = await loadImage(bg.src);
      const scale = bg.fit === "cover"
        ? Math.max(t.w / img.width, t.h / img.height)
        : Math.min(t.w / img.width, t.h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (t.w - dw) / 2;
      const dy = (t.h - dh) / 2;
      if (bg.fit === "contain") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, t.w, t.h);
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    } catch (err) {
      console.error("[exportCanvas] erro ao carregar imagem de fundo:", err);
    }
  } else {
    let grad: CanvasGradient;
    if (bg.direction === "horizontal") grad = ctx.createLinearGradient(0, 0, t.w, 0);
    else if (bg.direction === "vertical") grad = ctx.createLinearGradient(0, 0, 0, t.h);
    else if (bg.direction === "diagonal-1") grad = ctx.createLinearGradient(0, 0, t.w, t.h);
    else grad = ctx.createLinearGradient(t.w, 0, 0, t.h);
    grad.addColorStop(0, bg.color1);
    grad.addColorStop(1, bg.color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, t.w, t.h);
  }

  // Pré-carrega imagens de logo
  const logoCache = new Map<string, HTMLImageElement>();
  await Promise.all(
    layers.filter((l) => l.type === "logo").map(async (l) => {
      if (l.type !== "logo") return;
      if (logoCache.has(l.src)) return;
      const img = await loadImage(l.src);
      logoCache.set(l.src, img);
    }),
  );

  for (const layer of layers) {
    ctx.save();
    const cx = layer.x + layer.w / 2;
    const cy = layer.y + layer.h / 2;
    ctx.translate(cx, cy);
    if (layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    if (layer.type === "text") {
      ctx.fillStyle = layer.color;
      ctx.textBaseline = "top";
      ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
      ctx.textAlign = layer.align;
      const tx = layer.align === "center" ? layer.x + layer.w / 2
        : layer.align === "right" ? layer.x + layer.w
        : layer.x;
      // Suporte a quebra simples por \n
      const lines = layer.content.split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, tx, layer.y + i * layer.fontSize * 1.2);
      });
    } else {
      const img = logoCache.get(layer.src);
      if (img) {
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(img, layer.x, layer.y, layer.w, layer.h);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  return new Promise<Blob>((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))), "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
