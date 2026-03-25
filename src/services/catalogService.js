const { createContent } = require('../models/content');
const { paginate, buildFilter } = require('../utils/paginator');

const PLAN_ORDER = {
  basic: 1,
  standard: 2,
  premium: 3
};

let contents = [];

function addContent(data) {
  const duplicate = contents.find(
    (content) =>
      content.title.toLowerCase() === data.title.toLowerCase() &&
      content.year === data.year
  );

  if (duplicate) {
    throw new Error('Contenu déjà existant');
  }

  const content = createContent(data);
  contents.push(content);
  return content;
}

function getContentById(id) {
  const content = contents.find((item) => item.id === id);

  if (!content) {
    throw new Error('Contenu introuvable');
  }

  return content;
}

function searchCatalog(params = {}, page = 1, limit = 20) {
  let results = [...contents];

  const filter = buildFilter(params);
  results = results.filter(filter);

  if (params.query) {
    const query = params.query.toLowerCase();
    results = results.filter(
      (content) =>
        content.title.toLowerCase().includes(query) ||
        content.director.toLowerCase().includes(query)
    );
  }

  results.sort((a, b) => b.score - a.score);

  return paginate(results, page, limit);
}

function updateContent(id, updates) {
  const content = contents.find((item) => item.id === id);

  if (!content) {
    throw new Error('Contenu introuvable');
  }

  const forbiddenFields = ['id', 'createdAt', 'viewCount', 'score'];

  for (const field of forbiddenFields) {
    if (field in updates) {
      delete updates[field];
    }
  }

  Object.assign(content, updates);

  return content;
}

function archiveContent(id) {
  const content = contents.find((item) => item.id === id);

  if (!content) {
    throw new Error('Contenu introuvable');
  }

  if (content.status === 'archived') {
    throw new Error('Contenu déjà archivé');
  }

  content.status = 'archived';
  return content;
}

function getContentByPlan(plan) {
  const userPlanLevel = PLAN_ORDER[plan];

  return contents.filter(
    (content) =>
      content.status === 'active' &&
      PLAN_ORDER[content.plan] <= userPlanLevel
  );
}

function getAllContents() {
  return contents;
}

function incrementViewCount(contentId) {
  const content = getContentById(contentId);
  content.viewCount += 1;
  return content;
}

function updateContentScore(contentId, score) {
  const content = getContentById(contentId);
  content.score = score;
  return content;
}

function __reset() {
  contents = [];
}

module.exports = {
  addContent,
  getContentById,
  searchCatalog,
  updateContent,
  archiveContent,
  getContentByPlan,
  getAllContents,
  incrementViewCount,
  updateContentScore,
  __reset
};