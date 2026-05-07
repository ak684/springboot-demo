const path = require('path');

module.exports = {
  webpack: {
    alias: {},
    plugins: [],
    configure: (webpackConfig, { env, paths }) => {
      // Enable filesystem caching for faster builds
      if (env === 'production') {
        webpackConfig.cache = {
          type: 'filesystem',
          cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
          buildDependencies: {
            config: [__filename]
          }
        };
      }

      webpackConfig.module.rules.forEach(rule => {
        if (rule.oneOf instanceof Array) {
          rule.oneOf.forEach(oneOf => {
            if (oneOf.loader && oneOf.loader.includes('babel-loader')) {
              oneOf.include = [
                path.join(__dirname, 'src'),
                path.join(__dirname, '../shared-components')
              ];
            }
          });
        }
      });
      return webpackConfig;
    }
  }
};
