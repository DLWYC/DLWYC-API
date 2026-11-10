const pino = require('pino');

const logger = pino({
     transport: {
          targets: [
               {
                    target: 'pino-pretty',
                    option: {
                         colorize: true,
                         translateTime: 'HH:MM:ss',
                         ignore: 'pid,hostname',

                    }
               }
          ]
     }
});

module.exports = logger;