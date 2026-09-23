import { buildInsightCatalog, renderInsights } from './insights';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeScenario, validateAnalysis } from './analyze';
import { POST } from '@/app/api/analyze/route';
import { cityDataset } from '@/lib/data';
import { simulateScenario } from '@/lib/simulation';
import { CATEGORIES, type ScenarioSelection } from '@/types/city';
const analysis = { summary: 'Synthetic scenario improves supplied metrics.', strengths: ['Transport improves.'], risks: ['Weak metrics remain.'], tradeoffs: ['Spent funds cannot be reused.'], recommendations: [{ title: 'Review transport', rationale: 'Compare supplied values.', category: 'transport' }] };
const selection: ScenarioSelection = [{initiativeId:'M7',districtId:'nura'},{initiativeId:'M8',districtId:'nura'},{initiativeId:'M10',districtId:'nura'},{initiativeId:'M12'},{initiativeId:'M5',districtId:'saryarka'}];
const result = simulateScenario(cityDataset, selection);
const projected = result.projected!;
const ranked = [...CATEGORIES].sort((a,b) => projected.byCategory[b] - projected.byCategory[a]);
const gains = [...CATEGORIES].sort((a,b) => (projected.byCategory[b]-result.baseline.byCategory[b]) - (projected.byCategory[a]-result.baseline.byCategory[a]));
const evidence = { budgetSpent: result.budget.spent, budgetRemaining: result.budget.remaining, aqol: projected.overall, highestCategory: ranked[0], lowestCategory: ranked[4], largestGainCategory: gains[0], initiativeIds: result.selectedInitiatives.map(i=>i.id) };
const catalog = buildInsightCatalog(result);
const chosen = { summary: catalog.summary[0].id, strengths: [catalog.strengths[0].id], risks: [catalog.risks[0].id], tradeoffs: [catalog.tradeoffs[0].id], recommendations: [catalog.recommendations[0].id] };
const safeAnalysis = renderInsights(chosen, catalog);
function provider(value: unknown = {...chosen, evidence}) { return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] }); }
function request(value: unknown) { return new Request('http://localhost/api/analyze', { method: 'POST', body: JSON.stringify(value) }); }
describe('AI boundary', () => {
  beforeEach(() => vi.stubEnv('OPENAI_API_KEY', 'test-key-not-real'));
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });
  it('validates output structure and content', () => {
    expect(validateAnalysis(analysis)).toEqual(analysis);
    for (const value of [null, {}, {...analysis, summary:' '}, {...analysis, strengths:[]}, {...analysis, extra:1}, {...analysis, recommendations:[{title:'a',rationale:'b',category:'unknown'}]}]) expect(() => validateAnalysis(value)).toThrow();
  });
  it('sends canonical facts using strict schema and returns analysis', async () => {
    expect(result.valid).toBe(true);
    const mock = vi.fn().mockResolvedValue(provider()); vi.stubGlobal('fetch', mock);
    const response = await POST(request(result));
    expect(response.status).toBe(200); expect(await response.json()).toEqual(safeAnalysis);
    const body = JSON.parse(mock.mock.calls[0][1].body);
    expect(body.text.format.strict).toBe(true); expect(body.store).toBe(false);
    expect(JSON.parse(body.input).scenario).toEqual(result);
    expect(JSON.parse(body.input).facts.formulaComponents.after.criticalCount).toBe(0);
    expect(JSON.parse(body.input).facts.contributions).toEqual(result.contributions);
    expect(JSON.parse(body.input).facts.synergies).toEqual(result.synergies);
    expect(JSON.parse(body.input).suppliedCatalog).toEqual(cityDataset.initiatives);
    expect(projected.overall).toBe(56.54);
    expect(JSON.parse(body.input).facts.highestCategories).toContain(ranked[0]);
    expect(body.text.format.schema.properties.evidence.properties.aqol.enum).toEqual([projected.overall]);
  });
  it('rejects incorrect scores, rankings and initiative evidence even with valid prose', async () => {
    for (const bad of [undefined, {...evidence, aqol:99.9}, {...evidence, budgetSpent:1}, {...evidence, highestCategory:ranked[4]}, {...evidence, initiativeIds:Array(5).fill(evidence.initiativeIds[0])}]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(provider({...chosen, evidence:bad})));
      const response = await POST(request(result));
      expect(response.status).toBe(502);
      expect((await response.json()).code).toBe('INVALID_AI_OUTPUT');
    }
  });
  it.each([
    ['false number', {...chosen, summary: 'Score is 99.99'}],
    ['false category count', {...chosen, strengths: ['All 5 categories improved']}],
    ['unsupported metric effect', {...chosen, strengths: ['M7 improved air quality']}],
    ['unknown district', {...chosen, risks: ['Koktal is weakest']}],
    ['unknown initiative', {...chosen, recommendations: ['M99']}],
    ['sixth initiative', {...chosen, recommendations: ['Add M2 as a sixth measure']}],
    ['invented statistics', {...chosen, summary: 'Astana population is 9000000'}],
    ['invented support', {...chosen, strengths: ['Public support is 80 percent']}],
    ['extra prose with correct IDs', {...chosen, prose: 'False facts'}],
    ['unknown recommendation properties', {...chosen, recommendations: [{id:chosen.recommendations[0], rationale:'False'}]}],
    ['unsupported unchanged category', {...chosen, strengths:['gain-transport']}],
    ['empty output', {}],
    ['duplicate insights', {...chosen, strengths:[chosen.strengths[0],chosen.strengths[0]]}],
  ])('rejects correct evidence plus %s', async (_name, unsafe) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(provider({...unsafe, evidence})));
    const before = JSON.stringify(result);
    const response = await POST(request(result));
    expect(response.status).toBe(502);
    expect((await response.json()).code).toBe('INVALID_AI_OUTPUT');
    expect(JSON.stringify(result)).toBe(before);
  });
  it('renders only catalog text and all recommended alternatives obey official rules', () => {
    expect(safeAnalysis.summary).toBe(catalog.summary[0].text);
    expect(catalog.strengths.map(i=>i.id)).not.toContain('gain-transport');
    expect(catalog.tradeoffs.map(i=>i.id)).toContain('unchanged-transport');
    expect(catalog.risks.map(i=>i.id)).not.toContain('critical-remain');
    expect(catalog.recommendations.length).toBeGreaterThan(0);
    expect(safeAnalysis.recommendations[0].rationale).toContain('вместо');
  });
  it('rejects tampering, missing choices, unknown IDs and bad bodies before provider call', async () => {
    const mock = vi.fn(); vi.stubGlobal('fetch', mock);
    const unknown = structuredClone(result); unknown.selectedInitiatives[0].id = 'unknown';
    for (const value of [{...result,delta:result.delta!+1},{...result,selectedInitiatives:[]},unknown,null]) expect((await POST(request(value))).status).toBe(400);
    for (const body of ['{', 'x'.repeat(50_001)]) expect((await POST(new Request('http://localhost/api/analyze',{method:'POST',body}))).status).toBe(400);
    expect(mock).not.toHaveBeenCalled();
  });
  it('rejects forged targets, duplicate measures, and overbudget results before the provider', async () => {
    const mock = vi.fn(); vi.stubGlobal('fetch', mock);
    const forgedTarget = structuredClone(result);
    forgedTarget.selection.find(item => item.initiativeId === 'M7')!.districtId = 'esil';
    const duplicate = simulateScenario(cityDataset, [...selection.slice(0, 4), selection[0]]);
    const over = simulateScenario(cityDataset, [{initiativeId:'M1',districtId:'nura'},{initiativeId:'M2'},{initiativeId:'M5',districtId:'saryarka'},{initiativeId:'M6'},{initiativeId:'M14'}]);
    expect(over.budget.spent).toBe(101); expect(over.projected).toBeNull();
    for (const value of [forgedTarget, duplicate, over]) expect((await POST(request(value))).status).toBe(400);
    await expect(analyzeScenario(over)).rejects.toMatchObject({status:400,code:'INVALID_SCENARIO'});
    expect(mock).not.toHaveBeenCalled();
  });
  it('reports missing key without mutating simulation', async () => {
    vi.stubEnv('OPENAI_API_KEY',''); const before = JSON.stringify(result);
    const response = await POST(request(result)); expect(response.status).toBe(503);
    expect((await response.json()).code).toBe('AI_NOT_CONFIGURED'); expect(JSON.stringify(result)).toBe(before);
  });
  it('reports rejected credentials without exposing provider details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('secret-provider-details', {status: 401})));
    const response = await POST(request(result));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.code).toBe('AI_CREDENTIALS_INVALID');
    expect(JSON.stringify(body)).not.toContain('secret-provider-details');
  });
  it('handles failed, refused, incomplete, oversized and malformed provider outputs', async () => {
    for (const response of [new Response('secret-provider-details',{status:429}),provider({}),Response.json({status:'incomplete',output:[]}),Response.json({status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]}),new Response('not JSON'),new Response('x'.repeat(100_001))]) {
      vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response)); const output = await POST(request(result));
      expect(output.status).toBe(502); expect(await output.text()).not.toContain('secret-provider-details');
    }
  });
  it('aborts slow requests', async () => {
    vi.useFakeTimers(); vi.stubGlobal('fetch',vi.fn((_url, options) => new Promise((_resolve,reject) => { options.signal.addEventListener('abort',() => reject(new Error('aborted'))); })));
    const check = expect(analyzeScenario(result)).rejects.toMatchObject({status:504,code:'AI_TIMEOUT'});
    await vi.advanceTimersByTimeAsync(60_000); await check;
  });
});
