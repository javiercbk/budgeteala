/* eslint-disable space-unary-ops */
const winston = require('winston');
const moment = require('moment');
const RotatingTransportsFile = require('winston-daily-rotate-file');

class LoggerFactory {
  constructor(logsPath) {
    this.transports = [new winston.transports.Console()];
    this.logsPath = logsPath;
    this._instance = null;
  }

  getInstance() {
    if (!this._instance) {
      if (this.logsPath) {
        const logFile = this.logsPath;
        this.transports = [
          new RotatingTransportsFile({
            filename: logFile,
            stringify: (options) => {
              const logFormat = {
                level: options.level,
                timestamp: options.timestamp,
                message: options.message
              };
              if (options.requestId) {
                logFormat.requestId = options.requestId;
              }
              if (options.sessionID) {
                logFormat.sessionID = options.sessionID;
              }
              return JSON.stringify(logFormat);
            }
          })
        ];
      }
      this._instance = new winston.Logger({
        level: 'info',
        timestamp: () =>
          moment()
            .utc()
            .toDate(),
        transports: this.transports
      });
    }
    return this._instance;
  }
}

module.exports = new LoggerFactory();
