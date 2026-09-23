"use client";

import { useRef, useState } from "react";
import { ArrowRight, ChevronDown, LoaderCircle, RotateCcw } from "lucide-react";
import { cityDataset } from "@/lib/data";
import { calculateSnapshot, simulateScenario, validateSelection } from "@/lib/simulation";
import { CATEGORIES, METRICS, METRIC_LABELS, type Category, type Initiative, type ScenarioSelection, type SimulationResult, type AIAnalysis, type ScoreSnapshot } from "@/types/city";

import { ScenarioReview } from "@/components/scenario-review";

const labels: Record<Category,string> = {transport:"Транспорт",greening:"Экология и озеленение",social:"Социальная инфраструктура",safety:"Безопасность",services:"Городские сервисы"};
const baseline = calculateSnapshot(cityDataset.districts);
const number = (v:number) => v.toLocaleString("ru-RU",{maximumFractionDigits:2});
const score = (v:number) => v.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2});
const signed = (v:number) => `${v>0?"+":""}${number(Math.round(v*100)/100)}`;
const budgetPlural = new Intl.PluralRules("ru-RU");
const budgetUnit = (v:number) => { const form = budgetPlural.select(v); return form === "one" ? "единица" : form === "few" ? "единицы" : "единиц"; };
const money = (v:number) => `${number(v)} ${budgetUnit(v)} бюджета`;
const districtName = (id?:string) => cityDataset.districts.find(d=>d.id===id)?.name ?? "Весь город";

function Effects({initiative}:{initiative:Initiative}) {
  const fraction = (cityDataset.horizon-initiative.lag)/cityDataset.horizon;
  return <ul className="effects" aria-label="Эффекты с учётом лага">{METRICS.filter(m=>initiative.effects[m]!==undefined).map(m=><li key={m}><span>{m} · {METRIC_LABELS[m]}</span><strong className={initiative.effects[m]!<0?"negative":"positive"}>{signed(initiative.effects[m]!*fraction)}</strong></li>)}</ul>;
}

