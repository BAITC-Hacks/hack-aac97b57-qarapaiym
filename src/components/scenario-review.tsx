import { ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronDown, CircleAlert, GitCompareArrows, Lightbulb, LoaderCircle, RotateCcw } from 'lucide-react';
import type { AIAnalysis, District, Initiative, SimulationResult } from '@/types/city';
import { CATEGORIES } from '@/types/city';
import { initiativeCopy } from './initiative-copy';
import { barWidth, buildReviewModel, difference, directionLabels, reviewDelta as delta, reviewMoney as money, reviewNumber as number } from './review-model';

type Props = {
  result: SimulationResult; districts: District[]; saved: SimulationResult | null;
  analysis: AIAnalysis | null; loading: boolean; aiError: string;
  onSave: () => void; onClearSaved: () => void; onRetry: () => void;
};
type Row = { id: string; name: string; before: number; after: number; delta: number };

function Change({ value }: { value: number }) {
  return <span className={`review-change ${value < 0 ? 'negative' : value > 0 ? 'positive' : ''}`}>
    {value > 0 ? <ArrowUpRight size={14} aria-hidden="true" /> : value < 0 ? <ArrowDownRight size={14} aria-hidden="true" /> : null}{delta(value)}
  </span>;
}

function Legend() {
  return <div className="review-legend"><span><i />До</span><span><i />После</span><span>Шкала 0–100</span></div>;
}

function ComparisonBars({ rows }: { rows: Row[] }) {
  return <ul className="review-chart-list">{rows.map(row => <li key={row.id}>
    <div className="review-chart-label"><strong>{row.name}</strong><Change value={row.delta} /></div>
    <div className="review-bar-pair" aria-hidden="true"><i style={{ width: `${barWidth(row.before)}%` }} /><i style={{ width: `${barWidth(row.after)}%` }} /></div>
    <p className="review-chart-values"><span>До <b>{number(row.before)}</b></span><span>После <b>{number(row.after)}</b></span></p>
  </li>)}</ul>;
}

function InitiativeRow({ initiative, districts }: { initiative: Initiative; districts: District[] }) {
  const affected = [...new Set(initiative.impacts.map(impact => impact.districtId))];
  const effects = CATEGORIES.flatMap(category => {
    const values = initiative.impacts.filter(impact => impact.metric === category).map(impact => impact.delta);
    if (!values.length) return [];
    const low = Math.min(...values), high = Math.max(...values);
    return [{ category, low, high }];
  });
  return <article className="review-initiative">
    <div className="review-initiative-heading"><div><span className="review-overline">{directionLabels[initiative.category]} · <code>{initiative.id}</code></span><h4>{initiativeCopy(initiative).name}</h4></div><strong>{money(initiative.cost)}</strong></div>
    <p className="review-coverage">Охват: {affected.map(id => districts.find(district => district.id === id)?.name ?? id).join(', ') || 'Эффекты не заданы'}</p>
    <div className="review-effect-chips">{effects.map(effect => <span key={effect.category}>{directionLabels[effect.category]} <b className={effect.low < 0 ? 'negative' : 'positive'}>{effect.low === effect.high ? delta(effect.low) : `${delta(effect.low)}…${delta(effect.high)}`} п.</b></span>)}</div>
    <details className="review-detail"><summary>Эффекты по районам <ChevronDown size={14} /></summary><ul className="review-effect-list">{initiative.impacts.map((impact, index) => <li key={index}><span>{districts.find(district => district.id === impact.districtId)?.name ?? impact.districtId} · {directionLabels[impact.metric]}</span><Change value={impact.delta} /></li>)}</ul></details>
  </article>;
}

function InsightText({ text }: { text: string }) {
  if (text.length <= 170) return <p>{text}</p>;
  const cut = text.lastIndexOf(' ', 150);
  return <details className="review-insight-detail"><summary>{text.slice(0, cut > 70 ? cut : 150)}… <span>Читать полностью</span></summary><p>{text}</p></details>;
}

function InsightList({ items, limit = 4 }: { items: string[]; limit?: number }) {
  return <><ul className="review-insight-list">{items.slice(0, limit).map((text, index) => <li key={index}><InsightText text={text} /></li>)}</ul>
    {items.length > limit && <details className="review-detail"><summary>Ещё выводы ({items.length - limit}) <ChevronDown size={14} /></summary><ul className="review-insight-list">{items.slice(limit).map((text, index) => <li key={index}><InsightText text={text} /></li>)}</ul></details>}</>;
}

