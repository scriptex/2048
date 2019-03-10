import { Position } from './tile';

export default class DOMUpdater {
	private tileContainer: Element;
	private scoreContainer: Element;
	private messageContainer: Element;

	public score: number;

	constructor() {
		this.tileContainer = document.getElementsByClassName('tile-container')[0];
		this.scoreContainer = document.getElementsByClassName('score-container')[0];
		this.messageContainer = document.getElementsByClassName('game-message')[0];

		this.score = 0;
	}

	update = (grid, metadata) => {
		window.requestAnimationFrame(() => {
			this.clearContainer(this.tileContainer);

			grid.cells.forEach(column => {
				column.forEach(cell => {
					if (cell) {
						this.addTile(cell);
					}
				});
			});

			this.updateScore(metadata.score);

			if (metadata.over) {
				this.message(false);
			}

			if (metadata.won) {
				this.message(true);
			}
		});
	};

	restart = () => {
		this.clearMessage();
	};

	clearContainer = container => {
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
	};

	addTile = tile => {
		const element: Element = document.createElement('div');
		const position: Position = tile.previousPosition || { x: tile.x, y: tile.y };
		const positionClass: string = this.positionClass(position);

		const classes = ['tile', 'tile-' + tile.value, positionClass];

		this.applyClasses(element, classes);

		element.textContent = tile.value;

		if (tile.previousPosition) {
			// Make sure that the tile gets rendered in the previous position first
			window.requestAnimationFrame(() => {
				classes[2] = this.positionClass({ x: tile.x, y: tile.y });
				this.applyClasses(element, classes); // Update the position
			});
		} else if (tile.mergedFrom) {
			classes.push('tile-merged');
			this.applyClasses(element, classes);

			// Render the tiles that merged
			tile.mergedFrom.forEach(merged => {
				this.addTile(merged);
			});
		} else {
			classes.push('tile-new');
			this.applyClasses(element, classes);
		}

		// Put the tile on the board
		this.tileContainer.appendChild(element);
	};

	applyClasses = (element, classes) => {
		element.setAttribute('class', classes.join(' '));
	};

	normalizePosition = (position: Position): Position => {
		return { x: position.x + 1, y: position.y + 1 };
	};

	positionClass = (position: Position): string => {
		position = this.normalizePosition(position);

		return 'tile-position-' + position.x + '-' + position.y;
	};

	updateScore = (score: number): void => {
		this.clearContainer(this.scoreContainer);

		const difference: number = score - this.score;

		this.score = score;

		this.scoreContainer.textContent = this.score.toString();

		if (difference > 0) {
			const addition: Element = document.createElement('div');

			addition.classList.add('score-addition');
			addition.textContent = '+' + difference;

			this.scoreContainer.appendChild(addition);
		}
	};

	message = (won: boolean): void => {
		const type: string = won ? 'game-won' : 'game-over';
		const message: string = won ? 'You win!' : 'Game over!';

		this.messageContainer.classList.add(type);
		this.messageContainer.querySelector('p').textContent = message;
	};

	clearMessage = () => {
		this.messageContainer.classList.remove('game-won', 'game-over');
	};
}
