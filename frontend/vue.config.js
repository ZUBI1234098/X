module.exports = {
  devServer: {
    port: 8086
  },
  transpileDependencies: ['chart.js'],
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.m?js$/,
          include: /node_modules\/chart\.js/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-proposal-class-properties']
            }
          }
        }
      ]
    }
  }
}
