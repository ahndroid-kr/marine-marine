function drawUI(ctx, canvas) {
  ctx.save();

  // Score
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#aae8ff';
  ctx.shadowColor = '#00aaff';
  ctx.shadowBlur = 8;
  ctx.fillText('SCORE  ' + GS.score, 16, 34);

  // Lives — small sub silhouettes
  for (let i = 0; i < GS.lives; i++) {
    const lx = canvas.width - 22 - i * 28;
    const ly = 20;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3d7a65';
    ctx.fill();
    ctx.fillStyle = '#2e6555';
    ctx.fillRect(-1, -9, 5, 5);
    ctx.restore();
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

  ctx.font = 'bold 56px monospace';
  ctx.fillStyle = '#ff4444';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 24;
  ctx.fillText('GAME OVER', cx, cy - 36);

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#aae8ff';
  ctx.shadowColor = '#00aaff';
  ctx.shadowBlur = 12;
  ctx.fillText('SCORE  ' + GS.score, cx, cy + 12);

  ctx.font = '17px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(Date.now() / 400);
  ctx.fillText('TAP OR CLICK TO PLAY AGAIN', cx, cy + 52);

  ctx.restore();
}
