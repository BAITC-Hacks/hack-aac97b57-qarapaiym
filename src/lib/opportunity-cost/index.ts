import { CATEGORIES, type Category, type CityDataset, type ScenarioAlternative, type ScenarioSelection } from "../../types/city";
import { simulateScenario } from "../simulation";

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const byId = (a: ScenarioAlternative, b: ScenarioAlternative) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Compare only one same-category replacement at a time; every score comes from simulateScenario. */
export function findScenarioAlternatives(dataset: CityDataset, selection: ScenarioSelection, limit = 3): ScenarioAlternative[] {
  if (!Number.isInteger(limit) || limit < 0) throw new Error("Alternative limit must be a nonnegative integer");
  const originalSelection = selection.map(choice => ({...choice}));
  const originalResult = simulateScenario(dataset, originalSelection);
  if (!originalResult.valid || !originalResult.projected) throw new Error("Opportunity cost requires a valid scenario");
  const originalProjected = originalResult.projected;
  const weakest = CATEGORIES.reduce((worst, category) => originalProjected.byCategory[category] < originalProjected.byCategory[worst] ? category : worst, CATEGORIES[0]);
  const candidates: ScenarioAlternative[] = [];
  for (const [index, choice] of originalSelection.entries()) {
    const current = dataset.initiatives.find(item => item.id === choice.initiativeId)!;
    const category = current.category;
    for (const initiative of dataset.initiatives) {
      if (initiative.category !== category || originalSelection.some(item => item.initiativeId === initiative.id)) continue;
      const targets = initiative.scope === "city" ? [undefined] : choice.districtId ? [choice.districtId] : dataset.districts.map(d => d.id);
      for (const districtId of targets) {
        const alternativeSelection = originalSelection.map((item, i) => i === index ? {initiativeId:initiative.id,...(districtId ? {districtId} : {})} : {...item});
        const alternativeResult = simulateScenario(dataset, alternativeSelection);
        if (!alternativeResult.valid || !alternativeResult.projected) continue;
        const projected = alternativeResult.projected;
        const categoryDifferences = Object.fromEntries(CATEGORIES.map(metric => [metric, round(projected.byCategory[metric] - originalProjected.byCategory[metric])])) as Record<Category, number>;
        const budgetDifference = round(alternativeResult.budget.spent - originalResult.budget.spent);
        const aqolDifference = round(projected.overall - originalProjected.overall);
        if (!budgetDifference && !aqolDifference && CATEGORIES.every(metric => categoryDifferences[metric] === 0)) continue;
        candidates.push({
          id: `${choice.initiativeId}:${initiative.id}:${districtId ?? "city"}`,
          description: `Replace ${current.name} with ${initiative.name}${districtId ? ` (${districtId})` : " (city)"}.`,
          changedCategories: [category], originalSelection: originalSelection.map(item => ({...item})), alternativeSelection,
          originalResult, alternativeResult, budgetDifference, aqolDifference, categoryDifferences,
        });
      }
    }
  }
  const picked: ScenarioAlternative[] = [];
  function add(candidate: ScenarioAlternative | undefined) { if (candidate && !picked.some(item => item.id === candidate.id) && picked.length < limit) picked.push(candidate); }
  add([...candidates].sort((a, b) => b.aqolDifference - a.aqolDifference || a.budgetDifference - b.budgetDifference || byId(a, b))[0]);
  add([...candidates].filter(item => item.budgetDifference < 0).sort((a, b) => a.budgetDifference - b.budgetDifference || b.aqolDifference - a.aqolDifference || byId(a, b))[0]);
  add([...candidates].filter(item => item.categoryDifferences[weakest] > 0).sort((a, b) => b.categoryDifferences[weakest] - a.categoryDifferences[weakest] || a.budgetDifference - b.budgetDifference || byId(a, b))[0]);
  return picked;
}
