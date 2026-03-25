const { createSubscription } = require('../models/subscription');
const pricingEngine = require('../utils/pricingEngine');

let subscriptions = [];

function subscribe(userId, plan, options = {}) {
  const pricing = pricingEngine.calculatePrice(plan, options);

  const subscription = createSubscription(
    userId,
    plan,
    pricing.finalPrice,
    pricing.discount
  );

  subscriptions.push(subscription);
  return subscription;
}

module.exports = {
  subscribe
};