import type { CityDataset } from "../../types/city";
import rawDataset from "../../../data/city-demo.json";
import { validateDataset } from "./validate";
validateDataset(rawDataset);
export const cityDataset: CityDataset = rawDataset;
export { validateDataset };
export const DATASET_NOTE = "Synthetic Astana demo — invented populations, costs and impact assumptions; not official statistics or forecasts. Budget and costs are in million KZT.";
