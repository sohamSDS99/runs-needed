/**
 * Result-card image (PRD §11.2, ADR-7): a 1200×630 PNG drawn imperatively with
 * Canvas 2D — no capture library, no web font, and no imports (this module is
 * self-contained and dynamically imported on demand). Returns a PNG Blob.
 */

export interface CardBar {
  lower: number;
  upper: number;
  point: number;
}

export interface CardData {
  wordmark: string;
  primary: string;
  secondary: string;
  bar: CardBar | null;
  classSentence: string;
  caveat: string;
  url: string;
}

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] ?? "";
  while (last.length > 0 && ctx.measureText(`${last}…`).width > maxWidth) {
    last = last.slice(0, -1);
  }
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

export async function drawResultCard(data: CardData): Promise<Blob> {
  const W = 1200;
  const H = 630;
  const M = 64;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("card: 2D context unavailable");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  let y = M;

  ctx.fillStyle = "#2563eb";
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(data.wordmark, M, y);
  y += 52;

  ctx.fillStyle = "#18181b";
  ctx.font = `700 96px ${FONT}`;
  ctx.fillText(data.primary, M, y);
  y += 120;

  ctx.fillStyle = "#3f3f46";
  ctx.font = `400 32px ${FONT}`;
  ctx.fillText(data.secondary, M, y);
  y += 56;

  if (data.bar) {
    const bx = M;
    const by = y;
    const bw = W - 2 * M;
    const bh = 64;
    const lo = Math.max(0, Math.min(1, data.bar.lower));
    const hi = Math.max(0, Math.min(1, data.bar.upper));
    ctx.fillStyle = "#e4e4e7";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "rgba(37,99,235,0.25)";
    ctx.fillRect(bx + lo * bw, by, (hi - lo) * bw, bh);
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + lo * bw, by, (hi - lo) * bw, bh);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(bx + Math.max(0, Math.min(1, data.bar.point)) * bw - 1, by, 2, bh);
    y += bh + 28;
  }

  ctx.fillStyle = "#3f3f46";
  ctx.font = `400 28px ${FONT}`;
  for (const line of wrap(ctx, data.classSentence, W - 2 * M, 3)) {
    ctx.fillText(line, M, y);
    y += 40;
  }

  ctx.fillStyle = "#71717a";
  ctx.font = `400 22px ${FONT}`;
  ctx.fillText(data.caveat, M, H - M - 22);

  ctx.textAlign = "right";
  ctx.fillText(data.url, W - M, H - M - 22);
  ctx.textAlign = "left";

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("card: toBlob failed"))),
      "image/png",
    );
  });
}
