module.exports = {
  devServer: {
    // proxy: "http://10.10.0.11:8088",
    proxy: {
      "/": {
        target: "http://192.168.254.82:9088",
        ws: true,
      },
    },
  },
};
