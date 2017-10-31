(function() {
  class MorrisAI {
    constructor(game, gameClass) {
      this.game = game;
      this.gameConstructor = gameClass;
    }
    calcMoves() {
      var self = this;

      var team = this.game.nextTeam;

      var possibleMoves = this.game.getMoves();



      for (var move of possibleMoves) {
        let millPotencial = self.millPotencial(move) * 1.9;
        //console.log(millPotencial);
        let preventMillPotencial = self.preventMillPotencial(move) * 1.8;
        //console.log(preventMillPotencial, move.targetPoint);
        let prepareMillPotencial = self.prepareMillPotencial(move) * 1.7;
        //console.log(prepareMillPotencial);

        let tacticsPotencial = self.tacticsPotencial(move) * 1;


        move.potencial = millPotencial + preventMillPotencial + prepareMillPotencial + tacticsPotencial;
      }

      var moves = possibleMoves.sort(function(a, b) {
        return a.potencial < b.potencial ? 1 : a.potencial > b.potencial ? -1 : 0;
      })


      return moves;
    }
    millPotencial(move) {
      var self = this;


      var game = MorrisAI.cloneGame(this.game, this.gameConstructor);
      var changeset;
      var actions = {
        set() {
          var setOptions = Object.assign({
            team: game.nextTeam
          }, move.targetPoint.position);
          changeset = game.set(setOptions);
        },
        move() {
          changeset = game.move(move.startPoint.position, move.targetPoint.position);

        },
        remove() {
          changeset = game.remove(move.targetPoint.position);
        }
      };
      actions[move.action]();

      return changeset.targetPoint.mills.length;

    }
    preventMillPotencial(move) {
      var self = this;

      var changeset;
      var game = MorrisAI.cloneGame(this.game, this.gameConstructor);
      var contraryTeams = game.teams.filter(team => team.name != game.nextTeam);
      var targetPoint = game.board.getPoint(move.targetPoint.position.row, move.targetPoint.position.position);
      var potencial = 0;

      var actions = {
        set() {
          contraryTeams.forEach(function(team) {
            potencial += checkForMill(team);
            game = MorrisAI.cloneGame(self.game, self.gameConstructor);
          });
        },
        move() {
          contraryTeams.forEach(function(team) {
            potencial += checkForMill(team);
            game = MorrisAI.cloneGame(self.game, self.gameConstructor);
          });
        },
        remove() {
          potencial += targetPoint.mills.length;
        }
      };
      function checkForMill(team) {
        var setOptions = Object.assign({
          team: team.name
        }, move.targetPoint.position);
        game.board.set(setOptions);
        return targetPoint.mills.length;
      }

      actions[game.nextAction]();

      return potencial;

    }
    prepareMillPotencial(move) {
      var self = this;
      var game = MorrisAI.cloneGame(this.game, this.gameConstructor);

      var targetPoint = game.board.getPoint(move.targetPoint.position.row, move.targetPoint.position.position);
      var contraryTeams = game.teams.filter(team => team.name != game.nextTeam);


      var potencial = 0;

      var actions = {
        set: checkForPreparedMill,
        move: checkForPreparedMill,
        remove() {
          contraryTeams.forEach(function(team) {
            var setOptions = Object.assign({
              team: team.name
            }, move.targetPoint.position);
            game.board.set(setOptions);
            potencial += targetPoint.mills.length;
          });
        }
      };

      function checkForPreparedMill() {
        for (var direction in targetPoint.surroundings) {
          if (targetPoint.surroundings.hasOwnProperty(direction)) {
            let point = targetPoint.surroundings[direction];
            if (point) {
              let setOptions = Object.assign({
                team: game.nextTeam
              }, point.position);
              game.board.set(setOptions);
              potencial += point.mills.length;

              setOptions.team = false;
              game.board.set(setOptions);
            }
          }
        }
      }

      return potencial;

    }
    tacticsPotencial(move) {
      var potencial = 0;

      for (var direction in move.targetPoint.surroundings) {
        if (move.targetPoint.surroundings.hasOwnProperty(direction)) {
          let point = move.targetPoint.surroundings[direction];
          if (point) {
            potencial += point.team === game.nextTeam ? 1 : 0.5;
          }
        }
      }

      return potencial;
    }
    static cloneGame(gameInstance, gameConstructor) {
      var options = {
        board: {
          rows: gameInstance.board.rows.length,
          points: gameInstance.board.points,
          default: gameInstance.board.map.map(point => point.team)
        },
        pieces: gameInstance.teams[0].pieces.length,
        teams: gameInstance.teams.map(function(team) {
          return {
            name: team.name,
            pieces: team.pieces.map(piece => piece)
          }
        }),
        rules: false,
        lastChangeset: Object.assign({}, gameInstance.__lastChangeset)
      };
      var game = new gameConstructor(options);
      // Set the 'targetPoint' to the new instance
      var lastChangesetTargetIndex = gameInstance.board.map.indexOf(gameInstance.__lastChangeset.targetPoint);
      game.__lastChangeset.targetPoint = game.board.map[lastChangesetTargetIndex];

      // Get the team object from the original game instance
      var lastChangesetTeam = gameInstance.teams.objectFromKey(gameInstance.getTeam(gameInstance.__lastChangeset.piece), "name");
      // Get the index of the piece within this original team object
      var lastChangesetPieceIndex = lastChangesetTeam.pieces.indexOf(gameInstance.__lastChangeset.piece);
      // Set the new instance's lastChangeset.piece to a piece object from its own team but usually with the same index as the original
      game.__lastChangeset.piece = game.teams.objectFromKey(lastChangesetTeam.name, "name").pieces[lastChangesetPieceIndex];


      return game;

    }

  }
  if ("process" in this) {
    module.exports = MorrisAI;
  }
  else {
    window.MorrisAI = MorrisAI;
  }
})();


Object.defineProperty(Array.prototype, "max",{
  get() {
    return Math.max.apply(Math, this);
  }
});
