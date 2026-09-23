import { describe, expect, it } from "vitest";
import { cityDataset, validateDataset } from "../data";
import { simulateScenario } from "../simulation";
import { calculateScenarioDiagnostics } from ".";
import { findScenarioAlternatives } from "../opportunity-cost";
import { CATEGORIES, type CityDataset, type ScenarioSelection } from "../../types/city";

const selection: ScenarioSelection = { transport: "transport-bus", greening: "greening-trees", social: "social-clinics", safety: "safety-lighting", services: "services-water" };
const copy = (): CityDataset => structuredClone(cityDataset);

describe("initiative economics", () => {
  it("allocates every initiative cost exactly and labels all breakdowns as assumptions", () => {
    expect(cityDataset.initiatives).toHaveLength(15);
    for (const initiative of cityDataset.initiatives) {
      expect(initiative.budgetBreakdownSource).toBe("simulation-assumption");
      expect(initiative.budgetBreakdown?.length).toBeGreaterThan(0);
      expect(initiative.budgetBreakdown!.reduce((sum, item) => sum + Math.round(item.amount * 1_000_000), 0)).toBe(Math.round(initiative.cost * 1_000_000));
    }
  });

  it("rejects missing, malformed, and mismatched breakdowns", () => {
    for (const change of [
      (data: CityDataset) => { data.initiatives[0].budgetBreakdown = undefined; },
      (data: CityDataset) => { data.initiatives[0].budgetBreakdown![0].amount += 1; },
      (data: CityDataset) => { data.initiatives[0].budgetBreakdown![0].amount = -1; },
      (data: CityDataset) => { data.initiatives[0].budgetBreakdown![1].id = data.initiatives[0].budgetBreakdown![0].id; },
    ]) { const data = copy(); change(data); expect(() => validateDataset(data)).toThrow("Invalid city dataset"); }
  });

  it("calculates reproducible spending, efficiency, category signals, and district balance", () => {
    const result = simulateScenario(cityDataset, selection);
    const metrics = calculateScenarioDiagnostics(result);
    expect(calculateScenarioDiagnostics(simulateScenario(cityDataset, selection))).toEqual(metrics);
    expect(metrics.budgetUtilizationPct).toBe(82);
    expect(metrics.remainingReservePct).toBe(18);
    expect(metrics.categorySpending).toEqual({ transport: 180, greening: 120, social: 210, safety: 110, services: 200 });
    expect(metrics.categorySpendingPct.social).toBe(25.6);
    expect(metrics.aqolGain).toBe(11.4);
    expect(metrics.aqolGainPer100M).toBe(1.39);
    expect(metrics.strongestImprovement).toEqual({ category: "services", delta: 13 });
    expect(metrics.weakestFinalCategory).toEqual({ category: "greening", score: 58.2 });
    expect(metrics.largestBudgetCategory).toEqual({ category: "social", amount: 210, percentage: 25.6 });
    expect(metrics.districtBalance.improvementSpread).toBeGreaterThanOrEqual(0);
    expect(() => calculateScenarioDiagnostics(simulateScenario(cityDataset, { ...selection, transport: "unknown" }))).toThrow();
  });

  it("handles zero spending without dividing by zero", () => {
    const data = copy();
    for (const initiative of data.initiatives) { initiative.cost = 0; initiative.budgetBreakdown = initiative.budgetBreakdown!.map(item => ({ ...item, amount: 0 })); }
    const metrics = calculateScenarioDiagnostics(simulateScenario(data, selection));
    expect(metrics.budgetUtilizationPct).toBe(0);
    expect(metrics.remainingReservePct).toBe(100);
    expect(metrics.aqolGainPer100M).toBeNull();
    expect(CATEGORIES.map(category => metrics.categorySpendingPct[category])).toEqual([0, 0, 0, 0, 0]);
  });

  it("returns only valid one-category alternatives scored by the simulation engine", () => {
    const beforeData = JSON.stringify(cityDataset), beforeSelection = JSON.stringify(selection);
    const alternatives = findScenarioAlternatives(cityDataset, selection);
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.length).toBeLessThanOrEqual(3);
    expect(findScenarioAlternatives(cityDataset, selection)).toEqual(alternatives);
    for (const alternative of alternatives) {
      expect(alternative.changedCategories).toHaveLength(1);
      expect(CATEGORIES.filter(category => alternative.originalSelection[category] !== alternative.alternativeSelection[category])).toEqual(alternative.changedCategories);
      expect(alternative.alternativeResult).toEqual(simulateScenario(cityDataset, alternative.alternativeSelection));
      expect(alternative.originalResult).toEqual(simulateScenario(cityDataset, selection));
      expect(alternative.alternativeResult).not.toEqual(alternative.originalResult);
      expect(alternative.alternativeResult.valid).toBe(true);
      expect(alternative.alternativeResult.budget.exceeded).toBe(false);
      expect(alternative.alternativeResult.budget.spent).toBeLessThanOrEqual(cityDataset.budget);
      expect(alternative.budgetDifference).toBe(alternative.alternativeResult.budget.spent - alternative.originalResult.budget.spent);
      expect(alternative.aqolDifference).toBe(Math.round((alternative.alternativeResult.projected.overall - alternative.originalResult.projected.overall) * 10) / 10);
    }
    expect(alternatives.some(item => item.budgetDifference < 0)).toBe(true);
    expect(JSON.stringify(cityDataset)).toBe(beforeData);
    expect(JSON.stringify(selection)).toBe(beforeSelection);
  });
});
