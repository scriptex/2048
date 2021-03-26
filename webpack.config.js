// @ts-nocheck

const { exec } = require('child_process');
const { parse } = require('url');
const { resolve } = require('path');

const { argv } = require('yargs');
const webpack = require('webpack');
const magicImporter = require('node-sass-magic-importer');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const cssnano = require('cssnano');
const postcssURL = require('postcss-url');
const autoprefixer = require('autoprefixer');
const postcssUtilities = require('postcss-utilities');
const postcssEasyImport = require('postcss-easy-import');
const postcssMergeRules = require('postcss-merge-rules');
const postcssWatchFolder = require('postcss-watch-folder');
const postcssFlexbugsFixed = require('postcss-flexbugs-fixes');

const { url, server, mode } = argv;
const sourceMap = {
	sourceMap: mode === 'development'
};

if (server) {
	exec('php index.php > index.html');
}

const postcssOptions = {
	plugins: [postcssURL({ url: 'rebase' }), autoprefixer(), postcssUtilities, postcssEasyImport, postcssFlexbugsFixed],
	...sourceMap
};

const browserSyncConfig = {
	host: 'localhost',
	port: 3000,
	open: 'external',
	/* eslint-disable no-mixed-spaces-and-tabs */
	files: [
		server
			? {
					match: ['*.php'],
					fn(_, file) {
						const name = file.replace(/.php$/, '');

						exec(`php ${file} > ${name}.html`);
					}
			  }
			: '**/*.php',
		'**/*.html',
		'./assets/dist/app.css',
		'./assets/dist/app.js'
	],
	/* eslint-enable */
	ghostMode: {
		clicks: false,
		scroll: true,
		forms: {
			submit: true,
			inputs: true,
			toggles: true
		}
	},
	snippetOptions: {
		rule: {
			match: /<\/body>/i,
			fn: (snippet, match) => `${snippet}${match}`
		}
	},
	proxy: 'localhost'
};

const extractTextConfig = {
	filename: 'dist/app.css'
};

const cleanConfig = {
	verbose: false,
	exclude: ['sprite.svg'],
	allowExternal: true
};

module.exports = () => {
	const isDevelopment = mode === 'development';
	const isProduction = mode === 'production';

	if (isProduction) {
		postcssOptions.plugins.push(postcssMergeRules, cssnano());
	}

	if (isDevelopment) {
		postcssOptions.plugins.push(
			postcssWatchFolder({
				folder: './assets/styles',
				main: './assets/styles/main.scss'
			})
		);
	}

	const config = {
		mode: mode,
		entry: ['./assets/styles/main.scss', './assets/scripts/main.ts'],
		output: {
			path: resolve(__dirname, './assets'),
			filename: 'dist/app.js'
		},
		resolve: {
			modules: ['node_modules', './assets/scripts', './assets/images/sprite'],
			extensions: ['.js', '.ts']
		},
		module: {
			rules: [
				{
					test: /\.(sa|sc|c)ss$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader
						},
						{
							loader: 'css-loader',
							options: sourceMap
						},
						{
							loader: 'postcss-loader',
							options: { postcssOptions }
						},
						{
							loader: 'sass-loader',
							options: {
								sassOptions: {
									importer: magicImporter()
								},
								...sourceMap
							}
						}
					]
				},
				{
					test: /\.ts$/,
					loader: 'awesome-typescript-loader'
				},
				{
					test: /\.js/,
					loader: 'source-map-loader'
				},
				{
					test: /\.(jpe?g|gif|png|svg|woff2?|ttf|eot|wav|mp3|mp4)(\?.*$|$)/,
					use: [
						{
							loader: 'file-loader',
							options: {
								name: '[hash].[ext]',
								context: '',
								publicPath: './',
								outputPath: './dist/'
							}
						}
					]
				}
			]
		},
		plugins: [
			new webpack.ProvidePlugin({
				$: 'jquery',
				jQuery: 'jquery',
				'window.jQuery': 'jquery'
			}),
			new MiniCssExtractPlugin(extractTextConfig),
			new CleanWebpackPlugin(['../assets/dist/'], cleanConfig)
		],
		externals: {
			jquery: 'jQuery'
		},
		cache: true,
		bail: false,
		devtool: isDevelopment ? 'source-map' : false,
		stats: 'errors-only'
	};

	if (isDevelopment) {
		if (url) {
			browserSyncConfig.host = parse(url).hostname;
			browserSyncConfig.proxy = url;
		}

		if (server) {
			delete browserSyncConfig.host;
			delete browserSyncConfig.proxy;

			browserSyncConfig.server = true;
		}

		config.plugins.push(
			new BrowserSyncPlugin(browserSyncConfig, {
				reload: false
			})
		);
	}

	return config;
};
