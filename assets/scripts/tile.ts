export interface Position {
	x: number;
	y: number;
}

export default class Tile {
	public x: Position['x'];
	public y: Position['y'];
	public value: number;
	public mergedFrom: [any, any] | null;
	public prevPosition: Position | null;

	constructor(position: Position, value: number) {
		this.x = position.x;
		this.y = position.y;
		this.value = value || 2;
		this.mergedFrom = null;
		this.prevPosition = null;
	}

	public save = (): void => {
		this.prevPosition = { x: this.x, y: this.y };
	};

	public update = (position: Position): void => {
		this.x = position.x;
		this.y = position.y;
	};
}
