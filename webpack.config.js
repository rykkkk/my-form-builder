const webpack = require('webpack');
const dotenv = require('dotenv');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';

  const resolveEnvName = (envArg) => {
    if (!envArg) return 'local';
    if (typeof envArg === 'string') return envArg;
    const ignoredKeys = new Set(['WEBPACK_SERVE', 'WEBPACK_BUILD']);
    const candidate = Object.keys(envArg).find(
      (key) => !ignoredKeys.has(key) && !key.toUpperCase().startsWith('WEBPACK_') && envArg[key] === true
    );
    return candidate || 'local';
  };

  const envString = resolveEnvName(env);
  const envResult = dotenv.config({ path: `.env.${envString}` });
  if (envResult.error) throw envResult.error;

  return {
    entry: ['regenerator-runtime/runtime.js', './src/index.tsx'],
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
      clean: true,
    },
    mode,
    devtool: 'source-map',
    devServer: {
      liveReload: true,
      historyApiFallback: true,
      client: { overlay: { warnings: false, errors: false } },
    },
    resolve: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
    stats: 'errors-only',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    optimization: {
      minimize: mode === 'production',
      minimizer: [new TerserPlugin({ terserOptions: { compress: { drop_console: mode === 'production', drop_debugger: true } } })],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: './public/index.html' }),
      new webpack.DefinePlugin({ 'process.env': JSON.stringify(envResult.parsed) }),
    ],
  };
};
