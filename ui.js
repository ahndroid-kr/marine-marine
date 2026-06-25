const uiHeartImg = new Image();
uiHeartImg.src = 'assets/images/ui_heart.png';

const UI_BAR_H = 58;
const HEART_SIZE = 38;
const HEART_PAD = 5;

function drawUI(ctx, canvas) {
  ctx.save();

  // Header background: deep navy gradient (darker at top)
  const grad = ctx.createLinearGradient(0, 0, 0, UI_BAR_H);
  grad.addColorStop(0,   'rgba(0,  6, 22, 0.92)');
  grad.addColorStop(1,   'rgba(0, 18, 48, 0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, UI_BAR_H);

  // Bottom border: thin cyan line
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, UI_BAR_H - 0.75);
  ctx.lineTo(canvas.width, UI_BAR_H - 0.75);
  ctx.stroke();

  // STAGE 1 (left)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 12;
  ctx.fillText('STAGE 1', 18, UI_BAR_H / 2);

  // Hearts (right)
  ctx.shadowBlur = 0;
  const heartY = (UI_BAR_H - HEART_SIZE) / 2;
  for (let i = 0; i < GS.lives; i++) {
    const lx = canvas.width - 14 - (i + 1) * HEART_SIZE - i * HEART_PAD;
    if (uiHeartImg.complete && uiHeartImg.naturalWidth > 0) {
      ctx.globalAlpha = 1;
      ctx.drawImage(uiHeartImg, lx, heartY, HEART_SIZE, HEART_SIZE);
    } else {
      ctx.save();
      ctx.fillStyle = '#ff4466';
      ctx.shadowColor = '#ff2244';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(lx + HEART_SIZE / 2, heartY + HEART_SIZE / 2, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawGameOver(ctx, canvas) {
  ctx.save();

  ctx.fillStyle = 'rgba(0, 5, 15, 0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = 'bold 56px monospace';
  ctx.fillStyle = '#ff4444';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 24;
  ctx.fillText('GAME OVER', cx, cy - 20);

  ctx.font = '17px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(Date.now() / 400);
  ctx.fillText('TAP OR CLICK TO PLAY AGAIN', cx, cy + 36);

  ctx.restore();
}
