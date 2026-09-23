import { CATEGORIES, METRICS, type CityDataset } from "../../types/city";
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const label = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
export function validateDataset(value: unknown): asserts value is CityDataset {
  const fail = (message: string): never => { throw new Error(`Invalid city dataset: ${message}`); };
  if (!object(value)) fail("expected an object");
  const data = value as Record<string, unknown>;
  if (!finite(data.budget) || data.budget < 0 || !Number.isSafeInteger(Math.round(data.budget * 1_000_000))) fail("invalid budget");
  if (!finite(data.horizon) || data.horizon <= 0 || !Number.isInteger(data.horizon)) fail("invalid horizon");
  if (!Array.isArray(data.districts) || !data.districts.length) fail("districts must be nonempty");
  const ids = new Set<string>(); let population = 0;
  for (const raw of data.districts as unknown[]) {
    if (!object(raw)) fail("invalid district");
    const d = raw as Record<string, unknown>;
    if (!label(d.id) || !label(d.name) || ids.has(d.id as string)) fail("invalid or duplicate district identity");
    ids.add(d.id as string);
    if (!finite(d.population) || d.population <= 0) fail("invalid population share");
    population += d.population as number;
    if (!object(d.metrics) || Object.keys(d.metrics).length !== METRICS.length || METRICS.some(m => !finite((d.metrics as Record<string, unknown>)[m]) || (d.metrics as Record<string, number>)[m] < 0 || (d.metrics as Record<string, number>)[m] > 100)) fail("metrics must include all ten indicators in 0..100");
  }
  if (Math.abs(population - 1) > 1e-9) fail("population shares must sum to one");
  if (!Array.isArray(data.initiatives) || !data.initiatives.length) fail("initiatives must be nonempty");
  const initiativeIds = new Set<string>(); const covered = new Set<string>();
  for (const raw of data.initiatives as unknown[]) {
    if (!object(raw)) fail("invalid initiative");
    const i = raw as Record<string, unknown>;
    if (!label(i.id) || !label(i.name) || !CATEGORIES.includes(i.category as typeof CATEGORIES[number]) || initiativeIds.has(i.id as string)) fail("invalid initiative identity/category");
    initiativeIds.add(i.id as string); covered.add(i.category as string);
    if (!finite(i.cost) || i.cost < 0 || !Number.isSafeInteger(Math.round(i.cost * 1_000_000))) fail("invalid cost");
    if (i.budgetBreakdown !== undefined || i.budgetBreakdownSource !== undefined) {
    if (!Array.isArray(i.budgetBreakdown) || !i.budgetBreakdown.length) fail("every initiative needs a budget breakdown");
    if (i.budgetBreakdownSource !== "provided-data" && i.budgetBreakdownSource !== "simulation-assumption") fail("budget breakdown source is required");
    const budgetItemIds = new Set<string>();
    let breakdownUnits = 0;
    for (const rawItem of i.budgetBreakdown as unknown[]) {
      if (!object(rawItem) || !label(rawItem.id) || !label(rawItem.label) || !finite(rawItem.amount) || rawItem.amount < 0 || !Number.isSafeInteger(Math.round(rawItem.amount * 1_000_000))) fail("invalid budget item");
      const item = rawItem as Record<string, unknown>;
      if (budgetItemIds.has(item.id as string)) fail("duplicate budget item id");
      budgetItemIds.add(item.id as string);
      if (item.description !== undefined && typeof item.description !== "string") fail("invalid budget item description");
      breakdownUnits += Math.round((item.amount as number) * 1_000_000);
    }
    if (breakdownUnits !== Math.round((i.cost as number) * 1_000_000)) fail("budget breakdown must equal initiative cost");
    }
    if (i.scope !== "district" && i.scope !== "city") fail("invalid scope");
    if (!finite(i.lag) || !Number.isInteger(i.lag) || i.lag < 0 || i.lag > (data.horizon as number)) fail("invalid lag");
    if (!object(i.effects) || !Object.keys(i.effects).length || Object.entries(i.effects).some(([m,v]) => !METRICS.includes(m as typeof METRICS[number]) || !finite(v))) fail("invalid effects");
  }
  if (CATEGORIES.some(c => !covered.has(c))) fail("each category needs an initiative");
}
