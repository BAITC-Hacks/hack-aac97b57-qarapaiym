import { describe, expect, it } from "vitest";
import { cityDataset, validateDataset } from "../data";
import { calculateSnapshot, simulateScenario } from ".";
import { CATEGORIES, type CityDataset, type ScenarioSelection } from "../../types/city";
const a: ScenarioSelection = { transport: "transport-bus", greening: "greening-trees", social: "social-clinics", safety: "safety-lighting", services: "services-water" };
const b: ScenarioSelection = { transport: "transport-junctions", greening: "greening-parks", social: "social-outreach", safety: "safety-community", services: "services-waste" };
const copy = (): CityDataset => structuredClone(cityDataset);
describe("deterministic simulation", () => {
  it("starts with a fixed, non-mutated baseline and repeats exactly", () => {
    const before = JSON.stringify(cityDataset);
    expect(simulateScenario(cityDataset, a)).toEqual(simulateScenario(cityDataset, a));
    expect(JSON.stringify(cityDataset)).toBe(before);
  });
  it("meaningful decisions change the metrics and AQoL", () => {
    const first = simulateScenario(cityDataset, a), second = simulateScenario(cityDataset, b);
    expect(first.valid).toBe(true); expect(second.valid).toBe(true);
    expect(first.projected).not.toEqual(second.projected);
    expect(first.projected.overall).not.toBe(second.projected.overall);
  });
  it("calculates exact budget math", () => {
    expect(simulateScenario(cityDataset, a).budget).toEqual({total:1000,spent:820,remaining:180,exceeded:false});
    const d=copy(); d.budget=0.5;
    for(const i of d.initiatives) i.cost=0.1;
    expect(simulateScenario(d,a).budget).toEqual({total:0.5,spent:0.5,remaining:0,exceeded:false});
  });
  it("rejects overspend without applying any impacts", () => {
    const result = simulateScenario(cityDataset, { transport:"transport-rail",greening:"greening-parks",social:"social-schools",safety:"safety-response",services:"services-water" });
    expect(result.valid).toBe(false); expect(result.budget.spent).toBe(1330);
    expect(result.projected).toEqual(result.baseline); expect(result.delta).toBe(0);
  });
  it.each(CATEGORIES)("requires the %s decision", category => {
    const input = {...a}; delete (input as Partial<ScenarioSelection>)[category];
    expect(simulateScenario(cityDataset,input).valid).toBe(false);
  });
  it("rejects unknown IDs, mismatched categories, extra categories, and null input", () => {
    expect(simulateScenario(cityDataset,{...a,social:"bogus"}).valid).toBe(false);
    expect(simulateScenario(cityDataset,{...a,safety:a.transport}).valid).toBe(false);
    expect(simulateScenario(cityDataset,{...a,extra:"bogus"} as ScenarioSelection).valid).toBe(false);
    expect(simulateScenario(cityDataset,null as unknown as ScenarioSelection).valid).toBe(false);
  });
  it("clamps accumulated impacts, at both limits", () => {
    const d=copy(); const i=d.initiatives.find(i=>i.id===a.transport)!;
    i.impacts=[{districtId:d.districts[0].id,metric:"transport",delta:1000},{districtId:d.districts[0].id,metric:"greening",delta:-1000}];
    const r=simulateScenario(d,a);
    expect(r.projected.districts[0].metrics.transport).toBe(100);
    expect(r.projected.districts[0].metrics.greening).toBe(0);
  });
  it("weights populated districts and uses equal weights if any population is missing", () => {
    const metrics=(v:number)=>Object.fromEntries(CATEGORIES.map(c=>[c,v])) as CityDataset["districts"][number]["metrics"];
    const districts=[{id:"a",name:"A",population:1,metrics:metrics(20)},{id:"b",name:"B",population:3,metrics:metrics(80)}];
    expect(calculateSnapshot(districts).overall).toBe(65);
    expect(calculateSnapshot([{...districts[0],population:undefined},districts[1]]).overall).toBe(50);
    expect(calculateSnapshot(districts.map(d=>({...d,population:0}))).overall).toBe(50);
  });
  it("rounds score once from unrounded category values", () => {
    const r=simulateScenario(cityDataset,a);
    expect(r.baseline.overall).toBe(53.2);
    expect(r.projected.overall).toBeGreaterThan(r.baseline.overall);
  });
  it("rejects malformed dataset inputs before simulation", () => {
    expect(()=>validateDataset(null)).toThrow("Invalid city dataset");
    const cases: ((d:CityDataset)=>void)[]=[d=>{d.budget=NaN},d=>{d.districts=[]},d=>{d.districts[0].population=-1},d=>{d.districts[0].metrics.social=101},d=>{d.districts[1].id=d.districts[0].id},d=>{d.initiatives[0].cost=-1},d=>{d.initiatives[0].impacts[0].districtId="unknown"},d=>{d.initiatives[0].impacts[0].delta=Infinity},d=>{d.initiatives[1].id=d.initiatives[0].id},d=>{d.initiatives=d.initiatives.filter(i=>i.category!=="social")}];
    for(const mutate of cases){const d=copy();mutate(d);expect(()=>simulateScenario(d,a)).toThrow("Invalid city dataset");}
  });
});
