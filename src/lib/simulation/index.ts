import { CATEGORIES, METRICS, METRIC_CATEGORY, METRIC_WEIGHTS, type CityDataset, type District, type ScenarioSelection, type ScoreSnapshot, type SimulationResult, type Metric } from "../../types/city";
import { validateDataset } from "../data/validate";
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const units = (amount: number) => Math.round(amount * 1_000_000);
export const SYNERGIES: Array<{ids:[string,string];target:string;metric:Metric;delta:number}> = [
  {ids:["M1","M2"],target:"M1",metric:"T1",delta:2},
  {ids:["M10","M12"],target:"M10",metric:"B1",delta:2},
  {ids:["M5","M6"],target:"M5",metric:"E2",delta:2},
];
export const INCOMPATIBILITIES = [{ids:["M1","M3"],sameDistrict:false},{ids:["M4","M7"],sameDistrict:true},{ids:["M5","M13"],sameDistrict:true}];
function rawScore(districts: District[]) {
  const scores = districts.map(d => METRICS.reduce((sum,m) => sum + METRIC_WEIGHTS[m] * d.metrics[m],0));
  const weightedAverage = scores.reduce((sum,s,i) => sum + s * districts[i].population,0);
  const worstDistrictScore = Math.min(...scores);
  const criticalCount = districts.reduce((sum,d) => sum + METRICS.filter(m => d.metrics[m] < 40).length,0);
  return {scores,weightedAverage,worstDistrictScore,criticalCount,overall:.7*weightedAverage+.3*worstDistrictScore-criticalCount};
}
export function calculateSnapshot(districts: District[]): ScoreSnapshot {
  if (!districts.length) throw new Error("Cannot score an empty city");
  const raw=rawScore(districts);
  const byCategory = Object.fromEntries(CATEGORIES.map(c => {
    const metrics=METRICS.filter(m => METRIC_CATEGORY[m]===c);
    const weight=metrics.reduce((sum,m) => sum+METRIC_WEIGHTS[m],0);
    return [c,round(districts.reduce((sum,d) => sum+d.population*metrics.reduce((n,m) => n+d.metrics[m]*METRIC_WEIGHTS[m],0)/weight,0))];
  })) as ScoreSnapshot["byCategory"];
  return {overall:round(raw.overall),byCategory,districts:districts.map((d,i) => ({districtId:d.id,metrics:{...d.metrics},score:round(raw.scores[i])})),weightedAverage:round(raw.weightedAverage),worstDistrictScore:round(raw.worstDistrictScore),criticalCount:raw.criticalCount};
}
export function validateSelection(dataset: CityDataset, selection: ScenarioSelection, requireComplete=true): string[] {
  const errors:string[]=[];
  if (!Array.isArray(selection)) return ["Решения должны быть списком из пяти мер."];
  if ((requireComplete && selection.length!==5) || selection.length>5) errors.push("Нужно выбрать ровно 5 решений.");
  const seen=new Set<string>(); const counts:Record<string,number>={}; let spent=0;
  for (const choice of selection) {
    if (!choice || typeof choice!=="object" || typeof choice.initiativeId!=="string") { errors.push("Некорректное решение."); continue; }
    const initiative=dataset.initiatives.find(i=>i.id===choice.initiativeId);
    if (!initiative) {errors.push(`Неизвестная мера: ${choice.initiativeId}.`);continue;}
    if (seen.has(initiative.id)) errors.push(`Повтор меры ${initiative.id} запрещён.`);
    seen.add(initiative.id); counts[initiative.category]=(counts[initiative.category]??0)+1;
    spent+=units(initiative.cost);
    if (initiative.scope==="district" && !dataset.districts.some(d=>d.id===choice.districtId)) errors.push(`Для ${initiative.id} выберите один существующий район.`);
    if (initiative.scope==="city" && choice.districtId!==undefined) errors.push(`Для городской меры ${initiative.id} район не указывается.`);
  }
  if (Object.values(counts).some(n=>n>2)) errors.push("Не более 2 мер одного направления.");
  if (spent>units(dataset.budget)) errors.push("Превышен бюджет 100 условных единиц.");
  for (const rule of INCOMPATIBILITIES) {
    const a=selection.find(c=>c?.initiativeId===rule.ids[0]),b=selection.find(c=>c?.initiativeId===rule.ids[1]);
    if (a && b && (!rule.sameDistrict || a.districtId===b.districtId)) errors.push(`Несовместимы ${rule.ids.join(" и ")}${rule.sameDistrict?" в одном районе":""}.`);
  }
  return errors;
}
export function simulateScenario(dataset: CityDataset, selection: ScenarioSelection): SimulationResult {
  validateDataset(dataset);
  const errors=validateSelection(dataset,selection);
  const choices:Array<ScenarioSelection[number]>=Array.isArray(selection)?selection.filter(c=>c && typeof c==="object" && typeof c.initiativeId==="string").map(c=>({initiativeId:c.initiativeId,...(c.districtId!==undefined?{districtId:c.districtId}:{})})).sort((a,b)=>a.initiativeId.localeCompare(b.initiativeId)):[];
  const selected=choices.flatMap(c=>{const i=dataset.initiatives.find(i=>i.id===c.initiativeId);return i?[{...i,effects:{...i.effects},...(c.districtId!==undefined?{districtId:c.districtId}:{})}]:[];});
  const spent=selected.reduce((sum,i)=>sum+units(i.cost),0),total=units(dataset.budget);
  const base:SimulationResult={valid:errors.length===0,validationErrors:errors,budget:{total:total/1e6,spent:spent/1e6,remaining:(total-spent)/1e6,exceeded:spent>total},selection:choices,selectedInitiatives:selected,baseline:calculateSnapshot(dataset.districts),projected:null,delta:null,contributions:[],synergies:[]};
  if (errors.length) return base;
  const districts=dataset.districts.map(d=>({...d,metrics:{...d.metrics}}));
  for (const i of selected) {
    const fraction=(dataset.horizon-i.lag)/dataset.horizon;
    const targets=i.scope==="city"?districts:districts.filter(d=>d.id===i.districtId);
    const impacts=targets.flatMap(d=>METRICS.filter(m=>i.effects[m]!==undefined).map(metric=>({districtId:d.id,metric,delta:i.effects[metric]!*fraction})));
    base.contributions.push({initiativeId:i.id,...(i.districtId?{districtId:i.districtId}:{}),fraction,impacts});
    for (const impact of impacts) districts.find(d=>d.id===impact.districtId)!.metrics[impact.metric]+=impact.delta;
  }
  for (const rule of SYNERGIES) if (rule.ids.every(id=>selected.some(i=>i.id===id))) {
    const districtId=selected.find(i=>i.id===rule.target)!.districtId!;
    const impact={districtId,metric:rule.metric,delta:rule.delta};
    base.synergies.push({initiativeIds:[...rule.ids],impacts:[impact]});
    districts.find(d=>d.id===districtId)!.metrics[rule.metric]+=rule.delta;
  }
  for (const d of districts) for (const m of METRICS) d.metrics[m]=Math.max(0,Math.min(100,d.metrics[m]));
  base.projected=calculateSnapshot(districts);
  base.delta=round(rawScore(districts).overall-rawScore(dataset.districts).overall);
  return base;
}
