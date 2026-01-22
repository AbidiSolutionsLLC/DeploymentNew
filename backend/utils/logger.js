// utils/logger.js

const winston = require('winston');

// Create the logger instance
const logger = winston.createLogger({
  level: 'info',  // Default log level
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  
  ],
});

// Adding custom methods for each log level
const info = (message) => {
  logger.info(message);  // Log as info
};

const warn = (message) => {
  logger.warn(message);  // Log as warning
};

const error = (message) => {
  logger.error(message);  // Log as error
};

const debug = (message) => {
  logger.debug(message);  // Log as debug
};

module.exports = { info, warn, error, debug };
