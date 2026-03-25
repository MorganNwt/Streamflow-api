const BASE_PRICES = {
  basic: 4.99,
  standard: 9.99,
  premium: 14.99
};

const PROMO_CODES = {
  WELCOME10: { discount: 10, type: 'percent' },
  SUMMER20: { discount: 20, type: 'percent' },
  FLAT5: { discount: 5, type: 'fixed' }
};

function calculatePrice(plan, options = {}) {
  if (!BASE_PRICES[plan]) {
    throw new Error('Plan invalide');
  }

  const baseMonthlyPrice = BASE_PRICES[plan];

  if (options.isFirstSubscription) {
    return {
      finalPrice: 0,
      basePrice: baseMonthlyPrice,
      discount: 100,
      discountType: 'first_subscription',
      isAnnual: Boolean(options.isAnnual)
    };
  }

  const candidates = [];

  candidates.push({
    finalPrice: baseMonthlyPrice,
    discount: 0,
    discountType: 'none'
  });

  if (options.isAnnual) {
    candidates.push({
      finalPrice: Number((baseMonthlyPrice * 12 * 0.8).toFixed(2)),
      discount: 20,
      discountType: 'annual'
    });
  }

  if (options.isStudentVerified) {
    candidates.push({
      finalPrice: Number((baseMonthlyPrice * 0.7).toFixed(2)),
      discount: 30,
      discountType: 'student'
    });
  }

  if (options.promoCode) {
    const promo = PROMO_CODES[options.promoCode];

    if (!promo) {
      throw new Error('Code promo invalide');
    }

    let promoPrice = baseMonthlyPrice;

    if (promo.type === 'percent') {
      promoPrice = baseMonthlyPrice * (1 - promo.discount / 100);
    } else if (promo.type === 'fixed') {
      promoPrice = Math.max(0, baseMonthlyPrice - promo.discount);
    }

    candidates.push({
      finalPrice: Number(promoPrice.toFixed(2)),
      discount: promo.discount,
      discountType: promo.type === 'percent' ? 'promo_percent' : 'promo_fixed'
    });
  }

  const best = candidates.reduce((lowest, current) =>
    current.finalPrice < lowest.finalPrice ? current : lowest
  );

  return {
    finalPrice: best.finalPrice,
    basePrice: baseMonthlyPrice,
    discount: best.discount,
    discountType: best.discountType,
    isAnnual: Boolean(options.isAnnual)
  };
}

function calculateAnnualSavings(plan) {
  if (!BASE_PRICES[plan]) {
    throw new Error('Plan invalide');
  }

  const monthlyTotal = BASE_PRICES[plan] * 12;
  const annualTotal = BASE_PRICES[plan] * 12 * 0.8;

  return Number((monthlyTotal - annualTotal).toFixed(2));
}

function applyLatePaymentPenalty(price, daysLate) {
  if (daysLate < 0) {
    throw new Error('Jours de retard invalides');
  }

  const penaltyRate = Math.min(daysLate * 0.015, 0.2);
  return Number((price * (1 + penaltyRate)).toFixed(2));
}

module.exports = {
  BASE_PRICES,
  PROMO_CODES,
  calculatePrice,
  calculateAnnualSavings,
  applyLatePaymentPenalty
};