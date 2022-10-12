import 'scriptex-socials';
import 'html-head-component';

import Game from './game';

window.requestAnimationFrame(() => new Game(4));

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register(new URL('./service-worker.js', import.meta.url));
	});
}
