import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeScenario, validateAnalysis } from './analyze';
import { POST } from '@/app/api/analyze/route';
import { cityDataset } from '@/lib/data';
import { simulateScenario } from '@/lib/simulation';
import { CATEGORIES, type ScenarioSelection } from '@/types/city';
const analysis = { summary: 'Synthetic scenario improves supplied metrics.', strengths: ['Transport improves.'], risks: ['Weak metrics remain.'], tradeoffs: ['Spent funds cannot be reused.'], recommendations: [{ title: 'Review transport', rationale: 'Compare supplied values.', category: 'transport' }] };
const selection = Object.fromEntries(CATEGORIES.map(category => [category, [...cityDataset.initiatives].filter(item => item.category === category).sort((a,b) => a.cost-b.cost)[0].id])) as ScenarioSelection;
const result = simulateScenario(cityDataset, selection);
function provider(value: unknown = analysis) { return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] }); }
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
    expect(response.status).toBe(200); expect(await response.json()).toEqual(analysis);
    const body = JSON.parse(mock.mock.calls[0][1].body);
    expect(body.text.format.strict).toBe(true); expect(body.store).toBe(false);
    expect(JSON.parse(body.input).scenario).toEqual(result);
  });
  it('rejects tampering, missing choices, unknown IDs and bad bodies before provider call', async () => {
    const mock = vi.fn(); vi.stubGlobal('fetch', mock);
    const unknown = structuredClone(result); unknown.selectedInitiatives[0].id = 'unknown';
    for (const value of [{...result,delta:result.delta+1},{...result,selectedInitiatives:[]},unknown,null]) expect((await POST(request(value))).status).toBe(400);
    for (const body of ['{', 'x'.repeat(50_001)]) expect((await POST(new Request('http://localhost/api/analyze',{method:'POST',body}))).status).toBe(400);
    expect(mock).not.toHaveBeenCalled();
  });
  it('reports missing key without mutating simulation', async () => {
    vi.stubEnv('OPENAI_API_KEY',''); const before = JSON.stringify(result);
    const response = await POST(request(result)); expect(response.status).toBe(503);
    expect((await response.json()).code).toBe('AI_NOT_CONFIGURED'); expect(JSON.stringify(result)).toBe(before);
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
    await vi.advanceTimersByTimeAsync(25_000); await check;
  });
});
