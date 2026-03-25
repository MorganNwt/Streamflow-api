const ALLOWED_TYPES = ['movie', 'series'];
const ALLOWED_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
const ALLOWED_PLANS = ['basic', 'standard', 'premium'];
const ALLOWED_STATUS = ['active', 'archived', 'coming_soon'];

let nextId = 1;

function createContent(data) {
  const currentYear = new Date().getFullYear();

  if (!data || typeof data !== 'object') {
    throw new Error('Données de contenu invalides : data manquante');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    throw new Error('Données de contenu invalides : title manquant ou invalide');
  }

  if (!ALLOWED_TYPES.includes(data.type)) {
    throw new Error('Données de contenu invalides : type manquant ou invalide');
  }

  if (
    !Number.isInteger(data.year) ||
    data.year < 1888 ||
    data.year > currentYear
  ) {
    throw new Error('Données de contenu invalides : year manquant ou invalide');
  }

  if (!Number.isInteger(data.duration) || data.duration <= 0) {
    throw new Error('Données de contenu invalides : duration manquant ou invalide');
  }

  if (!ALLOWED_RATINGS.includes(data.rating)) {
    throw new Error('Données de contenu invalides : rating manquant ou invalide');
  }

  if (!ALLOWED_PLANS.includes(data.plan)) {
    throw new Error('Données de contenu invalides : plan manquant ou invalide');
  }

  const content = {
    id: nextId++,
    title: data.title.trim(),
    type: data.type,
    genre: Array.isArray(data.genre) ? data.genre : [],
    director: typeof data.director === 'string' ? data.director.trim() : '',
    cast: Array.isArray(data.cast) ? data.cast : [],
    year: data.year,
    duration: data.duration,
    rating: data.rating,
    plan: data.plan,
    score: 0,
    viewCount: 0,
    status: ALLOWED_STATUS.includes(data.status) ? data.status : 'active',
    createdAt: new Date().toISOString()
  };

  return content;
}

function __reset() {
  nextId = 1;
}

module.exports = {
  createContent,
  __reset,
  ALLOWED_TYPES,
  ALLOWED_RATINGS,
  ALLOWED_PLANS,
  ALLOWED_STATUS
};