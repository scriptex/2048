import Tile, { Position } from './tile';

export default class Grid {
	public size: number;
	public cells: any;

	constructor(size: number) {
		this.size = size;
		this.cells = [];

		this.build();
	}

	public getAvailableCell = (): Position | null => {
		const cells: Position[] = this.availableCells();

		if (!cells.length) {
			return null;
		}

		return cells[Math.floor(Math.random() * cells.length)];
	};

	public eachCell = (callback: (x: number, y: number, tile: Tile) => void): void => {
		for (let x = 0; x < this.size; x++) {
			for (let y = 0; y < this.size; y++) {
				callback(x, y, this.cells[x][y]);
			}
		}
	};

	public hasCellsAvailable = (): boolean => !!this.availableCells().length;

	public isCellAvailable = (cell: Position): boolean => !this.isCellOccupied(cell);

	public getCellContent = (cell: Position): Tile => (this.isInBounds(cell) ? this.cells[cell.x][cell.y] : null);

	public insertTile = (tile: Position): void => {
		this.cells[tile.x][tile.y] = tile;
	};

	public removeTile = (tile: Position): void => {
		this.cells[tile.x][tile.y] = null;
	};

	public isInBounds = (position: Position): boolean => {
		return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size;
	};

	private build = (): void => {
		for (let x = 0; x < this.size; x++) {
			const row: Array<Position | null> = (this.cells[x] = []);

			for (let y = 0; y < this.size; y++) {
				row.push(null);
			}
		}
	};

	private availableCells = (): Position[] => {
		const cells: Position[] = [];

		this.eachCell((x: number, y: number, tile: Tile) => {
			if (!tile) {
				cells.push({ x, y });
			}
		});

		return cells;
	};

	private isCellOccupied = (cell: Position): boolean => !!this.getCellContent(cell);
}
