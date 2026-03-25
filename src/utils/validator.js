const ALLOWED_PLANS = ['basic', 'standard', 'premium'];
const ALLOWED_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17'];

function isValidPlan(plan) {
  return ALLOWED_PLANS.includes(plan);
}

function isValidStatus(status, allowedStatuses) {
  return Array.isArray(allowedStatuses) && allowedStatuses.includes(status);
}

function isValidRating(rating) {
  return ALLOWED_RATINGS.includes(rating);
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isValidUserId(userId) {
  return typeof userId === 'string' && userId.trim() !== '';
}

module.exports = {
  isValidPlan,
  isValidStatus,
  isValidRating,
  isPositiveInteger,
  isValidUserId
};