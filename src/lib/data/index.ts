import type { CityDataset } from "../../types/city";
import rawDataset from "../../../data/city-demo.json";
import rawBreakdowns from "../../../data/budget-breakdowns.json";
import { validateDataset } from "./validate";
const breakdowns = rawBreakdowns as unknown as Record<string, Array<[string, string, number]>>;
if (Object.keys(breakdowns).length !== rawDataset.initiatives.length) throw new Error("Invalid city dataset: every initiative needs one budget breakdown");
export const cityDataset: CityDataset = {
  ...rawDataset,
  initiatives: rawDataset.initiatives.map(initiative => {
    const rows = breakdowns[initiative.id];
    if (!rows) throw new Error(`Invalid city dataset: missing budget breakdown for ${initiative.id}`);
    return {
      ...initiative,
      budgetBreakdown: rows.map(([id, label, amount]) => ({ id, label, amount })),
      budgetBreakdownSource: "simulation-assumption" as const,
      affectedDistricts: [...new Set(initiative.impacts.map(impact => impact.districtId))],
    };
  }),
};
validateDataset(cityDataset);
export { validateDataset };
export const DATASET_NOTE = "Synthetic Astana demo — invented populations, costs and impact assumptions; not official statistics or forecasts. Budget and costs are in million KZT.";
