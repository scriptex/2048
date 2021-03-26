import * as Hammer from 'hammerjs';

export type GestureEvent = MouseEvent | HammerListener | 'restart';

export type GestureCallback = (event: GestureEvent) => void;

export interface IndexedList<T> {
	[key: string]: T;
}

export interface GestureManagerOptions {
	gameContainer: HTMLDivElement;
	retryButton: HTMLButtonElement;
}

export const eventsMap: IndexedList<number> = {
	38: 0,
	39: 1,
	40: 2,
	37: 3
};

export default class GestureManager {
	public gameContainer: HTMLDivElement;
	public retryButton: HTMLButtonElement;

	private events: IndexedList<GestureCallback[]> = {};

	constructor(options: GestureManagerOptions) {
		this.gameContainer = options.gameContainer;
		this.retryButton = options.retryButton;
		this.events = {};

		this.listen();
	}

	public on = (event: string, callback: (event: GestureEvent) => void): void => {
		if (!this.events[event]) {
			this.events[event] = [];
		}

		this.events[event].push(callback);
	};

	private bindKeyboardEvents = (): void => {
		document.addEventListener('keydown', (event: KeyboardEvent): void => {
			const modifiers: boolean = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
			const mapped: number = eventsMap[event.which];

			if (modifiers) {
				return;
			}

			if (mapped !== undefined) {
				event.preventDefault();

				this.emit('move', mapped);
			}

			if (event.which === 32) {
				this.restart();
			}
		});
	};

	private bindTouchEvents = (): void => {
		const handler: HammerManager = new Hammer(this.gameContainer, {
			recognizers: [
				[
					Hammer.Swipe,
					{
						direction: Hammer.DIRECTION_ALL
					}
				]
			]
		});

		const gestures: number[] = [
			Hammer.DIRECTION_UP,
			Hammer.DIRECTION_RIGHT,
			Hammer.DIRECTION_DOWN,
			Hammer.DIRECTION_LEFT
		];

		handler.on('swipe', (event: HammerInput) => {
			event.preventDefault();

			const mapped: number = gestures.indexOf(event.direction);

			if (mapped !== -1) {
				this.emit('move', mapped);
			}
		});
	};

	private bindRestart = (): void => {
		this.retryButton.addEventListener('click', this.restart.bind(this));
	};

	private listen = (): void => {
		this.bindKeyboardEvents();
		this.bindTouchEvents();
		this.bindRestart();
	};

	private emit = (event: string, data?: any): void => {
		const callbacks = this.events[event];

		if (!callbacks) {
			return;
		}

		callbacks.forEach((callback: (args: any) => any) => callback(data));
	};

	private restart = (): void => {
		this.emit('restart');
	};
}
