import { CATEGORIES, type District, type SimulationResult } from '@/types/city';

export const directionLabels = {
  transport: 'Транспорт', greening: 'Озеленение', social: 'Социальная сфера',
  safety: 'Безопасность', services: 'Городские услуги',
};

export const reviewNumber = (value: number) => value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const reviewDelta = (value: number) => `${value > 0 ? '+' : ''}${reviewNumber(value)}`;
export const reviewMoney = (value: number) => `${reviewNumber(value)} ед. бюджета`;
// Presentation differences only; the simulation engine owns scores and budget.
export const difference = (after: number, before: number) => Number((after - before).toFixed(5));
export const barWidth = (value: number, maximum = 100) => maximum > 0 ? Math.max(0, Math.min(100, value / maximum * 100)) : 0;

export function buildReviewModel(result: SimulationResult, districts: District[]) {
  const projected = result.projected;
  if (!result.valid || !projected) throw new Error('Review requires a valid scenario');
  const directions = CATEGORIES.map(id => ({
    id, name: directionLabels[id], before: result.baseline.byCategory[id],
    after: projected.byCategory[id],
    delta: difference(projected.byCategory[id], result.baseline.byCategory[id]),
  }));
  const districtRows = projected.districts.flatMap(after => {
    const before = result.baseline.districts.find(item => item.districtId === after.districtId);
    const district = districts.find(item => item.id === after.districtId);
    if (!before || !district) return [];
    return [{ id: district.id, name: district.name, before: before.score, after: after.score, delta: difference(after.score, before.score) }];
  }).sort((a, b) => b.delta - a.delta || a.name.localeCompare(b.name, 'ru'));
  const bestGain = Math.max(...directions.map(row => row.delta));
  const weakestValue = Math.min(...directions.map(row => row.after));
  const districtGain = Math.max(...districtRows.map(row => row.delta));
  const weakestDistrict = Math.min(...districtRows.map(row => row.after));
  return {
    directions, districts: districtRows,
    best: directions.filter(row => row.delta === bestGain),
    weakest: directions.filter(row => row.after === weakestValue),
    bestDistricts: districtRows.filter(row => row.delta === districtGain),
    weakestDistricts: districtRows.filter(row => row.after === weakestDistrict),
  };
}
