# Nine Men's Morris

I separated the board logic from the game logic to make the game extensible and modular.
The game logic implements parts like rule validation.

The board is completely modular which means that you are not focused on the normal look of a Nine Men's Morris board.
By using the property `points` in board options, you can define how many points exist on each side and wether they are connected with the upper row.
And the amount or rows can be defined with the property `rows` in board options. More about the idea behind `points` in [Points](#Points).

To require the module you can browserify it simply with *browserify*. In the case of a browser's API the module will add the class `MorrisGame` to the window object you can use instead.

As Node.js module, just require it:

```javascript
const MorrisGame = require('morrisgame');
```

To create a new game instance call:
```javascript
var myGame = new Morris({
  board: {
    rows: 3,
    points: [false, true, false]
  },
  pieces: 9,
  rules: true
});
```

The `Morris` class will automatically create a new `MorrisBoard` instance for itself. You find it at as `board` property of your game instance.
As I already said, the `board` is own class instance for controlling the board. Normally you do not need manipulating it directly but if you want to know how, have a look at [Morris Board](#Morris Board).

That is just good to know to understand why addressing a point will be done by defining a `row` and a `position` (Index within the row).

The reason why I separated board and game logic is, that this keeps the process completely clean extensible.

#### Important

Please note that the board works with a circular coordinate system. What that means is described more detailed below.

Your instance should look like:

```javascript
{
  board: <MorrisBoard>, // The instance of the board your game instance uses
  points: [Array], // Array containing the template for points on each side
  rules: true || false, // Wether rule validation is enabled
  // More information about the structure of a team and a 'piece' object you will find below
  teams: [
    {
      name: "white",
      pieces: [Array] // Array containing your defined amount of pieces for each team as objects
    },
    {
      name: "black",
      pieces: [Array] // Array containing your defined amount of pieces for each team as objects
    }
  ],
  // Object containing some information to validate rules like 'nextTeam' or 'nextAction'
  __rule: {
    nextTeam: [Getter], // Returns the next team using the information about the last changeset
    nextAction: [Getter], // Returns the next action using the information about the last changeset
    __lastChangeset: <ChangeSet> // The last successfull changeset. Used to get next team or action
  }
}
```

### Ruling

The algorithms for validating rules and all related properties and methods are absolutely responsive which means, that your *game instance* **will not** modify more properties than needed. The **only** important property that will always be edited by your *game instance* is the `__lastChangeset` property in `__rule` (More about this below). All the other stuff like `phase`, `gameOver`, `nextTeam`, `nextAction`

### Points

The `points` property of your instance is the same as you used as argument when creating the instance. If you did not specified one, the default one is used.
In detail this array describes, how many points your board has on each side and wether they are connected with each other.

For example, the default `points` array looks like:
```javascript
[false, true, false]
```

This means that the points left and right side are **not** connected with the upper and lower one but the point in the middle is. Because a Nine Men's Morris board normally looks like this, this is the default value.

### Teams

The `teams` array of your instance contains objects that represent each team.
Normally there exist exactly two teams, called `black` and `white` but theoretically more teams would be possible. And also the algorithms behind rule validation and game logic are made for more than two teams.

But that is just the general theory behind it.

A team object looks like:

```javascript
{
  name: "teamName",
  pieces: [Array] // Array containing your defined amount of pieces for each team as objects
}
```

#### Pieces

As you saw, the `pieces` array within a `team` object contains each piece as an object. You can define the amount of the pieces for each team in `pieces` property when creating your game instance.

A piece object literal contains thre properties. `point` whose value represents an index in `map` array within the in game's board instance. If the piece is not set yet, `point` is `null`.
The other property is `removed` that contains a boolean value. It is used to declare a piece as *removed*.
The third one is the **Getter** `activePieces` that just returns an array with all pieces of the team that are **not** removed but still active.

```javascript
{
  name: "teamName", // "white" or "black"
  pieces: [
    ...
    {
      point: null, // null or the index of the point, the piece is standing on
      removed: false // Wether the piece is already removed
    }
    ...
  ]
}
```

### Rules

To handle internally with rules and the logic of a game, a object for rules, named `__rule` exist in your game instance.


### Get Moves

To get a list of all valid moves call:
```javascript
myGame.getMoves();
```

This will return an `array` containing objects representing each movement specially for the kind of movement. For example, a `set` & `remove` *movement* only needs a `targetPoint` property wether a `move` *movement* usually has also a `startPoint` property containing the point the movement is going to start from.

#### Movement Object Literal

```javascript
{
  action: "movementName", // "set", "move" or "remove"; String describing the kind of movement
  startPoint: [Object], // Optional. Point object literal who refers to the start point within the 'board.map'
  targetPoint: [Object], // Point object literal who refers to the target point within the 'board.map'
  team: "teamName" // "white" or "black"
}
```

### Get Piece

To get a piece that is related to a point's position, use the `getPiece` method.

```javascript
// Returns the piece object literal
var piece = myGame.getPiece({
  row: 0,
  position: 0
});
// Log the piece object
console.log(piece);
```

#### Important

If not piece is related to this point, the method will return `undefined`.

### Set

To set a new piece to the board use the `set` method of your game instance.
(More about the coordinating system in [MorrisBoard->Coordinating](#Coordinating))

```javascript
var changeset = myGame.set({
  team: "white", // Name of the team you want to use
  row: 0,
  position: 0
});
// If an error occured (Set action was not allowed)
if (changeset.error) {
  console.error(err);
}
// The set action was successfully
else {
  console.log(changeset);
}
```

### Move

To move a piece from one point to another one, use the `move` method of your game instance.

```javascript
var changeset = myGame.move({
  row: 0,
  position: 0,
}, {
  row: 0,
  position: 1,
});

// If an error occured (Movement was not allowed)
if (changeset.error) {
  console.error(err);
}
// The movement was successfully
else {
  console.log(changeset);
}
```

### Remove

To remove a piece from the board, use the `remove` method of your game instance.

```javascript
var changeset = myGame.remove({
  row: 0,
  position: 0
});
// If an error occured (Removement was not allowed)
if (changeset.error) {
  console.error(err);
}
// The removement was successfully
else {
  console.log(changeset);
}
```

### Next Team

To get the next team just get the property `nextTeam` of your game instance.
*Please keep in mind that this property is a getter and is related to the* `__lastChangeset` *object of your game instance.*

```javascript
// Get the next team
var nextTeam = myGame.nextTeam;

// Log it
console.log(nextTeam);
```

#### Important

Please keep in mind that after a created mill, the next action is normally `remove`. But the next team is* **not** the team that is *removing* (Normally the same team that created the mill before) **but** the contrary team whose piece will be removed.

### Next Action

To get the next action that should be performed within the game, just get the property `nextAction` of your game instance.

```javascript
// Get the next action
var nextAction = myGame.nextAction;

// Log it
console.log(nextAction);
```

### Phase

The `phase` property of your game instance returns the current phase of the match. (0-2) / (1-3)

```javascript
// Get the current match's phase
var phase = myGame.phase;

// Log it
console.log(phase);
```

### Game Over

To get wether the game is over, just get the `gameOver` property of your game instance.

```javascript
// Get wether the game is over
var isGameOver = myGame.gameOver;

// Log it
console.log(isGameOver);
```

### Draw

To get wether the game is a draw, just get the `draw` property of your game instance.

```javascript
// Get wether the game is a draw
var isDraw = myGame.draw;

// Log it
console.log(isDraw);
```


## Morris Board

The `MorrisBoard` controller is a module that is just used to control the board logic of a Nine Men's Morris board.
This API provides all needed methods and tools to manage a morris game logically.

If you are using the game controller, a board instance will be created automatically and is accessible at `yourGame.board`.
But that's how the board works:
```javascript
// 1. Argument is the amount of rows
// 2. Argument is an array representing the logic of points on a side and wether they are connected vertically
var board = new MorrisBoard(3, [false, true, false]);

// Test it out
console.log(board);
```
### Map

The board's points are stored within the `yourBoard.map`. The `map` contains each point as an object literal containing some details about the point and a lot of **Getters** that return things like `mills`, `surroundings`, `line` and more.

This is how a *point's object* looks like within the *map* array:
```javascript
yourBoard.map = [
  ...
  {
    team: false || "black" || "white", // Name of the team that is staying on the point (False if there is no team)
    surroundings: [Object], // (Getter): Returns all connected points
    position: [Object], // (Getter): Returns the position as position object { row: Number, position: Number}
    mills: [Array], // (Getter): Returns all mills in which the point is involved
    sides: [Array], // (Getter): Returns all sides the point is part of
    line: [Object] || [Boolean], // Getter: Returns index of the vertical line the point is part of. If there is no vertical line, the value is false
  }
  ...
]
```

### Coordinating

The coordinating system is, as I already explained, circular. That means, you will mostly address points on the board, by using a row index and a index within the row:
```javascript
// Example position object for a point
{
  row: [Number], // E.g. 0 for the inner row or 2 for the outer (Common Nine Mens's Morris)
  position: [Number] // E.g. 0 for the first of your row or 7 for the last one (Common Nine Men's Morris)
}
```

*Please keep in mind that you have to use your board instance* **within** *your game instance when working with a game controller. Normally this will be found at* `myGame.board`.

#### Get Point Index (by using its position)

To get the index of a point directly from the position, use the `getPointIndex()` method of your board instance.

```javascript
var index = board.getPointIndex(row, position);
```
(Of course could also get a point's index by using the `indexOf` method with the `map` array of your *board instance* but this needs a *real* point object and is much slower than this method. This method just calculates it directly. That also means that you could a index that does not exist because no point has such a position.)

#### Get Point (by using its position)

To get a point object literal by using the point's position, use the `getPoint()` method of your board instance.

```javascript
var point = board.getPoint(row, position);
```

#### Get Point's Position (by using its index)

To get a point's position by using the point's index, use the get `getPointPosition()` method of your board instance.

```javascript
var pos = board.getPointPosition(index);
```

#### Get Point (by using its index)

To get a points by its index, just call the index within the `map` array ;-)

```javascript
// Just simple as it is
var point = board.map[index];
```


#### Surroundings

The connected points of a point are represented within the `surroundings` property of each point.
A surroundings object contains one key for each direction. Such a key itself contains a *point object*.

```javascript
{
  right: [Object], // Object literal representing the point right from this point
  left: [Object], // Object literal representing the point left from this point
  up: [Object], // Object literal representing the point top from this point
  down: [Object], // Object literal representing the point bottom from this point
}
```

Please always keep in mind that *right*, *right*, *up* and *down* are meant from the perspective of the middle point of the morris board. That's because we are using a **circular** coordinate system to address the points.

#### Position

The property `position` of a *point object* returns the exact position within the **circular** coordinate system of the point.
It returns an object that looks like:
```javascript
{
  row: [Number],
  position: [Number]
}
```

As you can see, such an object is also used very often to address a point ;-)

#### Mills

The property `mills` of a *point object* returns all mill's in which the point is involved.

Such a mill is represented by an array containing *point objects* for each point.

```javascript
[
  [Array], // Array containing point object for each point that is a part of the mill
  [Array] // Array containing point object for each point that is a part of the mill
]
```

Of course it is theoretically impossible that a point is involved in more than **2** mills at the same time.
And if you are playing morris normally a mill is always is using **3** points. But if you are using **100** rows, of course a vertical mill would need all **100** points.

#### Sides

The property `sides` of a *point object* returns all sides the point is a part of. A side is represented by its index.

Normally, when playing with *4* sides this index is from 0-3. Of course, a point can only be a part of **2** sides at the same time.

```javascript
[
  Number, // Index [0-3]
  Number // Index [0-3]
]
```

#### Line

The property `line` of a *point object* returns wether the point is a part of a vertical line and if this is the case, the index of it. If not, `false` will be returned.
Wether a point is part of a vertical line is defined by the vertical connections. If the `points` argument when creating the board is `[false, true, false]`, the point in the middle of each side has a vertical line but the others do not.

The index of such a vertical line is the index position relative within the circular coordinate system of its points. For example, in *Nine Men's Morris* there are **4** vertical lines and their indexes would be `1`, `3`, `5` & `7`.

##### getLine()

To return a line's points (*point objects*), call `yourBoard.getLine(lineIndex)`. This will return an *array* containing all points of the line as *point objects*.


### All Mills

To get all mills that are currently active on the board, just use the `mills` property of your board's instance.

```javascript
yourBoard.mills = [
  ...
  [Array],
  [Array],
  [Array]
  ...
];
```


## AI

The AI used here is a fast and simple AI program that tries to get the best moves by validating their potential. It is important to know, that the AI **is not** perfect by calculating the whole game. That would have been a solution but I did not liked such a AI. I wanted an AI that is not absolutely perfect but just simple and fast.

In detail, the AI works with a lot of methods that return a potential for inner game actions and moves. They are not too complex but very general. You can win against the AI ;-)

The AI module can also be used within browser's API or within Node.js. *You do not have to browserify the module!* Within a browser's API it will create the class `MorrisAI` to the window object you can use instead. If you are using Node.js, you can *require* it simply.

```javascript
const MorrisAI = require('./morrisAI');
```

```javascript
var ai = new MorrisAI(myGame, MorrisGame);

// Get the best moves
var bestMoves = ai.calcMoves();

// Log them to console
console.log(bestMoves);
```
You need to put your game instance into and your constructor class. That is important because the AI would do some stuff with the original class.
