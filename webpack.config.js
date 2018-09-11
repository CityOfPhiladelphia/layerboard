var path = require('path')
var webpack = require('webpack')
var VueLoaderPlugin = require('vue-loader/lib/plugin')

var env = process.env.NODE_ENV;
var isDevelopment = env === 'development';

module.exports = {
  entry: {
    // app: './src/main.js',
    app: './config.js',
  },
  resolve: {
    extensions: ['.js', '.vue'],
    // alias: {
    //   'vue$': 'vue/public/vue.esm.js'
    // }
  },
  devtool: isDevelopment ? 'inline-source-map' : 'source-map',
  devServer: {
    contentBase: './public',
    historyApiFallback: true,
    // noInfo: true,
    host: process.env.WEBPACK_DEV_HOST,
    port: process.env.WEBPACK_DEV_PORT
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'build.js',
    publicPath: '/',
    library: 'layerboard',
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
    // new webpack.DefinePlugin({
    //   // this allows webpack to interpolate the value of the WEBPACK_DEV_HOST
    //   // env var during build.
    //   'process.env.WEBPACK_DEV_HOST': JSON.stringify(
    //                                     process.env.WEBPACK_DEV_HOST
    //                                   )
    // })
  ],
  mode: env,
  // optimization: {
  //
  // },
};

// if (process.env.NODE_ENV === 'production') {
//   module.exports.devtool = '#source-map'
//   // http://vue-loader.vuejs.org/en/workflow/production.html
//   module.exports.plugins = (module.exports.plugins || []).concat([
//     new webpack.DefinePlugin({
//       'process.env': {
//         NODE_ENV: '"production"'
//       }
//     }),
//     new webpack.optimize.UglifyJsPlugin({
//       sourceMap: true,
//       compress: {
//         warnings: false
//       }
//     }),
//     new webpack.LoaderOptionsPlugin({
//       minimize: true
//     })
//   ])
// }
