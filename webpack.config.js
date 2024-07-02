const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const path = require('path');

const ENV = process.env.APP_ENV;
const isTest = ENV === 'test';
const isProd = ENV === 'prod';

function setDevTool() {
  if (isTest) {
    return 'inline-source-map';
  } else if (isProd) {
    return 'source-map';
  } else {
    return 'eval-source-map';
  }
}

const config = {
  mode: isProd ? 'production' : 'development',
  devtool: setDevTool(),
  entry: path.resolve(__dirname, "src/app/index.jsx"),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      fs: false,
    }
  },
  module: {
    rules: [
      {
        test: /\.(jpe?g|ico|gif|png|woff|ttf|wav|mp3|webmanifest|xml)$/i,
        type: 'asset/resource',
      },
      {
        test: /apple-app-site-association$/,
        type: 'asset/resource',
        generator: {
          filename: '[name]'
        }
      },
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(sass|scss)$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src/public/index.html"),
      inject: 'body'
    }),
    new Dotenv()
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'src/public'),
    },
    port: 7700,
    historyApiFallback: true,
    hot: true,
  },
  optimization: {
    minimizer: [new TerserPlugin()],
  },
};

if (isProd) {
  config.plugins.push(
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'src/public'), to: 'public' }
      ],
    })
  );
}

module.exports = config;
