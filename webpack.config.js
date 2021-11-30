// @ts-nocheck

const { exec } = require('child_process');
const { parse } = require('url');
const { resolve } = require('path');

const { argv } = require('yargs');
const webpack = require('webpack');
const magicImporter = require('node-sass-magic-importer');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const cssnano = require('cssnano');
const postcssURL = require('postcss-url');
const autoprefixer = require('autoprefixer');
const postcssUtilities = require('postcss-utilities');
const postcssEasyImport = require('postcss-easy-import');
const postcssMergeRules = require('postcss-merge-rules');
const postcssWatchFolder = require('postcss-watch-folder');
const postcssFlexbugsFixed = require('postcss-flexbugs-fixes');

const { mode } = argv;
const sourceMap = {
	sourceMap: mode === 'development'
};

const postcssOptions = {
	plugins: [postcssURL({ url: 'rebase' }), autoprefixer(), postcssUtilities, postcssEasyImport, postcssFlexbugsFixed],
	...sourceMap
};

const browserSyncConfig = server => ({
	host: 'localhost',
	port: 3000,
	open: 'external',
	files: ['**/*.html', './assets/dist/app.css', './assets/dist/app.js'],
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
});

const extractTextConfig = {
	filename: 'app.css'
};

const cleanConfig = {
	cleanOnceBeforeBuildPatterns: ['**/*', '!sprite.svg']
};

module.exports = env => {
	const { url, server } = env;

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

	const bsConfig = browserSyncConfig(server);

	const config = {
		mode: mode,
		entry: ['./assets/styles/main.scss', './assets/scripts/main.ts'],
		output: {
			path: resolve(__dirname, './assets/dist'),
			filename: 'app.js'
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
					loader: 'ts-loader'
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
			new CleanWebpackPlugin(cleanConfig)
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
			bsConfig.host = parse(url).hostname;
			bsConfig.proxy = url;
		}

		if (server) {
			delete bsConfig.host;
			delete bsConfig.proxy;

			bsConfig.server = true;
		}

		config.plugins.push(
			new BrowserSyncPlugin(bsConfig, {
				reload: false
			})
		);
	}

	return config;
};
