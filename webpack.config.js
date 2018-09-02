const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const path           = require('path')
const { name }       = require('./package.json')

const isProd = process.env.NODE_ENV === 'production'
const config = {
  entry : './src/index.js',
  mode  : process.env.NODE_ENV,
  output: {
    filename: `${name}.js`,
    path    : path.resolve(__dirname, 'dist'),
    library : {
      root    : 'VueGate',
      amd     : name,
      commonjs: name,
    },
    libraryTarget    : 'umd',
    libraryExport    : 'default',
    sourceMapFilename: `${name}.map`,
  },
  module: {
    rules: [
      {
        test   : /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use    : {
          loader : 'babel-loader',
          options: { presets: ['@babel/preset-env'] },
        },
      },
    ],
  },
}

if (isProd)
  Object.assign(config, { plugins: [new UglifyJsPlugin({ uglifyOptions: { output: { comments: false } } })] })
else {
  Object.assign(config, {
    devtool  : 'inline-source-map',
    devServer: { contentBase: ['./dist', './dev'] },
  })
}

module.exports = config
