// ========================================
// Pixel Arcade - T-Rex / Dino Game
// ========================================

(() => {
  const arcade =
    window.PixelArcade;

  if (!arcade) {
    console.error(
      "T-Rex-game.js requires game-core.js first."
    );

    return;
  }


  const {
    canvas,
    ctx,
    updateScore,
    setInstructions,
    fillCanvas,
    showGameOver
  } = arcade;


  let running = false;
  let animation = null;
  let score = 0;
  let speed = 6;
  let frame = 0;
  let nextObstacleFrame = 90;
  let obstacles = [];


  const groundY =
    canvas.height -
    100;


  const dino = {
    x: 90,

    y:
      groundY -
      55,

    width:
      45,

    height:
      55,

    velocityY:
      0,

    gravity:
      0.8,

    jumpPower:
      -15,

    jumping:
      false
  };


  const highScoreElement =
    document.querySelector(
      '.high-score[data-game="dino"]'
    );


  let highScore =
    Number(
      localStorage.getItem(
        "dinoHighScore"
      )
    ) || 0;


  if (highScoreElement) {
    highScoreElement.textContent =
      highScore;
  }


  // ========================================
  // START
  // ========================================

  function start() {
    running = true;

    score = 0;

    speed = 6;

    frame = 0;

    nextObstacleFrame =
      90;

    obstacles = [];


    dino.y =
      groundY -
      dino.height;

    dino.velocityY =
      0;

    dino.jumping =
      false;


    updateScore(0);


    setInstructions(
      "Dino Mode: Press Space, Arrow Up, or W to jump. Avoid cactus groups and flying pterosaurs. The game gets faster as you progress."
    );


    drawGame();


    animation =
      requestAnimationFrame(
        update
      );
  }


  // ========================================
  // STOP
  // ========================================

  function stop() {
    running = false;


    if (animation) {
      cancelAnimationFrame(
        animation
      );
    }


    animation = null;
  }


  // ========================================
  // JUMP
  // ========================================

  function jump() {
    if (
      !running ||
      dino.jumping
    ) {
      return;
    }


    dino.velocityY =
      dino.jumpPower;

    dino.jumping =
      true;
  }


  // ========================================
  // UPDATE
  // ========================================

  function update() {
    if (!running) {
      return;
    }


    frame++;


    dino.velocityY +=
      dino.gravity;

    dino.y +=
      dino.velocityY;


    if (
      dino.y +
      dino.height >=
      groundY
    ) {
      dino.y =
        groundY -
        dino.height;

      dino.velocityY =
        0;

      dino.jumping =
        false;
    }


    if (
      frame >=
      nextObstacleFrame
    ) {
      createRandomObstacle();


      nextObstacleFrame =
        frame +
        Math.floor(
          80 +
          Math.random() *
          70
        );
    }


    obstacles.forEach(
      (obstacle) => {
        obstacle.x -=
          speed;
      }
    );


    obstacles =
      obstacles.filter(
        (obstacle) =>
          obstacle.x +
          obstacle.width >
          -30
      );


    for (
      const obstacle
      of obstacles
    ) {
      if (
        checkCollision(
          dino,
          obstacle
        )
      ) {
        endGame();

        return;
      }
    }


    if (
      frame %
      6 ===
      0
    ) {
      score++;

      updateScore(
        score
      );
    }


    // ========================================
    // GET FASTER AS PLAYER PROGRESSES
    // ========================================

    if (
      frame %
      250 ===
      0 &&
      speed <
      14
    ) {
      speed +=
        0.35;
    }


    drawGame();


    animation =
      requestAnimationFrame(
        update
      );
  }


  // ========================================
  // OBSTACLES
  // ========================================

  function createRandomObstacle() {
    const random =
      Math.random();


    if (
      random < 0.30
    ) {
      createCactusGroup(1);
    } else if (
      random < 0.52
    ) {
      createCactusGroup(2);
    } else if (
      random < 0.65
    ) {
      createCactusGroup(3);
    } else if (
      random < 0.83
    ) {
      createPterosaur(
        "low"
      );
    } else {
      createPterosaur(
        "high"
      );
    }
  }


  function createCactusGroup(
    count
  ) {
    const cactusWidth =
      22;

    const gap = 3;

    const height =
      45 +
      Math.random() *
      30;


    const totalWidth =
      count *
      cactusWidth +
      (count - 1) *
      gap;


    obstacles.push({
      type:
        "cactus",

      x:
        canvas.width +
        20,

      y:
        groundY -
        height,

      width:
        totalWidth,

      height,

      count,

      cactusWidth,

      gap
    });
  }


  function createPterosaur(
    heightType
  ) {
    obstacles.push({
      type:
        "pterosaur",

      x:
        canvas.width +
        20,

      y:
        heightType ===
        "low"
          ? groundY - 85
          : groundY - 145,

      width:
        50,

      height:
        28
    });
  }


  // ========================================
  // COLLISION
  // ========================================

  function checkCollision(
    player,
    obstacle
  ) {
    const playerPadding =
      7;

    const obstaclePadding =
      obstacle.type ===
      "pterosaur"
        ? 5
        : 3;


    return (
      player.x +
        playerPadding <
      obstacle.x +
        obstacle.width -
        obstaclePadding &&

      player.x +
        player.width -
        playerPadding >
      obstacle.x +
        obstaclePadding &&

      player.y +
        playerPadding <
      obstacle.y +
        obstacle.height -
        obstaclePadding &&

      player.y +
        player.height -
        playerPadding >
      obstacle.y +
        obstaclePadding
    );
  }


  // ========================================
  // DRAW GAME
  // ========================================

  function drawGame() {
    fillCanvas(
      "#f7f7f7"
    );


    ctx.strokeStyle =
      "#535353";

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(
      0,
      groundY
    );

    ctx.lineTo(
      canvas.width,
      groundY
    );

    ctx.stroke();


    ctx.fillStyle =
      "#777777";


    for (
      let x = 0;
      x <
      canvas.width + 70;
      x += 70
    ) {
      const offset =
        (
          frame *
          speed
        ) %
        70;


      ctx.fillRect(
        x - offset,
        groundY + 14,
        22,
        3
      );
    }


    drawDino();


    obstacles.forEach(
      (obstacle) => {
        if (
          obstacle.type ===
          "cactus"
        ) {
          drawCactusGroup(
            obstacle
          );
        } else {
          drawPterosaur(
            obstacle
          );
        }
      }
    );


    ctx.fillStyle =
      "#535353";

    ctx.font =
      "bold 24px monospace";

    ctx.textAlign =
      "right";


    ctx.fillText(
      String(
        score
      ).padStart(
        5,
        "0"
      ),
      canvas.width - 20,
      40
    );


    ctx.textAlign =
      "start";
  }


  // ========================================
  // DINO DESIGN
  // ========================================

  function drawDino() {
    ctx.fillStyle =
      "#535353";


    ctx.fillRect(
      dino.x,
      dino.y + 18,
      30,
      30
    );


    ctx.fillRect(
      dino.x + 20,
      dino.y,
      27,
      27
    );


    ctx.fillRect(
      dino.x + 40,
      dino.y + 8,
      10,
      12
    );


    ctx.beginPath();

    ctx.moveTo(
      dino.x,
      dino.y + 23
    );

    ctx.lineTo(
      dino.x - 18,
      dino.y + 15
    );

    ctx.lineTo(
      dino.x,
      dino.y + 35
    );

    ctx.fill();


    ctx.fillStyle =
      "#ffffff";

    ctx.fillRect(
      dino.x + 35,
      dino.y + 6,
      4,
      4
    );


    ctx.fillStyle =
      "#535353";


    const legFrame =
      dino.jumping ||
      Math.floor(
        frame / 8
      ) %
      2 ===
      0;


    ctx.fillRect(
      dino.x + 5,
      dino.y + 45,
      7,
      legFrame
        ? 10
        : 6
    );


    ctx.fillRect(
      dino.x + 23,
      dino.y + 45,
      7,
      legFrame
        ? 6
        : 10
    );
  }


  // ========================================
  // CACTUS
  // ========================================

  function drawCactusGroup(
    obstacle
  ) {
    for (
      let i = 0;
      i <
      obstacle.count;
      i++
    ) {
      const x =
        obstacle.x +
        i *
        (
          obstacle.cactusWidth +
          obstacle.gap
        );


      drawSingleCactus(
        x,
        obstacle.y,
        obstacle.cactusWidth,
        obstacle.height
      );
    }
  }


  function drawSingleCactus(
    x,
    y,
    width,
    height
  ) {
    ctx.fillStyle =
      "#535353";


    ctx.fillRect(
      x,
      y,
      width,
      height
    );


    ctx.fillRect(
      x - 7,
      y +
        height * 0.4,
      9,
      7
    );


    ctx.fillRect(
      x - 7,
      y +
        height * 0.25,
      6,
      height * 0.2
    );


    ctx.fillRect(
      x +
        width -
        2,
      y +
        height * 0.55,
      9,
      7
    );
  }


  // ========================================
  // PTEROSAUR
  // ========================================

  function drawPterosaur(
    obstacle
  ) {
    ctx.fillStyle =
      "#535353";


    const wingUp =
      Math.floor(
        frame / 10
      ) %
      2 ===
      0;


    ctx.fillRect(
      obstacle.x + 12,
      obstacle.y + 10,
      28,
      10
    );


    ctx.fillRect(
      obstacle.x + 35,
      obstacle.y + 7,
      13,
      11
    );


    ctx.beginPath();

    ctx.moveTo(
      obstacle.x + 48,
      obstacle.y + 10
    );

    ctx.lineTo(
      obstacle.x + 58,
      obstacle.y + 14
    );

    ctx.lineTo(
      obstacle.x + 48,
      obstacle.y + 17
    );

    ctx.fill();


    ctx.beginPath();

    ctx.moveTo(
      obstacle.x + 28,
      obstacle.y +
        (
          wingUp
            ? 11
            : 17
        )
    );

    ctx.lineTo(
      obstacle.x + 18,
      obstacle.y +
        (
          wingUp
            ? -10
            : 35
        )
    );

    ctx.lineTo(
      obstacle.x + 38,
      obstacle.y + 18
    );

    ctx.fill();
  }


  // ========================================
  // GAME OVER
  // ========================================

  function endGame() {
    stop();


    if (
      score >
      highScore
    ) {
      highScore =
        score;


      localStorage.setItem(
        "dinoHighScore",
        highScore
      );


      if (highScoreElement) {
        highScoreElement.textContent =
          highScore;
      }
    }


    showGameOver(
      "DINO GAME OVER",
      score
    );


    setInstructions(
      "Dino game over. Press Restart Game to play again."
    );
  }


  // ========================================
  // CONTROLS
  // ========================================

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        arcade.getCurrentGame() !==
          "dino" ||
        !running
      ) {
        return;
      }


      const key =
        event.key.toLowerCase();


      if (
        event.code === "Space" ||
        event.key === "ArrowUp" ||
        key === "w"
      ) {
        event.preventDefault();

        jump();
      }
    }
  );


  // ========================================
  // REGISTER
  // ========================================

  arcade.registerGame(
    "dino",
    {
      start,
      stop
    }
  );
})();