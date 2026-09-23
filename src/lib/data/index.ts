import type { CityDataset } from "../../types/city";
import rawDataset from "../../../data/city-demo.json";
import { validateDataset } from "./validate";
validateDataset(rawDataset);
export const cityDataset: CityDataset = rawDataset;
export { validateDataset };
export const DATASET_NOTE = "Учебные данные официального кейса «Аким на 5 часов»; не официальная статистика и не прогноз. Бюджет и цены — условные единицы, горизонт — 8 кварталов.";
