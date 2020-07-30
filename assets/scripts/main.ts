import 'scriptex-socials';
import Game from './game';

window.requestAnimationFrame(() => new Game(4));

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('./service-worker.js');
	});
}
