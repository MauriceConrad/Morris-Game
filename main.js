(function() {
  const helper = require("./helper");

  var Board = require("morrisboard");

  var Exception = require("./Exception");

  class Morris {
    constructor(options) {
      var self = this;

      options = options.fillDefaults({
        board: {
          rows: 3,
          points: [false, true, false],
          default: []
        },
        pieces: 9,
        rules: true,
        lastChangeset: null,
        teams: []

      });


      this.board = new Board(options.board.rows, options.board.points);

      this.board.map = this.board.map.map(function(point, i) {
        if (options.board.default[i]) {
          point.team = options.board.default[i];
        }
        return point;
      });


      this.rules = options.rules;

      this.teams = this.teams.map(function(teamName) {
        var defaultTeam = options.teams.objectFromKey(teamName, "name");
        var team = {
          name: teamName,
          pieces: new Array(options.pieces).fill(function(index) {
            return {
              point: (defaultTeam && "pieces" in defaultTeam && index in defaultTeam.pieces) ? defaultTeam.pieces[index].point : null,
              removed: (defaultTeam && "pieces" in defaultTeam && index in defaultTeam.pieces) ? defaultTeam.pieces[index].removed : false
            };
          }),
          get activePieces() {
            return this.pieces.filter(piece => !piece.removed);
          },
          get moveablePieces() {
            return this.activePieces.filter(piece => typeof piece.point === "number");
          }
        };
        return team;
      });

      this.__lastChangeset = options.lastChangeset || null


    }
    get nextTeam() {
      if (this.__lastChangeset) {
        // Get the team name of the last change normally directly from the piece
        // Sometimes the chnageset contains a seperate 'team' property that is used if the piece that was used to interact with is not a part of the team that interacted
        // This case is when a "removement" happened (A piece will always be removed by the contrary team)
        /*if (this.__lastChangeset.team) {
          //console.log("!!!");
          return this.__lastChangeset.team;
        }*/
        var teamName = this.__lastChangeset.team || this.getTeam(this.__lastChangeset.piece);
        var teamIndex = this.teams.indexOfKey(teamName, "name");
        //console.log(teamName, teamIndex, this.__lastChangeset.piece);

        //console.log(teamName);

        return (teamIndex + 1) in this.teams ? this.teams[teamIndex + 1].name : this.teams[0].name;
      }
      return "white";
    }
    get nextAction() {
      if (this.__lastChangeset) {
        if (this.__lastChangeset.targetPoint.mills.length > 0) {
          //console.log("Remove!", this.__lastChangeset.targetPoint.mills);
          return "remove";
        }
      }
      var phaseActions = [
        "set",
        "move",
        "move"
      ];
      return phaseActions[this.phase];
    }
    get phase() {
      // Loop trough teams and check wether they have at least one unused piece (Phase 1)
      for (var team of this.teams) {
        // Returns the index of first piece object that's 'point' property is null of current team
        // If this index is not -1, such a piece object exists and phause 1 is still active because there is a team that is allowed to 'set()'
        if (team.pieces.indexOfKey(null, "point") > -1) {
          // Return 0 to represent phase 1
          return 0;
        }
      }
      // No piece found that's "point" property is null
      // Phase 1 is completed, looking for phase 2 or 3 ...

      // Loop trough teams to check wether they have three or less active (unremoved) pieces on board
      for (var team of this.teams) {
        // Filter the pieces array for a false in "removed" property
        // If the returning array's length is three or less, phase 2 is completed and phase 3 is the current one
        if (team.activePieces.length <= 3) {
          // Return 2 to represent phase 3
          return 2;
        }
      }

      // There exist no unused pieces but no team has three or less active pieces
      // Return 1 to represent phase 2
      return 1;
    }
    get gameOver() {
      for (var team of this.teams) {
        if (team.activePieces.length <= 0) {
          return true;
        }
      }
      return false;
    }
    get draw() {
      return (!this.gameOver && this.getMoves().length <= 0);
    }
    getPiece(pos) {
      var index = this.board.getPointIndex(pos.row, pos.position);
      for (var team of this.teams) {
        var relatedPiece = team.pieces.objectFromKey(index, "point");
        if (relatedPiece) {
          return relatedPiece;
        }
      }
    }
    set(options, sandbox = false) {
      var targetPoint = this.board.getPoint(options.row, options.position);


      var changeset = {
        success: false,
        action: "set",
        piece: null,
        targetPoint: targetPoint
      };

      (() => {
        if (!targetPoint) {
          changeset.error = new Exception("Point is invalid or does not exist", 3, "data");
          return;
        }

        // Get team object from options "team" prooperty
        var team = this.teams.objectFromKey(options.team, "name");
        if (!team) {
          changeset.error = new Exception("Team is invalid", 0, "data");
          return;
        }
        // If the next team that is allowed to interact is not the team that is tried to set and rule validation is allowed
        if (this.rules && this.nextTeam != options.team) {
          changeset.error = new Exception("Team is not allowed to set", 2, "rule");
          return;
        }


        // Get first piece that isn't setted yet
        var piece = team.pieces.objectFromKey(null, "point");

        // If there exist a piece that should be edited
        if (piece) {
          changeset.piece = piece;
          // Piece is valid
          // If target point has no piece on it or if it has one, rule validation should be disabled
          if (!targetPoint.team || !this.rules) {
            if (!sandbox) {
              var settedIndex = this.board.set(options);
              piece.point = settedIndex;
            }
          }
          else {
            changeset.error = new Exception("Point (target) is already used by piece.", 4, "rule", {
              targetPoint: targetPoint
            });
          }
        }
        else {
          changeset.error = new Exception("Team has no unused pieces anymore", 1, "data");
        }
      })();

      if (!changeset.error) {
        changeset.success = true;
        if (!sandbox) {
          this.__lastChangeset = changeset;
        }
      }

      return changeset;
    }
    move(from, to, sandbox = false) {

      // Move in board instance
      var fromIndex = this.board.getPointIndex(from.row, from.position);
      var toIndex = this.board.getPointIndex(to.row, to.position);

      var startPoint = this.board.map[fromIndex];
      var targetPoint = this.board.map[toIndex];

      var changeset = {
        success: false,
        action: "move",
        piece: null,
        startPoint: startPoint,
        targetPoint: targetPoint
      };


      (() => {
        if (!startPoint || !targetPoint) {
          changeset.error = new Exception("Cannot move piece. Start point or target point is invalid or does not exist", 3, "data");
          return;
        }

        if (!startPoint.team) {
          changeset.error = new Exception("Cannot move piece from point. No piece on this point", 4, "data");
          return;
        }

        var piece = this.teams.objectFromKey(startPoint.team, "name").pieces.objectFromKey(fromIndex, "point");

        changeset.piece = piece;

        // Validate with rules
        if (this.validateMovement(startPoint, targetPoint) || !this.rules) {
          var relatedStartPiece = this.getPiece(from);
          //console.log(relatedStartPiece);
          if (!sandbox) {
            this.board.move(fromIndex, toIndex);
            piece.point = toIndex;
          }
        }
        else {
          changeset.error = new Exception("Invalid movement. Cannot move piece over such a distance or this team is not allowed to move", 5, "rule");
        }
      })();

      if (!changeset.error) {
        changeset.success = true;
        if (!sandbox) {
          this.__lastChangeset = changeset;
        }
      }

      return changeset;
    }
    remove(point, sandbox = false) {

      var targetPoint = this.board.getPoint(point.row, point.position);
      var startIndex = this.board.map.indexOf(targetPoint);

      var piece = this.teams.objectFromKey(targetPoint.team, "name").pieces.objectFromKey(startIndex, "point");

      var changeset = {
        success: false,
        action: "remove",
        piece: piece,
        // Define team explictily because the piece who was used to interact with is defintly not a piece of the team that is doing the removement
        team: this.getTeam(this.__lastChangeset.piece),
        targetPoint: targetPoint
      };

      if (targetPoint && typeof piece.point === "number") {
        if ((targetPoint.team === this.nextTeam && this.nextAction === "remove" && targetPoint.mills.length <= 0) || !this.rules) {
          if (!sandbox) {
            this.board.remove(startIndex);
            piece.removed = true;
            piece.point = undefined;
          }
        }
        else {
          changeset.error = new Exception("Not allowed to remove pieces of this team", 7, "rule");
        }
      }
      else {
        changeset.error = new Exception("Piece or point is invalid or does not exist", 3, "data");
      }

      if (!changeset.error) {
        changeset.success = true;
        if (!sandbox) {
          this.__lastChangeset = changeset;
        }
      }


      return changeset;
    }
    // Method to validate a movement in general by using all the aspects of Nine Men's Morris rules
    validateMovement(from, to) {
      // Get reference from point to related team
      var teamRef = this.teams.objectFromKey(from.team, "name");
      //console.log(teamRef.name, Board.isSurrounding(from, to), this.board.map.indexOf(from.surroundings.right));
      // Check wether the related team has 3 or less active (unremoved) pieces (Jumping is allowed) or if not, the target point borders on the point directly
      return ((teamRef.activePieces.length <= 3 || Board.isSurrounding(from, to)) && this.nextTeam === from.team && !to.team);

    }
    getTeam(piece) {
      for (var team of this.teams) {
        if (team.pieces.includes(piece)) {
          return team.name;
        }
      }
      /*for (var team of this.teams) {
        if (team.pieces.objectFromKey(piece.point, "point")) {
          return team.name;
        }
      }*/

      return null;
    }
    getMoves() {
      var self = this;

      var movements = [];

      var actions = {
        set() {
          // Returns all empty points on the board which have no piece on it (team: false)
          var emptyPoints = self.board.map.filter(point => !point.team);
          // Loop trough all possible target points
          emptyPoints.forEach(function(point) {
            // Assign setting options from point's position and the next team
            var pointInfo = Object.assign({
              team: self.nextTeam
            }, point.position);
            // Set this point for the next team in sandbox mode (true)
            var testSet = self.set(pointInfo, true);
            // Sandbox setting was successfull, add it to array
            if (testSet.success) {
              // Push an movement describing object to the array 'movements'
              movements.push({
                action: "set",
                team: pointInfo.team,
                targetPoint: point
              });
            }
          });
        },
        move() {
          var usedPoints = self.board.map.filter(point => point.team);
          // Loop trough all used points on the board and check wether the pieces on them can be moved to a different point
          usedPoints.forEach(startPoint => {
            // Loop trough the whole board now and check wether 'startPoint's piece can be moved to the current target point
            self.board.map.forEach(targetPoint => {
              // Validate a theoretically movement between these two points
              if (self.validateMovement(startPoint, targetPoint)) {
                // Such a movement seems to be valid
                // Push a movement describing object to the array 'movements'
                movements.push({
                  action: "move",
                  startPoint: startPoint,
                  targetPoint: targetPoint
                });
              }
            });
          });
        },
        remove() {
          var usedPoints = self.board.map.filter(point => point.team);
          // Loop trough all used points on the board and check wether the pieces on them can be moved to a different point
          usedPoints.forEach(targetPoint => {
            // Remove piece in sandbox mode and check the success
            var removement = self.remove(targetPoint.position, true);
            // Wether the removement is allowed
            if (removement.success) {
              // Push a movement describing object to the array 'movements'
              movements.push({
                action: "remove",
                targetPoint: targetPoint
              });
            }
          });
        }
      };

      actions[this.nextAction]();

      return movements;
    }
  }
  Morris.prototype.teams = ["white", "black"];

  if ("process" in this) {
    module.exports = Morris;
  }
  else {
    window.MorrisGame = Morris;
  }
})();
