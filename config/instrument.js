const Sentry = require('@sentry/node');
const config = require('./index.js');

Sentry.init({
     dsn: config.sentry.dsn,
     enableLogs: true,
     integrations: [Sentry.pinoIntegration({ log: { levels: ["error", "warn"] } })]
})

module.exports = Sentry;