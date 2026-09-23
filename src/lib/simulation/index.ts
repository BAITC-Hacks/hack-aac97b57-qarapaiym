import { CATEGORIES, type CityDataset, type District, type ScenarioSelection, type ScoreSnapshot, type SimulationResult } from "../../types/city";
import { validateDataset } from "../data/validate";
const round = (value: number) => Math.round((value + Number.EPSILON) * 10) / 10;
export function calculateSnapshot(districts: District[]): ScoreSnapshot {
  if (!districts.length) throw new Error("Cannot score an empty city");
  const weighted = districts.every(d => d.population !== undefined) && districts.reduce((n, d) => n + (d.population ?? 0), 0) > 0;
  const weights = districts.map(d => weighted ? d.population! : 1);
  const total = weights.reduce((a, b) => a + b, 0);
  const raw = CATEGORIES.map(c => districts.reduce((n, d, index) => n + d.metrics[c] * weights[index], 0) / total);
  return { overall: round(raw.reduce((a, b) => a + b, 0) / CATEGORIES.length), byCategory: Object.fromEntries(CATEGORIES.map((c, i) => [c, round(raw[i])])) as ScoreSnapshot["byCategory"], districts: districts.map(d => ({ districtId: d.id, metrics: { ...d.metrics } })) };
}
export function simulateScenario(dataset: CityDataset, selection: ScenarioSelection): SimulationResult {
  validateDataset(dataset);
  const errors: string[] = [];
  const selected: CityDataset["initiatives"] = [];
  const input = selection && typeof selection === "object" && !Array.isArray(selection) ? selection : {} as ScenarioSelection;
  if (Object.keys(input).some(k => !CATEGORIES.includes(k as typeof CATEGORIES[number]))) errors.push("Only the five required categories are allowed.");
  for (const category of CATEGORIES) {
    const id = input[category];
    if (!id || typeof id !== "string") { errors.push(`Choose one initiative for ${category}.`); continue; }
    const initiative = dataset.initiatives.find(i => i.id === id);
    if (!initiative) { errors.push(`Unknown initiative for ${category}: ${id}.`); continue; }
    if (initiative.category !== category) { errors.push(`Initiative ${id} does not belong to ${category}.`); continue; }
    selected.push(initiative);
  }
  // Normalize money to millionths of a million KZT (one tenge).
  const units = (amount: number) => Math.round(amount * 1_000_000);
  const spentUnits = selected.reduce((sum, i) => sum + units(i.cost), 0);
  const totalUnits = units(dataset.budget);
  const exceeded = spentUnits > totalUnits;
  if (exceeded) errors.push("Selected initiatives exceed the fixed budget.");
  const baseline = calculateSnapshot(dataset.districts);
  const districts = dataset.districts.map(d => ({ ...d, metrics: { ...d.metrics } }));
  if (!errors.length) {
    // Accumulate all impacts before clamping, so initiative ordering has no effect.
    for (const initiative of selected) for (const impact of initiative.impacts) {
      districts.find(d => d.id === impact.districtId)!.metrics[impact.metric] += impact.delta;
    }
    for (const d of districts) for (const category of CATEGORIES) d.metrics[category] = Math.max(0, Math.min(100, d.metrics[category]));
  }
  const projected = calculateSnapshot(districts);
  return { valid: errors.length === 0, validationErrors: errors, budget: { total: totalUnits / 1_000_000, spent: spentUnits / 1_000_000, remaining: (totalUnits - spentUnits) / 1_000_000, exceeded }, selectedInitiatives: selected.map(i => ({ ...i, impacts: i.impacts.map(impact => ({ ...impact })), ...(i.budgetBreakdown ? { budgetBreakdown: i.budgetBreakdown.map(item => ({ ...item })) } : {}), ...(i.affectedDistricts ? { affectedDistricts: i.affectedDistricts.slice() } : {}), ...(i.implementationNotes ? { implementationNotes: i.implementationNotes.slice() } : {}), ...(i.implementationRisks ? { implementationRisks: i.implementationRisks.slice() } : {}) })), baseline, projected, delta: round(projected.overall - baseline.overall) };
}
