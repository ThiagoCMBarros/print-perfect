// Remoção de fundo no navegador usando @huggingface/transformers (WebGPU/WASM).
// Carrega o modelo sob demanda; o primeiro uso pode demorar alguns segundos.
import { pipeline, env } from "@huggingface/transformers";

// Permite que o transformers baixe modelos remotos.
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_DIM = 1024;
let segmenterPromise: Promise<unknown> | null = null;

function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = pipeline("image-segmentation", "Xenova/segformer-b0-finetuned-ade-512-512");
  }
  return segmenterPromise;
}

function resizeIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let w = image.naturalWidth;
  let h = image.naturalHeight;
  if (w > MAX_DIM || h > MAX_DIM) {
    if (w > h) { h = Math.round((h * MAX_DIM) / w); w = MAX_DIM; }
    else { w = Math.round((w * MAX_DIM) / h); h = MAX_DIM; }
  }
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(image, 0, 0, w, h);
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

/**
 * Recebe uma imagem (data URL ou URL) e devolve um data URL PNG com fundo transparente.
 * Usa segmentação semântica e usa o canal alpha invertido da máscara de fundo.
 */
export async function removeBackground(imageSrc: string): Promise<string> {
  const segmenter = (await getSegmenter()) as (input: HTMLCanvasElement) => Promise<Array<{ label?: string; mask: { data: Uint8ClampedArray | Uint8Array; width: number; height: number } }>>;

  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  resizeIfNeeded(canvas, ctx, img);

  const result = await segmenter(canvas);
  if (!result?.length) throw new Error("Segmentação falhou");
  // Usa o primeiro segmento como máscara de "objeto" — se vier label "background" usa esse invertido.
  const seg = result[0];
  const mask = seg.mask;

  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas indisponível");
  octx.drawImage(canvas, 0, 0);
  const imageData = octx.getImageData(0, 0, out.width, out.height);
  const data = imageData.data;

  // Heurística: se o segmento ocupa mais de 50% da imagem, provavelmente é fundo → invertemos.
  let sum = 0;
  for (let i = 0; i < mask.data.length; i++) sum += mask.data[i];
  const avg = sum / mask.data.length;
  const invert = avg > 128;

  for (let i = 0; i < mask.data.length; i++) {
    const m = mask.data[i];
    const alpha = invert ? 255 - m : m;
    data[i * 4 + 3] = alpha;
  }
  octx.putImageData(imageData, 0, 0);
  return out.toDataURL("image/png");
}
