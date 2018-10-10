var path = require('path')
var webpack = require('webpack')
var VueLoaderPlugin = require('vue-loader/lib/plugin')

var env = process.env.NODE_ENV;
var isDevelopment = env === 'development';

module.exports = {
  entry: {
    app: './example/main.js',
  },
  resolve: {
    extensions: ['.js', '.vue'],
  },
  devtool: isDevelopment ? 'inline-source-map' : 'source-map',
  devServer: {
    contentBase: './example',
    historyApiFallback: true,
    // noInfo: true,
    host: process.env.WEBPACK_DEV_HOST,
    port: process.env.WEBPACK_DEV_PORT
  },
  output: {
    path: path.resolve(__dirname, 'example'),
    filename: 'bundle.js',
    publicPath: '/',
    // library: 'layerboard',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        // exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  externals: {
    // 'vue': 'Vue',
    'leaflet': 'L',
    'jQuery': '$',
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map',
  plugins: [
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
    new VueLoaderPlugin(),
  ],
  mode: env,
};
