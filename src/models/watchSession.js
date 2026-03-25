const ALLOWED_DEVICES = ['web', 'mobile', 'tv'];

let nextId = 1;

function createWatchSession(userId, contentId, device = 'web') {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Utilisateur invalide');
  }

  if (!Number.isInteger(contentId) || contentId <= 0) {
    throw new Error('Contenu invalide');
  }

  if (!ALLOWED_DEVICES.includes(device)) {
    throw new Error('Appareil invalide');
  }

  return {
    id: nextId++,
    userId: userId.trim(),
    contentId,
    startedAt: new Date().toISOString(),
    lastPosition: 0,
    completed: false,
    completedAt: null,
    device
  };
}

function __reset() {
  nextId = 1;
}

module.exports = {
  createWatchSession,
  __reset,
  ALLOWED_DEVICES
};