"use client";

import { useRef, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Building2, Bus, Check, ChevronRight, CircleHelp, GitCompareArrows, Landmark, Leaf, LoaderCircle, MapPin, RotateCcw, ShieldCheck, Sparkles, Waves, X } from "lucide-react";
import { cityDataset, DATASET_NOTE } from "@/lib/data";
import { calculateSnapshot, simulateScenario } from "@/lib/simulation";
import { CATEGORIES, type Category, type ScenarioSelection, type SimulationResult, type AIAnalysis } from "@/types/city";

const labels: Record<Category, string> = { transport: "Transport", greening: "Green spaces", social: "Social infrastructure", safety: "Public safety", services: "City services" };
const descriptions: Record<Category, string> = { transport: "Make the everyday journey better.", greening: "Give the city room to breathe.", social: "Build opportunity closer to home.", safety: "Help every neighborhood feel safer.", services: "Keep the essentials working for everyone." };
const icons = { transport: Bus, greening: Leaf, social: Building2, safety: ShieldCheck, services: Waves };
const baseline = calculateSnapshot(cityDataset.districts);
const number = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });

function Skyline() {
  return <svg className="skyline" viewBox="0 0 610 200" fill="none" aria-hidden="true"><path d="M0 184H610" stroke="currentColor" opacity=".25"/><g stroke="currentColor" strokeWidth="1.4"><path d="M26 183V105H75V183M34 113H67M34 125H67M34 137H67M34 149H67M34 161H67M84 183V80L114 62L144 80V183M92 91H136M92 106H136M92 121H136M92 136H136M92 151H136M92 166H136M153 183V133H196V183M164 143V173M175 143V173M186 143V173"/><path d="M224 183L237 104M255 183L242 104M231 140H249M227 162H253M232 111H247M238 72V38M242 72V38"/><circle cx="240" cy="87" r="21" fill="#d4e6b7"/><path d="M224 73L255 99M220 85L250 106M230 68L260 94M220 93L250 68M228 104L260 80" opacity=".4"/><path d="M277 183V113L311 89L345 113V183M289 119V174M301 109V174M313 109V174M325 117V174M357 183L412 65L467 183ZM385 183L412 65L438 183M370 157H455M382 131H443M394 105H431M476 183V121H515V183M485 131H506M485 143H506M485 155H506M485 167H506M527 183V94H576V183M535 105H568M535 119H568M535 133H568M535 147H568M535 161H568"/><path d="M8 183V158M0 164C0 147 18 147 18 164C18 177 0 177 0 164ZM590 183V158M581 164C581 147 601 147 601 164C601 177 581 177 581 164Z"/></g><circle cx="443" cy="36" r="17" fill="#d4e6b7" opacity=".7"/></svg>;
}

