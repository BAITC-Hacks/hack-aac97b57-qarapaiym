"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, LoaderCircle, RotateCcw } from "lucide-react";
import { cityDataset } from "@/lib/data";
import { calculateSnapshot, simulateScenario } from "@/lib/simulation";
import { initiativeCopy } from "@/components/initiative-copy";
import { ScenarioReview } from "@/components/scenario-review";
import { CATEGORIES, type Category, type Initiative, type ScenarioSelection, type SimulationResult, type AIAnalysis } from "@/types/city";

const labels: Record<Category, string> = { transport: "Транспорт", greening: "Озеленение", social: "Социальная инфраструктура", safety: "Безопасность", services: "Городские сервисы" };
const baseline = calculateSnapshot(cityDataset.districts);
const number = (value: number) => value.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
const score = (value: number) => value.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signed = (value: number) => `${value > 0 ? "+" : ""}${number(Math.round(value * 10) / 10)}`;
const money = (value: number) => `${number(value)} млн ₸`;

function Effects({ initiative }: { initiative: Initiative }) {
  return <ul className="effects" aria-label="Эффекты мероприятия">
    {CATEGORIES.flatMap(category => {
      const impacts = initiative.impacts.filter(impact => impact.metric === category);
      if (!impacts.length) return [];
      const low = Math.min(...impacts.map(impact => impact.delta));
      const high = Math.max(...impacts.map(impact => impact.delta));
      return <li key={category}><span>{labels[category]}</span>
        <strong className={low < 0 ? "negative" : "positive"}>{low === high ? signed(low) : `${signed(low)}…${signed(high)}`} п.</strong>
      </li>;
    })}
  </ul>;
}

