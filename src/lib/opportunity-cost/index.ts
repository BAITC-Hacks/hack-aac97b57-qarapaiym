import { CATEGORIES, type Category, type CityDataset, type ScenarioAlternative, type ScenarioSelection } from "../../types/city";
import { simulateScenario } from "../simulation";

const round = (value: number) => Math.round((value + Number.EPSILON) * 10) / 10;
const byId = (a: ScenarioAlternative, b: ScenarioAlternative) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Compare only one same-category replacement at a time; every score comes from simulateScenario. */
export function findScenarioAlternatives(dataset: CityDataset, selection: ScenarioSelection, limit = 3): ScenarioAlternative[] {
  if (!Number.isInteger(limit) || limit < 0) throw new Error("Alternative limit must be a nonnegative integer");
  const originalSelection = { ...selection };
  const originalResult = simulateScenario(dataset, originalSelection);
  if (!originalResult.valid) throw new Error("Opportunity cost requires a valid scenario");
  const weakest = CATEGORIES.reduce((worst, category) => originalResult.projected.byCategory[category] < originalResult.projected.byCategory[worst] ? category : worst, CATEGORIES[0]);
  const candidates: ScenarioAlternative[] = [];
  for (const category of CATEGORIES) {
    for (const initiative of dataset.initiatives) {
      if (initiative.category !== category || initiative.id === originalSelection[category]) continue;
      const alternativeSelection = { ...originalSelection, [category]: initiative.id };
      const alternativeResult = simulateScenario(dataset, alternativeSelection);
      if (!alternativeResult.valid) continue;
      const categoryDifferences = Object.fromEntries(CATEGORIES.map(metric => [metric, round(alternativeResult.projected.byCategory[metric] - originalResult.projected.byCategory[metric])])) as Record<Category, number>;
      const budgetDifference = round(alternativeResult.budget.spent - originalResult.budget.spent);
      const aqolDifference = round(alternativeResult.projected.overall - originalResult.projected.overall);
      if (!budgetDifference && !aqolDifference && CATEGORIES.every(metric => categoryDifferences[metric] === 0)) continue;
      candidates.push({
        id: `${category}:${initiative.id}`,
        description: `Replace ${originalResult.selectedInitiatives.find(item => item.category === category)!.name} with ${initiative.name}.`,
        changedCategories: [category], originalSelection: { ...originalSelection }, alternativeSelection,
        originalResult, alternativeResult, budgetDifference, aqolDifference, categoryDifferences,
      });
    }
  }
  const picked: ScenarioAlternative[] = [];
  function add(candidate: ScenarioAlternative | undefined) { if (candidate && !picked.some(item => item.id === candidate.id) && picked.length < limit) picked.push(candidate); }
  add([...candidates].sort((a, b) => b.aqolDifference - a.aqolDifference || a.budgetDifference - b.budgetDifference || byId(a, b))[0]);
  add([...candidates].filter(item => item.budgetDifference < 0).sort((a, b) => a.budgetDifference - b.budgetDifference || b.aqolDifference - a.aqolDifference || byId(a, b))[0]);
  add([...candidates].filter(item => item.categoryDifferences[weakest] > 0).sort((a, b) => b.categoryDifferences[weakest] - a.categoryDifferences[weakest] || a.budgetDifference - b.budgetDifference || byId(a, b))[0]);
  return picked;
}
