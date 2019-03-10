import Grid from './grid';
import Tile, { Position } from './tile';
import DOMUpdater from './dom-updater';
import GestureManager, { IndexedList } from './gesture-manager';

export default class Game {
	private size: number;
	private grid: Grid;
	private score: number;
	private over: boolean;
	private won: boolean;
	private domUpdater: DOMUpdater;
	private gestureManager: GestureManager;

	private startTiles: number;

	constructor(size: number) {
		this.size = size; // Size of the grid
		this.gestureManager = new GestureManager({
			gameContainer: document.querySelector('.game-container') as HTMLDivElement,
			retryButton: document.querySelector('.retry-button')
		});
		this.domUpdater = new DOMUpdater();

		this.startTiles = 2;

		this.gestureManager.on('move', this.move.bind(this));
		this.gestureManager.on('restart', this.restart.bind(this));

		this.setup();
	}

	setup = () => {
		this.grid = new Grid(this.size);

		this.score = 0;
		this.over = false;
		this.won = false;

		// Add the initial tiles
		this.addStartTiles();

		// Update the actuator
		this.update();
	};

	restart = () => {
		this.domUpdater.restart();
		this.setup();
	};

	addStartTiles = () => {
		for (let i = 0; i < this.startTiles; i++) {
			this.addRandomTile();
		}
	};

	addRandomTile = () => {
		if (this.grid.cellsAvailable()) {
			var value = Math.random() < 0.9 ? 2 : 4;
			var tile = new Tile(this.grid.randomAvailableCell(), value);

			this.grid.insertTile(tile);
		}
	};

	update = () => {
		this.domUpdater.update(this.grid, {
			score: this.score,
			over: this.over,
			won: this.won
		});
	};

	prepareTiles = () => {
		this.grid.eachCell((x, y, tile) => {
			if (tile) {
				tile.mergedFrom = null;
				tile.savePosition();
			}
		});
	};

	moveTile = (tile, cell) => {
		this.grid.cells[tile.x][tile.y] = null;
		this.grid.cells[cell.x][cell.y] = tile;

		tile.updatePosition(cell);
	};

	move = direction => {
		// 0: up, 1: right, 2:down, 3: left

		if (this.over || this.won) {
			return; // Don't do anything if the game's over
		}

		let cell;
		let tile;
		let moved = false;

		const vector = this.getVector(direction);
		const traversals = this.buildTraversals(vector);

		this.prepareTiles();

		// Traverse the grid in the right direction and move tiles
		traversals.x.forEach(x => {
			traversals.y.forEach(y => {
				cell = { x, y };
				tile = this.grid.cellContent(cell);

				if (tile) {
					var positions = this.findFarthestPosition(cell, vector);
					var next = this.grid.cellContent(positions.next);

					// Only one merger per row traversal?
					if (next && next.value === tile.value && !next.mergedFrom) {
						var merged = new Tile(positions.next, tile.value * 2);
						merged.mergedFrom = [tile, next];

						this.grid.insertTile(merged);
						this.grid.removeTile(tile);

						// Converge the two tiles' positions
						tile.updatePosition(positions.next);

						// Update the score
						this.score += merged.value;

						// The mighty 2048 tile
						if (merged.value === 2048) this.won = true;
					} else {
						this.moveTile(tile, positions.farthest);
					}

					if (!this.positionsEqual(cell, tile)) {
						moved = true; // The tile moved from its original cell!
					}
				}
			});
		});

		if (moved) {
			this.addRandomTile();

			if (!this.movesAvailable()) {
				this.over = true; // Game over!
			}

			this.update();
		}
	};

	getVector = direction => {
		// Vectors representing tile movement
		const map: IndexedList<Position> = {
			0: { x: 0, y: -1 }, // up
			1: { x: 1, y: 0 }, // right
			2: { x: 0, y: 1 }, // down
			3: { x: -1, y: 0 } // left
		};

		return map[direction];
	};

	buildTraversals = vector => {
		const traversals = { x: [], y: [] };

		for (let pos = 0; pos < this.size; pos++) {
			traversals.x.push(pos);
			traversals.y.push(pos);
		}

		if (vector.x === 1) {
			traversals.x = traversals.x.reverse();
		}

		if (vector.y === 1) {
			traversals.y = traversals.y.reverse();
		}

		return traversals;
	};

	findFarthestPosition = (cell, vector) => {
		let previous;

		// Progress towards the vector direction until an obstacle is found
		do {
			previous = cell;
			cell = { x: previous.x + vector.x, y: previous.y + vector.y };
		} while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

		return {
			farthest: previous,
			next: cell // Used to check if a merge is required
		};
	};

	movesAvailable = () => this.grid.cellsAvailable() || this.tileMatchesAvailable();

	tileMatchesAvailable = () => {
		let tile;

		for (let x = 0; x < this.size; x++) {
			for (let y = 0; y < this.size; y++) {
				tile = this.grid.cellContent({ x, y });

				if (tile) {
					for (let direction = 0; direction < 4; direction++) {
						const vector = this.getVector(direction);
						const cell = { x: x + vector.x, y: y + vector.y };

						const other = this.grid.cellContent(cell);

						if (other && other.value === tile.value) {
							return true; // These two tiles can be merged
						}
					}
				}
			}
		}

		return false;
	};

	positionsEqual = (first, second) => first.x === second.x && first.y === second.y;
}
