import { isDeepStrictEqual } from 'node:util';
import { cityDataset } from '@/lib/data';
import { simulateScenario } from '@/lib/simulation';
import { CATEGORIES, type ScenarioSelection } from '@/types/city';
import { AnalysisError, analyzeScenario, readBoundedJson } from '@/lib/ai/analyze';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    let submitted: unknown;
    try { submitted = await readBoundedJson(request, 50_000); }
    catch { throw new AnalysisError(400, 'INVALID_REQUEST', 'Provide a valid simulation result (maximum 50 KB).'); }
    if (!submitted || typeof submitted !== 'object' || !('selectedInitiatives' in submitted) || !Array.isArray(submitted.selectedInitiatives) || submitted.selectedInitiatives.length !== CATEGORIES.length) {
      throw new AnalysisError(400, 'INVALID_SCENARIO', 'Select exactly one initiative in each of the five categories.');
    }
    const selection = {} as ScenarioSelection;
    for (const item of submitted.selectedInitiatives) {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string') throw new AnalysisError(400, 'INVALID_SCENARIO', 'Unknown initiative.');
      const initiative = cityDataset.initiatives.find(candidate => candidate.id === item.id);
      if (!initiative || selection[initiative.category]) throw new AnalysisError(400, 'INVALID_SCENARIO', 'Unknown or duplicate initiative category.');
      selection[initiative.category] = initiative.id;
    }
    const canonical = simulateScenario(cityDataset, selection);
    if (!canonical.valid || !isDeepStrictEqual(submitted, canonical)) throw new AnalysisError(400, 'INVALID_SCENARIO', 'Scenario does not match the current dataset. Recalculate your decisions before requesting analysis.');
    return Response.json(await analyzeScenario(canonical), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const known = error instanceof AnalysisError ? error : new AnalysisError(500, 'ANALYSIS_ERROR', 'Analysis failed. Your calculated result is unchanged.');
    return Response.json({ error: known.message, code: known.code }, { status: known.status, headers: { 'Cache-Control': 'no-store' } });
  }
}
