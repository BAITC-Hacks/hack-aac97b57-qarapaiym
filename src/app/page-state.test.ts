import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';

// Execute the real page handlers with retained hook slots. Deferred responses
// deliberately ignore abort, including an independently delayed JSON body.
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0 }));
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useState(initial: unknown) {
    const slot = hooks.cursor++;
    if (!(slot in hooks.slots)) hooks.slots[slot] = initial;
    return [hooks.slots[slot], (value: unknown) => { hooks.slots[slot] = typeof value === 'function' ? value(hooks.slots[slot]) : value; }];
  },
  useRef(initial: unknown) {
    const slot = hooks.cursor++;
    if (!(slot in hooks.slots)) hooks.slots[slot] = { current: initial };
    return hooks.slots[slot];
  },
}));
import Home from './page';
import { ScenarioReview } from '@/components/scenario-review';

type Node = ReactElement<Record<string, unknown>>;
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !('props' in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
function text(value: ReactNode): string {
  if (Array.isArray(value)) return value.map(text).join('');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return value && typeof value === 'object' && 'props' in value ? text((value as Node).props.children as ReactNode) : '';
}
function render() { hooks.cursor = 0; return nodes(Home()); }
function find(predicate: (node: Node) => boolean) { const node = render().find(predicate); if (!node) throw new Error('Control not found'); return node; }
function click(label: string) { const button = find(n => n.type === 'button' && text(n.props.children as ReactNode).trim() === label); (button.props.onClick as () => void)(); }
function target(label: string, value: string) { const select = find(n => n.props['aria-label'] === label); (select.props.onChange as (e: { target: { value: string } }) => void)({ target: { value } }); }
function review() { return render().find(n => n.type === ScenarioReview)?.props; }
function setup() {
  hooks.slots = []; hooks.cursor = 0; vi.useFakeTimers();
  const pending: Array<{resolve: (response: unknown) => void; reject: (error: Error) => void}> = [];
  vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve, reject) => pending.push({resolve, reject}))));
  for (const [category, id, district] of [['social','M7','nura'],['social','M8','nura'],['safety','M10','nura'],['services','M12',''],['greening','M5','saryarka']]) {
    (find(n => n.props.id === `tab-${category}`).props.onClick as () => void)();
    if (district) target(`Район для ${id}`, district);
    const article = find(n => n.type === 'article' && String(n.props['aria-label']).startsWith(`${id} `));
    const button = nodes(article).find(n => n.type === 'button');
    if (!button || button.props.disabled) throw new Error('Invalid setup');
    (button.props.onClick as () => void)();
  }
  return pending;
}
async function flush() { for (let i=0;i<8;i++) await Promise.resolve(); }
const payload = { summary: 'CURRENT', strengths: [], risks: [], tradeoffs: [], recommendations: [] };
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('page request isolation', () => {
  it('clears results on a pending scenario change and ignores late success', async () => {
    const pending = setup(); click('Рассчитать сценарий');
    expect(review()?.loading).toBe(true);
    target('Район в плане для M7','esil'); expect(review()).toBeUndefined();
    pending[0].resolve({ok:true,json:async()=>payload}); await flush();
    expect(review()).toBeUndefined();
    click('Рассчитать сценарий');
    expect((review()?.result as {projected:{overall:number}}).projected.overall).toBe(55.30);
    expect(review()?.analysis).toBeNull();
  });
  it('reset while JSON is pending prevents late analysis and clears budget', async () => {
    const pending = setup(); click('Рассчитать сценарий');
    let finish: (v: unknown) => void = () => {};
    pending[0].resolve({ok:true,json:()=>new Promise(resolve=>{finish=resolve;})}); await flush();
    click('Сбросить решения'); finish(payload); await flush();
    expect(review()).toBeUndefined();
    expect(text(render()[0])).toContain('0 / 5');
    expect(find(n=>n.type==='progress').props.value).toBe(0);
    expect(text(render()[0])).toContain('100');
  });
  it('new request survives older failure and older finally cannot clear loading', async () => {
    const pending = setup(); click('Рассчитать сценарий');
    (review()?.onRetry as () => void)();
    pending[0].reject(new Error('OLD ERROR')); await flush();
    expect(review()?.loading).toBe(true); expect(review()?.aiError).toBe('');
    pending[1].resolve({ok:true,json:async()=>payload}); await flush();
    expect(review()?.analysis).toEqual(payload); expect(review()?.loading).toBe(false);
  });
  it('old success cannot replace a newer successful response', async () => {
    const pending = setup(); click('Рассчитать сценарий'); (review()?.onRetry as () => void)();
    pending[1].resolve({ok:true,json:async()=>payload}); await flush();
    pending[0].resolve({ok:true,json:async()=>({...payload,summary:'OLD'})}); await flush();
    expect(review()?.analysis).toEqual(payload);
  });
  it('provider failure preserves the deterministic result', async () => {
    const pending = setup(); click('Рассчитать сценарий');
    pending[0].resolve({ok:false,json:async()=>({error:'Unavailable'})}); await flush();
    expect((review()?.result as {projected:{overall:number}}).projected.overall).toBe(56.54);
    expect(review()?.aiError).toBe('Unavailable'); expect(review()?.analysis).toBeNull();
  });
});
