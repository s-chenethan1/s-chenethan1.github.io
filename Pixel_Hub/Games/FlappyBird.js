// ========================================
// Pixel Arcade - Flappy Bird-style
// ========================================

(() => {
  const arcade =
    window.PixelArcade;

  if (!arcade) {
    console.error(
      "FlappyBird.js requires game-core.js first."
    );

    return;
  }


  const {
    canvas,
    ctx,
    updateScore,
    setInstructions,
    showGameOver
  } = arcade;


  let running = false;
  let animation = null;
  let score = 0;
  let frame = 0;
  let pipes = [];
  let nextPipeFrame = 90;


  const highScoreElement =
    document.querySelector(
      '.high-score[data-game="flappy"]'
    );


  let highScore =
    Number(
      localStorage.getItem(
        "flappyHighScore"
      )
    ) || 0;


  if (highScoreElement) {
    highScoreElement.textContent =
      highScore;
  }


  const bird = {
    x: 130,

    y:
      canvas.height /
      2,

    width:
      38,

    height:
      28,

    velocityY:
      0,

    gravity:
      0.48,

    flapPower:
      -8.2
  };


  const pipeWidth =
    72;

  const pipeGap =
    170;

  const pipeSpeed =
    3.6;


  // ========================================
  // START
  // ========================================

  function start() {
    running = true;

    score = 0;

    frame = 0;

    pipes = [];

    nextPipeFrame =
      80;


    bird.y =
      canvas.height /
      2 -
      bird.height /
      2;

    bird.velocityY =
      0;


    updateScore(0);


    setInstructions(
      "Flappy Bird-style: Press Space, Arrow Up, W, or click the game canvas to flap. Fly through the pipe gaps."
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
  // FLAP
  // ========================================

  function flap() {
    if (!running) {
      return;
    }


    bird.velocityY =
      bird.flapPower;
  }


  // ========================================
  // CREATE PIPE
  // ========================================

  function createPipePair() {
    const margin =
      70;

    const minTop =
      70;

    const maxTop =
      canvas.height -
      pipeGap -
      margin -
      70;


    const topHeight =
      Math.floor(
        minTop +
        Math.random() *
        (
          maxTop -
          minTop
        )
      );


    pipes.push({
      x:
        canvas.width +
        20,

      topHeight,

      bottomY:
        topHeight +
        pipeGap,

      passed:
        false
    });
  }


  // ========================================
  // UPDATE
  // ========================================

  function update() {
    if (!running) {
      return;
    }


    frame++;


    bird.velocityY +=
      bird.gravity;

    bird.y +=
      bird.velocityY;


    if (
      frame >=
      nextPipeFrame
    ) {
      createPipePair();

      nextPipeFrame =
        frame +
        105;
    }


    pipes.forEach(
      (pipe) => {
        pipe.x -=
          pipeSpeed;


        if (
          !pipe.passed &&
          pipe.x +
          pipeWidth <
          bird.x
        ) {
          pipe.passed =
            true;

          score++;

          updateScore(
            score
          );
        }
      }
    );


    pipes =
      pipes.filter(
        (pipe) =>
          pipe.x +
          pipeWidth >
          -20
      );


    if (
      bird.y <= 0 ||
      bird.y +
      bird.height >=
      canvas.height
    ) {
      endGame();

      return;
    }


    for (
      const pipe
      of pipes
    ) {
      if (
        checkCollision(
          pipe
        )
      ) {
        endGame();

        return;
      }
    }


    drawGame();


    animation =
      requestAnimationFrame(
        update
      );
  }


  // ========================================
  // COLLISION
  // ========================================

  function checkCollision(
    pipe
  ) {
    const paddingX =
      6;

    const paddingY =
      4;


    const birdLeft =
      bird.x +
      paddingX;

    const birdRight =
      bird.x +
      bird.width -
      paddingX;

    const birdTop =
      bird.y +
      paddingY;

    const birdBottom =
      bird.y +
      bird.height -
      paddingY;


    const overlapsX =
      birdRight >
        pipe.x &&
      birdLeft <
        pipe.x +
        pipeWidth;


    if (!overlapsX) {
      return false;
    }


    return (
      birdTop <
        pipe.topHeight ||
      birdBottom >
        pipe.bottomY
    );
  }


  // ========================================
  // DRAW GAME
  // ========================================

  function drawGame() {
    const sky =
      ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height
      );


    sky.addColorStop(
      0,
      "#70c5ce"
    );

    sky.addColorStop(
      1,
      "#dff6f8"
    );


    ctx.fillStyle =
      sky;


    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    ctx.fillStyle =
      "rgba(255,255,255,0.75)";


    for (
      let i = 0;
      i < 4;
      i++
    ) {
      const cloudX =
        (
          (
            i *
            180
          ) -
          (
            frame *
            0.45
          )
        ) %
        (
          canvas.width +
          220
        ) +
        80;


      const cloudY =
        80 +
        i *
        85;


      ctx.beginPath();

      ctx.arc(
        cloudX,
        cloudY,
        24,
        0,
        Math.PI * 2
      );

      ctx.arc(
        cloudX + 28,
        cloudY + 6,
        19,
        0,
        Math.PI * 2
      );

      ctx.arc(
        cloudX - 26,
        cloudY + 8,
        17,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }


    pipes.forEach(
      drawPipePair
    );


    drawBird();


    ctx.fillStyle =
      "#ffffff";

    ctx.strokeStyle =
      "rgba(0,0,0,0.35)";

    ctx.lineWidth = 5;

    ctx.textAlign =
      "center";

    ctx.font =
      "bold 46px system-ui";


    ctx.strokeText(
      String(score),
      canvas.width / 2,
      60
    );

    ctx.fillText(
      String(score),
      canvas.width / 2,
      60
    );


    ctx.textAlign =
      "start";
  }


  // ========================================
  // DRAW PIPES
  // ========================================

  function drawPipePair(
    pipe
  ) {
    const capHeight =
      26;

    const capExtra =
      10;


    ctx.fillStyle =
      "#55c93f";

    ctx.strokeStyle =
      "#2f7d2d";

    ctx.lineWidth = 3;


    ctx.fillRect(
      pipe.x,
      0,
      pipeWidth,
      pipe.topHeight
    );

    ctx.strokeRect(
      pipe.x,
      0,
      pipeWidth,
      pipe.topHeight
    );


    ctx.fillRect(
      pipe.x -
        capExtra / 2,
      pipe.topHeight -
        capHeight,
      pipeWidth +
        capExtra,
      capHeight
    );

    ctx.strokeRect(
      pipe.x -
        capExtra / 2,
      pipe.topHeight -
        capHeight,
      pipeWidth +
        capExtra,
      capHeight
    );


    const bottomHeight =
      canvas.height -
      pipe.bottomY;


    ctx.fillRect(
      pipe.x,
      pipe.bottomY,
      pipeWidth,
      bottomHeight
    );

    ctx.strokeRect(
      pipe.x,
      pipe.bottomY,
      pipeWidth,
      bottomHeight
    );


    ctx.fillRect(
      pipe.x -
        capExtra / 2,
      pipe.bottomY,
      pipeWidth +
        capExtra,
      capHeight
    );

    ctx.strokeRect(
      pipe.x -
        capExtra / 2,
      pipe.bottomY,
      pipeWidth +
        capExtra,
      capHeight
    );
  }


  // ========================================
  // DRAW BIRD
  // ========================================

  function drawBird() {
    const centerX =
      bird.x +
      bird.width /
      2;

    const centerY =
      bird.y +
      bird.height /
      2;


    const angle =
      Math.max(
        -0.45,
        Math.min(
          0.75,
          bird.velocityY *
          0.055
        )
      );


    ctx.save();

    ctx.translate(
      centerX,
      centerY
    );

    ctx.rotate(
      angle
    );


    ctx.fillStyle =
      "#ffd84d";

    ctx.strokeStyle =
      "#b77b18";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.ellipse(
      0,
      0,
      bird.width / 2,
      bird.height / 2,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.stroke();


    ctx.fillStyle =
      "#f2b632";

    ctx.beginPath();

    ctx.ellipse(
      -6,
      5,
      11,
      7,
      -0.2,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
      "#ffffff";

    ctx.beginPath();

    ctx.arc(
      9,
      -5,
      7,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
      "#111111";

    ctx.beginPath();

    ctx.arc(
      11,
      -5,
      3,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
      "#ff7a2f";

    ctx.beginPath();

    ctx.moveTo(
      17,
      0
    );

    ctx.lineTo(
      30,
      4
    );

    ctx.lineTo(
      17,
      8
    );

    ctx.closePath();

    ctx.fill();


    ctx.restore();
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
        "flappyHighScore",
        highScore
      );


      if (highScoreElement) {
        highScoreElement.textContent =
          highScore;
      }
    }


    showGameOver(
      "FLAPPY GAME OVER",
      score
    );


    setInstructions(
      "Flappy Bird-style game over. Press Restart Game to try again."
    );
  }


  // ========================================
  // KEYBOARD CONTROLS
  // ========================================

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        arcade.getCurrentGame() !==
          "flappy" ||
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

        flap();
      }
    }
  );


  // ========================================
  // CLICK / TOUCH CONTROLS
  // ========================================

  canvas.addEventListener(
    "pointerdown",
    () => {
      if (
        arcade.getCurrentGame() ===
          "flappy" &&
        running
      ) {
        flap();
      }
    }
  );


  // ========================================
  // REGISTER
  // ========================================

  arcade.registerGame(
    "flappy",
    {
      start,
      stop
    }
  );
})();