export default function Home() {
  const [selection, setSelection] = useState<Partial<ScenarioSelection>>({});
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SimulationResult | null>(null);
  const [active, setActive] = useState<Category>("transport");
  const [view, setView] = useState<"plan" | "districts">("plan");
  const [validation, setValidation] = useState("");
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const selected = cityDataset.initiatives.filter(item => selection[item.category] === item.id);
  const spent = selected.reduce((sum, item) => sum + item.cost, 0);
  const remaining = cityDataset.budget - spent;
  const count = selected.length;
  function invalidate() { generation.current++; controller.current?.abort(); setLoading(false); setResult(null); setAnalysis(null); setAiError(""); setValidation(""); }
  function choose(category: Category, id: string) { invalidate(); setSelection(previous => ({ ...previous, [category]: id })); }
  function reset() { invalidate(); setSelection({}); setActive("transport"); }
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
    setResult(next); setValidation(""); void explain(next);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a href="#" className="brand"><span className="brand-mark"><Landmark size={23}/></span><span>akim<span className="brand-dot">.</span><small>ASTANA CITY LAB</small></span></a>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav aria-label="Main navigation"><button className={view === "plan" ? "nav-item current" : "nav-item"} onClick={() => setView("plan")}><Landmark size={18}/>City simulator<ChevronRight size={15}/></button><button className={view === "districts" ? "nav-item current" : "nav-item"} onClick={() => setView("districts")}><MapPin size={18}/>District overview</button></nav>
      <div className="sidebar-city"><div className="city-dot"/>ASTANA, KAZAKHSTAN<p>A better city starts<br/>with your decisions.</p><span>51.1694° N · 71.4491° E</span></div>
      <div className="sidebar-bottom"><span className="avatar">A</span><div>Acting Akim<small>Your five-hour term</small></div><span className="term-dot"/></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumbs">City lab <ChevronRight size={13}/><strong>{view === "plan" ? "Simulator" : "District overview"}</strong></div><span className="demo-pill"><span/>SIMULATION MODE</span></header>
      <main>
        <section className="hero"><div className="eyebrow"><span/>АКИМ НА 5 ЧАСОВ · THE CITY IS IN YOUR HANDS</div><h1>Five decisions.<br/><span>One better Astana.</span></h1><p>You’re the Akim for five hours. Invest your budget, balance<br className="desktop-break"/> your priorities, and see the city you could create.</p><Skyline/><div className="hero-footer"><span><MapPin size={14}/>Astana, Kazakhstan</span><span>5 priorities <i/> 1 shared future</span></div></section>
        <section className="baseline-strip" aria-label="Starting conditions"><div className="baseline-title"><span className="eyebrow">YOUR STARTING POINT</span><div><strong>{number(baseline.overall)}</strong><span>/ 100<small>Astana Quality of Life</small></span></div></div><div className="baseline-metrics">{CATEGORIES.map(category => { const Icon = icons[category]; return <div key={category}><span><Icon size={15}/>{labels[category]}</span><strong>{number(baseline.byCategory[category])}</strong><div className="mini-track"><i style={{ width: `${baseline.byCategory[category]}%` }}/></div></div>; })}</div></section>
        {view === "districts" ? <section className="district-panel panel"><div className="section-heading"><div><span className="eyebrow">THE CITY AT A GLANCE</span><h2>Every neighborhood matters.</h2></div><button className="text-button" onClick={() => setView("plan")}>Build your plan <ArrowRight size={16}/></button></div><p className="muted">Starting indicators for each district. All scores are on a 0–100 scale.</p><DistrictTable snapshot={baseline}/><p className="data-note">{DATASET_NOTE}</p></section> : <>
        <div className="workspace-grid"><section className="decision-panel"><div className="section-heading"><div><span className="eyebrow">01 / BUILD YOUR CITY PLAN</span><h2>Where will you make a difference?</h2><p>Choose one initiative in each priority. Make every tenge count.</p></div><span className="step-count">{count}<span> / 5 selected</span></span></div>
          <div className="category-tabs" role="group" aria-label="Investment category">{CATEGORIES.map((category, index) => { const Icon = icons[category]; return <button key={category} id={`tab-${category}`} aria-controls={`panel-${category}`} aria-pressed={active === category} className={active === category ? "category-tab active" : "category-tab"} onClick={() => setActive(category)}><span className="tab-icon">{selection[category] ? <Check size={18}/> : <Icon size={19}/>}</span><span>{labels[category]}</span><small>0{index + 1}</small></button>; })}</div>
          <div className="choices-panel" role="region" id={`panel-${active}`} aria-labelledby={`tab-${active}`}><div className="choices-title"><div><h3>{labels[active]}</h3><p>{descriptions[active]}</p></div><span>SELECT ONE</span></div><div className="choices">{cityDataset.initiatives.filter(item => item.category === active).map((item, index) => { const checked = selection[active] === item.id; const previous = selected.find(choice => choice.category === active)?.cost || 0; const blocked = spent - previous + item.cost > cityDataset.budget; const affected = new Set(item.impacts.map(impact => impact.districtId)).size; return <button key={item.id} className={`choice ${checked ? "selected" : ""}`} onClick={() => choose(active, item.id)} disabled={blocked} aria-pressed={checked}><span className="choice-top"><span className="choice-tag">OPTION 0{index + 1}</span><span className="radio">{checked && <Check size={13}/>}</span></span><strong>{item.name}</strong><p>{item.description}</p><span className="choice-impact"><MapPin size={12}/>{affected} districts impacted</span><span className="choice-bottom"><span><b>{number(item.cost)}</b> M ₸</span><span>{blocked ? "Over budget" : checked ? "Selected" : "Choose initiative"}{checked ? <Check size={14}/> : <ArrowUpRight size={14}/>}</span></span></button>; })}</div><div className="choice-footnote"><CircleHelp size={14}/><span>Each investment affects city indicators. Some benefits come with trade-offs.</span></div>{CATEGORIES.indexOf(active) < 4 && <button className="next-category" onClick={() => setActive(CATEGORIES[CATEGORIES.indexOf(active) + 1])}>Next: {labels[CATEGORIES[CATEGORIES.indexOf(active) + 1]]}<ArrowRight size={15}/></button>}</div>
        </section>
        <aside className="budget-card"><div className="budget-heading"><span className="eyebrow">YOUR CITY BUDGET</span><span className="fixed-label">FIXED</span></div><div className="budget-total">{number(cityDataset.budget)}<span> M ₸</span></div><p className="budget-caption">Million tenge · same start for everyone</p><div className="budget-progress"><i style={{width: `${Math.min(100, spent / cityDataset.budget * 100)}%`}}/></div><div className="budget-stats"><span>Allocated<strong>{number(spent)} M ₸</strong></span><span>Remaining<strong className={remaining < 0 ? "negative" : "positive"}>{number(remaining)} M ₸</strong></span></div><div className="plan-list"><div className="plan-list-title">YOUR PLAN<span>{count} OF 5</span></div>{CATEGORIES.map(category => { const item = selected.find(choice => choice.category === category); return <div className="plan-item" key={category}><span className={item ? "plan-check checked" : "plan-check"}>{item ? <Check size={12}/> : <span/>}</span><div><strong>{labels[category]}</strong><small>{item ? item.name : "Choose an initiative"}</small></div><span>{item ? `${item.cost}` : "—"}</span></div>; })}</div><button className="primary-button" onClick={run} disabled={count !== 5 || remaining < 0 || loading}>{loading ? <LoaderCircle className="spin" size={17}/> : <Sparkles size={17}/>}Simulate my city<ArrowRight size={17}/></button><p className="submit-hint">{count < 5 ? `${5 - count} more ${5 - count === 1 ? "decision" : "decisions"} to see your impact` : "Your plan is ready. See what changes."}</p><button className="reset-button" onClick={reset} disabled={!count}><RotateCcw size={13}/>Reset decisions</button>{validation && <p role="alert" className="error-text">{validation}</p>}</aside></div>
        {result && <section className="results-section" ref={resultsRef} aria-label="Simulation results"><div className="section-heading"><div><span className="eyebrow">02 / YOUR CITY, REIMAGINED</span><h2>Here’s the difference you make.</h2><p>Calculated from your decisions. Explained by your AI advisor.</p></div><button className="secondary-button" onClick={() => setSaved(result)}><GitCompareArrows size={16}/>{saved ? "Replace saved A" : "Save as scenario A"}</button></div><div className="results-grid"><div className="result-score panel"><span className="eyebrow">PROJECTED QUALITY OF LIFE</span><div className="score-large">{number(result.projected.overall)}<span>/100</span></div><span className={`delta-pill ${result.delta < 0 ? "down" : ""}`}>{result.delta >= 0 ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>} {result.delta > 0 ? "+" : ""}{number(result.delta)} points</span><p>From a baseline of {number(result.baseline.overall)}.<br/>Five priorities. One citywide score.</p><div className="deterministic-note"><ShieldCheck size={15}/>Calculated by code, never by AI</div></div><div className="metric-results panel"><div className="chart-heading"><h3>Your impact by priority</h3><span><i/>Before <i/>After</span></div>{CATEGORIES.map(category => <div className="metric-row" key={category}><div><span>{labels[category]}</span><span>{number(result.baseline.byCategory[category])}<ArrowRight size={12}/><b>{number(result.projected.byCategory[category])}</b></span></div><div className="comparison-bars"><i style={{width: `${result.baseline.byCategory[category]}%`}}/><i style={{width: `${result.projected.byCategory[category]}%`}}/></div></div>)}</div></div>
          {saved && <div className="comparison panel"><div className="chart-heading"><h3><GitCompareArrows size={18}/> Scenario comparison</h3><button className="icon-button" aria-label="Clear saved scenario" onClick={() => setSaved(null)}><X size={18}/></button></div><div className="table-scroll"><table><thead><tr><th>Indicator</th><th>Saved A</th><th>Current B</th><th>Change</th></tr></thead><tbody>{[{label: "Quality of life", a: saved.projected.overall, b: result.projected.overall}, ...CATEGORIES.map(category => ({label: labels[category], a: saved.projected.byCategory[category], b: result.projected.byCategory[category]})), {label: "Budget spent · M ₸", a: saved.budget.spent, b: result.budget.spent}].map(row => <tr key={row.label}><td>{row.label}</td><td>{number(row.a)}</td><td>{number(row.b)}</td><td>{row.b > row.a ? "+" : ""}{number(Math.round((row.b - row.a) * 10) / 10)}</td></tr>)}</tbody></table></div><p className="muted">Saved in this session. Change your decisions and simulate again to compare.</p></div>}
          <div className="ai-panel panel"><div className="chart-heading"><h3><Sparkles size={19}/>Your AI city advisor</h3><span className="ai-label">EXPLANATION, NOT CALCULATION</span></div><div aria-live="polite">{loading && <div className="ai-loading"><LoaderCircle size={22} className="spin"/><div><strong>Looking at the bigger picture…</strong><p>Your score is ready. Your advisor is exploring benefits, risks, and trade-offs.</p></div></div>}{aiError && <div className="ai-error"><strong>Your city results are ready. AI analysis is unavailable.</strong><p>{aiError}</p><button className="secondary-button" onClick={() => void explain(result)}><RotateCcw size={14}/>Retry AI analysis</button></div>}{analysis && <><p className="ai-summary">{analysis.summary}</p><div className="analysis-columns">{[{title: "What works well", items: analysis.strengths}, {title: "Risks to watch", items: analysis.risks}, {title: "The trade-offs", items: analysis.tradeoffs}].map(group => <div key={group.title}><h4>{group.title}</h4><ul>{group.items.map((text, i) => <li key={i}>{text}</li>)}</ul></div>)}</div><div className="recommendations"><h4>Your next moves</h4>{analysis.recommendations.map((item, i) => <div key={i}><span>0{i + 1}</span><div><strong>{item.title}</strong><p>{item.rationale}</p></div></div>)}</div></>}</div></div><details className="district-details panel"><summary>Explore the impact in each district <ChevronRight size={18}/></summary><DistrictTable snapshot={result.projected}/></details></section>}
        </>}
        <footer className="page-footer"><span><Landmark size={14}/>Built for a better tomorrow.</span><p>{DATASET_NOTE} Budget and outcomes are virtual.</p><span>HACKALEM · CITY LAB</span></footer>
      </main>
    </div>
  </div>;
}

function DistrictTable({ snapshot }: { snapshot: SimulationResult["projected"] }) {
  return <div className="table-scroll"><table><thead><tr><th>District</th>{CATEGORIES.map(category => <th key={category}>{labels[category]}</th>)}</tr></thead><tbody>{snapshot.districts.map(district => <tr key={district.districtId}><td>{cityDataset.districts.find(item => item.id === district.districtId)?.name || district.districtId}</td>{CATEGORIES.map(category => <td key={category}>{number(district.metrics[category])}</td>)}</tr>)}</tbody></table></div>;
}

