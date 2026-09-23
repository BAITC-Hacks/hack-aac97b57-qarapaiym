import { isDeepStrictEqual } from 'node:util';
import { cityDataset } from '@/lib/data';
import { simulateScenario } from '@/lib/simulation';
import { type ScenarioSelection } from '@/types/city';
import { AnalysisError, analyzeScenario, readBoundedJson } from '@/lib/ai/analyze';

export const runtime = 'nodejs';
export const maxDuration = 65;

export async function POST(request: Request) {
  try {
    let submitted: unknown;
    try { submitted = await readBoundedJson(request, 50_000); }
    catch { throw new AnalysisError(400, 'INVALID_REQUEST', 'Provide a valid simulation result (maximum 50 KB).'); }
    if (!submitted || typeof submitted !== 'object' || !('selection' in submitted) || !Array.isArray(submitted.selection) || submitted.selection.length !== 5) {
      throw new AnalysisError(400, 'INVALID_SCENARIO', 'Select exactly five measures with district targets where required.');
    }
    const selection = submitted.selection as ScenarioSelection;
    const canonical = simulateScenario(cityDataset, selection);
    if (!canonical.valid || !isDeepStrictEqual(submitted, canonical)) throw new AnalysisError(400, 'INVALID_SCENARIO', 'Scenario does not match the current dataset. Recalculate your decisions before requesting analysis.');
    return Response.json(await analyzeScenario(canonical), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const known = error instanceof AnalysisError ? error : new AnalysisError(500, 'ANALYSIS_ERROR', 'Analysis failed. Your calculated result is unchanged.');
    return Response.json({ error: known.message, code: known.code }, { status: known.status, headers: { 'Cache-Control': 'no-store' } });
  }
}
