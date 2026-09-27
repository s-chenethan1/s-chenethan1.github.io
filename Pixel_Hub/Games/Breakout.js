// ========================================
// Pixel Arcade - Breakout
// ========================================
// Controls:
//   A / D
//   Left Arrow / Right Arrow
//
// Goal:
//   Bounce the ball with the paddle and
//   destroy every brick.
//
// Levels:
//   Brick formations are randomized.
//   Ball speed increases each level.
//
// Power-ups:
//   +100 Bonus
//   Extra Life
//   Wide Paddle
//   Slow Ball
//   Multi Ball
// ========================================

(function bootBreakout(attempt = 0) {
  const arcade = window.PixelArcade;

  if (!arcade) {
    if (attempt < 100) {
      setTimeout(
        () => bootBreakout(attempt + 1),
        50
      );
    } else {
      console.error(
        "Breakout.js could not find the PixelArcade controller inside games.html."
      );
    }

    return;
  }

  const {
    canvas,
    ctx,
    updateScore,
    setInstructions,
    showGameOver,
    getCurrentGame
  } = arcade;


  // ========================================
  // GAME SETTINGS
  // ========================================

  const normalPaddleWidth = 110;
  const widePaddleWidth = 170;
  const paddleHeight = 16;
  const paddleY = canvas.height - 48;
  const paddleSpeed = 8;

  const ballRadius = 9;
  const startingBallSpeed = 5;
  const speedIncreasePerLevel = 0.65;
  const maximumBallSpeed = 12;

  const brickRows = 6;
  const brickColumns = 9;
  const brickGap = 8;
  const brickHeight = 24;
  const brickTop = 72;
  const brickSideMargin = 30;

  const brickWidth =
    (
      canvas.width -
      brickSideMargin * 2 -
      brickGap * (brickColumns - 1)
    ) /
    brickColumns;

  const powerUpSize = 24;
  const powerUpFallSpeed = 2.5;
  const powerUpChance = 0.22;

  const widePaddleDuration = 9000;
  const slowBallDuration = 6500;


  // ========================================
  // GAME STATE
  // ========================================

  let running = false;
  let animationFrameId = null;

  let paddleX = 0;
  let paddleWidth = normalPaddleWidth;

  let movingLeft = false;
  let movingRight = false;

  let balls = [];
  let bricks = [];
  let powerUps = [];

  let score = 0;
  let lives = 3;
  let level = 1;

  let widePaddleUntil = 0;
  let slowBallUntil = 0;

  let currentBrickPattern = "Classic";
  let previousBrickPattern = "";


  // ========================================
  // HIGH SCORE
  // ========================================

  const highScoreElement =
    document.querySelector(
      '.high-score[data-game="breakout"]'
    );

  let highScore = Number(
    localStorage.getItem(
      "breakoutHighScore"
    )
  ) || 0;


  function updateHighScoreDisplay() {
    if (highScoreElement) {
      highScoreElement.textContent =
        highScore;
    }
  }


  function saveHighScore() {
    if (score > highScore) {
      highScore = score;

      localStorage.setItem(
        "breakoutHighScore",
        String(highScore)
      );

      updateHighScoreDisplay();
    }
  }


  updateHighScoreDisplay();


  // ========================================
  // BRICKS
  // ========================================

  const brickPatterns = [
    {
      name: "Classic",

      shouldPlace(row, column) {
        return true;
      }
    },

    {
      name: "Checkerboard",

      shouldPlace(row, column) {
        return (row + column) % 2 === 0;
      }
    },

    {
      name: "Pyramid",

      shouldPlace(row, column) {
        const center =
          (brickColumns - 1) / 2;

        const distance =
          Math.abs(
            column - center
          );

        const allowedDistance =
          Math.min(
            center,
            row + 1
          );

        return (
          distance <=
          allowedDistance
        );
      }
    },

    {
      name: "Diamond",

      shouldPlace(row, column) {
        const centerColumn =
          (brickColumns - 1) / 2;

        const centerRow =
          (brickRows - 1) / 2;

        const horizontal =
          Math.abs(
            column -
              centerColumn
          ) / 1.35;

        const vertical =
          Math.abs(
            row - centerRow
          );

        return (
          horizontal +
            vertical <=
          3.6
        );
      }
    },

    {
      name: "Stripes",

      shouldPlace(row, column) {
        return (
          column % 2 === 0 ||
          row === brickRows - 1
        );
      }
    },

    {
      name: "Wave",

      shouldPlace(row, column) {
        const waveRow =
          Math.round(
            2.3 +
            Math.sin(
              column * 0.9
            ) * 1.65
          );

        return (
          Math.abs(
            row - waveRow
          ) <= 1
        );
      }
    },

    {
      name: "Fortress",

      shouldPlace(row, column) {
        const edge =
          column === 0 ||
          column === brickColumns - 1;

        const tower =
          column === 2 ||
          column === brickColumns - 3;

        const floor =
          row === brickRows - 1;

        const roof =
          row === 0 &&
          column >= 2 &&
          column <= brickColumns - 3;

        return (
          edge ||
          floor ||
          roof ||
          (tower && row >= 2)
        );
      }
    },

    {
      name: "Scatter",

      shouldPlace(row, column) {
        const guaranteedEdge =
          row === brickRows - 1 &&
          column % 2 === 0;

        return (
          guaranteedEdge ||
          Math.random() > 0.34
        );
      }
    }
  ];


  function chooseBrickPattern() {
    let choices =
      brickPatterns.filter(
        (pattern) =>
          pattern.name !==
          previousBrickPattern
      );


    if (choices.length === 0) {
      choices = brickPatterns;
    }


    const pattern =
      choices[
        Math.floor(
          Math.random() *
          choices.length
        )
      ];


    previousBrickPattern =
      pattern.name;

    currentBrickPattern =
      pattern.name;


    return pattern;
  }


  function createBricks() {
    bricks = [];

    const pattern =
      chooseBrickPattern();


    for (
      let row = 0;
      row < brickRows;
      row++
    ) {
      for (
        let column = 0;
        column < brickColumns;
        column++
      ) {
        if (
          !pattern.shouldPlace(
            row,
            column
          )
        ) {
          continue;
        }


        bricks.push({
          x:
            brickSideMargin +
            column *
              (brickWidth + brickGap),

          y:
            brickTop +
            row *
              (brickHeight + brickGap),

          width: brickWidth,
          height: brickHeight,
          row,
          column,
          active: true
        });
      }
    }


    if (bricks.length < 18) {
      createFallbackBricks();
    }
  }


  function createFallbackBricks() {
    bricks = [];

    currentBrickPattern =
      "Classic";


    for (
      let row = 0;
      row < brickRows;
      row++
    ) {
      for (
        let column = 0;
        column < brickColumns;
        column++
      ) {
        bricks.push({
          x:
            brickSideMargin +
            column *
              (brickWidth + brickGap),

          y:
            brickTop +
            row *
              (brickHeight + brickGap),

          width: brickWidth,
          height: brickHeight,
          row,
          column,
          active: true
        });
      }
    }
  }


  function activeBrickCount() {
    return bricks.filter(
      (brick) => brick.active
    ).length;
  }


  // ========================================
  // BALLS + PADDLE
  // ========================================

  function resetPaddle() {
    paddleWidth =
      Date.now() < widePaddleUntil
        ? widePaddleWidth
        : normalPaddleWidth;

    paddleX =
      canvas.width / 2 -
      paddleWidth / 2;
  }


  function getLevelBallSpeed() {
    return Math.min(
      maximumBallSpeed,
      startingBallSpeed +
        (level - 1) *
          speedIncreasePerLevel
    );
  }


  function makeBall(
    x,
    y,
    direction = 1,
    verticalDirection = -1
  ) {
    const speed =
      getLevelBallSpeed();

    const vx =
      speed *
      0.72 *
      direction;

    const vy =
      Math.sqrt(
        Math.max(
          1,
          speed * speed -
            vx * vx
        )
      ) *
      verticalDirection;

    return {
      x,
      y,
      vx,
      vy,
      radius: ballRadius,
      active: true
    };
  }


  function resetBalls(
    direction =
      Math.random() < 0.5
        ? -1
        : 1
  ) {
    balls = [
      makeBall(
        canvas.width / 2,
        paddleY - 28,
        direction,
        -1
      )
    ];
  }


  function addMultiBall() {
    if (balls.length === 0) {
      resetBalls();
      return;
    }

    const source =
      balls.find(
        (ball) => ball.active
      );

    if (!source) {
      return;
    }

    const speed =
      Math.sqrt(
        source.vx * source.vx +
        source.vy * source.vy
      );

    const angleOffset =
      Math.PI / 7;

    const baseAngle =
      Math.atan2(
        source.vy,
        source.vx
      );

    const angles = [
      baseAngle - angleOffset,
      baseAngle + angleOffset
    ];

    angles.forEach(
      (angle) => {
        balls.push({
          x: source.x,
          y: source.y,

          vx:
            Math.cos(angle) *
            speed,

          vy:
            Math.sin(angle) *
            speed,

          radius: ballRadius,
          active: true
        });
      }
    );
  }


  // ========================================
  // POWER-UPS
  // ========================================

  const powerUpTypes = [
    "bonus",
    "life",
    "wide",
    "slow",
    "multi"
  ];


  function maybeDropPowerUp(brick) {
    if (
      Math.random() >
      powerUpChance
    ) {
      return;
    }

    const type =
      powerUpTypes[
        Math.floor(
          Math.random() *
          powerUpTypes.length
        )
      ];

    powerUps.push({
      x:
        brick.x +
        brick.width / 2 -
        powerUpSize / 2,

      y:
        brick.y +
        brick.height / 2 -
        powerUpSize / 2,

      width: powerUpSize,
      height: powerUpSize,
      type,
      active: true
    });
  }


  function getPowerUpLabel(type) {
    const labels = {
      bonus: "+100",
      life: "+1",
      wide: "W",
      slow: "S",
      multi: "×3"
    };

    return labels[type] || "?";
  }


  function getPowerUpColor(type) {
    const colors = {
      bonus: "#ffd75e",
      life: "#4dff88",
      wide: "#69f7ff",
      slow: "#c45bff",
      multi: "#ff667d"
    };

    return colors[type] || "#ffffff";
  }


  function activatePowerUp(type) {
    if (type === "bonus") {
      score += 100;

      saveHighScore();
      updateScore(score);

      setInstructions(
        "Bonus collected: +100 points!"
      );

      return;
    }


    if (type === "life") {
      lives++;

      setInstructions(
        `Extra life collected! You now have ${lives} lives.`
      );

      return;
    }


    if (type === "wide") {
      widePaddleUntil =
        Date.now() +
        widePaddleDuration;

      const center =
        paddleX +
        paddleWidth / 2;

      paddleWidth =
        widePaddleWidth;

      paddleX =
        center -
        paddleWidth / 2;

      paddleX =
        Math.max(
          0,
          Math.min(
            canvas.width -
              paddleWidth,
            paddleX
          )
        );

      setInstructions(
        "Wide Paddle power-up collected!"
      );

      return;
    }


    if (type === "slow") {
      slowBallUntil =
        Date.now() +
        slowBallDuration;

      balls.forEach(
        (ball) => {
          const speed =
            Math.sqrt(
              ball.vx * ball.vx +
              ball.vy * ball.vy
            );

          if (speed === 0) {
            return;
          }

          const targetSpeed =
            Math.max(
              3.2,
              speed * 0.72
            );

          const scale =
            targetSpeed /
            speed;

          ball.vx *= scale;
          ball.vy *= scale;
        }
      );

      setInstructions(
        "Slow Ball power-up collected!"
      );

      return;
    }


    if (type === "multi") {
      addMultiBall();

      setInstructions(
        "Multi Ball collected! Three balls are now in play."
      );
    }
  }


  function updatePowerUps() {
    for (
      const item of powerUps
    ) {
      if (!item.active) {
        continue;
      }

      item.y +=
        powerUpFallSpeed;


      const caught =
        item.y +
          item.height >=
          paddleY &&

        item.y <=
          paddleY +
          paddleHeight &&

        item.x +
          item.width >=
          paddleX &&

        item.x <=
          paddleX +
          paddleWidth;


      if (caught) {
        item.active = false;

        activatePowerUp(
          item.type
        );

        continue;
      }


      if (
        item.y >
        canvas.height
      ) {
        item.active = false;
      }
    }


    powerUps =
      powerUps.filter(
        (item) => item.active
      );
  }


  function updateTimedEffects() {
    if (
      Date.now() >
        widePaddleUntil &&
      paddleWidth !==
        normalPaddleWidth
    ) {
      const center =
        paddleX +
        paddleWidth / 2;

      paddleWidth =
        normalPaddleWidth;

      paddleX =
        center -
        paddleWidth / 2;

      paddleX =
        Math.max(
          0,
          Math.min(
            canvas.width -
              paddleWidth,
            paddleX
          )
        );
    }


    if (
      Date.now() >
      slowBallUntil
    ) {
      slowBallUntil = 0;
    }
  }


  // ========================================
  // COLLISION HELPERS
  // ========================================

  function circleHitsRectangle(
    circleX,
    circleY,
    radius,
    rectangle
  ) {
    const closestX =
      Math.max(
        rectangle.x,
        Math.min(
          circleX,
          rectangle.x +
            rectangle.width
        )
      );

    const closestY =
      Math.max(
        rectangle.y,
        Math.min(
          circleY,
          rectangle.y +
            rectangle.height
        )
      );

    const differenceX =
      circleX -
      closestX;

    const differenceY =
      circleY -
      closestY;

    return (
      differenceX *
        differenceX +
      differenceY *
        differenceY <=
      radius *
        radius
    );
  }


  function handleWallCollisions(ball) {
    if (
      ball.x -
        ball.radius <=
        0 &&
      ball.vx < 0
    ) {
      ball.x =
        ball.radius;

      ball.vx =
        Math.abs(
          ball.vx
        );
    }


    if (
      ball.x +
        ball.radius >=
        canvas.width &&
      ball.vx > 0
    ) {
      ball.x =
        canvas.width -
        ball.radius;

      ball.vx =
        -Math.abs(
          ball.vx
        );
    }


    if (
      ball.y -
        ball.radius <=
        0 &&
      ball.vy < 0
    ) {
      ball.y =
        ball.radius;

      ball.vy =
        Math.abs(
          ball.vy
        );
    }
  }


  function handlePaddleCollision(ball) {
    const paddle = {
      x: paddleX,
      y: paddleY,
      width: paddleWidth,
      height: paddleHeight
    };


    if (
      ball.vy > 0 &&
      circleHitsRectangle(
        ball.x,
        ball.y,
        ball.radius,
        paddle
      )
    ) {
      ball.y =
        paddleY -
        ball.radius -
        1;


      const paddleCenter =
        paddleX +
        paddleWidth / 2;


      const relativeHit =
        Math.max(
          -1,
          Math.min(
            1,
            (
              ball.x -
              paddleCenter
            ) /
              (
                paddleWidth /
                2
              )
          )
        );


      const currentSpeed =
        Math.min(
          maximumBallSpeed,
          Math.sqrt(
            ball.vx *
              ball.vx +
            ball.vy *
              ball.vy
          ) +
            0.08
        );


      ball.vx =
        currentSpeed *
        0.82 *
        relativeHit;


      if (
        Math.abs(
          ball.vx
        ) < 1.5
      ) {
        ball.vx =
          1.5 *
          (
            relativeHit < 0
              ? -1
              : 1
          );
      }


      ball.vy =
        -Math.sqrt(
          Math.max(
            1,
            currentSpeed *
              currentSpeed -
            ball.vx *
              ball.vx
          )
        );
    }
  }


  function handleBrickCollisions(ball) {
    for (
      const brick of bricks
    ) {
      if (!brick.active) {
        continue;
      }


      if (
        !circleHitsRectangle(
          ball.x,
          ball.y,
          ball.radius,
          brick
        )
      ) {
        continue;
      }


      brick.active = false;

      score +=
        10 *
        level;

      saveHighScore();
      updateScore(score);

      maybeDropPowerUp(
        brick
      );


      const brickCenterX =
        brick.x +
        brick.width / 2;

      const brickCenterY =
        brick.y +
        brick.height / 2;


      const horizontalDistance =
        (
          ball.x -
          brickCenterX
        ) /
        (
          brick.width / 2 +
          ball.radius
        );


      const verticalDistance =
        (
          ball.y -
          brickCenterY
        ) /
        (
          brick.height / 2 +
          ball.radius
        );


      if (
        Math.abs(
          horizontalDistance
        ) >
        Math.abs(
          verticalDistance
        )
      ) {
        ball.vx *= -1;
      } else {
        ball.vy *= -1;
      }


      break;
    }
  }


  // ========================================
  // GAME EVENTS
  // ========================================

  function loseLife() {
    lives--;

    movingLeft = false;
    movingRight = false;


    if (
      lives <= 0
    ) {
      endGame();

      return;
    }


    powerUps = [];

    resetPaddle();

    resetBalls(
      Math.random() < 0.5
        ? -1
        : 1
    );


    setInstructions(
      `Breakout: ${lives} ${lives === 1 ? "life" : "lives"} left. Use A/D or Left/Right to move the paddle.`
    );
  }


  function completeLevel() {
    level++;

    powerUps = [];

    createBricks();
    resetPaddle();

    resetBalls(
      Math.random() < 0.5
        ? -1
        : 1
    );


    const levelSpeed =
      getLevelBallSpeed().toFixed(1);


    setInstructions(
      `Breakout Level ${level}! ${currentBrickPattern} brick layout. Ball speed: ${levelSpeed}. Clear every brick.`
    );
  }


  function endGame() {
    running = false;

    saveHighScore();

    showGameOver(
      "Breakout - Game Over",
      score
    );


    setInstructions(
      "Breakout ended. Press Restart Game to try again."
    );
  }


  // ========================================
  // UPDATE
  // ========================================

  function updatePaddle() {
    if (movingLeft) {
      paddleX -=
        paddleSpeed;
    }


    if (movingRight) {
      paddleX +=
        paddleSpeed;
    }


    paddleX =
      Math.max(
        0,
        Math.min(
          canvas.width -
            paddleWidth,
          paddleX
        )
      );
  }


  function updateBalls() {
    let activeBallCount = 0;


    for (
      const ball of balls
    ) {
      if (!ball.active) {
        continue;
      }


      ball.x +=
        ball.vx;

      ball.y +=
        ball.vy;


      handleWallCollisions(
        ball
      );

      handlePaddleCollision(
        ball
      );

      handleBrickCollisions(
        ball
      );


      if (
        ball.y -
          ball.radius >
        canvas.height
      ) {
        ball.active = false;
      } else {
        activeBallCount++;
      }
    }


    balls =
      balls.filter(
        (ball) => ball.active
      );


    if (
      activeBallCount === 0
    ) {
      loseLife();

      return;
    }


    if (
      activeBrickCount() === 0
    ) {
      completeLevel();
    }
  }


  function update() {
    updateTimedEffects();
    updatePaddle();
    updateBalls();
    updatePowerUps();
  }


  // ========================================
  // DRAWING
  // ========================================

  function brickColor(row) {
    const colors = [
      "#69f7ff",
      "#c45bff",
      "#4dff88",
      "#ffd75e",
      "#ff8d5c",
      "#ff667d"
    ];


    return colors[
      row %
      colors.length
    ];
  }


  function drawBackground() {
    ctx.fillStyle =
      "#080812";


    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    ctx.strokeStyle =
      "rgba(105, 247, 255, 0.055)";


    ctx.lineWidth = 1;


    for (
      let x = 0;
      x <= canvas.width;
      x += 30
    ) {
      ctx.beginPath();

      ctx.moveTo(
        x,
        0
      );

      ctx.lineTo(
        x,
        canvas.height
      );

      ctx.stroke();
    }


    for (
      let y = 0;
      y <= canvas.height;
      y += 30
    ) {
      ctx.beginPath();

      ctx.moveTo(
        0,
        y
      );

      ctx.lineTo(
        canvas.width,
        y
      );

      ctx.stroke();
    }
  }


  function drawHeader() {
    ctx.fillStyle =
      "#ffffff";


    ctx.textAlign =
      "left";


    ctx.textBaseline =
      "alphabetic";


    ctx.font =
      "bold 26px system-ui";


    ctx.fillText(
      "BREAKOUT",
      22,
      37
    );


    ctx.textAlign =
      "right";


    ctx.font =
      "bold 17px system-ui";


    ctx.fillStyle =
      "#69f7ff";


    ctx.fillText(
      `Score ${score} • Lives ${lives} • Level ${level}`,
      canvas.width - 22,
      35
    );


    ctx.textAlign =
      "left";


    ctx.font =
      "12px system-ui";


    ctx.fillStyle =
      "rgba(255,255,255,0.58)";


    ctx.fillText(
      `Layout: ${currentBrickPattern} • Speed: ${getLevelBallSpeed().toFixed(1)}`,
      22,
      57
    );


    ctx.textAlign =
      "start";
  }


  function drawBricks() {
    for (
      const brick of bricks
    ) {
      if (!brick.active) {
        continue;
      }


      ctx.fillStyle =
        brickColor(
          brick.row
        );


      ctx.fillRect(
        brick.x,
        brick.y,
        brick.width,
        brick.height
      );


      ctx.fillStyle =
        "rgba(255, 255, 255, 0.22)";


      ctx.fillRect(
        brick.x + 3,
        brick.y + 3,
        Math.max(
          0,
          brick.width - 6
        ),
        4
      );
    }
  }


  function drawPaddle() {
    ctx.shadowColor =
      "#69f7ff";


    ctx.shadowBlur =
      12;


    ctx.fillStyle =
      "#69f7ff";


    ctx.fillRect(
      paddleX,
      paddleY,
      paddleWidth,
      paddleHeight
    );


    ctx.shadowBlur =
      0;


    ctx.fillStyle =
      "rgba(255, 255, 255, 0.5)";


    ctx.fillRect(
      paddleX + 8,
      paddleY + 3,
      Math.max(
        0,
        paddleWidth - 16
      ),
      3
    );
  }


  function drawBalls() {
    for (
      const ball of balls
    ) {
      ctx.shadowColor =
        "#ffffff";


      ctx.shadowBlur =
        13;


      ctx.fillStyle =
        "#ffffff";


      ctx.beginPath();


      ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
      );


      ctx.fill();


      ctx.shadowBlur =
        0;
    }
  }


  function drawPowerUps() {
    for (
      const item of powerUps
    ) {
      const color =
        getPowerUpColor(
          item.type
        );


      ctx.shadowColor =
        color;

      ctx.shadowBlur =
        10;


      ctx.fillStyle =
        color;


      ctx.fillRect(
        item.x,
        item.y,
        item.width,
        item.height
      );


      ctx.shadowBlur =
        0;


      ctx.fillStyle =
        "#080812";


      ctx.textAlign =
        "center";


      ctx.textBaseline =
        "middle";


      ctx.font =
        item.type === "bonus"
          ? "bold 9px system-ui"
          : "bold 13px system-ui";


      ctx.fillText(
        getPowerUpLabel(
          item.type
        ),
        item.x +
          item.width / 2,
        item.y +
          item.height / 2 +
          1
      );
    }


    ctx.textAlign =
      "start";

    ctx.textBaseline =
      "alphabetic";
  }


  function drawPowerUpLegend() {
    const legend =
      "Drops: +100 Bonus • +1 Life • W Wide • S Slow • ×3 Multi";


    ctx.fillStyle =
      "rgba(255,255,255,0.58)";


    ctx.font =
      "12px system-ui";


    ctx.textAlign =
      "center";


    ctx.fillText(
      legend,
      canvas.width / 2,
      canvas.height - 8
    );


    ctx.textAlign =
      "start";
  }


  function draw() {
    drawBackground();
    drawHeader();
    drawBricks();
    drawPowerUps();
    drawPaddle();
    drawBalls();
    drawPowerUpLegend();
  }


  // ========================================
  // GAME LOOP
  // ========================================

  function gameLoop() {
    if (
      !running ||
      getCurrentGame() !==
        "breakout"
    ) {
      return;
    }


    update();
    draw();


    animationFrameId =
      requestAnimationFrame(
        gameLoop
      );
  }


  // ========================================
  // INPUT
  // ========================================

  function handleKeyDown(
    event
  ) {
    if (
      !running ||
      getCurrentGame() !==
        "breakout"
    ) {
      return;
    }


    const key =
      event.key.toLowerCase();


    if (
      key === "arrowleft" ||
      key === "a"
    ) {
      event.preventDefault();

      movingLeft = true;
    }


    if (
      key === "arrowright" ||
      key === "d"
    ) {
      event.preventDefault();

      movingRight = true;
    }
  }


  function handleKeyUp(
    event
  ) {
    const key =
      event.key.toLowerCase();


    if (
      key === "arrowleft" ||
      key === "a"
    ) {
      movingLeft = false;
    }


    if (
      key === "arrowright" ||
      key === "d"
    ) {
      movingRight = false;
    }
  }


  window.addEventListener(
    "keydown",
    handleKeyDown,
    {
      passive: false
    }
  );


  window.addEventListener(
    "keyup",
    handleKeyUp
  );


  // ========================================
  // GAME LIFECYCLE
  // ========================================

  function start() {
    if (
      animationFrameId
    ) {
      cancelAnimationFrame(
        animationFrameId
      );
    }


    running = true;

    score = 0;
    lives = 3;
    level = 1;

    movingLeft = false;
    movingRight = false;

    widePaddleUntil = 0;
    slowBallUntil = 0;

    previousBrickPattern = "";
    currentBrickPattern = "Classic";

    paddleWidth =
      normalPaddleWidth;

    powerUps = [];

    createBricks();

    resetPaddle();

    resetBalls(
      Math.random() < 0.5
        ? -1
        : 1
    );


    updateScore(
      score
    );


    setInstructions(
      `Breakout Level 1: ${currentBrickPattern} brick layout. Use A/D or Left/Right. Each new level gets a new randomized layout and a faster ball. Catch falling power-ups for bonuses.`
    );


    draw();


    canvas.focus({
      preventScroll: true
    });


    animationFrameId =
      requestAnimationFrame(
        gameLoop
      );
  }


  function stop() {
    running = false;

    movingLeft = false;
    movingRight = false;

    powerUps = [];


    if (
      animationFrameId
    ) {
      cancelAnimationFrame(
        animationFrameId
      );

      animationFrameId = null;
    }
  }


  // ========================================
  // REGISTER GAME
  // ========================================

  arcade.registerGame(
    "breakout",
    {
      start,
      stop
    }
  );
})(0);