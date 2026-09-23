import { CATEGORIES, type CityDataset } from "../../types/city";
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const label = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const category = (v: unknown) => CATEGORIES.includes(v as typeof CATEGORIES[number]);
export function validateDataset(value: unknown): asserts value is CityDataset {
  const fail = (message: string): never => { throw new Error(`Invalid city dataset: ${message}`); };
  if (!object(value)) fail("expected an object");
  const data = value as Record<string, unknown>;
  if (!finite(data.budget) || data.budget < 0 || !Number.isSafeInteger(Math.round(data.budget * 1_000_000))) fail("budget must be finite and nonnegative");
  if (!Array.isArray(data.districts) || !data.districts.length) fail("districts must be nonempty");
  const ids = new Set<string>();
  for (const d of data.districts as unknown[]) {
    if (!object(d) || !label(d.id) || !label(d.name)) fail("district requires id and name");
    const district = d as Record<string, unknown>;
    if (ids.has(district.id as string)) fail("duplicate district id");
    ids.add(district.id as string);
    if (district.population !== undefined && (!finite(district.population) || district.population < 0)) fail("invalid population");
    if (!object(district.metrics) || CATEGORIES.some(c => !finite((district.metrics as Record<string, unknown>)[c]) || ((district.metrics as Record<string, number>)[c] < 0) || ((district.metrics as Record<string, number>)[c] > 100))) fail("metrics must include all five categories in 0..100");
  }
  if (!Array.isArray(data.initiatives) || !data.initiatives.length) fail("initiatives must be nonempty");
  const initiativeIds = new Set<string>();
  const covered = new Set<string>();
  for (const raw of data.initiatives as unknown[]) {
    if (!object(raw)) fail("invalid initiative");
    const i = raw as Record<string, unknown>;
    if (!label(i.id) || !label(i.name) || !category(i.category)) fail("invalid initiative identity/category");
    if (initiativeIds.has(i.id as string)) fail("duplicate initiative id");
    initiativeIds.add(i.id as string); covered.add(i.category as string);
    if (!finite(i.cost) || i.cost < 0 || !Number.isSafeInteger(Math.round(i.cost * 1_000_000))) fail("cost must be finite and nonnegative");
    if (i.description !== undefined && typeof i.description !== "string") fail("invalid description");
    if (!Array.isArray(i.impacts)) fail("impacts must be an array");
    for (const impact of i.impacts as unknown[]) {
      if (!object(impact) || !ids.has(impact.districtId as string) || !category(impact.metric) || !finite(impact.delta)) fail("invalid impact target or delta");
    }
  }
  if (CATEGORIES.some(c => !covered.has(c))) fail("each category needs an initiative");
}