export function ScenarioReview({ result, districts, saved, analysis, loading, aiError, onSave, onClearSaved, onRetry }: Props) {
  if (!result.valid || !result.projected) return <p className="error-message" role="alert">Сценарий недействителен. Исправьте решения перед просмотром результата.</p>;
  const model = buildReviewModel(result, districts);
  const bestChange = model.best[0]?.delta ?? 0;
  const budgetShare = barWidth(result.budget.spent, result.budget.total);
  return <div className="review-dashboard">
    <div className="section-heading"><div><p className="eyebrow">03 / РЕЗУЛЬТАТ СЦЕНАРИЯ</p><h2 id="results-heading">Ваши решения в цифрах</h2></div><button className="secondary-button" onClick={onSave}>{saved ? 'Обновить сохранённый A' : 'Сохранить как сценарий A'}</button></div>
    <p className="review-source"><CheckCircle2 size={15} aria-hidden="true" />Расчёт модели · AI не меняет показатели</p>

    <dl className="review-kpis">
      <div className="review-kpi review-kpi-main"><dt>Итоговый AQoL</dt><dd>{number(result.projected.overall)}<small> / 100</small></dd><p>До решений: {number(result.baseline.overall)}</p></div>
      <div className="review-kpi"><dt>Изменение балла</dt><dd><Change value={result.delta} /></dd><p>{result.delta > 0 ? 'Выше исходного' : result.delta < 0 ? 'Ниже исходного' : 'Без изменения'} · п.</p></div>
      <div className="review-kpi"><dt>Бюджет, млн ₸</dt><dd>{number(result.budget.spent)}<small> / {number(result.budget.total)}</small></dd><p>Остаток: {money(result.budget.remaining)}</p></div>
      <div className="review-kpi"><dt>Критические показатели</dt><dd className="review-kpi-text">Не рассчитываются</dd><p>Критический порог не задан в модели</p></div>
      <div className="review-kpi"><dt>{bestChange > 0 ? 'Наибольший прирост' : 'Лучшее изменение'}</dt><dd className="review-kpi-text">{model.best.map(row => row.name).join(', ')}</dd><p><Change value={bestChange} /> п. к исходному</p></div>
      <div className="review-kpi"><dt>Слабейшее направление</dt><dd className="review-kpi-text">{model.weakest.map(row => row.name).join(', ')}</dd><p>{number(model.weakest[0].after)} после решений</p></div>
    </dl>

    <div className="review-visual-grid">
      <section className="review-panel" aria-labelledby="review-score-heading"><div className="review-panel-heading"><h3 id="review-score-heading">Как изменился балл</h3><span className="review-tag">AQoL</span></div><Legend /><ComparisonBars rows={[{ id: 'overall', name: 'Качество жизни', before: result.baseline.overall, after: result.projected.overall, delta: result.delta }]} /></section>
      <section className="review-panel" aria-labelledby="review-budget-heading"><div className="review-panel-heading"><h3 id="review-budget-heading">Распределение бюджета</h3><span className="review-tag">{number(result.budget.total)} млн ₸</span></div>
        <div className="review-budget-headline"><strong>{number(result.budget.spent)}<small> млн ₸ выделено</small></strong><span>Резерв {money(result.budget.remaining)}</span></div>
        <div className="review-budget-bar" role="img" aria-label={`Выделено ${money(result.budget.spent)}, осталось ${money(result.budget.remaining)}, всего ${money(result.budget.total)}`}><span style={{ width: `${budgetShare}%` }} /></div>
        <div className="review-budget-key"><span><i />Выделено</span><span><i />Доступный остаток</span></div>
      </section>
      <section className="review-panel" aria-labelledby="review-directions-heading"><div className="review-panel-heading"><h3 id="review-directions-heading">Пять направлений</h3><span className="review-tag">До → после</span></div><Legend /><ComparisonBars rows={model.directions} /></section>
      <section className="review-panel" aria-labelledby="review-districts-heading"><div className="review-panel-heading"><h3 id="review-districts-heading">Изменения по районам</h3><span className="review-tag">По приросту</span></div><Legend /><ComparisonBars rows={model.districts} />
        <div className="review-district-notes"><p><strong>Лучшее изменение:</strong> {model.bestDistricts.map(row => row.name).join(', ')}</p><p><strong>Наименьший итог:</strong> {model.weakestDistricts.map(row => row.name).join(', ')}</p></div>
        <p className="review-footnote">Среднее пяти показателей района по текущей модели. Рейтинг города учитывает население районов.</p>
        <details className="review-detail"><summary>Все показатели районов <ChevronDown size={14} /></summary><div className="table-scroll" role="region" aria-label="Показатели районов до и после решений" tabIndex={0}><table><thead><tr><th scope="col">Район</th>{CATEGORIES.map(id => <th scope="col" key={id}>{directionLabels[id]}</th>)}</tr></thead><tbody>{result.projected.districts.map(district => <tr key={district.districtId}><th scope="row">{districts.find(item => item.id === district.districtId)?.name ?? district.districtId}</th>{CATEGORIES.map(id => <td key={id}>{number(result.baseline.districts.find(item => item.districtId === district.districtId)!.metrics[id])} → {number(district.metrics[id])}</td>)}</tr>)}</tbody></table></div></details>
      </section>
    </div>

    <section className="review-evidence" aria-labelledby="review-initiatives-heading"><div className="review-panel-heading"><div><p className="eyebrow">ОСНОВАНИЕ РАСЧЁТА</p><h3 id="review-initiatives-heading">За счёт чего меняется результат</h3></div><span className="review-tag">{result.selectedInitiatives.length} инициатив</span></div>
      <p className="review-footnote">Заданные эффекты по районам до ограничения 0–100. Диапазоны не являются вкладом в общий AQoL. Синергии в текущей модели не заданы.</p>
      <div className="review-initiatives">{result.selectedInitiatives.map(item => <InitiativeRow key={item.id} initiative={item} districts={districts} />)}</div>
    </section>

    {saved?.valid && saved.projected && <section className="review-panel review-saved" aria-labelledby="review-saved-heading"><div className="review-panel-heading"><h3 id="review-saved-heading">Сравнение с сохранённым A</h3><button className="text-button" onClick={onClearSaved}>Убрать A</button></div><div className="table-scroll" role="region" aria-label="Сравнение сценариев A и B" tabIndex={0}><table><thead><tr><th scope="col">Показатель</th><th scope="col">A</th><th scope="col">Текущий B</th><th scope="col">B − A</th></tr></thead><tbody>{[{ id: 'aqol', name: 'AQoL', a: saved.projected.overall, b: result.projected.overall }, ...CATEGORIES.map(id => ({ id, name: directionLabels[id], a: saved.projected.byCategory[id], b: result.projected.byCategory[id] })), { id: 'budget', name: 'Выделено, млн ₸', a: saved.budget.spent, b: result.budget.spent }].map(row => <tr key={row.id}><th scope="row">{row.name}</th><td>{number(row.a)}</td><td>{number(row.b)}</td><td>{delta(difference(row.b, row.a))}</td></tr>)}</tbody></table></div><p className="review-footnote">Сохранённый A доступен до перезагрузки страницы.</p></section>}

    <section className="review-ai" aria-labelledby="analysis-heading"><div className="review-panel-heading"><div><p className="eyebrow">ИНТЕРПРЕТАЦИЯ</p><h3 id="analysis-heading">Что учесть при решении</h3></div><span className="review-tag">AI-разбор</span></div>
      <p className="review-footnote">Выводы AI могут содержать неточности. Проверяйте их по расчёту и эффектам выше.</p>
      <div aria-live="polite" aria-busy={loading}>
        {loading && <div className="review-ai-state" role="status"><LoaderCircle size={20} className="spin" aria-hidden="true" /><div><strong>Расчёт готов. Готовим разбор…</strong><p>Все показатели уже доступны выше.</p></div></div>}
        {aiError && <div className="review-ai-state review-ai-error" role="alert"><CircleAlert size={20} aria-hidden="true" /><div><strong>Разбор недоступен. Расчёт сохранён.</strong><p>Повторите запрос, чтобы получить интерпретацию.</p><button className="secondary-button" onClick={onRetry}><RotateCcw size={15} />Повторить разбор</button></div></div>}
        {analysis && !loading && !aiError && <><div className="review-insights">
          <article className="review-insight review-insight-strength"><h4><CheckCircle2 size={18} aria-hidden="true" />Сильные стороны</h4><InsightList items={analysis.strengths} /></article>
          <article className="review-insight review-insight-risk"><h4><CircleAlert size={18} aria-hidden="true" />Риски</h4><InsightList items={analysis.risks} /></article>
          <article className="review-insight"><h4><GitCompareArrows size={18} aria-hidden="true" />Компромиссы</h4><InsightList items={analysis.tradeoffs} /></article>
          <article className="review-insight review-insight-action"><h4><Lightbulb size={18} aria-hidden="true" />Что пересмотреть</h4><ol className="review-insight-list">{analysis.recommendations.slice(0, 3).map((item, index) => <li key={index}><strong>{item.title}</strong><InsightText text={item.rationale} /></li>)}</ol>{analysis.recommendations.length > 3 && <details className="review-detail"><summary>Ещё рекомендации <ChevronDown size={14} /></summary><ol className="review-insight-list" start={4}>{analysis.recommendations.slice(3).map((item, index) => <li key={index}><strong>{item.title}</strong><InsightText text={item.rationale} /></li>)}</ol></details>}</article>
        </div><details className="review-detail review-ai-summary"><summary>Общий вывод AI <ChevronDown size={14} /></summary><p>{analysis.summary}</p></details></>}
      </div>
    </section>
  </div>;
}
