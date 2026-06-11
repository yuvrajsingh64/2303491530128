module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix 1: treat .mjs files as regular JS (not strict ESM)
      webpackConfig.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
        resolve: { fullySpecified: false },
      });

      // Fix 2: disable fullySpecified for all .m?js imports from node_modules
      webpackConfig.module.rules.push({
        test: /\.m?js/,
        include: /node_modules/,
        resolve: { fullySpecified: false },
      });

      return webpackConfig;
    },
  },
};
