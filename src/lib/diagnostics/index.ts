import { CATEGORIES, type Category, type ScenarioDiagnostics, type SimulationResult } from "../../types/city";

const round = (value: number, places: number) => Math.round((value + Number.EPSILON) * 10 ** places) / 10 ** places;

/** Percentages use the full budget for utilization and actual spending for category shares. */
export function calculateScenarioDiagnostics(simulation: SimulationResult): ScenarioDiagnostics {
  if (!simulation.valid || !simulation.projected || simulation.delta === null) throw new Error("Scenario diagnostics require a valid simulation");
  const projected = simulation.projected;
  const spending = Object.fromEntries(CATEGORIES.map(category => [category, 0])) as Record<Category, number>;
  for (const initiative of simulation.selectedInitiatives) spending[initiative.category] += initiative.cost;
  const spent = simulation.budget.spent;
  const total = simulation.budget.total;
  const spendingPct = Object.fromEntries(CATEGORIES.map(category => [category, spent ? round(spending[category] / spent * 100, 1) : 0])) as Record<Category, number>;
  const categoryDeltas = Object.fromEntries(CATEGORIES.map(category => [category, round(projected.byCategory[category] - simulation.baseline.byCategory[category], 1)])) as Record<Category, number>;
  const strongest = CATEGORIES.reduce((best, category) => categoryDeltas[category] > categoryDeltas[best] ? category : best, CATEGORIES[0]);
  const weakest = CATEGORIES.reduce((worst, category) => projected.byCategory[category] < projected.byCategory[worst] ? category : worst, CATEGORIES[0]);
  const largest = CATEGORIES.reduce((best, category) => spending[category] > spending[best] ? category : best, CATEGORIES[0]);
  const baselineDistricts = new Map(simulation.baseline.districts.map(district => [district.districtId, district.score]));
  const districtImprovements = projected.districts.map(district => {
    const before = baselineDistricts.get(district.districtId);
    if (before === undefined) throw new Error("Projected district is absent from baseline");
    const delta = district.score - before;
    return { districtId: district.districtId, delta: round(delta, 1) };
  });
  if (!districtImprovements.length) throw new Error("Scenario diagnostics require districts");
  const largestDistrict = districtImprovements.reduce((best, current) => current.delta > best.delta ? current : best);
  const smallestDistrict = districtImprovements.reduce((worst, current) => current.delta < worst.delta ? current : worst);
  return {
    budgetUtilizationPct: total ? round(spent / total * 100, 1) : 0,
    remainingReservePct: total ? round(simulation.budget.remaining / total * 100, 1) : 0,
    categorySpending: spending,
    categorySpendingPct: spendingPct,
    aqolGain: simulation.delta,
    aqolGainPer100Units: spent ? round(simulation.delta / spent * 100, 2) : null,
    strongestImprovement: { category: strongest, delta: categoryDeltas[strongest] },
    weakestFinalCategory: { category: weakest, score: projected.byCategory[weakest] },
    largestBudgetCategory: { category: largest, amount: spending[largest], percentage: spendingPct[largest] },
    districtBalance: { largestImprovement: largestDistrict, smallestImprovement: smallestDistrict, improvementSpread: round(largestDistrict.delta - smallestDistrict.delta, 1) },
  };
}
