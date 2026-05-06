import { createCanvas, loadImage } from "@napi-rs/canvas";

const BG       = "#0d1117";
const PANEL_BG = "#161b22";
const BORDER   = "#30363d";
const ACCENT   = "#39d353";
const HEADING  = "#ffffff";
const CMD_CLR  = "#c9d1d9";
const DIM      = "#8b949e";

const PAD    = 24;
const COLS   = 2;
const GUTTER = 16;

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function roundRectStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.stroke();
}

/**
 * @param {string} botName
 * @param {string} prefix
 * @param {Array<{title: string, commands: string[]}>} sections
 * @param {string} [bgUrl]
 * @returns {Promise<Buffer>}
 */
export async function generateMenuImage(botName, prefix, sections, bgUrl) {
  const W = 900;
  const LINE_H = 28;
  const TITLE_H = 38;
  const PANEL_PAD = 18;
  const PANEL_W = (W - PAD * 2 - GUTTER * (COLS - 1)) / COLS;

  const rows = [];
  for (let i = 0; i < sections.length; i += COLS)
    rows.push(sections.slice(i, i + COLS));

  const HEADER_H = 80;
  const FOOTER_H = 44;
  let contentH = 0;
  for (const row of rows) {
    const maxCmds = Math.max(...row.map((s) => s.commands.length));
    contentH += PANEL_PAD + TITLE_H + maxCmds * LINE_H + PANEL_PAD + GUTTER;
  }
  const H = HEADER_H + contentH + FOOTER_H;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background
  if (bgUrl) {
    try {
      const bgImg = await loadImage(bgUrl);
      const scale = Math.max(W / bgImg.width, H / bgImg.height);
      const bw = bgImg.width * scale;
      const bh = bgImg.height * scale;
      ctx.drawImage(bgImg, (W - bw) / 2, (H - bh) / 2, bw, bh);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
    } catch {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
  }

  // Header
  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(0, 0, W, HEADER_H);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, HEADER_H - 3, W, 3);

  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = HEADING;
  ctx.fillText(`\u26A1  ${botName.toUpperCase()}`, PAD, 42);

  ctx.font = "15px sans-serif";
  ctx.fillStyle = DIM;
  ctx.fillText(`PREFIX: ${prefix}`, PAD, 66);

  // Sections
  let y = HEADER_H + GUTTER;

  for (const row of rows) {
    const maxCmds = Math.max(...row.map((s) => s.commands.length));
    const panelH = PANEL_PAD + TITLE_H + maxCmds * LINE_H + PANEL_PAD;

    row.forEach((section, ci) => {
      const x = PAD + ci * (PANEL_W + GUTTER);

      roundRect(ctx, x, y, PANEL_W, panelH, 8, PANEL_BG);

      ctx.fillStyle = ACCENT;
      ctx.fillRect(x, y, 4, panelH);

      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      roundRectStroke(ctx, x, y, PANEL_W, panelH, 8);

      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = ACCENT;
      ctx.fillText(section.title, x + PANEL_PAD + 6, y + PANEL_PAD + 16);

      ctx.fillStyle = BORDER;
      ctx.fillRect(x + PANEL_PAD + 6, y + PANEL_PAD + 24, PANEL_W - PANEL_PAD * 2, 1);

      ctx.font = "14px monospace";
      section.commands.forEach((cmd, i) => {
        const cy = y + PANEL_PAD + TITLE_H + i * LINE_H + 14;
        ctx.fillStyle = ACCENT;
        ctx.fillText("\u250C", x + PANEL_PAD + 6, cy);
        ctx.fillStyle = CMD_CLR;
        ctx.fillText(` ${prefix}${cmd}`, x + PANEL_PAD + 6 + 14, cy);
      });
    });

    y += panelH + GUTTER;
  }

  // Footer
  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, H - FOOTER_H, W, 2);

  ctx.font = "13px sans-serif";
  ctx.fillStyle = DIM;
  ctx.textAlign = "center";
  ctx.fillText("Powered by Baileys", W / 2, H - FOOTER_H + 26);

  return canvas.toBuffer("image/png");
}
