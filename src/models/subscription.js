const ALLOWED_PLANS = ['basic', 'standard', 'premium'];

let nextId = 1;

function createSubscription(userId, plan, price = 0, discountApplied = 0) {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Utilisateur invalide');
  }

  if (!ALLOWED_PLANS.includes(plan)) {
    throw new Error('Plan invalide');
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);

  const subscription = {
    id: nextId++,
    userId: userId.trim(),
    plan,
    status: 'active',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    renewalDate: endDate.toISOString(),
    price,
    discountApplied,
    paymentHistory: []
  };

  return subscription;
}

function __reset() {
  nextId = 1;
}

module.exports = {
  createSubscription,
  __reset,
  ALLOWED_PLANS
};