import { describe, expect, it } from "vitest";
import { cityDataset, validateDataset } from "../data";
import { calculateSnapshot, simulateScenario, validateSelection } from ".";
import { METRICS, type CityDataset, type ScenarioSelection } from "../../types/city";
const choice=(initiativeId:string,districtId?:string)=>({initiativeId,...(districtId?{districtId}:{})});
const example:ScenarioSelection=[choice("M7","nura"),choice("M8","nura"),choice("M10","nura"),choice("M12"),choice("M5","saryarka")];
const cheap:ScenarioSelection=[choice("M9","nura"),choice("M11","nura"),choice("M10","nura"),choice("M12"),choice("M4","esil")];
const copy=():CityDataset=>structuredClone(cityDataset);
describe("official simulation",()=>{
 it("matches official baseline using ten indicators and unrounded arithmetic",()=>{
  const s=calculateSnapshot(cityDataset.districts);
  expect(s.overall).toBe(52.56);expect(s.weightedAverage).toBe(56.86);expect(s.worstDistrictScore).toBe(49.18);expect(s.criticalCount).toBe(2);
  expect(s.districts.map(d=>d.score)).toEqual([62.99,57.06,54.65,56.63,49.18]);
 });
 it("matches cost95 example including lag, district target and synergy",()=>{
  const r=simulateScenario(cityDataset,example);
  expect(r.valid).toBe(true);expect(r.budget.spent).toBe(95);expect(r.projected!.overall).toBe(56.54);expect(r.delta).toBe(3.99);expect(r.projected!.criticalCount).toBe(0);
  const n=r.projected!.districts.find(d=>d.districtId==='nura')!;
  expect(n.metrics.S1).toBe(48);expect(n.metrics.S2).toBe(43.75);expect(n.metrics.B1).toBe(67.5);
  expect(r.projected!.districts[0].metrics.S1).toBe(48);
  expect(r.synergies).toEqual([{initiativeIds:['M10','M12'],impacts:[{districtId:'nura',metric:'B1',delta:2}]}]);
 });
 it("accepts cheapest plan at61 and different choices change score",()=>{
  const r=simulateScenario(cityDataset,cheap);expect(r.valid).toBe(true);expect(r.budget.spent).toBe(61);expect(r.projected!.overall).not.toBe(simulateScenario(cityDataset,example).projected!.overall);
 });
 it("is deterministic, immutable, and order invariant",()=>{
  const before=JSON.stringify(cityDataset);expect(simulateScenario(cityDataset,example)).toEqual(simulateScenario(cityDataset,[...example].reverse()));expect(JSON.stringify(cityDataset)).toBe(before);
 });
 it("rejects incomplete, overfull, repeats, unknown and malformed choices without a score",()=>{
  const plans=[example.slice(1),[...example,choice('M2')],[...cheap.slice(0,4),cheap[0]],[...cheap.slice(0,4),choice('bogus')],null as unknown as ScenarioSelection,[null] as unknown as ScenarioSelection];
  for(const plan of plans){const r=simulateScenario(cityDataset,plan);expect(r.valid).toBe(false);expect(r.validationErrors.length).toBeGreaterThan(0);expect(r.projected).toBeNull();expect(r.delta).toBeNull();expect(r.contributions).toEqual([]);}
 });
 it("validates district and city targets",()=>{
  for(const c of [choice('M7'),choice('M7','missing'),choice('M12','nura')]) expect(validateSelection(cityDataset,[c],false).length).toBeGreaterThan(0);
  expect(validateSelection(cityDataset,[choice('M7','nura')],false)).toEqual([]);
 });
 it("limits category to two while allowing official two-social example",()=>{
  expect(validateSelection(cityDataset,[choice('M7','nura'),choice('M8','nura'),choice('M9','nura')],false)).toContain('Не более 2 мер одного направления.');
 });
 it("rejects all three conflicts and permits different district exceptions",()=>{
  expect(validateSelection(cityDataset,[choice('M1','esil'),choice('M3','nura')],false).some(e=>e.includes('Несовместимы'))).toBe(true);
  for(const [a,b] of [['M4','M7'],['M5','M13']]){
   expect(validateSelection(cityDataset,[choice(a,'nura'),choice(b,'nura')],false).some(e=>e.includes('Несовместимы'))).toBe(true);
   expect(validateSelection(cityDataset,[choice(a,'nura'),choice(b,'esil')],false)).toEqual([]);
  }
 });
 it("accepts exact budget and rejects overspend",()=>{
  const d=copy();d.budget=95;expect(simulateScenario(d,example).valid).toBe(true);d.budget=94;const r=simulateScenario(d,example);expect(r.valid).toBe(false);expect(r.budget.exceeded).toBe(true);expect(r.projected).toBeNull();
 });
 it("does not reward unused budget",()=>{const d=copy();d.budget=1000;expect(simulateScenario(d,cheap).projected).toEqual(simulateScenario(cityDataset,cheap).projected);});
 it("applies all fixed synergies without lag scaling",()=>{
  for(const [a,b,m,target] of [['M1','M2','T1','M1'],['M5','M6','E2','M5']] as const){
   const plan=[choice(a,'saryarka'),choice(b),choice('M9','nura'),choice('M11','nura'),choice('M12')];
   const r=simulateScenario(cityDataset,plan);expect(r.valid).toBe(true);expect(r.synergies).toContainEqual({initiativeIds:[a,b],impacts:[{districtId:'saryarka',metric:m,delta:2}]});expect(r.contributions.find(c=>c.initiativeId===target)!.fraction).toBeGreaterThan(0);
  }
 });
 it("clips after effects and treats exactly40 as noncritical",()=>{
  const d=copy();d.initiatives.find(i=>i.id==='M9')!.effects={T1:1000,E1:-1000};const r=simulateScenario(d,cheap);const n=r.projected!.districts.find(d=>d.districtId==='nura')!;expect(n.metrics.T1).toBe(100);expect(n.metrics.E1).toBe(0);
  const uniform={id:'test',name:'test',population:1,metrics:Object.fromEntries(METRICS.map(m=>[m,40])) as CityDataset['districts'][number]['metrics']};expect(calculateSnapshot([uniform]).criticalCount).toBe(0);uniform.metrics.T1=39.999;expect(calculateSnapshot([uniform]).criticalCount).toBe(1);
 });
 it("validates malformed dataset structures",()=>{
  expect(()=>validateDataset(null)).toThrow();for(const change of [(d:CityDataset)=>{d.districts[0].population=.1},(d:CityDataset)=>{d.initiatives[0].lag=9},(d:CityDataset)=>{d.districts[0].metrics.T1=101}]){const d=copy();change(d);expect(()=>validateDataset(d)).toThrow();}
 });
});
