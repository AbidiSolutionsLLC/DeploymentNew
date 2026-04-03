const User = require("../models/userSchema");

/**
 * Recursively find all employee IDs that report to a given manager.
 * @param {String|ObjectId} managerId - The ID of the manager to find reports for.
 * @returns {Promise<Array<String>>} - A list of all subordinate IDs.
 */
const getTeamIds = async (managerId) => {
  let teamIds = [managerId.toString()];
  const directReports = await User.find({ reportsTo: managerId }).distinct('_id');
  if (directReports.length > 0) {
    for (const reportId of directReports) {
      const subTeam = await getTeamIds(reportId);
      teamIds = [...new Set([...teamIds, ...subTeam])];
    }
  }
  return teamIds;
};

module.exports = { getTeamIds };