export default function Home() {
  const [selection,setSelection] = useState<ScenarioSelection>([]);
  const [targets,setTargets] = useState<Record<string,string>>({});
  const [active,setActive] = useState<Category>("transport");
  const [result,setResult] = useState<SimulationResult|null>(null);
  const [saved,setSaved] = useState<SimulationResult|null>(null);
  const [analysis,setAnalysis] = useState<AIAnalysis|null>(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [undoSelection,setUndoSelection] = useState<ScenarioSelection|null>(null);
  const decisionsRef = useRef<HTMLElement>(null);
  const generation = useRef(0);
  const controller = useRef<AbortController|null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const draft = simulateScenario(cityDataset,selection);
  const {spent,remaining} = draft.budget;
  const invalidate = () => {generation.current++;controller.current?.abort();setLoading(false);setResult(null);setAnalysis(null);setError("");};
  function update(next:ScenarioSelection) { const hadResult=!!result; invalidate();setSelection(next);setUndoSelection(null);setNotice(hadResult?"План изменён. Рассчитайте новый результат.":""); }
  function reset() {setUndoSelection(selection);invalidate();setSelection([]);setTargets({});setActive("transport");setNotice("Решения сброшены. Доступно 100 единиц бюджета.");}
  function changeTarget(item:Initiative,id:string) {
    const existing=selection.find(s=>s.initiativeId===item.id);
    if(existing) {
      const next=selection.map(s=>s.initiativeId===item.id?{initiativeId:item.id,districtId:id}:s);
      const errors=validateSelection(cityDataset,next,false);
      if(errors.length){setNotice(errors.join(" "));return;}
      update(next);
    }
    setTargets(old=>({...old,[item.id]:id}));
  }
  async function explain(next:SimulationResult) {
    const request=++generation.current;controller.current?.abort();controller.current=new AbortController();
    setLoading(true);setError("");setAnalysis(null);
    try {
      const response=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(next),signal:controller.current.signal});
      const body=await response.json();
      if(!response.ok)throw new Error(body.error||"Сервис объяснений недоступен.");
      if(request===generation.current)setAnalysis(body);
    }catch(e){if(request===generation.current&&!(e instanceof Error&&e.name==="AbortError"))setError(e instanceof Error?e.message:"Не удалось получить объяснение.");}
    finally{if(request===generation.current)setLoading(false);}
  }
  function run(){const next=simulateScenario(cityDataset,selection);if(!next.valid){setNotice(next.validationErrors.join(" "));return;}setResult(next);setNotice("");void explain(next);setTimeout(()=>resultsRef.current?.scrollIntoView({block:"start"}),50);}
  function editPlan() { decisionsRef.current?.scrollIntoView({block:"start"}); decisionsRef.current?.focus({preventScroll:true}); }
  const projected=result?.projected;
  return <div className="simulator" lang="ru">
    <a className="skip-link" href="#decisions">Перейти к решениям</a>
    <header className="page-header"><div><p className="eyebrow">HACKALEM · АСТАНА</p><h1>Аким на 5 часов</h1></div><p>Соберите план из 5 мероприятий. Распределите 100 единиц бюджета и узнайте, как изменится город за 2 года.</p></header>
    <div className="budget-bar" aria-label="Бюджет и готовность сценария">
      <div className="budget-main"><span>Осталось бюджета</span><strong>{number(remaining)}<small className="budget-unit">{budgetUnit(remaining)} из 100</small></strong></div>
      <div className="budget-allocation"><span>Выделено {money(spent)} из 100</span><progress value={spent} max={100} aria-label="Выделенная доля бюджета"/></div>
      <div className="run-control"><a href="#scenario-plan" className="readiness" aria-live="polite">{selection.length} / 5 решений · {draft.valid?"план готов":`добавьте ещё ${5-selection.length}`}</a><button className="primary-button" onClick={run} disabled={!draft.valid||loading}>{loading?<LoaderCircle className="spin" size={17}/>:<ArrowRight size={17}/>} {loading?"Анализируем…":"Рассчитать сценарий"}</button></div>
    </div>
    <main>
      <section className="baseline-section" aria-labelledby="baseline-heading">
        <div className="section-heading"><div><p className="eyebrow">01 / ИСХОДНЫЕ УСЛОВИЯ</p><h2 id="baseline-heading">Город до ваших решений</h2></div><p className="dataset-note">Синтетические данные из задания · одинаковые для всех</p></div>
        <div className="city-overview"><div><span>Рейтинг качества жизни · AQoL</span><strong>{score(baseline.overall)}</strong></div><p><strong>Нура — самый слабый район</strong><span>Школы и медицина ниже 40 из 100. Улучшение этих показателей уменьшает штраф к рейтингу.</span></p><a className="secondary-button" href="#decisions">Выбрать мероприятия <ArrowRight size={16}/></a></div>
        <details className="baseline-details"><summary>Показатели города по направлениям <ChevronDown size={15}/></summary><div className="baseline-grid">{CATEGORIES.map(c=><div className="baseline-metric" key={c}><span>{labels[c]}</span><strong>{score(baseline.byCategory[c])}</strong><div className="bar-track"><i style={{width:`${baseline.byCategory[c]}%`}}/></div></div>)}</div><p className="muted">Шкала 0–100: выше — лучше. Критических показателей (&lt;40): {baseline.criticalCount}.</p></details>
        <details className="score-definition"><summary>Как рассчитывается рейтинг? <ChevronDown size={15}/></summary><p>Эффект меры × (8 − лаг) / 8, затем фиксированные синергии и ограничение показателей 0–100. Районный балл — взвешенная сумма десяти показателей. Score = 0,7 × средний районный балл по долям населения + 0,3 × худший район − число показателей ниже 40. Остаток бюджета бонуса не даёт. Баллы направлений — вспомогательные нормированные средние, не формула Score.</p></details>
        <details className="district-details"><summary>Исходные показатели пяти районов <ChevronDown size={15}/></summary><DistrictTable snapshot={baseline}/></details>
      </section>
      <section className="decisions-section" id="decisions" ref={decisionsRef} tabIndex={-1} aria-labelledby="decisions-heading">
        <div className="section-heading"><div><p className="eyebrow">02 / ВАШИ РЕШЕНИЯ</p><h2 id="decisions-heading">Соберите свой план</h2></div><button className="text-button" onClick={reset} disabled={!selection.length}><RotateCcw size={15}/>Сбросить решения</button></div>
        <p className="section-intro">Выберите 5 разных мероприятий — не более 2 из одного направления. Укажите район и нажмите «Добавить в план».</p>
        {notice&&<p className="status-message" role="status">{notice} {undoSelection&&<button className="text-button" onClick={()=>update(undoSelection)}>Вернуть решения</button>}</p>}
        <div className="category-tabs" role="group" aria-label="Пять направлений">{CATEGORIES.map(c=><button key={c} id={`tab-${c}`} className={`category-tab ${active===c?"active":""}`} aria-pressed={active===c} onClick={()=>setActive(c)}><span>{labels[c]}<small>Выбрано: {draft.selectedInitiatives.filter(i=>i.category===c).length}</small></span></button>)}</div>
        <div className="planning-workspace"><div className="initiative-catalog"><div className="choices-heading"><h3>{labels[active]}</h3><span>{selection.length} / 5 решений</span></div>
        <div className="choices">{cityDataset.initiatives.filter(i=>i.category===active).map(item=>{
          const existing=selection.find(s=>s.initiativeId===item.id);
          const target=existing?.districtId??targets[item.id]??"";
          const candidate={initiativeId:item.id,...(item.scope==="district"?{districtId:target}:{})};
          const reasons=existing?[]:validateSelection(cityDataset,[...selection,candidate],false);
          const missingTarget=item.scope==="district"&&!target;
          const visibleReasons=reasons.filter(r=>!r.includes("выберите один существующий район")).map(r=>r.includes("Превышен бюджет")?`Не хватает ${money(item.cost-remaining)}. Уберите другое мероприятие.`:r.includes("ровно 5")?"В плане уже 5 мероприятий. Уберите одно, чтобы добавить это.":r);
          return <article key={item.id} className={`choice ${existing?"selected":""}`} aria-label={`${item.id} ${item.name}`}>
            <div className="choice-price"><span>{number(item.cost)}<small className="cost-unit">{budgetUnit(item.cost)} бюджета</small></span><small>{existing?"✓ В плане":item.id}</small></div><h4 className="choice-name">{item.name}</h4>
            <p>{item.scope==="city"?"Весь город":"Один район"} · начало эффекта через {item.lag} кв.</p><Effects initiative={item}/>
            {item.scope==="district"&&<label className="target-label">Где реализовать<select aria-label={`Район для ${item.id}`} value={target} onChange={e=>changeTarget(item,e.target.value)}><option value="" disabled>Выберите район</option>{cityDataset.districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}
            {visibleReasons.length>0&&<p className="choice-reason">{visibleReasons.join(" ")}</p>}
            <button className={`choice-state ${existing?"secondary-button":"primary-button"}`} disabled={!existing&&reasons.length>0} onClick={()=>update(existing?selection.filter(s=>s.initiativeId!==item.id):[...selection,candidate])}>{existing?"Убрать из плана":missingTarget?"Сначала выберите район":"Добавить в план"}</button>
          </article>;
        })}</div>
        <details className="selection-rules"><summary>Эффекты и ограничения <ChevronDown size={15}/></summary><p className="muted">Показаны изменения за 2 года, до синергий и ограничения 0–100. Несовместимы M1/M3 в любых районах, M4/M7 и M5/M13 — в одном районе. Городские меры действуют во всех пяти районах.</p></details>
        </div><aside id="scenario-plan" className="plan-details" aria-label="Ваш план"><div className="plan-heading"><h3>Ваш план</h3><strong>{selection.length} / 5</strong></div><p className="muted">{draft.valid?"Всё готово. Можно рассчитать результат.":`Добавьте ещё ${5-selection.length} мероприятий.`}</p><ol className="plan-list">{selection.map(choice=>{const item=cityDataset.initiatives.find(i=>i.id===choice.initiativeId)!;return <li key={item.id}><div><span>{labels[item.category]} · {item.id}</span><strong>{item.name}</strong>{item.scope==="district"?<select aria-label={`Район в плане для ${item.id}`} value={choice.districtId} onChange={e=>changeTarget(item,e.target.value)}>{cityDataset.districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>:<span>Весь город</span>}</div><div className="plan-item-actions"><span>{money(item.cost)}</span><button className="text-button" aria-label={`Удалить ${item.id}`} onClick={()=>update(selection.filter(s=>s.initiativeId!==item.id))}>Убрать</button></div></li>})}{Array.from({length:5-selection.length},(_,i)=><li className="empty-slot" key={`empty-${i}`}><span>{selection.length+i+1}</span>Мероприятие не выбрано</li>)}</ol><div className="plan-total"><span>Выделено</span><strong>{number(spent)} / 100</strong></div><a className="text-button" href="#decisions">К выбору мероприятий ↑</a></aside></div>
      </section>
      {result&&projected&&<section className="results-section" ref={resultsRef} tabIndex={-1} aria-labelledby="results-heading">
        <button className="secondary-button" onClick={editPlan}>Изменить решения</button>
        <ScenarioReview result={result} districts={cityDataset.districts} saved={saved} analysis={analysis} loading={loading} aiError={error} onSave={()=>setSaved(result)} onClearSaved={()=>setSaved(null)} onRetry={()=>void explain(result)}/>
      </section>}
      <footer>Синтетический учебный набор из задания HackAlem. Единицы бюджета — условная валюта симулятора. Это не официальная статистика Астаны, закупочные цены или прогноз реальных последствий.</footer>
    </main>
  </div>;
}
function DistrictTable({snapshot,before}:{snapshot:ScoreSnapshot;before?:ScoreSnapshot}) {return <div className="table-scroll" role="region" aria-label="Показатели районов" tabIndex={0}><table><thead><tr><th>Район</th><th>Доля</th>{METRICS.map(m=><th key={m} title={METRIC_LABELS[m]}>{m}<br/>{METRIC_LABELS[m]}</th>)}<th>Балл D</th></tr></thead><tbody>{snapshot.districts.map(d=><tr key={d.districtId}><th>{districtName(d.districtId)}</th><td>{number((cityDataset.districts.find(x=>x.id===d.districtId)?.population??0)*100)}%</td>{METRICS.map(m=><td key={m} className={d.metrics[m]<40?"negative":""}>{before&&`${number(before.districts.find(x=>x.districtId===d.districtId)!.metrics[m])} → `}{number(d.metrics[m])}</td>)}<td>{before&&`${score(before.districts.find(x=>x.districtId===d.districtId)!.score)} → `}{score(d.score)}</td></tr>)}</tbody></table></div>;}
