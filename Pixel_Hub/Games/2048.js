// ========================================
// Pixel Arcade - 2048
// ========================================
// Classic 4x4 sliding-number puzzle.
//
// Controls:
//   Arrow Keys
//   W / A / S / D
//
// Goal:
//   Combine matching tiles and try to
//   create the 2048 tile.
// ========================================

(() => {
  const arcade = window.PixelArcade;

  if (!arcade) {
    console.error(
      "2048.js requires the PixelArcade controller inside games.html."
    );

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

  const gridSize = 4;

  const boardSize = 500;
  const boardX = (canvas.width - boardSize) / 2;
  const boardY = 70;

  const gap = 12;

  const tileSize =
    (boardSize - gap * (gridSize + 1)) /
    gridSize;


  // ========================================
  // GAME STATE
  // ========================================

  let board = [];
  let score = 0;
  let running = false;
  let reached2048 = false;
  let animating = false;


  // ========================================
  // HIGH SCORE
  // ========================================

  const highScoreElement =
    document.querySelector(
      '.high-score[data-game="2048"]'
    );


  let highScore = Number(
    localStorage.getItem(
      "2048HighScore"
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
        "2048HighScore",
        String(highScore)
      );

      updateHighScoreDisplay();
    }
  }


  updateHighScoreDisplay();


  // ========================================
  // BOARD HELPERS
  // ========================================

  function createEmptyBoard() {
    return Array.from(
      { length: gridSize },
      () => Array(gridSize).fill(0)
    );
  }


  function copyBoard(source) {
    return source.map(
      (row) => row.slice()
    );
  }


  function boardsMatch(first, second) {
    for (
      let row = 0;
      row < gridSize;
      row++
    ) {
      for (
        let column = 0;
        column < gridSize;
        column++
      ) {
        if (
          first[row][column] !==
          second[row][column]
        ) {
          return false;
        }
      }
    }

    return true;
  }


  function getEmptyCells() {
    const cells = [];

    for (
      let row = 0;
      row < gridSize;
      row++
    ) {
      for (
        let column = 0;
        column < gridSize;
        column++
      ) {
        if (
          board[row][column] === 0
        ) {
          cells.push({
            row,
            column
          });
        }
      }
    }

    return cells;
  }


  function addRandomTile() {
    const emptyCells =
      getEmptyCells();

    if (
      emptyCells.length === 0
    ) {
      return;
    }

    const randomCell =
      emptyCells[
        Math.floor(
          Math.random() *
          emptyCells.length
        )
      ];

    board[
      randomCell.row
    ][
      randomCell.column
    ] =
      Math.random() < 0.9
        ? 2
        : 4;
  }


  // ========================================
  // MOVEMENT + MERGING
  // ========================================

  function slideAndMerge(line) {
    const values =
      line.filter(
        (value) => value !== 0
      );

    const merged = [];

    for (
      let index = 0;
      index < values.length;
      index++
    ) {
      if (
        index + 1 < values.length &&
        values[index] ===
          values[index + 1]
      ) {
        const combinedValue =
          values[index] * 2;

        merged.push(
          combinedValue
        );

        score +=
          combinedValue;

        if (
          combinedValue >= 2048 &&
          !reached2048
        ) {
          reached2048 = true;

          setInstructions(
            "2048 reached! You can keep playing. Use Arrow Keys or W/A/S/D to combine even larger tiles."
          );
        }

        index++;
      } else {
        merged.push(
          values[index]
        );
      }
    }

    while (
      merged.length < gridSize
    ) {
      merged.push(0);
    }

    return merged;
  }


  function moveLeft() {
    for (
      let row = 0;
      row < gridSize;
      row++
    ) {
      board[row] =
        slideAndMerge(
          board[row]
        );
    }
  }


  function moveRight() {
    for (
      let row = 0;
      row < gridSize;
      row++
    ) {
      const reversed =
        board[row]
          .slice()
          .reverse();

      board[row] =
        slideAndMerge(
          reversed
        ).reverse();
    }
  }


  function moveUp() {
    for (
      let column = 0;
      column < gridSize;
      column++
    ) {
      const line = [];

      for (
        let row = 0;
        row < gridSize;
        row++
      ) {
        line.push(
          board[row][column]
        );
      }

      const merged =
        slideAndMerge(
          line
        );

      for (
        let row = 0;
        row < gridSize;
        row++
      ) {
        board[row][column] =
          merged[row];
      }
    }
  }


  function moveDown() {
    for (
      let column = 0;
      column < gridSize;
      column++
    ) {
      const line = [];

      for (
        let row = gridSize - 1;
        row >= 0;
        row--
      ) {
        line.push(
          board[row][column]
        );
      }

      const merged =
        slideAndMerge(
          line
        );

      for (
        let row = gridSize - 1,
          index = 0;
        row >= 0;
        row--, index++
      ) {
        board[row][column] =
          merged[index];
      }
    }
  }


  function canMove() {
    if (
      getEmptyCells().length > 0
    ) {
      return true;
    }

    for (
      let row = 0;
      row < gridSize;
      row++
    ) {
      for (
        let column = 0;
        column < gridSize;
        column++
      ) {
        const value =
          board[row][column];

        if (
          column + 1 < gridSize &&
          board[row][column + 1] === value
        ) {
          return true;
        }

        if (
          row + 1 < gridSize &&
          board[row + 1][column] === value
        ) {
          return true;
        }
      }
    }

    return false;
  }


  // ========================================
  // SMOOTH SWISH ANIMATION
  // ========================================

  function easeOutCubic(progress) {
    return (
      1 -
      Math.pow(
        1 - progress,
        3
      )
    );
  }


  function animateSwish(
    previousBoard,
    direction
  ) {
    return new Promise(
      (resolve) => {
        const duration = 140;
        const distance = 38;

        const startTime =
          performance.now();

        animating = true;


        function frame(now) {
          const rawProgress =
            Math.min(
              (
                now -
                startTime
              ) /
                duration,
              1
            );


          const progress =
            easeOutCubic(
              rawProgress
            );


          let offsetX = 0;
          let offsetY = 0;


          if (
            direction === "left"
          ) {
            offsetX =
              -distance *
              progress;
          }


          if (
            direction === "right"
          ) {
            offsetX =
              distance *
              progress;
          }


          if (
            direction === "up"
          ) {
            offsetY =
              -distance *
              progress;
          }


          if (
            direction === "down"
          ) {
            offsetY =
              distance *
              progress;
          }


          draw(
            previousBoard,
            offsetX,
            offsetY,
            0.5 *
              (
                1 -
                progress
              )
          );


          if (
            rawProgress < 1
          ) {
            requestAnimationFrame(
              frame
            );
          } else {
            animating = false;

            draw();

            resolve();
          }
        }


        requestAnimationFrame(
          frame
        );
      }
    );
  }


  async function makeMove(
    direction
  ) {
    if (
      !running ||
      animating ||
      getCurrentGame() !== "2048"
    ) {
      return;
    }


    const beforeMove =
      copyBoard(
        board
      );


    const scoreBeforeMove =
      score;


    if (
      direction === "left"
    ) {
      moveLeft();
    }


    if (
      direction === "right"
    ) {
      moveRight();
    }


    if (
      direction === "up"
    ) {
      moveUp();
    }


    if (
      direction === "down"
    ) {
      moveDown();
    }


    const boardChanged =
      !boardsMatch(
        beforeMove,
        board
      );


    if (
      !boardChanged
    ) {
      score =
        scoreBeforeMove;

      return;
    }


    addRandomTile();

    saveHighScore();

    updateScore(
      score
    );


    await animateSwish(
      beforeMove,
      direction
    );


    if (
      !canMove()
    ) {
      running = false;

      saveHighScore();


      showGameOver(
        "2048 - Game Over",
        score
      );


      setInstructions(
        "No moves left. Press Restart Game to try again."
      );
    }
  }


  // ========================================
  // TILE APPEARANCE
  // ========================================

  function getTileColors(value) {
    const colors = {
      0: {
        background: "#171725",
        text: "#ffffff"
      },

      2: {
        background: "#243a46",
        text: "#ffffff"
      },

      4: {
        background: "#294958",
        text: "#ffffff"
      },

      8: {
        background: "#376985",
        text: "#ffffff"
      },

      16: {
        background: "#337e78",
        text: "#ffffff"
      },

      32: {
        background: "#3b956e",
        text: "#ffffff"
      },

      64: {
        background: "#52b96f",
        text: "#07110b"
      },

      128: {
        background: "#7662bd",
        text: "#ffffff"
      },

      256: {
        background: "#925fd1",
        text: "#ffffff"
      },

      512: {
        background: "#b65ae0",
        text: "#ffffff"
      },

      1024: {
        background: "#df65d6",
        text: "#ffffff"
      },

      2048: {
        background: "#69f7ff",
        text: "#071116"
      }
    };


    if (
      colors[value]
    ) {
      return colors[value];
    }


    return {
      background: "#ffd75e",
      text: "#101018"
    };
  }


  function getTileFontSize(
    value
  ) {
    const digits =
      String(
        value
      ).length;


    if (
      digits <= 2
    ) {
      return 46;
    }


    if (
      digits === 3
    ) {
      return 39;
    }


    if (
      digits === 4
    ) {
      return 31;
    }


    return 25;
  }


  // ========================================
  // DRAWING
  // ========================================

  function drawHeader() {
    ctx.fillStyle =
      "#ffffff";


    ctx.textAlign =
      "left";


    ctx.textBaseline =
      "alphabetic";


    ctx.font =
      "bold 34px system-ui";


    ctx.fillText(
      "2048",
      boardX,
      44
    );


    ctx.textAlign =
      "right";


    ctx.font =
      "bold 19px system-ui";


    ctx.fillStyle =
      "#69f7ff";


    ctx.fillText(
      `Score ${score}`,
      boardX +
        boardSize,
      42
    );


    ctx.textAlign =
      "start";
  }


  function drawBoard() {
    ctx.fillStyle =
      "#0f0f1a";


    ctx.fillRect(
      boardX,
      boardY,
      boardSize,
      boardSize
    );


    ctx.strokeStyle =
      "rgba(105, 247, 255, 0.28)";


    ctx.lineWidth = 3;


    ctx.strokeRect(
      boardX,
      boardY,
      boardSize,
      boardSize
    );


    for (
      let row = 0;
      row < gridSize;
      row++
    ) {
      for (
        let column = 0;
        column < gridSize;
        column++
      ) {
        const value =
          board[row][column];


        const colors =
          getTileColors(
            value
          );


        const x =
          boardX +
          gap +
          column *
            (
              tileSize +
              gap
            );


        const y =
          boardY +
          gap +
          row *
            (
              tileSize +
              gap
            );


        ctx.fillStyle =
          colors.background;


        ctx.fillRect(
          x,
          y,
          tileSize,
          tileSize
        );


        if (
          value !== 0
        ) {
          ctx.fillStyle =
            colors.text;


          ctx.textAlign =
            "center";


          ctx.textBaseline =
            "middle";


          ctx.font =
            `900 ${getTileFontSize(value)}px system-ui`;


          ctx.fillText(
            String(value),
            x +
              tileSize / 2,
            y +
              tileSize / 2 +
              1
          );
        }
      }
    }


    ctx.textBaseline =
      "alphabetic";


    ctx.textAlign =
      "start";
  }


  // ========================================
  // SWISH TRAIL DRAWING
  // ========================================

  function drawGhostBoard(
    ghostBoard,
    offsetX,
    offsetY,
    opacity
  ) {
    if (
      !ghostBoard ||
      opacity <= 0
    ) {
      return;
    }


    ctx.save();


    ctx.globalAlpha =
      opacity;


    for (
      let row = 0;
      row < gridSize;
      row++
    ) {
      for (
        let column = 0;
        column < gridSize;
        column++
      ) {
        const value =
          ghostBoard[
            row
          ][
            column
          ];


        if (
          value === 0
        ) {
          continue;
        }


        const colors =
          getTileColors(
            value
          );


        const x =
          boardX +
          gap +
          column *
            (
              tileSize +
              gap
            ) +
          offsetX;


        const y =
          boardY +
          gap +
          row *
            (
              tileSize +
              gap
            ) +
          offsetY;


        ctx.fillStyle =
          colors.background;


        ctx.fillRect(
          x,
          y,
          tileSize,
          tileSize
        );


        ctx.fillStyle =
          colors.text;


        ctx.textAlign =
          "center";


        ctx.textBaseline =
          "middle";


        ctx.font =
          `900 ${getTileFontSize(value)}px system-ui`;


        ctx.fillText(
          String(value),
          x +
            tileSize / 2,
          y +
            tileSize / 2 +
            1
        );
      }
    }


    ctx.restore();


    ctx.textBaseline =
      "alphabetic";


    ctx.textAlign =
      "start";
  }


  function drawFooter() {
    ctx.fillStyle =
      "rgba(255, 255, 255, 0.7)";


    ctx.font =
      "16px system-ui";


    ctx.textAlign =
      "center";


    ctx.fillText(
      "Arrow Keys or W/A/S/D",
      canvas.width / 2,
      592
    );


    ctx.textAlign =
      "start";
  }


  function draw(
    ghostBoard = null,
    offsetX = 0,
    offsetY = 0,
    opacity = 0
  ) {
    ctx.fillStyle =
      "#080812";


    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    drawHeader();

    drawBoard();


    drawGhostBoard(
      ghostBoard,
      offsetX,
      offsetY,
      opacity
    );


    drawFooter();
  }


  // ========================================
  // INPUT
  // ========================================

  function handleKeyDown(
    event
  ) {
    if (
      !running ||
      animating ||
      getCurrentGame() !== "2048"
    ) {
      return;
    }


    const key =
      event.key.toLowerCase();


    let direction =
      null;


    if (
      key === "arrowleft" ||
      key === "a"
    ) {
      direction =
        "left";
    }


    if (
      key === "arrowright" ||
      key === "d"
    ) {
      direction =
        "right";
    }


    if (
      key === "arrowup" ||
      key === "w"
    ) {
      direction =
        "up";
    }


    if (
      key === "arrowdown" ||
      key === "s"
    ) {
      direction =
        "down";
    }


    if (
      !direction
    ) {
      return;
    }


    event.preventDefault();


    makeMove(
      direction
    );
  }


  window.addEventListener(
    "keydown",
    handleKeyDown,
    {
      passive: false
    }
  );


  // ========================================
  // GAME LIFECYCLE
  // ========================================

  function start() {
    running = true;

    animating = false;

    reached2048 =
      false;

    score = 0;


    board =
      createEmptyBoard();


    addRandomTile();

    addRandomTile();


    updateScore(
      score
    );


    setInstructions(
      "2048: Use Arrow Keys or W/A/S/D. Slide matching tiles together to combine them. Try to create the 2048 tile."
    );


    draw();


    canvas.focus({
      preventScroll: true
    });
  }


  function stop() {
    running = false;

    animating = false;
  }


  // ========================================
  // REGISTER GAME
  // ========================================

  arcade.registerGame(
    "2048",
    {
      start,
      stop
    }
  );
})();