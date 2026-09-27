// ========================================
// Pixel Arcade - Pong
// ========================================
// Single-player Pong against the computer.
//
// Controls:
//   W / S
//   Arrow Up / Arrow Down
//
// CPU difficulty:
//   1 = Easy
//   2 = Medium
//   3 = Hard
//   4 = Impossible
//
// First player to 7 points wins.
// ========================================

(() => {
  const arcade = window.PixelArcade;

  if (!arcade) {
    console.error(
      "Pong.js requires the PixelArcade controller inside games.html."
    );

    return;
  }


  const {
    canvas,
    ctx,
    updateScore,
    setInstructions,
    fillCanvas,
    showGameOver,
    getCurrentGame
  } = arcade;


  // ========================================
  // GAME SETTINGS
  // ========================================

  const winningScore = 7;

  const paddleWidth = 16;
  const paddleHeight = 110;

  const ballSize = 18;

  const playerX = 35;

  const computerX =
    canvas.width -
    35 -
    paddleWidth;


  // ========================================
  // CPU DIFFICULTY
  // ========================================

  const cpuLevels = {
    easy: {
      label: "Easy",
      cpuSpeed: 2.6,
      playerSpeed: 5.5,
      ballSpeed: 4,
      deadZone: 34,
      reactionChance: 0.72
    },

    medium: {
      label: "Medium",
      cpuSpeed: 4.6,
      playerSpeed: 7,
      ballSpeed: 5,
      deadZone: 14,
      reactionChance: 0.9
    },

    hard: {
      label: "Hard",
      cpuSpeed: 6.3,
      playerSpeed: 8,
      ballSpeed: 6.5,
      deadZone: 6,
      reactionChance: 0.98
    },

    impossible: {
      label: "Impossible",
      cpuSpeed: 10,
      playerSpeed: 9,
      ballSpeed: 8,
      deadZone: 0,
      reactionChance: 1
    }
  };


  let cpuLevel =
    localStorage.getItem(
      "pongCpuLevel"
    );


  if (!cpuLevels[cpuLevel]) {
    cpuLevel = "medium";
  }


  function setCpuLevel(level) {
    if (!cpuLevels[level]) {
      return;
    }


    cpuLevel = level;


    localStorage.setItem(
      "pongCpuLevel",
      level
    );


    setInstructions(
      `Pong: CPU difficulty set to ${cpuLevels[level].label}. Player speed ${cpuLevels[level].playerSpeed}, ball speed ${cpuLevels[level].ballSpeed}. Use W/S or Arrow Up/Down to move. Press 1 Easy, 2 Medium, 3 Hard, or 4 Impossible. First to 7 wins.`
    );
  }


  // ========================================
  // GAME STATE
  // ========================================

  let animationFrame = null;

  let running = false;

  let playerScore = 0;
  let computerScore = 0;

  let playerY =
    canvas.height / 2 -
    paddleHeight / 2;

  let computerY =
    canvas.height / 2 -
    paddleHeight / 2;

  let ballX =
    canvas.width / 2 -
    ballSize / 2;

  let ballY =
    canvas.height / 2 -
    ballSize / 2;

  let ballVX = 5;
  let ballVY = 3;

  let moveUp = false;
  let moveDown = false;


  // ========================================
  // HIGH SCORE
  // ========================================

  const highScoreElement =
    document.querySelector(
      '.high-score[data-game="pong"]'
    );


  let highScore = Number(
    localStorage.getItem(
      "pongHighScore"
    )
  ) || 0;


  function updateHighScoreDisplay() {
    if (highScoreElement) {
      highScoreElement.textContent =
        highScore;
    }
  }


  function saveHighScore() {
    if (playerScore > highScore) {
      highScore =
        playerScore;


      localStorage.setItem(
        "pongHighScore",
        String(highScore)
      );


      updateHighScoreDisplay();
    }
  }


  updateHighScoreDisplay();


  // ========================================
  // SCORE DISPLAY
  // ========================================

  function refreshScore() {
    updateScore(
      `You ${playerScore} - ${computerScore} CPU | ${cpuLevels[cpuLevel].label}`
    );
  }


  // ========================================
  // RESET POSITIONS
  // ========================================

  function centerPlayerPaddle() {
    playerY =
      canvas.height / 2 -
      paddleHeight / 2;
  }


  function centerComputerPaddle() {
    computerY =
      canvas.height / 2 -
      paddleHeight / 2;
  }


  function resetPaddles() {
    centerPlayerPaddle();
    centerComputerPaddle();
  }


  function resetBall(direction = 1) {
    ballX =
      canvas.width / 2 -
      ballSize / 2;


    ballY =
      canvas.height / 2 -
      ballSize / 2;


    const baseSpeed =
      cpuLevels[cpuLevel].ballSpeed;


    ballVX =
      baseSpeed *
      direction;


    const verticalDirection =
      Math.random() < 0.5
        ? -1
        : 1;


    ballVY =
      (
        2.5 +
        Math.random() * 2
      ) *
      verticalDirection;
  }


  // ========================================
  // DRAWING
  // ========================================

  function drawBackground() {
    fillCanvas("#080812");


    ctx.fillStyle =
      "rgba(255, 255, 255, 0.22)";


    const dashHeight = 24;
    const gap = 18;


    for (
      let y = 12;
      y < canvas.height;
      y += dashHeight + gap
    ) {
      ctx.fillRect(
        canvas.width / 2 - 2,
        y,
        4,
        dashHeight
      );
    }
  }


  function drawPaddle(
    x,
    y
  ) {
    ctx.fillStyle =
      "#69f7ff";


    ctx.fillRect(
      x,
      y,
      paddleWidth,
      paddleHeight
    );


    ctx.fillStyle =
      "rgba(255, 255, 255, 0.35)";


    ctx.fillRect(
      x + 3,
      y + 4,
      3,
      paddleHeight - 8
    );
  }


  function drawBall() {
    ctx.fillStyle =
      "#ffffff";


    ctx.beginPath();


    ctx.arc(
      ballX +
        ballSize / 2,
      ballY +
        ballSize / 2,
      ballSize / 2,
      0,
      Math.PI * 2
    );


    ctx.fill();
  }


  function drawScore() {
    ctx.fillStyle =
      "#ffffff";


    ctx.textAlign =
      "center";


    ctx.font =
      "bold 44px system-ui";


    ctx.fillText(
      playerScore,
      canvas.width / 2 - 65,
      65
    );


    ctx.fillText(
      computerScore,
      canvas.width / 2 + 65,
      65
    );


    ctx.font =
      "14px system-ui";


    ctx.fillStyle =
      "rgba(255, 255, 255, 0.7)";


    ctx.fillText(
      "YOU",
      canvas.width / 2 - 65,
      90
    );


    ctx.fillText(
      "CPU",
      canvas.width / 2 + 65,
      90
    );


    ctx.font =
      "15px system-ui";


    ctx.fillStyle =
      "rgba(255, 255, 255, 0.8)";


    ctx.fillText(
      `CPU: ${cpuLevels[cpuLevel].label}`,
      canvas.width / 2,
      120
    );


    ctx.textAlign =
      "start";
  }


  function draw() {
    drawBackground();


    drawPaddle(
      playerX,
      playerY
    );


    drawPaddle(
      computerX,
      computerY
    );


    drawBall();

    drawScore();
  }


  // ========================================
  // PLAYER MOVEMENT
  // ========================================

  function updatePlayer() {
    const playerSpeed =
      cpuLevels[cpuLevel].playerSpeed;


    if (moveUp) {
      playerY -=
        playerSpeed;
    }


    if (moveDown) {
      playerY +=
        playerSpeed;
    }


    playerY =
      Math.max(
        0,
        Math.min(
          canvas.height -
            paddleHeight,
          playerY
        )
      );
  }


  // ========================================
  // COMPUTER MOVEMENT
  // ========================================

  function updateComputer() {
    const settings =
      cpuLevels[cpuLevel];


    if (
      Math.random() >
      settings.reactionChance
    ) {
      return;
    }


    const paddleCenter =
      computerY +
      paddleHeight / 2;


    const ballCenter =
      ballY +
      ballSize / 2;


    const difference =
      ballCenter -
      paddleCenter;


    if (
      difference >
      settings.deadZone
    ) {
      computerY +=
        Math.min(
          settings.cpuSpeed,
          difference
        );
    }


    if (
      difference <
      -settings.deadZone
    ) {
      computerY -=
        Math.min(
          settings.cpuSpeed,
          Math.abs(
            difference
          )
        );
    }


    computerY =
      Math.max(
        0,
        Math.min(
          canvas.height -
            paddleHeight,
          computerY
        )
      );
  }


  // ========================================
  // COLLISION HELPERS
  // ========================================

  function rectanglesOverlap(
    ax,
    ay,
    aw,
    ah,
    bx,
    by,
    bw,
    bh
  ) {
    return (
      ax < bx + bw &&
      ax + aw > bx &&
      ay < by + bh &&
      ay + ah > by
    );
  }


  function bounceOffPaddle(
    paddleY,
    direction
  ) {
    const paddleCenter =
      paddleY +
      paddleHeight / 2;


    const ballCenter =
      ballY +
      ballSize / 2;


    const offset =
      (
        ballCenter -
        paddleCenter
      ) /
      (
        paddleHeight / 2
      );


    const speed =
      Math.min(
        cpuLevels[cpuLevel].ballSpeed + 4,
        Math.max(
          cpuLevels[cpuLevel].ballSpeed,
          Math.abs(
            ballVX
          ) + 0.35
        )
      );


    ballVX =
      speed *
      direction;


    ballVY =
      offset *
      6;


    if (
      Math.abs(ballVY) <
      1.4
    ) {
      ballVY =
        ballVY < 0
          ? -1.4
          : 1.4;
    }
  }


  // ========================================
  // BALL MOVEMENT
  // ========================================

  function updateBall() {
    ballX += ballVX;
    ballY += ballVY;


    if (ballY <= 0) {
      ballY = 0;

      ballVY =
        Math.abs(
          ballVY
        );
    }


    if (
      ballY +
        ballSize >=
      canvas.height
    ) {
      ballY =
        canvas.height -
        ballSize;


      ballVY =
        -Math.abs(
          ballVY
        );
    }


    if (
      ballVX < 0 &&
      rectanglesOverlap(
        ballX,
        ballY,
        ballSize,
        ballSize,
        playerX,
        playerY,
        paddleWidth,
        paddleHeight
      )
    ) {
      ballX =
        playerX +
        paddleWidth;


      bounceOffPaddle(
        playerY,
        1
      );
    }


    if (
      ballVX > 0 &&
      rectanglesOverlap(
        ballX,
        ballY,
        ballSize,
        ballSize,
        computerX,
        computerY,
        paddleWidth,
        paddleHeight
      )
    ) {
      ballX =
        computerX -
        ballSize;


      bounceOffPaddle(
        computerY,
        -1
      );
    }


    // ========================================
    // CPU SCORES
    // ========================================

    if (
      ballX +
        ballSize <
      0
    ) {
      computerScore++;


      centerPlayerPaddle();


      moveUp = false;
      moveDown = false;


      refreshScore();


      resetBall(-1);
    }


    // ========================================
    // PLAYER SCORES
    // ========================================

    if (
      ballX >
      canvas.width
    ) {
      playerScore++;


      saveHighScore();

      refreshScore();


      resetBall(1);
    }
  }


  // ========================================
  // WIN / LOSS
  // ========================================

  function checkGameOver() {
    if (
      playerScore <
        winningScore &&
      computerScore <
        winningScore
    ) {
      return false;
    }


    running = false;


    saveHighScore();


    if (
      playerScore >
      computerScore
    ) {
      showGameOver(
        "You Win!",
        `${playerScore} - ${computerScore}`
      );


      setInstructions(
        `You won on ${cpuLevels[cpuLevel].label}! Press Restart Game to play again. Press 1 Easy, 2 Medium, 3 Hard, or 4 Impossible to change CPU difficulty.`
      );

    } else {

      showGameOver(
        "CPU Wins",
        `${playerScore} - ${computerScore}`
      );


      setInstructions(
        `The ${cpuLevels[cpuLevel].label} CPU won. Press Restart Game to try again. Press 1 Easy, 2 Medium, 3 Hard, or 4 Impossible to change CPU difficulty.`
      );
    }


    return true;
  }


  // ========================================
  // GAME LOOP
  // ========================================

  function gameLoop() {
    if (
      !running ||
      getCurrentGame() !==
        "pong"
    ) {
      return;
    }


    updatePlayer();

    updateComputer();

    updateBall();


    draw();


    if (
      checkGameOver()
    ) {
      return;
    }


    animationFrame =
      requestAnimationFrame(
        gameLoop
      );
  }


  // ========================================
  // KEYBOARD
  // ========================================

  function handleKeyDown(event) {
    if (
      getCurrentGame() !==
      "pong"
    ) {
      return;
    }


    const key =
      event.key.toLowerCase();


    if (key === "1") {
      setCpuLevel("easy");

      refreshScore();

      event.preventDefault();

      return;
    }


    if (key === "2") {
      setCpuLevel("medium");

      refreshScore();

      event.preventDefault();

      return;
    }


    if (key === "3") {
      setCpuLevel("hard");

      refreshScore();

      event.preventDefault();

      return;
    }


    if (key === "4") {
      setCpuLevel(
        "impossible"
      );

      refreshScore();

      event.preventDefault();

      return;
    }


    if (
      key === "w" ||
      event.key ===
        "ArrowUp"
    ) {
      moveUp = true;

      event.preventDefault();
    }


    if (
      key === "s" ||
      event.key ===
        "ArrowDown"
    ) {
      moveDown = true;

      event.preventDefault();
    }
  }


  function handleKeyUp(event) {
    if (
      getCurrentGame() !==
      "pong"
    ) {
      return;
    }


    const key =
      event.key.toLowerCase();


    if (
      key === "w" ||
      event.key ===
        "ArrowUp"
    ) {
      moveUp = false;

      event.preventDefault();
    }


    if (
      key === "s" ||
      event.key ===
        "ArrowDown"
    ) {
      moveDown = false;

      event.preventDefault();
    }
  }


  document.addEventListener(
    "keydown",
    handleKeyDown
  );


  document.addEventListener(
    "keyup",
    handleKeyUp
  );


  // ========================================
  // START
  // ========================================

  function start() {
    stop();


    playerScore = 0;
    computerScore = 0;


    moveUp = false;
    moveDown = false;


    running = true;


    resetPaddles();


    resetBall(
      Math.random() < 0.5
        ? -1
        : 1
    );


    refreshScore();


    setInstructions(
      `Pong: CPU is ${cpuLevels[cpuLevel].label}. Player speed ${cpuLevels[cpuLevel].playerSpeed}, ball speed ${cpuLevels[cpuLevel].ballSpeed}. Use W/S or Arrow Up/Down to move. Press 1 Easy, 2 Medium, 3 Hard, or 4 Impossible. First to 7 points wins.`
    );


    draw();


    animationFrame =
      requestAnimationFrame(
        gameLoop
      );
  }


  // ========================================
  // STOP
  // ========================================

  function stop() {
    running = false;


    moveUp = false;
    moveDown = false;


    if (
      animationFrame !==
      null
    ) {
      cancelAnimationFrame(
        animationFrame
      );


      animationFrame =
        null;
    }
  }


  // ========================================
  // REGISTER
  // ========================================

  arcade.registerGame(
    "pong",
    {
      start,
      stop
    }
  );
})();