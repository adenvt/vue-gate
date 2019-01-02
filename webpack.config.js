const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const merge          = require('webpack-merge')
const path           = require('path')
const { name }       = require('./package.json')

const isProd = process.env.NODE_ENV === 'production'
const common = {
  entry : './src/index.js',
  mode  : process.env.NODE_ENV,
  module: {
    rules: [
      {
        test   : /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use    : {
          loader : 'babel-loader',
          options: {
            presets: [['@babel/preset-env']],
            plugins: [['add-module-exports', { addDefaultProperty: true }]],
          },
        },
      },
    ],
  },
}

if (isProd)
  Object.assign(common, { plugins: [new UglifyJsPlugin({ uglifyOptions: { output: { comments: false } } })] })
else {
  Object.assign(common, {
    devtool  : 'inline-source-map',
    devServer: { contentBase: ['./dist', './dev'] },
  })
}

const umd = merge(common, {
  output: {
    filename         : `${name}.js`,
    path             : path.resolve(__dirname, 'dist'),
    libraryExport    : 'default',
    libraryTarget    : 'umd',
    sourceMapFilename: `${name}.map`,
    library          : {
      root    : 'VueGate',
      commonjs: name,
      amd     : name,
    },
  },
})

const commonjs = merge(common, {
  output: {
    filename         : `${name}.common.js`,
    path             : path.resolve(__dirname, 'dist'),
    libraryTarget    : 'commonjs2',
    libraryExport    : 'default',
    sourceMapFilename: `${name}.map`,
  },
})

module.exports = [ umd, commonjs ]
