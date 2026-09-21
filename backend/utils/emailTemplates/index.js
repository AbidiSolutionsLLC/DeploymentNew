const ticketTemplates = require('./ticketTemplates');
const authTemplates = require('./authTemplates');

module.exports = {
  ...ticketTemplates,
  ...authTemplates
};
