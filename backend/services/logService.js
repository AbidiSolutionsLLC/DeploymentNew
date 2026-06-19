const Log = require("../models/LogSchema");
const { info, warn, error, debug } = require("../utils/logger");
const { NotFoundError } = require("../utils/ExpressError");

class LogService {
  async saveLog(level, message, companyId) {
    const log = new Log({
      level,
      message,
      company: companyId,
      createdAt: new Date(),
    });

    await log.save();

    switch (level) {
      case "info":
        info(message);
        break;
      case "warn":
        warn(message);
        break;
      case "error":
        error(message);
        break;
      case "debug":
        debug(message);
        break;
      default:
        error(`Unknown log level: ${level}`);
        break;
    }
  }

  async getAllLogs(companyId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const filter = {};
    if (companyId) filter.company = companyId;

    const logs = await Log.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const totalLogs = await Log.countDocuments(filter);

    if (!logs.length) {
      throw new NotFoundError("Logs");
    }

    return {
      logs,
      totalLogs,
    };
  }
}

module.exports = new LogService();
