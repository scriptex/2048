import { Position } from './tile';

export default class Grid {
	public size: number;
	public cells: any;

	constructor(size: number) {
		this.size = size;
		this.cells = [];

		this.build();
	}

	build = () => {
		for (let x = 0; x < this.size; x++) {
			const row = (this.cells[x] = []);

			for (let y = 0; y < this.size; y++) {
				row.push(null);
			}
		}
	};

	randomAvailableCell = () => {
		const cells = this.availableCells();

		if (cells.length) {
			return cells[Math.floor(Math.random() * cells.length)];
		}
	};

	availableCells = () => {
		const cells = [];

		this.eachCell((x, y, tile) => {
			if (!tile) {
				cells.push({ x: x, y: y });
			}
		});

		return cells;
	};

	eachCell = callback => {
		for (let x = 0; x < this.size; x++) {
			for (let y = 0; y < this.size; y++) {
				callback(x, y, this.cells[x][y]);
			}
		}
	};

	cellsAvailable = () => !!this.availableCells().length;

	cellAvailable = cell => !this.cellOccupied(cell);

	cellOccupied = cell => !!this.cellContent(cell);

	cellContent = cell => (this.withinBounds(cell) ? this.cells[cell.x][cell.y] : null);

	insertTile = tile => {
		this.cells[tile.x][tile.y] = tile;
	};

	removeTile = tile => {
		this.cells[tile.x][tile.y] = null;
	};

	withinBounds = (position: Position) => {
		return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size;
	};
}
