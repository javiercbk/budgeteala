const appLogger = require('./logger').getInstance();

class ApplicationLogger {
  constructor(requestData, logLevel = 'info', logger = appLogger) {
    this.requestData = requestData;
    this.logger = logger;
    const keys = Object.keys(this.logger.transports);
    keys.forEach((k) => {
      this.logger.transports[k].level = logLevel;
    });
  }

  silly(message) {
    this.logger.silly(message, {
      requestId: this.requestData.req.id
    });
  }

  debug(message) {
    this.logger.debug(message, {
      requestId: this.requestData.req.id
    });
  }

  verbose(message) {
    this.logger.verbose(message, {
      requestId: this.requestData.req.id
    });
  }

  info(message) {
    this.logger.info(message, {
      requestId: this.requestData.req.id
    });
  }

  warn(message) {
    this.logger.warn(message, {
      requestId: this.requestData.req.id
    });
  }

  error(message) {
    this.logger.error(message, {
      requestId: this.requestData.req.id
    });
  }
}

module.exports = ApplicationLogger;
