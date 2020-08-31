function noTruenes(query) {
  var minesCount = 25;
  var boardWidth = 12;
  var boardHeight = 12;
  var squareSize = 32;
  var fontSize = (squareSize * 0.5);
  var board;
  var aroundOffsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
  ];
  var crossOffsets = [
    [0, -1], [-1,  0], [1,  0], [0,  1]
  ];
  var numberColors = [
    'transparent',
    'green',
    'blue',
    'magenta',
    'red',
    'purple',
    'orange',
    'steelblue',
    'black'
  ];

  function createCanvas() {
    let e = document.createElement('canvas');
    e.width = boardWidth * squareSize;
    e.height = boardHeight * squareSize;
    document.body.appendChild(e);
    return e;
  }

  function mineSquare(square) {
    square.isMine = true;
    if (!square.isCovered) {
      square.style.background = 'black';
    }
  }

  function uncoverSquare(square) {
    square.isCovered = false;

    if (square.isMine) {
      mineSquare(square);
    } else if (square.mineCounter > 0) {
      const text = document.createElement('div');
      text.innerText = square.mineCounter.toString();
      square.style.background = 'grey';
      square.appendChild(text);
    } else {
      square.style.background = 'grey';
    }
  }

  function toggleFlagSquare(square) {
    square.isFlagged = !square.isFlagged;
    if (square.isFlagged) {
      const flag = document.createElement('div');
      flag.style.width = (squareSize * 0.5) + 'px';
      flag.style.background = 'green';
      square.flagElement = flag;
      square.appendChild(flag);
    } else {
      if (square.flagElement) {
        square.removeChild(square.flagElement);
        square.flagElement = null;
      }
    }
  }

  function createSquare(o) {
    const e = document.createElement('div');
    e.className = 'square';
    e.style.width = squareSize + 'px';
    e.style.height = squareSize + 'px';
    e.style.border = 'solid 1px black';

    e.addEventListener('mousedown', onMouseDown);

    e.isMine = false;
    e.isCovered = true;
    e.isFlagged = false;
    e.mineCounter = 0;
    e.position = [0, 0];

    return e;
  }

  function randomPosition() {
    return [
      parseInt(Math.floor(Math.random() * boardWidth)),
      parseInt(Math.floor(Math.random() * boardHeight)),
    ];
  }

  function prepareBoard() {
    const container = document.querySelector(query);
    container.style.width = (boardWidth * squareSize) + 'px';
    container.style.height = (boardHeight * squareSize) + 'px';

    board = new Array(boardHeight);

    for (let y = 0; y < boardHeight; y++) {
      board[y] = new Array(boardWidth);
      for (let x = 0; x < boardWidth; x++) {
        const square = createSquare();
        square.position = [x, y];
        board[y][x] = square;
        container.appendChild(square);
      }
    }
    
    for (let idx = 0; idx < minesCount; idx++) {
      var [x, y] = randomPosition();

      if (!board[y][x].isMine) {
        mineSquare(board[y][x]);

        iterateAroundSquare(board[y][x], (square) => {
          if (square.isMine === false) {
            square.mineCounter += 1;
          }
        });
      } else {
        idx--;
      }
    }
  }

  function iterateAroundSquare(square, fn) {
    const [x, y] = square.position;
    aroundOffsets.forEach(function(o) {
      const [ox, oy] = o;
      const ax = x + ox;
      const ay = y + oy;

      if (ax < boardWidth && ax >= 0
        && ay < boardHeight && ay >= 0
      ) {
        fn(board[ay][ax], ax, ay);
      }
    });
  }

  function iterateSquares(fn) {
    board.forEach((row, y) => {
      board.forEach((square, x) => {
        fn(square, x, y);
      });
    });
  }


  function onLoad() { 
    prepareBoard();
  }

  function revealAroundSquare(square) {
    iterateAroundSquare(square, (square) => {
      if (square.isCovered) {
        uncoverSquare(square);
      }
    });
  }

  function revealEmptySquare(square) {
    const queue = [square.position];

    uncoverSquare(square);

    console.log(square.position);

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      const sq = board[cy][cx];
      iterateAroundSquare(sq, (square) => {
        if (square.isCovered
          && !square.isMine
          && square.mineCounter >= 0
          && !square.isFlagged
        ) {
          uncoverSquare(square);
          if (square.mineCounter === 0) {
            queue.push(square.position);
          }
        }
      });
    }
  }

  function onMouseDown(e) {
    const square = e.target;
    if (e.shiftKey === true) {
      if (!square.isCovered && square.mineCounter > 0) {
        console.log("Reveal around");
        //revealAround(x, y);
      }
    } else if (e.altKey === true) {
      toggleFlagSquare(square);
    } else {
      if (square.mineCounter === 0 && !square.isMine) {
        console.log("Empty, trying to reveal");
        //revealEmpty(x, y);
        // uncoverSquare(square);
        revealEmptySquare(square);
      } else {
        // square.isCovered = false;
        uncoverSquare(square);
      }
    }
  }

  window.addEventListener('load', onLoad);
};