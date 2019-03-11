import Grid from './grid';
import Tile, { Position } from './tile';
import DOMUpdater from './dom-updater';
import GestureManager, { IndexedList } from './gesture-manager';

export interface Directions {
	x: number[];
	y: number[];
}

export interface LastPosition {
	last: Position;
	next: Position;
}

export default class Game {
	private size: number;
	private score: number;
	private startTiles: number;
	private isWin: boolean;
	private isOver: boolean;
	private grid: Grid;
	private domUpdater: DOMUpdater;
	private gestureManager: GestureManager;

	constructor(size: number, startTiles: number = 2) {
		this.size = size;
		this.startTiles = startTiles;

		this.gestureManager = new GestureManager({
			gameContainer: document.querySelector('.game-container') as HTMLDivElement,
			retryButton: document.querySelector('.retry-button')
		});
		this.domUpdater = new DOMUpdater();

		this.gestureManager.on('move', this.move.bind(this));
		this.gestureManager.on('restart', this.restart.bind(this));

		this.init();
	}

	private init = (): void => {
		this.grid = new Grid(this.size);

		this.score = 0;
		this.isOver = false;
		this.isWin = false;

		this.renderStartTiles();
		this.update();
	};

	private restart = (): void => {
		this.domUpdater.restart();
		this.init();
	};

	private renderStartTiles = (): void => {
		for (let i = 0; i < this.startTiles; i++) {
			this.renderTile();
		}
	};

	private renderTile = (): void => {
		if (!this.grid.hasCellsAvailable()) {
			return;
		}

		const value: number = Math.random() < 0.9 ? 2 : 4;
		const tile: Tile = new Tile(this.grid.getAvailableCell(), value);

		this.grid.insertTile(tile);
	};

	private update = (): void => {
		this.domUpdater.update(this.grid, {
			score: this.score,
			isOver: this.isOver,
			isWin: this.isWin
		});
	};

	private updateTiles = (): void => {
		this.grid.eachCell((x: number, y: number, tile: Tile) => {
			if (tile) {
				tile.mergedFrom = null;
				tile.save();
			}
		});
	};

	private moveTile = (tile: Tile, cell: Position): void => {
		this.grid.cells[tile.x][tile.y] = null;
		this.grid.cells[cell.x][cell.y] = tile;

		tile.update(cell);
	};

	private move = (direction: number): void => {
		if (this.isOver || this.isWin) {
			return;
		}

		let cell: Position;
		let tile: Tile;
		let isMoved: boolean = false;

		const coordinates: Position = this.getCoordinates(direction);
		const cellsInDirection: Directions = this.getCellsInDirection(coordinates);

		this.updateTiles();

		cellsInDirection.x.forEach((x: number) => {
			cellsInDirection.y.forEach((y: number) => {
				cell = { x, y };
				tile = this.grid.getCellContent(cell);

				if (tile) {
					const positions: LastPosition = this.getLastPosition(cell, coordinates);
					const next: Tile = this.grid.getCellContent(positions.next);

					if (next && next.value === tile.value && !next.mergedFrom) {
						const mergedTile: Tile = new Tile(positions.next, tile.value * 2);

						mergedTile.mergedFrom = [tile, next];

						this.grid.insertTile(mergedTile);
						this.grid.removeTile(tile);

						tile.update(positions.next);

						this.score += mergedTile.value;

						if (mergedTile.value === 2048) {
							this.isWin = true;
						}
					} else {
						this.moveTile(tile, positions.last);
					}

					if (!this.arePositionsEqual(cell, tile)) {
						isMoved = true;
					}
				}
			});
		});

		if (isMoved) {
			this.renderTile();

			if (!this.hasMovesLeft()) {
				this.isOver = true;
			}

			this.update();
		}
	};

	private getCoordinates = (direction: number): Position => {
		const map: IndexedList<Position> = {
			0: { x: 0, y: -1 },
			1: { x: 1, y: 0 },
			2: { x: 0, y: 1 },
			3: { x: -1, y: 0 }
		};

		return map[direction];
	};

	private getCellsInDirection = (coordinates: Position): Directions => {
		const cellsInDirection: Directions = { x: [], y: [] };

		for (let pos = 0; pos < this.size; pos++) {
			cellsInDirection.x.push(pos);
			cellsInDirection.y.push(pos);
		}

		if (coordinates.x === 1) {
			cellsInDirection.x = cellsInDirection.x.reverse();
		}

		if (coordinates.y === 1) {
			cellsInDirection.y = cellsInDirection.y.reverse();
		}

		return cellsInDirection;
	};

	private getLastPosition = (cell: Position, coordinates: Position): LastPosition => {
		let previous: Position;

		do {
			previous = cell;
			cell = { x: previous.x + coordinates.x, y: previous.y + coordinates.y };
		} while (this.grid.isInBounds(cell) && this.grid.isCellAvailable(cell));

		return {
			last: previous,
			next: cell
		};
	};

	private hasMovesLeft = (): boolean => this.grid.hasCellsAvailable() || this.tileMatchesAvailable();

	private tileMatchesAvailable = (): boolean => {
		let tile: Tile;

		for (let x = 0; x < this.size; x++) {
			for (let y = 0; y < this.size; y++) {
				tile = this.grid.getCellContent({ x, y });

				if (!tile) {
					continue;
				}

				for (let direction = 0; direction < this.size; direction++) {
					const coordinates: Position = this.getCoordinates(direction);
					const cell: Position = { x: x + coordinates.x, y: y + coordinates.y };
					const other: Tile = this.grid.getCellContent(cell);

					if (other && other.value === tile.value) {
						return true;
					}
				}
			}
		}

		return false;
	};

	private arePositionsEqual = (first: Position, second: Position) => first.x === second.x && first.y === second.y;
}
