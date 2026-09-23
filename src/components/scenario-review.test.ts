import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { cityDataset } from '@/lib/data';
import { calculateSnapshot, simulateScenario } from '@/lib/simulation';
import type { AIAnalysis, SimulationResult } from '@/types/city';
import { ScenarioReview } from './scenario-review';
import { barWidth, buildReviewModel, reviewNumber } from './review-model';

const result = simulateScenario(cityDataset, {
  transport: 'transport-bus', greening: 'greening-trees', social: 'social-clinics',
  safety: 'safety-lighting', services: 'services-water',
});
const analysis: AIAnalysis = {
  summary: 'Общий вывод проверяется по расчёту.', strengths: ['Улучшение показателей.'],
  risks: ['Сохраняются ограничения модели.'], tradeoffs: ['Резерв сокращается.'],
  recommendations: [{ title: 'Сравнить планы', rationale: 'Проверьте слабые направления.' }],
};
function render(overrides: Partial<Parameters<typeof ScenarioReview>[0]> = {}) {
  return renderToStaticMarkup(createElement(ScenarioReview, {
    result, districts: cityDataset.districts, saved: null, analysis: null, loading: false,
    aiError: '', onSave() {}, onClearSaved() {}, onRetry() {}, ...overrides,
  }));
}

describe('scenario review presentation (current deterministic contract)', () => {
  it('uses engine results without changing the scenario', () => {
    const before = JSON.stringify(result);
    const model = buildReviewModel(result, cityDataset.districts);
    for (const row of model.directions) {
      expect(row.before).toBe(result.baseline.byCategory[row.id]);
      expect(row.after).toBe(result.projected.byCategory[row.id]);
    }
    for (const row of model.districts) {
      const original = cityDataset.districts.find(d => d.id === row.id)!;
      const projected = result.projected.districts.find(d => d.districtId === row.id)!;
      expect(row.after).toBe(calculateSnapshot([{ ...original, metrics: projected.metrics }]).overall);
    }
    render({ analysis });
    expect(JSON.stringify(result)).toBe(before);
  });
  it('puts all four data visuals and initiatives before AI interpretation', () => {
    const html = render({ analysis });
    for (const heading of ['Как изменился балл', 'Распределение бюджета', 'Пять направлений', 'Изменения по районам', 'За счёт чего меняется результат']) {
      expect(html.indexOf(heading)).toBeGreaterThan(-1);
      expect(html.indexOf(heading)).toBeLessThan(html.indexOf('Что учесть при решении'));
    }
    expect(html).toContain(reviewNumber(result.projected.overall));
    expect(html).toContain('Не рассчитываются');
    expect(html).toContain('Синергии в текущей модели не заданы');
  });
  it('does not invent critical counts or a selected district scope', () => {
    const html = render();
    expect(html).toContain('Охват:');
    expect(html).toContain('Критический порог не задан в модели');
    expect(html).toContain('Все показатели районов');
    expect(html).not.toContain('Критические показатели: 0');
  });
  it('keeps deterministic facts visible while AI loads or fails', () => {
    for (const overrides of [{ loading: true }, { aiError: 'provider-secret-details' }]) {
      const html = render(overrides);
      expect(html).toContain(reviewNumber(result.projected.overall));
      expect(html).toContain('review-budget-bar');
      expect(html).not.toContain('provider-secret-details');
    }
    expect(render({ aiError: 'failed' })).toContain('Повторить разбор');
    expect(render({ loading: true, analysis })).not.toContain(analysis.summary);
  });
  it('keeps long insights available in expandable cards and limits initial lists', () => {
    const longText = 'Полный смысл вывода остаётся доступен. '.repeat(20);
    const html = render({ analysis: { ...analysis, strengths: [longText, 'Два', 'Три', 'Четыре', 'Пять'] } });
    expect(html).toContain('Читать полностью');
    expect(html).toContain(longText);
    expect(html).toContain('Ещё выводы (1)');
    expect(html).toContain('Общий вывод AI');
  });
  it('preserves comparison and refuses an invalid result', () => {
    expect(render({ saved: result })).toContain('Сравнение с сохранённым A');
    const invalid = { ...result, valid: false } as SimulationResult;
    const html = render({ result: invalid });
    expect(html).toContain('Сценарий недействителен');
    expect(html).not.toContain('review-kpis');
  });
  it('preserves ties, zero and negative changes without claiming improvement', () => {
    const equal = { ...result, projected: result.baseline, delta: 0 };
    expect(buildReviewModel(equal, cityDataset.districts).best).toHaveLength(5);
    expect(render({ result: equal })).toContain('Без изменения');
    expect(render({ result: { ...result, delta: -1 } })).toContain('Ниже исходного');
    expect(barWidth(200, 100)).toBe(100);
    expect(barWidth(-1)).toBe(0);
    expect(barWidth(0, 0)).toBe(0);
  });
});
