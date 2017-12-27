#!/usr/bin/env node
const db = require('./lib/db');
const App = require('./app');
const stdoutLogger = require('./lib/log/stdout-logger');
const config = require('./lib/config');

let server = null;

const app = new App();
app.express.set('port', config.BUDGETEALA_PORT);

process.on('SIGINT', () => {
  // Graceful shutdown
  // wait 10 seconds and close the db and exit
  server.close();
  setTimeout(() => {
    db.sequelize.close().then(() => {
      process.exit(0);
    });
  }, 10000);
});

server = app.express.listen(app.express.get('port'), () => {
  stdoutLogger.info('Express server listening');
});
