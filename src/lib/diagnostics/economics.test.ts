import { describe, expect, it } from "vitest";
import { cityDataset, validateDataset } from "../data";
import { simulateScenario } from "../simulation";
import { calculateScenarioDiagnostics } from ".";
import { findScenarioAlternatives } from "../opportunity-cost";
import { CATEGORIES, type CityDataset, type ScenarioSelection } from "../../types/city";

const selection: ScenarioSelection = [
  {initiativeId:"M7",districtId:"nura"}, {initiativeId:"M8",districtId:"nura"},
  {initiativeId:"M10",districtId:"nura"}, {initiativeId:"M12"}, {initiativeId:"M5",districtId:"saryarka"},
];
const copy = (): CityDataset => structuredClone(cityDataset);
describe("official scenario economics", () => {
  it("does not attach old-prototype procurement assumptions to official measures", () => {
    expect(cityDataset.initiatives).toHaveLength(14);
    expect(cityDataset.initiatives.every(i => i.budgetBreakdown === undefined)).toBe(true);
    expect(() => validateDataset(cityDataset)).not.toThrow();
  });
  it("validates optional spending breakdowns when explicitly supplied", () => {
    const data = copy();
    data.initiatives[0].budgetBreakdownSource = "simulation-assumption";
    data.initiatives[0].budgetBreakdown = [{id:"a",label:"A",amount:10},{id:"b",label:"B",amount:8}];
    expect(() => validateDataset(data)).not.toThrow();
    for (const change of [
      (d: CityDataset) => { d.initiatives[0].budgetBreakdown = undefined; },
      (d: CityDataset) => { d.initiatives[0].budgetBreakdown![0].amount += 1; },
      (d: CityDataset) => { d.initiatives[0].budgetBreakdown![0].amount = -1; },
      (d: CityDataset) => { d.initiatives[0].budgetBreakdown![1].id = "a"; },
    ]) { const changed = structuredClone(data); change(changed); expect(() => validateDataset(changed)).toThrow("Invalid city dataset"); }
  });
  it("calculates deterministic diagnostics from the official example", () => {
    const result = simulateScenario(cityDataset, selection);
    const metrics = calculateScenarioDiagnostics(result);
    expect(calculateScenarioDiagnostics(simulateScenario(cityDataset, selection))).toEqual(metrics);
    expect(metrics.budgetUtilizationPct).toBe(95);
    expect(metrics.remainingReservePct).toBe(5);
    expect(metrics.categorySpending).toEqual({transport:0,greening:25,social:44,safety:12,services:14});
    expect(metrics.categorySpendingPct.social).toBe(46.3);
    expect(metrics.aqolGain).toBe(3.99);
    expect(metrics.aqolGainPer100Units).toBe(4.2);
    expect(metrics.strongestImprovement).toEqual({category:"services",delta:2.4});
    expect(metrics.weakestFinalCategory).toEqual({category:"transport",score:55.65});
    expect(metrics.districtBalance.largestImprovement).toEqual({districtId:"nura",delta:3.8});
    expect(() => calculateScenarioDiagnostics(simulateScenario(cityDataset, []))).toThrow();
  });
  it("handles zero spending without dividing by zero", () => {
    const data = copy();
    for (const initiative of data.initiatives) initiative.cost = 0;
    const metrics = calculateScenarioDiagnostics(simulateScenario(data, selection));
    expect(metrics.budgetUtilizationPct).toBe(0);
    expect(metrics.remainingReservePct).toBe(100);
    expect(metrics.aqolGainPer100Units).toBeNull();
    expect(CATEGORIES.map(c => metrics.categorySpendingPct[c])).toEqual([0,0,0,0,0]);
  });
  it("scores valid five-measure alternatives with the real engine, without mutation", () => {
    const beforeData = JSON.stringify(cityDataset), beforeSelection = JSON.stringify(selection);
    const alternatives = findScenarioAlternatives(cityDataset, selection);
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.length).toBeLessThanOrEqual(3);
    expect(findScenarioAlternatives(cityDataset, selection)).toEqual(alternatives);
    for (const alternative of alternatives) {
      const changed=alternative.originalSelection.filter((choice,i)=>choice.initiativeId!==alternative.alternativeSelection[i].initiativeId);
      expect(changed).toHaveLength(1);
      expect(alternative.changedCategories).toEqual([cityDataset.initiatives.find(i=>i.id===changed[0].initiativeId)!.category]);
      expect(alternative.alternativeSelection).toHaveLength(5);
      expect(alternative.alternativeResult).toEqual(simulateScenario(cityDataset, alternative.alternativeSelection));
      expect(alternative.originalResult).toEqual(simulateScenario(cityDataset, selection));
      expect(alternative.alternativeResult.valid).toBe(true);
      expect(alternative.alternativeResult.budget.exceeded).toBe(false);
      expect(alternative.budgetDifference).toBe(alternative.alternativeResult.budget.spent-alternative.originalResult.budget.spent);
      expect(alternative.aqolDifference).toBeCloseTo(alternative.alternativeResult.projected!.overall-alternative.originalResult.projected!.overall,2);
    }
    expect(alternatives.some(item=>item.budgetDifference<0)).toBe(true);
    expect(findScenarioAlternatives(cityDataset, selection,0)).toEqual([]);
    expect(JSON.stringify(cityDataset)).toBe(beforeData);
    expect(JSON.stringify(selection)).toBe(beforeSelection);
  });
});
