import Grid from './grid';
import Tile, { Position } from './tile';

export interface Metadata {
	score: number;
	isOver: boolean;
	isWin: boolean;
}

export default class DOMUpdater {
	private tileContainer: Element;
	private scoreContainer: Element;
	private messageContainer: Element;
	private bestScoreContainer: Element;

	public score: number;

	private storageKey: string;

	constructor() {
		this.tileContainer = document.querySelector('.tiles') as HTMLDivElement;
		this.scoreContainer = document.querySelector('.current-score') as HTMLDivElement;
		this.messageContainer = document.querySelector('.message') as HTMLDivElement;
		this.bestScoreContainer = document.querySelector('.best-score') as HTMLDivElement;

		this.score = 0;

		this.storageKey = '2048-best-score';

		this.updateBestScore();
	}

	public update = (grid: Grid, metadata: Metadata): void => {
		window.requestAnimationFrame(() => {
			this.clearContainer(this.tileContainer);

			grid.cells.forEach((column: Tile[]) => {
				column.forEach((cell: Tile) => {
					if (cell) {
						this.addTile(cell);
					}
				});
			});

			this.updateScore(metadata.score);

			if (metadata.isOver) {
				this.getMessage(false);
			}

			if (metadata.isWin) {
				this.getMessage(true);
			}
		});
	};

	public restart = (): void => {
		this.clearMessage();
	};

	private clearContainer = (container: Element): void => {
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
	};

	private addTile = (tile: Tile): void => {
		const element: Element = document.createElement('div');
		const position: Position = tile.prevPosition || { x: tile.x, y: tile.y };
		const getPositionClass: string = this.getPositionClass(position);
		const classes: string[] = ['tile', 'tile-' + tile.value, getPositionClass];

		this.setClass(element, classes);

		element.textContent = tile.value.toString();

		if (tile.prevPosition) {
			window.requestAnimationFrame(() => {
				classes[2] = this.getPositionClass({ x: tile.x, y: tile.y });

				this.setClass(element, classes);
			});
		} else if (tile.mergedFrom) {
			classes.push('tile-merged');

			this.setClass(element, classes);

			tile.mergedFrom.forEach((merged: Tile) => {
				this.addTile(merged);
			});
		} else {
			classes.push('tile-new');

			this.setClass(element, classes);
		}

		this.tileContainer.appendChild(element);
	};

	private setClass = (element: Element, classes: string[]): void => {
		element.setAttribute('class', classes.join(' '));
	};

	private normalizePosition = (position: Position): Position => ({
		x: position.x + 1,
		y: position.y + 1
	});

	private getPositionClass = (position: Position): string => {
		const { x, y } = this.normalizePosition(position);

		return `tile-position-${x}-${y}`;
	};

	private updateScore = (score: number): void => {
		const difference: number = score - this.score;

		this.score = score;

		this.clearContainer(this.scoreContainer);
		this.scoreContainer.textContent = this.score.toString();

		if (difference > 0) {
			const addition: Element = document.createElement('div');

			addition.classList.add('score-addition');
			addition.textContent = '+' + difference;

			this.scoreContainer.appendChild(addition);

			this.updateBestScore();
		}
	};

	private updateBestScore = (): void => {
		const bestScore: string = localStorage.getItem(this.storageKey) || '';
		const currentScore: number = this.score;

		if (!bestScore) {
			localStorage.setItem(this.storageKey, currentScore.toString());
		}

		if (bestScore && currentScore > parseInt(bestScore, 10)) {
			localStorage.setItem(this.storageKey, currentScore.toString());
		}

		this.bestScoreContainer.textContent = localStorage.getItem(this.storageKey);
	};

	private getMessage = (isWin: boolean): void => {
		const type: string = isWin ? 'game-won' : 'game-over';
		const message: string = isWin ? 'You win!' : 'Game over!';

		this.messageContainer.classList.add(type);
		this.messageContainer.querySelector('p')!.textContent = message;
	};

	private clearMessage = () => {
		this.messageContainer.classList.remove('game-won', 'game-over');
	};
}
