function paginate(array, page = 1, limit = 20) {
  if (page < 1) {
    throw new Error('Page invalide');
  }

  if (limit < 1 || limit > 100) {
    throw new Error('Limite invalide');
  }

  const total = array.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const data = startIndex >= total ? [] : array.slice(startIndex, endIndex);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1 && totalPages > 0
    }
  };
}

function buildFilter(params = {}) {
  return function filterItem(item) {
    if (params.type && item.type !== params.type) {
      return false;
    }

    if (params.genre && (!Array.isArray(item.genre) || !item.genre.includes(params.genre))) {
      return false;
    }

    if (params.plan && item.plan !== params.plan) {
      return false;
    }

    if (params.status && item.status !== params.status) {
      return false;
    }

    if (params.yearFrom && item.year < Number(params.yearFrom)) {
      return false;
    }

    if (params.yearTo && item.year > Number(params.yearTo)) {
      return false;
    }

    if (params.minScore && item.score < Number(params.minScore)) {
      return false;
    }

    return true;
  };
}

module.exports = {
  paginate,
  buildFilter
};