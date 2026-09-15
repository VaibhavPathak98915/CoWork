/** ₹24,999 — Indian digit grouping, which differs from the default after 1,000. */
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const formatINR = (amount) => `₹${inr.format(amount ?? 0)}`;

/** "/mo" fits the price line; "per month" reads better in a sentence. */
export const shortPeriod = (period) =>
  ({ day: "day", month: "mo", year: "yr" }[period] ?? period);

/**
 * What a plan costs over a year, for comparing commitment periods.
 * Used to show what the annual plan saves against paying monthly.
 */
export const annualisedCost = (plan) =>
  ({ day: plan.price * 365, month: plan.price * 12, year: plan.price }[plan.period] ?? plan.price);
