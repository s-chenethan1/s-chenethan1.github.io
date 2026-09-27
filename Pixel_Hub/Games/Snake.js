// ========================================
// Pixel Arcade - Snake
// ========================================

(() => {
  const arcade =
    window.PixelArcade;

  if (!arcade) {
    console.error(
      "Snake.js requires game-core.js first."
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


  const gridSize = 20;

  const tileSize =
    canvas.width /
    gridSize;

  let snake = [];

  let food = {
    x: 5,
    y: 5
  };

  let direction =
    "right";

  let nextDirection =
    "right";

  let score = 0;

  let running = false;

  let gameLoop = null;


  const highScoreElement =
    document.querySelector(
      '.high-score[data-game="snake"]'
    );

  let highScore =
    Number(
      localStorage.getItem(
        "snakeHighScore"
      )
    ) || 0;

  if (highScoreElement) {
    highScoreElement.textContent =
      highScore;
  }


  // ========================================
  // OPTIONAL CUSTOM IMAGES
  // ========================================

  const snakeHeadImage =
    new Image();

  snakeHeadImage.src =
    "images/snake-head.png";


  const snakeBodyImage =
    new Image();

  snakeBodyImage.src =
    "images/snake-body.png";


  const appleImage =
    new Image();

  appleImage.src =
    "images/apple.png";


  function imageReady(image) {
    return (
      image.complete &&
      image.naturalWidth > 0
    );
  }


  // ========================================
  // START
  // ========================================

  function start() {
    running = true;

    snake = [
      {
        x: 10,
        y: 10
      },
      {
        x: 9,
        y: 10
      },
      {
        x: 8,
        y: 10
      }
    ];

    direction =
      "right";

    nextDirection =
      "right";

    score = 0;

    createFood();

    updateScore(0);

    setInstructions(
      "Snake Mode: Use Arrow Keys or WASD. Eat apples and avoid walls and your own body."
    );

    draw();

    gameLoop =
      setInterval(
        update,
        120
      );
  }


  // ========================================
  // STOP
  // ========================================

  function stop() {
    if (gameLoop) {
      clearInterval(
        gameLoop
      );
    }

    gameLoop = null;
    running = false;
  }


  // ========================================
  // CREATE FOOD
  // ========================================

  function createFood() {
    do {
      food = {
        x:
          Math.floor(
            Math.random() *
            gridSize
          ),

        y:
          Math.floor(
            Math.random() *
            gridSize
          )
      };
    } while (
      snake.some(
        (segment) =>
          segment.x === food.x &&
          segment.y === food.y
      )
    );
  }


  // ========================================
  // UPDATE
  // ========================================

  function update() {
    if (!running) {
      return;
    }

    direction =
      nextDirection;

    const head = {
      ...snake[0]
    };


    if (
      direction === "up"
    ) {
      head.y--;
    }


    if (
      direction === "down"
    ) {
      head.y++;
    }


    if (
      direction === "left"
    ) {
      head.x--;
    }


    if (
      direction === "right"
    ) {
      head.x++;
    }


    if (
      head.x < 0 ||
      head.x >= gridSize ||
      head.y < 0 ||
      head.y >= gridSize
    ) {
      endGame();

      return;
    }


    const willEat =
      head.x === food.x &&
      head.y === food.y;


    const bodyToCheck =
      willEat
        ? snake
        : snake.slice(
            0,
            -1
          );


    const hitBody =
      bodyToCheck.some(
        (segment) =>
          segment.x === head.x &&
          segment.y === head.y
      );


    if (hitBody) {
      endGame();

      return;
    }


    snake.unshift(
      head
    );


    if (willEat) {
      score++;

      updateScore(
        score
      );

      createFood();
    } else {
      snake.pop();
    }


    draw();
  }


  // ========================================
  // DRAW GAME
  // ========================================

  function draw() {
    fillCanvas(
      "#080812"
    );


    ctx.strokeStyle =
      "rgba(255,255,255,0.04)";

    ctx.lineWidth = 1;


    for (
      let i = 0;
      i <= gridSize;
      i++
    ) {
      const position =
        i *
        tileSize;


      ctx.beginPath();

      ctx.moveTo(
        position,
        0
      );

      ctx.lineTo(
        position,
        canvas.height
      );

      ctx.stroke();


      ctx.beginPath();

      ctx.moveTo(
        0,
        position
      );

      ctx.lineTo(
        canvas.width,
        position
      );

      ctx.stroke();
    }


    const foodX =
      food.x *
      tileSize;

    const foodY =
      food.y *
      tileSize;


    if (
      imageReady(
        appleImage
      )
    ) {
      ctx.drawImage(
        appleImage,
        foodX,
        foodY,
        tileSize,
        tileSize
      );
    } else {
      drawApple(
        foodX,
        foodY
      );
    }


    snake.forEach(
      (
        segment,
        index
      ) => {
        const x =
          segment.x *
          tileSize;

        const y =
          segment.y *
          tileSize;


        if (index === 0) {
          drawSnakeHead(
            x,
            y
          );
        } else {
          drawSnakeBody(
            x,
            y
          );
        }
      }
    );
  }


  // ========================================
  // APPLE DESIGN
  // ========================================

  function drawApple(
    x,
    y
  ) {
    const cx =
      x +
      tileSize / 2;

    const cy =
      y +
      tileSize / 2 +
      2;


    ctx.save();


    ctx.fillStyle =
      "#ff4b4b";

    ctx.beginPath();

    ctx.arc(
      cx - 5,
      cy,
      tileSize * 0.24,
      0,
      Math.PI * 2
    );

    ctx.arc(
      cx + 5,
      cy,
      tileSize * 0.24,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
      "#d92e2e";

    ctx.beginPath();

    ctx.arc(
      cx,
      cy + 4,
      tileSize * 0.22,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.strokeStyle =
      "#7a4a22";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(
      cx,
      cy - 7
    );

    ctx.lineTo(
      cx + 2,
      cy - 14
    );

    ctx.stroke();


    ctx.fillStyle =
      "#4dff88";

    ctx.beginPath();

    ctx.ellipse(
      cx + 7,
      cy - 12,
      7,
      4,
      -0.5,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
      "rgba(255,255,255,0.65)";

    ctx.beginPath();

    ctx.arc(
      cx - 7,
      cy - 6,
      3,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.restore();
  }


  // ========================================
  // SNAKE HEAD
  // ========================================

  function drawSnakeHead(
    x,
    y
  ) {
    if (
      imageReady(
        snakeHeadImage
      )
    ) {
      let angle = 0;


      if (
        direction === "down"
      ) {
        angle =
          Math.PI / 2;
      }


      if (
        direction === "left"
      ) {
        angle =
          Math.PI;
      }


      if (
        direction === "up"
      ) {
        angle =
          -Math.PI / 2;
      }


      ctx.save();

      ctx.translate(
        x +
          tileSize / 2,
        y +
          tileSize / 2
      );

      ctx.rotate(
        angle
      );

      ctx.drawImage(
        snakeHeadImage,
        -tileSize / 2,
        -tileSize / 2,
        tileSize,
        tileSize
      );

      ctx.restore();
    } else {
      drawDesignedSnakeHead(
        x,
        y
      );
    }
  }


  // ========================================
  // SNAKE BODY
  // ========================================

  function drawSnakeBody(
    x,
    y
  ) {
    if (
      imageReady(
        snakeBodyImage
      )
    ) {
      ctx.drawImage(
        snakeBodyImage,
        x,
        y,
        tileSize,
        tileSize
      );
    } else {
      drawDesignedSnakeBody(
        x,
        y
      );
    }
  }


  // ========================================
  // BUILT-IN HEAD DESIGN
  // ========================================

  function drawDesignedSnakeHead(
    x,
    y
  ) {
    const padding = 2;

    const size =
      tileSize -
      padding * 2;

    const radius = 8;


    ctx.save();

    ctx.translate(
      x +
        tileSize / 2,
      y +
        tileSize / 2
    );


    let angle = 0;


    if (
      direction === "down"
    ) {
      angle =
        Math.PI / 2;
    }


    if (
      direction === "left"
    ) {
      angle =
        Math.PI;
    }


    if (
      direction === "up"
    ) {
      angle =
        -Math.PI / 2;
    }


    ctx.rotate(
      angle
    );


    const drawX =
      -size / 2;

    const drawY =
      -size / 2;


    const gradient =
      ctx.createLinearGradient(
        drawX,
        drawY,
        drawX + size,
        drawY + size
      );


    gradient.addColorStop(
      0,
      "#7cff99"
    );

    gradient.addColorStop(
      1,
      "#22b455"
    );


    ctx.fillStyle =
      gradient;

    roundRect(
      ctx,
      drawX,
      drawY,
      size,
      size,
      radius
    );

    ctx.fill();


    ctx.strokeStyle =
      "#159447";

    ctx.lineWidth = 2;

    roundRect(
      ctx,
      drawX,
      drawY,
      size,
      size,
      radius
    );

    ctx.stroke();


    ctx.fillStyle =
      "#ffffff";

    ctx.beginPath();

    ctx.arc(
      6,
      -6,
      5,
      0,
      Math.PI * 2
    );

    ctx.arc(
      6,
      6,
      5,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
      "#111111";

    ctx.beginPath();

    ctx.arc(
      8,
      -6,
      2.4,
      0,
      Math.PI * 2
    );

    ctx.arc(
      8,
      6,
      2.4,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.strokeStyle =
      "#ff5b73";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
      size / 2 - 1,
      0
    );

    ctx.lineTo(
      size / 2 + 6,
      0
    );

    ctx.stroke();


    ctx.restore();
  }


  // ========================================
  // BUILT-IN BODY DESIGN
  // ========================================

  function drawDesignedSnakeBody(
    x,
    y
  ) {
    const padding = 3;

    const size =
      tileSize -
      padding * 2;


    const gradient =
      ctx.createLinearGradient(
        x,
        y,
        x + tileSize,
        y + tileSize
      );


    gradient.addColorStop(
      0,
      "#46e575"
    );

    gradient.addColorStop(
      1,
      "#1fa652"
    );


    ctx.fillStyle =
      gradient;

    roundRect(
      ctx,
      x + padding,
      y + padding,
      size,
      size,
      7
    );

    ctx.fill();


    ctx.strokeStyle =
      "#168744";

    ctx.lineWidth = 2;

    roundRect(
      ctx,
      x + padding,
      y + padding,
      size,
      size,
      7
    );

    ctx.stroke();


    ctx.fillStyle =
      "rgba(255,255,255,0.16)";

    ctx.beginPath();

    ctx.arc(
      x +
        tileSize * 0.38,
      y +
        tileSize * 0.36,
      4,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  function roundRect(
    context,
    x,
    y,
    width,
    height,
    radius
  ) {
    const r =
      Math.min(
        radius,
        width / 2,
        height / 2
      );


    context.beginPath();

    context.moveTo(
      x + r,
      y
    );

    context.lineTo(
      x + width - r,
      y
    );

    context.quadraticCurveTo(
      x + width,
      y,
      x + width,
      y + r
    );

    context.lineTo(
      x + width,
      y + height - r
    );

    context.quadraticCurveTo(
      x + width,
      y + height,
      x + width - r,
      y + height
    );

    context.lineTo(
      x + r,
      y + height
    );

    context.quadraticCurveTo(
      x,
      y + height,
      x,
      y + height - r
    );

    context.lineTo(
      x,
      y + r
    );

    context.quadraticCurveTo(
      x,
      y,
      x + r,
      y
    );

    context.closePath();
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
      highScore = score;

      localStorage.setItem(
        "snakeHighScore",
        highScore
      );


      if (highScoreElement) {
        highScoreElement.textContent =
          highScore;
      }
    }


    showGameOver(
      "SNAKE GAME OVER",
      score
    );


    setInstructions(
      "Snake game over. Press Restart Game to play again."
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
          "snake" ||
        !running
      ) {
        return;
      }


      const key =
        event.key.toLowerCase();


      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight"
        ].includes(
          event.key
        )
      ) {
        event.preventDefault();
      }


      if (
        (
          event.key === "ArrowUp" ||
          key === "w"
        ) &&
        direction !== "down"
      ) {
        nextDirection =
          "up";
      }


      if (
        (
          event.key === "ArrowDown" ||
          key === "s"
        ) &&
        direction !== "up"
      ) {
        nextDirection =
          "down";
      }


      if (
        (
          event.key === "ArrowLeft" ||
          key === "a"
        ) &&
        direction !== "right"
      ) {
        nextDirection =
          "left";
      }


      if (
        (
          event.key === "ArrowRight" ||
          key === "d"
        ) &&
        direction !== "left"
      ) {
        nextDirection =
          "right";
      }
    }
  );


  // ========================================
  // REGISTER
  // ========================================

  arcade.registerGame(
    "snake",
    {
      start,
      stop
    }
  );
})();