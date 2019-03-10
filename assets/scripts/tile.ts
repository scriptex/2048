export interface Position {
	x: number;
	y: number;
}

export default class Tile {
	public value: number;
	public mergedFrom: [any, any];
	public previousPosition: Position;

	private x: Position['x'];
	private y: Position['y'];

	constructor(position: Position, value: number) {
		this.x = position.x;
		this.y = position.y;
		this.value = value || 2;

		this.previousPosition = null;
		this.mergedFrom = null; // Tracks tiles that merged together
	}

	savePosition = () => {
		this.previousPosition = { x: this.x, y: this.y };
	};

	updatePosition = (position: Position) => {
		this.x = position.x;
		this.y = position.y;
	};
}
