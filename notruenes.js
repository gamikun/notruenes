(function() {
  var minesCount = 20;
  var boardWidth = 12;
  var boardHeight = 12;
  var squareSize = 32;
  var fontSize = (squareSize * 0.5);
  var canvas;
  var context;
  var board;
  var mask;
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
    var e = document.createElement('canvas');
    e.width = 640;
    e.height = 640;
    document.body.appendChild(e);
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

    board = new Int8Array(length);
    board.fill(0);

    mask = new Int8Array(length);
    mask.fill(1);

    for (let idx = 0; idx < minesCount; idx++) {
      var [x, y] = randomPosition();
      var index = x + (y * boardWidth);

      if (board[index] > -1) {
        board[index] = -1;

        iterateAround(x, y, false, (x, y, index) => {
          if (board[index] >= 0) {
            board[index] += 1;
          }
        });
      } else {
        idx--;
      }
    }
  }

  function iterateAround(x, y, cross, fn) {
    const offsets = cross ? crossOffsets : aroundOffsets;

    offsets.forEach(function(o) {
      const [ox, oy] = o;
      const ax = x + ox;
      const ay = y + oy;
      const index = ax + (ay * boardWidth);

      if (ax < boardWidth && ax >= 0
        && ay < boardHeight && ay >= 0
      ) {
        fn(ax, ay, index);
      }
    });
  }

  function drawBoard() {
    context.clearRect(0, 0, 640, 640);

    board.forEach(function(value, index) {
      const x = index % boardWidth;
      const y = Math.floor(index / boardWidth);
      const ax = x * squareSize;
      const ay = y * squareSize;

      if (mask[index]) {
        context.strokeStyle = '#444';
        context.fillStyle = 'grey';
        context.fillRect(
          x * squareSize,
          y * squareSize,
          squareSize,
          squareSize
        );
        context.strokeRect(
          x * squareSize,
          y * squareSize,
          squareSize,
          squareSize
        );

        if (mask[index] === 2) {
          context.fillStyle = 'green';
          context.beginPath();
          context.arc(ax + squareSize / 2, ay + squareSize / 2,
            squareSize * 0.25,
            0, Math.PI * 2, 0
          );
          context.fill();
        }
      }

      else if (value === -1) {
        context.fillStyle = 'black';
        context.fillRect(ax, ay,
          squareSize, squareSize
        );

        context.fillStyle = 'red';
        context.beginPath();
        context.arc(ax + squareSize / 2, ay + squareSize / 2,
          squareSize * 0.25,
          0, Math.PI * 2, 0
        );
        context.fill();
      } else {
        const text = value.toString();
        const charSize = context.measureText(text);

        context.fillStyle = numberColors[value];
        context.fillText(text,
          ax + (squareSize / 2 - charSize.width / 2),
          ay + (squareSize / 2 - fontSize / 2)
        );
      }
    });
  }

  function onLoad() {
    canvas = createCanvas();
    context = canvas.getContext('2d');
    context.textBaseline = 'top';
    context.font = `bold ${fontSize}px Arial`;

    canvas.addEventListener('mousedown', onMouseDown);
    
    prepareBoard();
    drawBoard();
  }

  function revealAround(x, y) {
    iterateAround(x, y, false, (x, y, index) => {
      if (mask[index] === 1) {
        mask[index] = 0;
      }
    });

    drawBoard();
  }

  function revealEmpty(x, y) {
    const queue = [[x, y]];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      iterateAround(cx, cy, true, (x, y, index) => {
        if (mask[index] === 1 && board[index] >= 0) {
          mask[index] = 0;
          if (board[index] === 0) {
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
      if (e.shiftKey === true) {
        if (mask[index] === 0 && board[index] > 0) {
          revealAround(x, y);
        }
      } else if (e.altKey === true) {
        if (mask[index] === 1) {
          mask[index] = 2;
        } else if (mask[index] === 2) {
          mask[index] = 1;
        }
      } else {
        if (board[index] === 0) {
          revealEmpty(x, y);
        } else {
          mask[index] = 0;
        }
      }
    }
    
    drawBoard();
  }

  window.addEventListener('load', onLoad);
})();