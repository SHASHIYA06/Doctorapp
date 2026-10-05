/**
 * Simple health check endpoint
 */

module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    service: 'Healthcare SaaS API'
  });
};
