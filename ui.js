const uiHeartImg = new Image();
uiHeartImg.src = 'assets/images/ui_heart.png';

const titleLogoImg = new Image();
titleLogoImg.src = 'assets/images/title_logo.png';

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

  ctx.textBaseline = 'middle';

  // ── Pause button (far right) ─────────────────────────────────────────────
  const BTN   = Math.round(BAR_H * 0.60);
  const BTN_X = canvas.width - PAD - BTN;
  const BTN_Y = (BAR_H - BTN) / 2;

  // Hit area is larger than the visual to ensure a comfortable touch target on mobile.
  // Visual button ~28px; hit box extends to top-right corner (≥80px wide, ≥60px tall).
  if (typeof pauseBtnBounds !== 'undefined') {
    const HIT_W = Math.max(BTN + PAD * 2, 80);
    const HIT_H = Math.max(BAR_H, 60);
    pauseBtnBounds.x = canvas.width - HIT_W;
    pauseBtnBounds.y = 0;
    pauseBtnBounds.w = HIT_W;
    pauseBtnBounds.h = HIT_H;
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
  const MAX_HEARTS  = 5;
  const dispHearts  = Math.min(GS.lives, MAX_HEARTS);
  const extraLives  = GS.lives - MAX_HEARTS;
  const extraLabel  = extraLives > 0 ? `+${extraLives}` : '';
  ctx.font = `${FSZ}px 'Press Start 2P', monospace`;
  const extraLabelW = extraLives > 0 ? ctx.measureText(extraLabel).width + HGAP : 0;
  const totalHeartW = dispHearts * HEART + Math.max(0, dispHearts - 1) * HGAP + extraLabelW;
  let hx = BTN_X - PAD - totalHeartW;
  const hy = (BAR_H - HEART) / 2;
  for (let i = 0; i < dispHearts; i++) {
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
  if (extraLives > 0) {
    ctx.save();
    ctx.font        = `${FSZ}px 'Press Start 2P', monospace`;
    ctx.fillStyle   = '#ff4466';
    ctx.textAlign   = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(extraLabel, hx, BAR_H / 2);
    ctx.restore();
  }

  // ── Score (center) ───────────────────────────────────────────────────────
  ctx.font        = `${FSZ}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = '#ffffff';
  ctx.textAlign   = 'center';
  ctx.shadowColor = 'rgba(255,255,255,0.25)';
  ctx.shadowBlur  = 6;
  ctx.fillText(String(GS.score).padStart(6, '0'), canvas.width / 2, midY);
  ctx.shadowBlur  = 0;

  // ── STAGE N (left) ───────────────────────────────────────────────────────
  ctx.font        = `${FSZ}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = '#00e5ff';
  ctx.textAlign   = 'left';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur  = 10;
  ctx.fillText('STAGE ' + (GS.stageNum || 1), PAD, midY);
  ctx.shadowBlur  = 0;

  // ── QA MODE badge ────────────────────────────────────────────────────────
  if (typeof QA_MODE !== 'undefined' && QA_MODE) {
    const qsz  = Math.round(canvas.height * 0.016);
    const qpad = Math.round(canvas.height * 0.008);
    ctx.save();
    ctx.font = `${qsz}px 'Press Start 2P', monospace`;
    const qw = ctx.measureText('QA').width + qpad * 2;
    const qh = qsz + qpad * 2;
    const qx = canvas.width / 2 - qw / 2;
    const qy = BAR_H + Math.round(canvas.height * 0.008);
    ctx.fillStyle   = 'rgba(255, 200, 0, 0.18)';
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth   = 1;
    roundRect(ctx, qx, qy, qw, qh, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle    = '#ffcc00';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QA', canvas.width / 2, qy + qh / 2);
    ctx.restore();
  }

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

  // ESC hint (pulsing)
  ctx.font        = `${hintSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle   = 'rgba(200, 230, 255, 0.80)';
  ctx.globalAlpha = 0.55 + 0.45 * Math.sin(Date.now() / 560);
  ctx.fillText('PRESS ESC TO RESUME', cx, cy + hintSz * 0.5);
  ctx.globalAlpha = 1;

  // Two buttons: RESUME (left/green) | RESTART (right/red)
  const btnW = Math.round(canvas.width  * 0.22);
  const btnH = Math.round(canvas.height * 0.070);
  const btnGap = Math.round(canvas.width * 0.04);
  const btnY = cy + titleSz * 1.20;
  const resumeX  = cx - btnGap / 2 - btnW;
  const restartX = cx + btnGap / 2;

  // RESUME button
  if (typeof resumeBtnBounds !== 'undefined') {
    resumeBtnBounds.x = resumeX; resumeBtnBounds.y = btnY;
    resumeBtnBounds.w = btnW;    resumeBtnBounds.h = btnH;
  }
  ctx.fillStyle   = 'rgba(50, 255, 120, 0.15)';
  ctx.strokeStyle = '#44ff88';
  ctx.lineWidth   = 2;
  ctx.shadowColor = '#44ff88';
  ctx.shadowBlur  = 14;
  roundRect(ctx, resumeX, btnY, btnW, btnH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur  = 0;
  ctx.font      = `${btnSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle = '#88ffaa';
  ctx.fillText('RESUME', resumeX + btnW / 2, btnY + btnH / 2);

  // RESTART button
  if (typeof restartBtnBounds !== 'undefined') {
    restartBtnBounds.x = restartX; restartBtnBounds.y = btnY;
    restartBtnBounds.w = btnW;     restartBtnBounds.h = btnH;
  }
  ctx.fillStyle   = 'rgba(255, 50, 50, 0.15)';
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth   = 2;
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur  = 14;
  roundRect(ctx, restartX, btnY, btnW, btnH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur  = 0;
  ctx.font      = `${btnSz}px 'Press Start 2P', monospace`;
  ctx.fillStyle = '#ff7777';
  ctx.fillText('RESTART', restartX + btnW / 2, btnY + btnH / 2);

  ctx.restore();
}

// ─── Stage clear ─────────────────────────────────────────────────────────────
function drawStageClear(ctx, canvas, isLastStage = false) {
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
  if (isLastStage) {
    ctx.fillText('TAP OR CLICK TO PLAY AGAIN', cx, cy + titleSz * 1.20);
  } else {
    ctx.fillText('NEXT STAGE...', cx, cy + titleSz * 1.20);
  }
  ctx.globalAlpha = 1;

  // 자동 전환 진행 바 (마지막 스테이지 제외)
  if (!isLastStage) {
    const barW   = Math.round(canvas.width * 0.50);
    const barH   = Math.round(canvas.height * 0.008);
    const barX   = cx - barW / 2;
    const barY   = cy + titleSz * 1.70;
    const pct    = Math.min(GS.clearTimer / 150, 1);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle   = '#ffe066';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur  = 8;
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.shadowBlur  = 0;
  }

  ctx.restore();
}

// ─── Title / stage select ─────────────────────────────────────────────────────
function drawTitle(ctx, canvas, stageLabels, btnBoundsArr) {
  btnBoundsArr.length = 0;

  ctx.save();

  // Dark overlay over scrolling bg
  ctx.fillStyle = 'rgba(0, 5, 20, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width  / 2;
  const s  = canvas.height / 600;

  // ── Title logo image (floating) ───────────────────────────────────────────
  if (titleLogoImg.complete && titleLogoImg.naturalWidth > 0) {
    const logoW     = Math.round(432 * s);
    const logoH     = Math.round(288 * s);
    const logoBaseY = Math.round(canvas.height * 0.12);
    const floatY    = Math.sin(Date.now() / 1000 * (Math.PI * 2) / 2.5) * 6 * s;
    ctx.drawImage(titleLogoImg, cx - logoW / 2, logoBaseY + floatY, logoW, logoH);
  }

  // ── Buttons ──────────────────────────────────────────────────────────────
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  const isQA    = typeof QA_MODE !== 'undefined' && QA_MODE;
  const subSz   = Math.round(canvas.height * 0.014);
  const btnW    = Math.round(Math.min(canvas.width * 0.24, canvas.height * 0.22));
  const btnH    = Math.round(canvas.height * 0.072);
  const btnSz   = Math.round(canvas.height * 0.018);
  const gap     = Math.round(canvas.width  * 0.04);
  const totalW  = stageLabels.length * btnW + (stageLabels.length - 1) * gap;
  const startX  = cx - totalW / 2;
  const btnY    = Math.round(canvas.height * 0.70);

  if (isQA) {
    ctx.font      = `${subSz}px 'Press Start 2P', monospace`;
    ctx.fillStyle = 'rgba(150, 220, 255, 0.70)';
    ctx.fillText('SELECT STAGE', cx, btnY - subSz * 1.8);
  }

  stageLabels.forEach((label, i) => {
    const bx = startX + i * (btnW + gap);
    btnBoundsArr.push({ x: bx, y: btnY, w: btnW, h: btnH });

    ctx.fillStyle   = 'rgba(0, 229, 255, 0.08)';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth   = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur  = 14;
    roundRect(ctx, bx, btnY, btnW, btnH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur  = 0;

    ctx.font      = `${btnSz}px 'Press Start 2P', monospace`;
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(label, bx + btnW / 2, btnY + btnH / 2);
  });

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
