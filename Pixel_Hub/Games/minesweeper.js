/* Pixel Hub - Minesweeper. Standalone game for the shared 600x600 canvas. */
(function () {
  'use strict';
  const arcade = window.PixelArcade;
  if (!arcade) { console.error('Minesweeper needs the Pixel Hub game controller.'); return; }
  const { canvas, ctx, registerGame, updateScore, setInstructions } = arcade;
  const LEVELS = [
    { label: 'Easy', rows: 9, cols: 9, mines: 10 },
    { label: 'Medium', rows: 12, cols: 12, mines: 24 },
    { label: 'Hard', rows: 16, cols: 16, mines: 40 }
  ];
  const W = 600, H = 600, TOP = 134, BOTTOM = 566;
  let level = 0, board = [], started = false, finished = false, active = false;
  let flagMode = false, elapsed = 0, timer = null, revealed = 0, flags = 0, firstClick = true;
  let best = 0;
  try { best = Number(localStorage.getItem('pixelHubMinesweeperBest') || 0); } catch (_) {}
  const colors = ['#000', '#69f7ff', '#4dff88', '#ff667d', '#c45bff', '#ffd75e', '#ff8d5c', '#fff', '#a7b3c9'];
  function neighbors(r, c) {
    const cells = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < LEVELS[level].rows && nc >= 0 && nc < LEVELS[level].cols) cells.push([nr, nc]);
    }
    return cells;
  }
  function setup() {
    const { rows, cols } = LEVELS[level];
    board = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ mine: false, count: 0, open: false, flag: false })));
    firstClick = true; started = false; finished = false; elapsed = 0; revealed = 0; flags = 0;
    if (timer) clearInterval(timer);
    timer = null;
    updateScore(0);
    setInstructions(`Minesweeper ${LEVELS[level].label}: left-click to reveal, right-click to flag. First reveal is safe.`);
    draw();
  }
  function seed(safeR, safeC) {
    const { rows, cols, mines } = LEVELS[level];
    const protectedCells = new Set([[safeR, safeC], ...neighbors(safeR, safeC)].map(([r,c]) => `${r},${c}`));
    const choices = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!protectedCells.has(`${r},${c}`)) choices.push([r,c]);
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    for (const [r,c] of choices.slice(0, mines)) board[r][c].mine = true;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) board[r][c].count = neighbors(r,c).filter(([nr,nc]) => board[nr][nc].mine).length;
  }
  function beginTimer() {
    if (started) return;
    started = true;
    timer = setInterval(() => { if (active && !finished) { elapsed++; draw(); } }, 1000);
  }
  function reveal(r, c) {
    const cell = board[r][c];
    if (cell.open || cell.flag || finished) return;
    if (firstClick) { seed(r,c); firstClick = false; beginTimer(); }
    if (cell.mine) {
      cell.open = true; finished = true;
      if (timer) clearInterval(timer);
      for (const row of board) for (const tile of row) if (tile.mine) tile.open = true;
      setInstructions(`Mine hit! Game over after ${elapsed} seconds. Press Restart Game to try again.`);
      draw(); return;
    }
    const queue = [[r,c]];
    while (queue.length) {
      const [cr, cc] = queue.pop(), tile = board[cr][cc];
      if (tile.open || tile.flag || tile.mine) continue;
      tile.open = true; revealed++;
      if (tile.count === 0) for (const pair of neighbors(cr,cc)) {
        const next = board[pair[0]][pair[1]];
        if (!next.open && !next.flag && !next.mine) queue.push(pair);
      }
    }
    updateScore(revealed);
    if (revealed === LEVELS[level].rows * LEVELS[level].cols - LEVELS[level].mines) {
      finished = true;
      if (timer) clearInterval(timer);
      if (revealed > best) {
        best = revealed;
        try { localStorage.setItem('pixelHubMinesweeperBest', String(best)); } catch (_) {}
      }
      setInstructions(`You cleared ${LEVELS[level].label} in ${elapsed} seconds! All safe tiles revealed.`);
    }
    draw();
  }
  function toggleFlag(r,c) {
    if (finished || board[r][c].open) return;
    board[r][c].flag = !board[r][c].flag;
    flags += board[r][c].flag ? 1 : -1;
    draw();
  }
  function layout() {
    const { rows, cols } = LEVELS[level];
    const size = Math.floor(Math.min((W - 56) / cols, (BOTTOM - TOP) / rows));
    return { size, x: Math.floor((W - cols * size) / 2), y: TOP + Math.floor((BOTTOM - TOP - rows * size) / 2) };
  }
  function roundRect(x,y,w,h,r,fill) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill();
  }
  function draw() {
    if (!active) return;
    ctx.fillStyle = '#080812'; ctx.fillRect(0,0,W,H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.font = 'bold 31px system-ui'; ctx.fillText('MINESWEEPER',300,31);
    ctx.font = '17px system-ui'; ctx.fillStyle = '#a7b3c9';
    ctx.fillText(`💣 ${LEVELS[level].mines - flags} remaining     ⏱ ${elapsed}s     Safe: ${revealed}`,300,73);
    LEVELS.forEach((item,i) => {
      const x = 70 + i*160;
      roundRect(x,94,140,31,7,i === level ? '#3a9aa5' : '#25253a');
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.fillText(item.label,x+70,110);
    });
    const { size,x,y } = layout();
    for (let r=0;r<LEVELS[level].rows;r++) for(let c=0;c<LEVELS[level].cols;c++) {
      const cell=board[r][c], px=x+c*size, py=y+r*size;
      ctx.fillStyle=cell.open ? '#151d30' : ((r+c)%2 ? '#33445e' : '#3d526d');
      ctx.fillRect(px+1,py+1,size-2,size-2);
      if (cell.open && cell.mine) {
        ctx.fillStyle='#ff667d'; ctx.beginPath(); ctx.arc(px+size/2,py+size/2,size*.26,0,Math.PI*2); ctx.fill();
      } else if (cell.flag) {
        ctx.fillStyle='#ffd75e'; ctx.font=`bold ${Math.floor(size*.6)}px system-ui`; ctx.fillText('⚑',px+size/2,py+size/2);
      } else if (cell.open && cell.count) {
        ctx.fillStyle=colors[cell.count]; ctx.font=`bold ${Math.floor(size*.6)}px system-ui`; ctx.fillText(String(cell.count),px+size/2,py+size/2);
      }
    }
    ctx.fillStyle='#a7b3c9'; ctx.font='15px system-ui';
    ctx.fillText(`Left-click: reveal  •  Right-click: flag  •  F: ${flagMode ? 'FLAG' : 'REVEAL'} mode`,300,583);
    if (finished) {
      roundRect(104,258,392,88,14,'rgba(8,8,18,.94)');
      ctx.fillStyle='#fff'; ctx.font='bold 30px system-ui';
      ctx.fillText(revealed === LEVELS[level].rows*LEVELS[level].cols-LEVELS[level].mines ? 'YOU WIN!' : 'GAME OVER',300,287);
      ctx.font='16px system-ui'; ctx.fillText('Restart to play again',300,320);
    }
    ctx.textAlign='start'; ctx.textBaseline='alphabetic';
  }
  function position(event) {
    const rect=canvas.getBoundingClientRect();
    return { x:(event.clientX-rect.left)*W/rect.width, y:(event.clientY-rect.top)*H/rect.height };
  }
  function click(event) {
    if (!active) return;
    const p=position(event);
    if (p.y>=94 && p.y<=125) {
      for (let i=0;i<3;i++) if (p.x>=70+i*160 && p.x<=210+i*160) { level=i; setup(); return; }
    }
    const { size,x,y }=layout();
    const c=Math.floor((p.x-x)/size), r=Math.floor((p.y-y)/size);
    if (r<0 || c<0 || r>=LEVELS[level].rows || c>=LEVELS[level].cols) return;
    if (event.button===2 || flagMode) toggleFlag(r,c); else reveal(r,c);
  }
  function contextMenu(event) { if (active) event.preventDefault(); }
  function keyboard(event) {
    if (!active) return;
    if (event.key.toLowerCase()==='f') { flagMode=!flagMode; setInstructions(`Minesweeper: ${flagMode ? 'Flag' : 'Reveal'} mode enabled.`); draw(); }
  }
  registerGame('minesweeper', {
    start() {
      active=true; flagMode=false;
      canvas.addEventListener('pointerdown',click);
      canvas.addEventListener('contextmenu',contextMenu);
      window.addEventListener('keydown',keyboard);
      setup();
    },
    stop() {
      active=false;
      if (timer) clearInterval(timer);
      timer=null;
      canvas.removeEventListener('pointerdown',click);
      canvas.removeEventListener('contextmenu',contextMenu);
      window.removeEventListener('keydown',keyboard);
    }
  });
})();
