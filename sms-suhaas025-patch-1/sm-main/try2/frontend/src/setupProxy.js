const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to the backend server
  app.use(
    '/api',
    createProxyMiddleware({
      // Target is the backend server URL. If running locally, this would typically be where your Spring Boot app is running
      target: 'http://localhost:8080',
      changeOrigin: true,
      // Don't rewrite the path
      pathRewrite: {
        '^/api': '/api'
      },
      // Log proxy activity (helpful for debugging)
      logLevel: 'debug',
      // Add proper headers to prevent CORS issues
      onProxyRes: function(proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      }
    })
  );
}; 