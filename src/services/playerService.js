const { createWatchSession } = require('../models/watchSession');

let sessions = [];

function startSession(userId, contentId, device) {
  const session = createWatchSession(userId, contentId, device);
  sessions.push(session);
  return session;
}

module.exports = {
  startSession
};