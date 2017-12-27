class NullLogger {
  silly() {}
  debug() {}
  verbose() {}
  info() {}
  warn() {}
  error() {}
}

module.exports = new NullLogger();
