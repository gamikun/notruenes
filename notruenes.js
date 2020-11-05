(function() {
  var minesCount = 25;
  var boardWidth = 12;
  var boardHeight = 12;
  var squareSize = 32;
  var fontSize = (squareSize * 0.5);
  var clickMode = 'normal';
  var canvas;
  var context;
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

  var Square = function() {
    this.isMine = false;
    this.counter = 0;
    this.isCovered = true;
    this.isFlagged = false;
  };

  function createCanvas() {
    var e = document.createElement('canvas');
    e.width = boardWidth * squareSize;
    e.height = boardHeight * squareSize;
    document.getElementById('board').appendChild(e);
    return e;
  }

  function randomPosition() {
    return [
      parseInt(Math.floor(Math.random() * boardWidth)),
      parseInt(Math.floor(Math.random() * boardHeight)),
    ];
  }

  function prepareBoard() {
    const length = boardWidth * boardHeight;

    board = [];
    while (board.length < length) {
      board.push(new Square());
    }

    for (let idx = 0; idx < minesCount; idx++) {
      let [x, y] = randomPosition();
      let index = x + (y * boardWidth);

      if (!board[index].isMine) {
        board[index].isMine = true;
        iterateAround(x, y, (e) => {
          if (!e.isMine) {
            e.counter += 1;
          }
        });
      } else {
        idx--;
      }
    }
  }

  function iterateAround(x, y, fn) {
    aroundOffsets.forEach(function(o) {
      const [ox, oy] = o;
      const ax = x + ox;
      const ay = y + oy;
      const index = ax + (ay * boardWidth);

      if (ax < boardWidth && ax >= 0
        && ay < boardHeight && ay >= 0
      ) {
        fn(board[index], ax, ay);
      }
    });
  }

  function drawMine(x, y) {
    context.fillStyle = 'black';
    context.fillRect(x, y,
      squareSize, squareSize
    );

    context.fillStyle = 'red';
    context.beginPath();
    context.arc(x + squareSize / 2, y + squareSize / 2,
      squareSize * 0.25,
      0, Math.PI * 2, 0
    );
    context.fill();
  }

  function drawFlag(x, y) {
    context.lineWidth = 2;
    context.fillStyle = 'green';
    context.beginPath();
    context.arc(x + squareSize / 2, y + squareSize / 2,
      squareSize * 0.25,
      0, Math.PI * 2, 0
    );
    context.fill();
  }

  function drawGrid() {
    context.strokeStyle = '#444';
    context.lineWidth = 2;
    for (let idx = 1; idx < boardWidth; idx++) {
      context.moveTo(idx * squareSize, 0);
      context.lineTo(idx * squareSize, squareSize * boardHeight);
      context.stroke();
    }
    for (let idx = 1; idx < boardHeight; idx++) {
      context.moveTo(0, idx * squareSize);
      context.lineTo(squareSize * boardHeight, idx * squareSize);
      context.stroke();
    }
  }

  function drawBoard() {
    context.clearRect(0, 0, 640, 640);

    board.forEach(function(e, index) {
      const x = index % boardWidth;
      const y = Math.floor(index / boardWidth);
      const ax = x * squareSize;
      const ay = y * squareSize;

      if (e.isCovered) {
        context.strokeStyle = '#444';
        context.fillStyle = 'grey';
        context.fillRect(
          x * squareSize,
          y * squareSize,
          squareSize,
          squareSize
        );

        if (e.isFlagged) {
          drawFlag(ax, ay);
        }
      } else if (e.isMine) {
        drawMine(ax, ay);
      } else {
        const text = e.counter.toString();
        const charSize = context.measureText(text);

        context.fillStyle = numberColors[e.counter];
        context.fillText(text,
          ax + (squareSize / 2 - charSize.width / 2),
          ay + (squareSize / 2 - fontSize / 2)
        );
      }
    });

    drawGrid();
  }

  function onLoad() {
    canvas = createCanvas();
    context = canvas.getContext('2d');
    context.textBaseline = 'top';
    context.font = `bold ${fontSize}px Arial`;

    document.querySelectorAll('input[type=radio]').forEach((e, idx) => {
      if (idx === 0) {
        e.checked = true;
      }
      e.addEventListener('change', (evt) => {
        clickMode = evt.target.value;
      });
    });

    canvas.addEventListener('mousedown', onMouseDown);
    
    prepareBoard();
    drawBoard();
  }

  function revealAround(x, y) {
    iterateAround(x, y, (e) => {
      if (!e.isFlagged && e.isCovered) {
        e.isCovered = false;
      }
    });

    drawBoard();
  }

  function revealEmpty(x, y) {
    const queue = [[x, y]];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      iterateAround(cx, cy, (e, x, y) => {
        if (e.isCovered && !e.isFlagged) {
          e.isCovered = false;
          if (e.counter === 0) {
            queue.push([x, y]);
          }
        }
      });
    }
  }

  function onMouseDown(e) {
    const ax = e.clientX - canvas.offsetLeft;
    const ay = e.clientY - canvas.offsetTop;
    const x = parseInt(Math.floor(ax / squareSize));
    const y = parseInt(Math.floor(ay / squareSize));

    if (x >= 0 && x < boardWidth
      && y >= 0 && y < boardHeight
    ) {
      const index = x + (y * boardWidth);
      const e = board[index];

      if (clickMode === 'discover') {
        if (!e.isCovered && e.counter > 0) {
          revealAround(x, y);
        }
      } else if (clickMode === 'flag') {
        e.isFlagged = !e.isFlagged;
      } else  if (clickMode === 'normal') {
        if (e.isCovered) {
          if (e.counter === 0) {
            e.isCovered = false;
            if (!e.isMine) {
              revealEmpty(x, y);
            }
          } else {
            e.isCovered = false;
          }
        } 
      }
    }
    
    drawBoard();
  }

  window.addEventListener('load', onLoad);
})();