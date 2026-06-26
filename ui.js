const uiHeartImg = new Image();
uiHeartImg.src = 'assets/images/ui_heart.png';

function drawUI(ctx, canvas) {
  const BAR_H   = Math.round(canvas.height * 0.085);
  const HEART   = Math.round(canvas.height * 0.060);
  const PAD     = Math.round(canvas.height * 0.008);
  const FONT_SZ = Math.round(canvas.height * 0.033);

  ctx.save();

  // Header background
  const grad = ctx.createLinearGradient(0, 0, 0, BAR_H);
  grad.addColorStop(0, 'rgba(0,  6, 22, 0.92)');
  grad.addColorStop(1, 'rgba(0, 18, 48, 0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, BAR_H);

  // Bottom border
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, BAR_H - 0.75);
  ctx.lineTo(canvas.width, BAR_H - 0.75);
  ctx.stroke();

  // STAGE label (left)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${FONT_SZ}px monospace`;
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 12;
  ctx.fillText('STAGE 1', Math.round(canvas.width * 0.022), BAR_H / 2);

  // Hearts (right)
  ctx.shadowBlur = 0;
  const heartY = (BAR_H - HEART) / 2;
  for (let i = 0; i < GS.lives; i++) {
    const lx = canvas.width - PAD - (i + 1) * HEART - i * PAD;
    if (uiHeartImg.complete && uiHeartImg.naturalWidth > 0) {
      ctx.globalAlpha = 1;
      ctx.drawImage(uiHeartImg, lx, heartY, HEART, HEART);
    } else {
      ctx.save();
      ctx.fillStyle = '#ff4466';
      ctx.shadowColor = '#ff2244';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(lx + HEART / 2, heartY + HEART / 2, HEART * 0.37, HEART * 0.19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawStageClear(ctx, canvas) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 5, 15, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const titleSz = Math.round(canvas.height * 0.085);
  const scoreSz = Math.round(canvas.height * 0.036);
  const subSz   = Math.round(canvas.height * 0.028);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = `bold ${titleSz}px monospace`;
  ctx.fillStyle = '#ffe066';
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 28;
  ctx.fillText('STAGE CLEAR!', cx, cy - titleSz * 0.2);

  ctx.font = `${scoreSz}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.fillText(`SCORE  ${GS.score}`, cx, cy + titleSz * 0.7);

  ctx.font = `${subSz}px monospace`;
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(Date.now() / 400);
  ctx.fillText('TAP OR CLICK TO PLAY AGAIN', cx, cy + titleSz * 1.4);

  ctx.restore();
}

function drawGameOver(ctx, canvas) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 5, 15, 0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const titleSz = Math.round(canvas.height * 0.085);
  const subSz   = Math.round(canvas.height * 0.028);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = `bold ${titleSz}px monospace`;
  ctx.fillStyle = '#ff4444';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 24;
  ctx.fillText('GAME OVER', cx, cy - titleSz * 0.2);

  ctx.font = `${subSz}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(Date.now() / 400);
  ctx.fillText('TAP OR CLICK TO PLAY AGAIN', cx, cy + titleSz * 0.8);

  ctx.restore();
}
