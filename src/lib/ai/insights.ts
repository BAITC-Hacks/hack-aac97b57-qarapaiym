import { cityDataset } from '@/lib/data';
import { findScenarioAlternatives } from '@/lib/opportunity-cost';
import { CATEGORIES, type AIAnalysis, type Category, type SimulationResult } from '@/types/city';

const labels: Record<Category, string> = { transport: 'Транспорт', greening: 'Экология и озеленение', social: 'Социальная инфраструктура', safety: 'Безопасность', services: 'Городские сервисы' };
type Insight = { id: string; text: string };
type Recommendation = { id: string; title: string; rationale: string; category: Category };
export type InsightCatalog = { summary: Insight[]; strengths: Insight[]; risks: Insight[]; tradeoffs: Insight[]; recommendations: Recommendation[] };

// Only server-owned wording can reach the UI. The model selects emphasis/order;
// it cannot supply prose, numbers, entities, causal claims, or new selections.
export function buildInsightCatalog(result: SimulationResult): InsightCatalog {
  const projected = result.projected;
  if (!result.valid || !projected || result.delta === null) throw new Error('A valid scenario is required');
  const directions = CATEGORIES.map(id => ({ id, before: result.baseline.byCategory[id], after: projected.byCategory[id] }));
  const lowest = Math.min(...directions.map(d => d.after));
  const strengths = directions.filter(d => d.after > d.before).map(d => ({ id: `gain-${d.id}`, text: `${labels[d.id]}: итоговый показатель выше исходного. Сопоставьте этот прирост с изменениями по отдельным районам в таблице.` }));
  if (!strengths.length) strengths.push({ id: 'valid-plan', text: 'План соблюдает ограничения модели. Допустимость плана сама по себе не означает улучшения качества жизни.' });
  const risks = directions.filter(d => d.after === lowest).map(d => ({ id: `weak-${d.id}`, text: `${labels[d.id]}: итоговый показатель находится среди самых низких по направлениям в этом сценарии. Это относительное сравнение, а не отдельный критический порог.` }));
  if (projected.criticalCount > 0) risks.push({ id: 'critical-remain', text: 'В отдельных районах сохраняются критические показатели. Проверьте отмеченные значения в районной таблице перед выбором приоритета.' });
  risks.push({ id: 'synthetic-limit', text: 'Учебная модель не оценивает общественную поддержку, реальные закупочные цены и риски исполнения. Улучшение расчётного показателя не является прогнозом для города.' });
  const tradeoffs: Insight[] = [{ id: 'finite-plan', text: 'Любая новая мера требует пересмотра текущего набора решений. Сравнивайте полный допустимый план, а не добавляйте проект поверх уже выбранных мероприятий.' }];
  if (result.selectedInitiatives.some(i => i.lag > 0)) tradeoffs.push({ id: 'lag', text: 'Эффекты выбранных мер реализуются с задержкой. На горизонте сценария учтена только предусмотренная моделью доля эффекта; полный эффект нельзя прибавлять повторно.' });
  for (const d of directions.filter(d => d.after === d.before)) tradeoffs.push({ id: `unchanged-${d.id}`, text: `${labels[d.id]}: итоговый показатель направления не изменился. Ресурсы текущего плана не дали прироста этого агрегированного показателя.` });
  const recommendations: Recommendation[] = findScenarioAlternatives(cityDataset, result.selection).map(alternative => {
    const removed = result.selection.find(c => !alternative.alternativeSelection.some(a => a.initiativeId === c.initiativeId));
    const added = alternative.alternativeSelection.find(c => !result.selection.some(a => a.initiativeId === c.initiativeId));
    const from = result.selectedInitiatives.find(i => i.id === removed?.initiativeId);
    const to = cityDataset.initiatives.find(i => i.id === added?.initiativeId);
    if (!removed || !added || !from || !to || !alternative.alternativeResult.valid) throw new Error('Invalid canonical alternative');
    const scope = to.scope === 'city' ? 'весь город' : cityDataset.districts.find(d => d.id === added.districtId)?.name;
    if (!scope) throw new Error('Unknown alternative district');
    return { id: alternative.id, category: to.category, title: `Сравнить замену «${from.name}» на «${to.name}»`, rationale: `Уберите «${from.name}» и вместо неё выберите «${to.name}» (${scope}); остальные решения и районы оставьте без изменения. Полный альтернативный план проверен движком на бюджет и совместимость. Это вариант для сравнения, а не обещание лучшего результата: пересчитайте его и сопоставьте районные показатели и компромиссы с текущим планом.` };
  });
  if (!recommendations.length) recommendations.push({ id: 'inspect-current', category: CATEGORIES[0], title: 'Проверить районные приоритеты', rationale: 'Сопоставьте районные показатели и вклады уже выбранных мер. Допустимая замена в проверенном наборе альтернатив не найдена; изменение плана требует нового расчёта и проверки правил.' });
  return { summary: [{ id: 'scope', text: 'Разбор основан на текущем рассчитанном плане. AI выбрал акценты из проверенных выводов; точные значения, вклады мер и синергии показаны в расчёте. Рекомендации предназначены для сравнения сценариев.' }], strengths, risks, tradeoffs, recommendations };
}

export function insightSchema(catalog: InsightCatalog) {
  const list = (items: { id: string }[]) => ({ type: 'array', minItems: 1, maxItems: Math.min(3, items.length), items: { type: 'string', enum: items.map(i => i.id) } });
  return {
    summary: { type: 'string', enum: catalog.summary.map(i => i.id) },
    strengths: list(catalog.strengths), risks: list(catalog.risks), tradeoffs: list(catalog.tradeoffs), recommendations: list(catalog.recommendations),
  };
}

export function renderInsights(value: Record<string, unknown>, catalog: InsightCatalog): AIAnalysis {
  const summary = catalog.summary.find(item => item.id === value.summary);
  if (!summary) throw new Error('Unsupported summary');
  function select<T extends { id: string }>(key: string, items: T[]): T[] {
    const ids = value[key];
    if (!Array.isArray(ids) || !ids.length || ids.length > Math.min(3, items.length) || new Set(ids).size !== ids.length) throw new Error('Invalid insight selection');
    return ids.map(id => { const item = items.find(item => typeof id === 'string' && item.id === id); if (!item) throw new Error('Unsupported insight'); return item; });
  }
  return { summary: summary.text, strengths: select('strengths', catalog.strengths).map(i => i.text), risks: select('risks', catalog.risks).map(i => i.text), tradeoffs: select('tradeoffs', catalog.tradeoffs).map(i => i.text), recommendations: select('recommendations', catalog.recommendations).map(({title, rationale, category}) => ({title, rationale, category})) };
}
