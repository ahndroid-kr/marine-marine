const uiHeartImg = new Image();
uiHeartImg.src = 'assets/images/ui_heart.png';

// ─── Rounded rect path helper ─────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

// ─── HUD header ──────────────────────────────────────────────────────────────
function drawUI(ctx, canvas) {
  const BAR_H = Math.round(canvas.height * 0.085);
  const PAD   = Math.round(canvas.height * 0.016);
  const FSZ   = Math.round(canvas.height * 0.020); // 'Press Start 2P' — compact
  const HEART = Math.round(canvas.height * 0.046);
  const HGAP  = Math.round(canvas.height * 0.007);
  const midY  = BAR_H / 2;

  ctx.save();

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, BAR_H);
  grad.addColorStop(0, 'rgba(0,  4, 18, 0.97)');
  grad.addColorStop(1, 'rgba(0, 14, 40, 0.82)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, BAR_H);

  // Bottom border glow
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.60)';
  ctx.lineWidth   = 1.5;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur  = 8;
  ctx.beginPath();
  ctx.moveTo(0, BAR_H);
  ctx.lineTo(canvas.width, BAR_H);
  ctx.stroke();
  ctx.shadowBlur  = 0;

  ctx.textBaseline = 'middle';

  // ── Pause button (far right) ─────────────────────────────────────────────
  const BTN   = Math.round(BAR_H * 0.60);
  const BTN_X = canvas.width - PAD - BTN;
  const BTN_Y = (BAR_H - BTN) / 2;

  if (typeof pauseBtnBounds !== 'undefined') {
    pauseBtnBounds.x = BTN_X; pauseBtnBounds.y = BTN_Y;
    pauseBtnBounds.w = BTN;   pauseBtnBounds.h = BTN;
  }

  ctx.fillStyle   = 'rgba(0, 229, 255, 0.08)';
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)';
  ctx.lineWidth   = 1.5;
  roundRect(ctx, BTN_X, BTN_Y, BTN, BTN, 4);
  ctx.fill();
  ctx.stroke();

  const icX = BTN_X + BTN / 2;
  const icY = BTN_Y + BTN / 2;
  ctx.fillStyle = '#00e5ff';
  if (typeof paused !== 'undefined' && paused) {
    // ▶ resume triangle
    const th = Math.round(BTN * 0.46), tw = Math.round(th * 0.84);
    ctx.beginPath();
    ctx.moveTo(icX - tw * 0.36, icY - th / 2);
    ctx.lineTo(icX - tw * 0.36, icY + th / 2);
    ctx.lineTo(icX + tw * 0.64, icY);
    ctx.closePath();
    ctx.fill();
  } else {
    // ⏸ two bars
    const bh = Math.round(BTN * 0.46), bw = Math.round(BTN * 0.13), bg = Math.round(BTN * 0.13);
    ctx.fillRect(icX - bg / 2 - bw, icY - bh / 2, bw, bh);
    ctx.fillRect(icX + bg / 2,       icY - bh / 2, bw, bh);
  }

  // ── Hearts ───────────────────────────────────────────────────────────────
  const totalHeartW = GS.lives * HEART + Math.max(0, GS.lives - 1) * HGAP;
  let hx = BTN_X - PAD - totalHeartW;
  const hy = (BAR_H - HEART) / 2;
  for (let i = 0; i < GS.lives; i++) {
    if (uiHeartImg.complete && uiHeartImg.naturalWidth > 0) {
      ctx.globalAlpha = 1;
      ctx.drawImage(uiHeartImg, hx, hy, HEART, HEART);
    } else {
      ctx.save();
      ctx.fillStyle = '#ff4466'; ctx.shadowColor = '#ff2244'; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(hx + HEART / 2, hy + HEART / 2, HEART * 0.37, HEART * 0.19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    hx += HEART + HGAP;
  }

  // ── Score (center) ───────────────────────────────────────────────────────
  ctx.font        = `${FSZ}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = '#ffffff';
  ctx.textAlign   = 'center';
  ctx.shadowColor = 'rgba(255,255,255,0.25)';
  ctx.shadowBlur  = 6;
  ctx.fillText(String(GS.score).padStart(6, '0'), canvas.width / 2, midY);
  ctx.shadowBlur  = 0;

  // ── STAGE 1 (left) ───────────────────────────────────────────────────────
  ctx.font        = `${FSZ}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = '#00e5ff';
  ctx.textAlign   = 'left';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur  = 10;
  ctx.fillText('STAGE 1', PAD, midY);
  ctx.shadowBlur  = 0;

  ctx.restore();
}

// ─── Pause overlay ────────────────────────────────────────────────────────────
function drawPaused(ctx, canvas) {
  ctx.save();

  ctx.fillStyle = 'rgba(0, 4, 18, 0.84)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx      = canvas.width  / 2;
  const cy      = canvas.height / 2;
  const titleSz = Math.round(canvas.height * 0.052);
  const hintSz  = Math.round(canvas.height * 0.016);
  const btnSz   = Math.round(canvas.height * 0.018);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // PAUSED title
  ctx.font        = `${titleSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur  = 30;
  ctx.fillText('PAUSED', cx, cy - titleSz * 0.95);
  ctx.shadowBlur  = 0;

  // Resume hint (pulsing)
  ctx.font        = `${hintSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = 'rgba(200, 230, 255, 0.80)';
  ctx.globalAlpha = 0.55 + 0.45 * Math.sin(Date.now() / 560);
  ctx.fillText('PRESS ESC TO RESUME', cx, cy + hintSz * 0.5);
  ctx.globalAlpha = 1;

  // RESTART button
  const btnW = Math.round(canvas.width  * 0.28);
  const btnH = Math.round(canvas.height * 0.070);
  const btnX = cx - btnW / 2;
  const btnY = cy + titleSz * 1.15;

  if (typeof restartBtnBounds !== 'undefined') {
    restartBtnBounds.x = btnX; restartBtnBounds.y = btnY;
    restartBtnBounds.w = btnW; restartBtnBounds.h = btnH;
  }

  ctx.fillStyle   = 'rgba(255, 50, 50, 0.15)';
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth   = 2;
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur  = 14;
  roundRect(ctx, btnX, btnY, btnW, btnH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur  = 0;

  ctx.font      = `${btnSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle = '#ff7777';
  ctx.fillText('RESTART', cx, btnY + btnH / 2);

  ctx.restore();
}

// ─── Stage clear ─────────────────────────────────────────────────────────────
function drawStageClear(ctx, canvas) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 5, 15, 0.78)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx      = canvas.width  / 2;
  const cy      = canvas.height / 2;
  const titleSz = Math.round(canvas.height * 0.052);
  const scoreSz = Math.round(canvas.height * 0.020);
  const subSz   = Math.round(canvas.height * 0.014);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.font        = `${titleSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = '#ffe066';
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur  = 30;
  ctx.fillText('STAGE CLEAR!', cx, cy - titleSz * 0.85);
  ctx.shadowBlur  = 0;

  ctx.font      = `${scoreSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE  ${GS.score}`, cx, cy + titleSz * 0.15);

  ctx.font        = `${subSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = 'rgba(255,255,255,0.80)';
  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(Date.now() / 430);
  ctx.fillText('TAP OR CLICK TO PLAY AGAIN', cx, cy + titleSz * 1.20);
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ─── Game over ────────────────────────────────────────────────────────────────
function drawGameOver(ctx, canvas) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 5, 15, 0.78)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx      = canvas.width  / 2;
  const cy      = canvas.height / 2;
  const titleSz = Math.round(canvas.height * 0.052);
  const subSz   = Math.round(canvas.height * 0.014);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.font        = `${titleSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = '#ff4444';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur  = 28;
  ctx.fillText('GAME OVER', cx, cy - titleSz * 0.55);
  ctx.shadowBlur  = 0;

  ctx.font        = `${subSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = 'rgba(255,255,255,0.80)';
  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(Date.now() / 430);
  ctx.fillText('TAP OR CLICK TO PLAY AGAIN', cx, cy + titleSz * 0.65);
  ctx.globalAlpha = 1;

  ctx.restore();
}
