function renderGame(game, svg, options, clickHandle) {
  options = options.fillDefaults({
    radius: 2,
    strokeWidth: 1,
    margin: 10,
    selected: []
  });

  const xmlns = "http://www.w3.org/2000/svg";

  var viewBoxMatch = svg.getAttribute("viewBox").match(/[0-9]{1,}\.?[0-9]* [0-9]{1,}\.?[0-9]* ([0-9]{1,}\.?[0-9]*) ([0-9]{1,}\.?[0-9]*)/);

  var viewBox = {
    width: parseFloat(viewBoxMatch[1]),
    height: parseFloat(viewBoxMatch[2])
  };

  var offset = options.margin;

  while (svg.childNodes.length > 0) {
    svg.removeChild(svg.childNodes[0]);
  }

  var rowSize = (viewBox.height - offset * 2) / (game.board.rows.length * 2);

  var center = {
    x: viewBox.width / 2,
    y: viewBox.height / 2
  };

  var sideProp = [
    {
      x: false,
      y: -1
    },
    {
      x: 1,
      y: false
    },
    {
      reverse: true,
      x: false,
      y: 1
    },
    {
      reverse: true,
      x: -1,
      y: false
    },
  ];

  game.board.rows[0].forEach(function(point, pointIndex) {
    if (point.line) {
      var line = game.board.getLine(point.line);
      var firstRowOffset = (0 + 1) * rowSize;
      var lastRowOffset = game.board.rows.length * rowSize;
      var firstPointCoords = getPointPos(line[0], firstRowOffset, firstRowOffset * 2);
      var lastPointCoords = getPointPos(line[line.length - 1], lastRowOffset, lastRowOffset * 2);
      svg.appendChild(createElementNS("line", {
        x1: firstPointCoords.x,
        y1: firstPointCoords.y,
        x2: lastPointCoords.x,
        y2: lastPointCoords.y,
        //style: 'stroke-width: ' + options.strokeWidth + 'px;'
      }));
    }
  });


  game.board.rows.forEach(function(row, rowIndex) {

    var rowOffset = (rowIndex + 1) * rowSize;
    var rowBoundings = rowOffset * 2;

    var rect = createElementNS("rect", {
      x: center.x - rowOffset,
      y: center.y - rowOffset,
      width: rowBoundings,
      height: rowBoundings,
      //style: 'stroke-width: ' + options.strokeWidth + 'px;'
    });
    svg.appendChild(rect);

    row.forEach(function(point, pointIndex) {
      var pointCoords = getPointPos(point, rowOffset, rowBoundings);

      var circle = createElementNS("circle", {
        r: options.radius,
        cx: pointCoords.x,
        cy: pointCoords.y,
        //style: 'stroke-width: ' + options.strokeWidth + 'px;',
        class: "point" + (options.selected.includes(point) ? " selected" : "")
      });
      circle.addEventListener("click", function() {
        clickHandle(point);
      });
      svg.appendChild(circle);

      var piece = createElementNS("circle", {
        r: options.radius * 0.75,
        cx: pointCoords.x,
        cy: pointCoords.y,
        //style: 'stroke-width: ' + options.strokeWidth + 'px;',
        class: "piece team-" + (point.team)
      });
      piece.addEventListener("click", function() {
        clickHandle(point);
      });
      svg.appendChild(piece);

    });




  });


  function getPointPos(point, rowOffset, rowBoundings) {

    var pointIndex = game.board.map.indexOf(point);
    var rowIndex = Math.trunc(pointIndex / game.board.pointCount);

    var primarySideIndex = point.sides[0];
    var primarySide = game.board.getSide(primarySideIndex, rowIndex);

    var pointOffset = (rowBoundings / (primarySide.length - 1));

    var coords = {
      x: sideProp[primarySideIndex].x ? (rowOffset * sideProp[primarySideIndex].x) : (pointOffset * primarySide.indexOf(point) - rowOffset),
      y: sideProp[primarySideIndex].y ? (rowOffset * sideProp[primarySideIndex].y) : (pointOffset * primarySide.indexOf(point) - rowOffset)
    };
    // Turn the numbers aorund if needed
    if (sideProp[primarySideIndex].reverse) {
      coords.x = sideProp[primarySideIndex].x ? coords.x : -coords.x;
      coords.y = sideProp[primarySideIndex].y ? coords.y : -coords.y;
    }

    return {
      x: coords.x + center.x,
      y: coords.y + center.y
    };
  }

  var paneWidth = (viewBox.width - viewBox.height) / 2;

  // Render left team info

  game.teams.forEach(function(team) {
    var remainingPieces = team.activePieces.filter(piece => typeof piece.point != "number");
    var pieceRadius = 10;
    var pieceOffset = pieceRadius * 2.5;
    var teamPiecePos = {
      white: {
        x: 0,
        y: 0,
        max: Math.trunc((viewBox.height - pieceOffset) / pieceOffset),
        dirX: 1,
        dirY: 1
      },
      black: {
        x: viewBox.width,
        y: 0,
        max: Math.trunc((viewBox.height - pieceOffset) / pieceOffset),
        dirX: -1,
        dirY: 1
      }
    };
    remainingPieces.forEach(function(piece, index) {
      var row = Math.trunc(index / teamPiecePos[team.name].max);
      var line = index % teamPiecePos[team.name].max;
      var pos = {
        x: teamPiecePos[team.name].x + (pieceOffset * row + pieceOffset) * teamPiecePos[team.name].dirX,
        y: teamPiecePos[team.name].y + (pieceOffset * line + pieceOffset) * teamPiecePos[team.name].dirY
      };

      svg.appendChild(createElementNS("circle", {
        r: pieceRadius,
        cx: pos.x,
        cy: pos.y,
        class: "piece team-" + team.name
      }));
    });


  });
}


function createElementNS(tagName, attributes = {}) {
  const xmlns = "http://www.w3.org/2000/svg";

  var element = document.createElementNS(xmlns, tagName);
  for (var attribute in attributes) {
    if (attributes.hasOwnProperty(attribute)) {
      element.setAttributeNS(null, attribute, attributes[attribute]);
    }
  }

  return element;
}