export default function Home() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const [selection, setSelection] = useState<Partial<ScenarioSelection>>({});
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SimulationResult | null>(null);
  const [active, setActive] = useState<Category>("transport");

  const [validation, setValidation] = useState("");
  const [notice, setNotice] = useState("");
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const selected = cityDataset.initiatives.filter(item => selection[item.category] === item.id);
  const spent = selected.reduce((sum, item) => sum + item.cost, 0);
  const remaining = cityDataset.budget - spent;
  const count = selected.length;
  function invalidate() { generation.current++; controller.current?.abort(); setLoading(false); setResult(null); setAnalysis(null); setAiError(""); setValidation(""); }
  function choose(category: Category, id: string) { setNotice(result ? "Решения изменены. Рассчитайте сценарий заново." : ""); invalidate(); setSelection(previous => ({ ...previous, [category]: id })); }
  function reset() { invalidate(); setSelection({}); setActive("transport"); setNotice("Решения сброшены. Доступен весь бюджет."); }
  async function explain(next: SimulationResult) {
    const request = ++generation.current;
    controller.current?.abort(); controller.current = new AbortController();
    setLoading(true); setAiError(""); setAnalysis(null);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next), signal: controller.current.signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The AI advisor is temporarily unavailable.");
      if (!body.summary || !Array.isArray(body.strengths) || !Array.isArray(body.risks) || !Array.isArray(body.tradeoffs) || !Array.isArray(body.recommendations)) throw new Error("The AI advisor returned an incomplete response. Please try again.");
      if (request === generation.current) setAnalysis(body);
    } catch (error) { if (request === generation.current && !(error instanceof Error && error.name === "AbortError")) setAiError(error instanceof Error ? error.message : "The AI advisor could not connect. Please try again."); }
    finally { if (request === generation.current) setLoading(false); }
  }
  function run() {
    const next = simulateScenario(cityDataset, selection as ScenarioSelection);
    if (!next.valid) { setValidation(next.validationErrors.join(" ")); return; }
    setResult(next); setValidation(""); setNotice(""); void explain(next);
    setTimeout(() => { resultsRef.current?.focus({ preventScroll: true }); resultsRef.current?.scrollIntoView({ block: "start" }); }, 50);
  }

  const activeIndex = CATEGORIES.indexOf(active);
  const activeChoice = selected.find(item => item.category === active);
  function removeChoice() {
    invalidate();
    setSelection(previous => { const next = { ...previous }; delete next[active]; return next; });
    setNotice(`Выбор в направлении «${labels[active]}» снят.`);
  }

  return <div className="simulator" lang="ru">
    <a className="skip-link" href="#decisions">Перейти к решениям</a>
    <header className="page-header">
      <div><p className="eyebrow">HACKALEM · АСТАНА</p><h1>Аким на 5 часов</h1></div>
      <p>Распределите бюджет между пятью направлениями и оцените, как решения изменят качество жизни.</p>
    </header>
    <div className="budget-bar" aria-label="Бюджет и готовность сценария">
      <div className="budget-main"><span>Осталось</span><strong className={remaining < 0 ? "negative" : ""}>{money(remaining)}</strong><small className="budget-limit">из {money(cityDataset.budget)}</small></div>
      <div className="budget-allocation"><span>Выделено {money(spent)} из {number(cityDataset.budget)}</span>
        <progress value={Math.min(spent, cityDataset.budget)} max={cityDataset.budget} aria-label="Выделенная доля бюджета" />
      </div>
      <div className="run-control"><span className="readiness" aria-live="polite">{count === 5 ? "5 из 5 · можно рассчитать" : `${count} из 5 решений выбрано`}</span>
        <button className="primary-button" onClick={run} disabled={count !== 5 || remaining < 0 || loading} aria-describedby="plan-instruction">
          {loading ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />}{loading ? "Получаем объяснение…" : "Рассчитать сценарий"}
        </button>
      </div>
    </div>
    <main>
      <section className="baseline-section" aria-labelledby="baseline-heading">
        <div className="section-heading"><div><p className="eyebrow">01 / ИСХОДНЫЕ УСЛОВИЯ</p><h2 id="baseline-heading">Город до ваших решений</h2></div>
          <p className="dataset-note">Учебные данные · одинаковые условия для всех</p>
        </div>
        <div className="baseline-grid">
          <div className="baseline-score"><span>Astana Quality of Life Score</span><strong>{score(baseline.overall)}<small> / 100</small></strong></div>
          {CATEGORIES.map(category => <div className="baseline-metric" key={category}><span>{labels[category]}</span><strong>{score(baseline.byCategory[category])}</strong><div className="bar-track" aria-hidden="true"><i style={{ width: `${baseline.byCategory[category]}%` }} /></div></div>)}
        </div>
        <p className="muted">Индекс 0–100: выше — лучше. Пять направлений имеют равный вес.</p>
        <details className="score-definition"><summary>Как рассчитывается рейтинг? <ChevronDown size={15} /></summary>
          <p>AQoL — индекс качества жизни от 0 до 100. Чем выше значение, тем лучше показатели модели. Пять направлений имеют равный вес; внутри каждого учитывается население районов. Итог округляется до одной десятой. Это учебная модель, а не официальный рейтинг Астаны.</p>
        </details>
        <details className="district-details"><summary>Исходные показатели {cityDataset.districts.length} районов <ChevronDown size={15} /></summary><DistrictTable snapshot={baseline} /></details>
      </section>

      <section className="decisions-section" id="decisions" aria-labelledby="decisions-heading">
        <div className="section-heading"><div><p className="eyebrow">02 / ВАШИ РЕШЕНИЯ</p><h2 id="decisions-heading">По одному мероприятию в каждом направлении</h2></div>
          <button className="text-button" onClick={reset} disabled={!count}><RotateCcw size={15} />Сбросить решения</button>
        </div>
        <p id="plan-instruction" className="section-intro" role="status">{count < 5 ? `Выбрано ${count} из 5. Для расчёта заполните все направления.` : "Все направления заполнены. Можно рассчитать сценарий или изменить выбор."}</p>
        {notice && <p className="status-message" role="status">{notice}</p>}
        {validation && <p className="error-message" role="alert">{validation}</p>}
        <div className="category-tabs" role="group" aria-label="Пять направлений">
          {CATEGORIES.map((category, index) => <button id={`tab-${category}`} key={category} className={`category-tab ${active === category ? "active" : ""}`} disabled={!ready} aria-pressed={active === category} aria-controls="initiative-choices" onClick={() => setActive(category)}>
            <span className="category-number">{selection[category] ? <Check size={16} /> : index + 1}</span><span>{labels[category]}<small>{selection[category] ? "Выбрано" : "Нужен выбор"}</small></span>
          </button>)}
        </div>
        <div className="choices-heading"><h3>{labels[active]}</h3><span>Шаг {activeIndex + 1} из 5</span></div>
        <div className="choices" id="initiative-choices" role="group" aria-labelledby={`tab-${active}`}>
          {cityDataset.initiatives.filter(item => item.category === active).map(item => {
            const checked = selection[active] === item.id;
            const projectedSpend = spent - (activeChoice?.cost || 0) + item.cost;
            const blocked = projectedSpend > cityDataset.budget;
            const copy = initiativeCopy(item);
            return <button key={item.id} className={`choice ${checked ? "selected" : ""}`} disabled={blocked || !ready} aria-pressed={checked} onClick={() => choose(active, item.id)}>
              <span className="choice-price">{money(item.cost)}<span className="choice-check" aria-hidden="true">{checked && <Check size={16} />}</span></span>
              <strong className="choice-name">{copy.name}</strong><p>{copy.description}</p><Effects initiative={item} />
              <span className={blocked ? "choice-state negative" : "choice-state"}>{!ready ? "Подготовка…" : blocked ? `Не хватает ${money(projectedSpend - cityDataset.budget)}` : checked ? "Выбрано" : "Выбрать мероприятие"}{!blocked && (checked ? <Check size={16} /> : <ArrowRight size={16} />)}</span>
            </button>;
          })}
        </div>
        <div className="choice-actions"><p>Эффекты указаны в пунктах показателей районов до ограничения 0–100. Диапазон отражает различия между затронутыми районами.</p>
          <div>{activeChoice && <button className="text-button" onClick={removeChoice}>Снять выбор</button>}{activeIndex < 4 && <button className="secondary-button" onClick={() => setActive(CATEGORIES[activeIndex + 1])}>Далее: {labels[CATEGORIES[activeIndex + 1]]}<ArrowRight size={16} /></button>}</div>
        </div>
        <details className="plan-details"><summary>Ваш план · {count} из 5 решений <ChevronDown size={16} /></summary>
          <ul className="plan-list">{CATEGORIES.map(category => {
            const item = selected.find(initiative => initiative.category === category);
            return <li key={category}><div><span>{labels[category]}</span><strong>{item ? initiativeCopy(item).name : "Мероприятие не выбрано"}</strong></div><span>{item ? money(item.cost) : "—"}</span><button className="text-button" onClick={() => { setActive(category); document.getElementById("decisions")?.scrollIntoView({ block: "start" }); }} aria-label={`Изменить: ${labels[category]}`}>{item ? "Изменить" : "Выбрать"}</button></li>;
          })}</ul>
        </details>
      </section>

      {result && <section className="results-section" ref={resultsRef} tabIndex={-1} aria-labelledby="results-heading">
        <ScenarioReview result={result} districts={cityDataset.districts} saved={saved}
          analysis={analysis} loading={loading} aiError={aiError}
          onSave={() => setSaved(result)} onClearSaved={() => setSaved(null)} onRetry={() => void explain(result)} />
      </section>}
      <footer>Учебный симулятор. Население, исходные показатели, стоимость и эффекты мероприятий синтетические. Это не прогноз и не официальная статистика Астаны.</footer>
    </main>
  </div>;
}

function DistrictTable({ snapshot, before }: { snapshot: SimulationResult["projected"]; before?: SimulationResult["baseline"] }) {
  return <div className="table-scroll" role="region" aria-label="Показатели районов" tabIndex={0}><table><thead><tr><th scope="col">Район</th>{CATEGORIES.map(category => <th scope="col" key={category}>{labels[category]}</th>)}</tr></thead><tbody>{snapshot.districts.map(district => <tr key={district.districtId}><th scope="row">{cityDataset.districts.find(item => item.id === district.districtId)?.name || district.districtId}</th>{CATEGORIES.map(category => <td key={category}>{before && <span className="muted">{number(before.districts.find(item => item.districtId === district.districtId)!.metrics[category])} → </span>}{number(district.metrics[category])}</td>)}</tr>)}</tbody></table></div>;
}
