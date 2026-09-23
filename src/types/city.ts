export const CATEGORIES = ["transport", "greening", "social", "safety", "services"] as const;
export type Category = (typeof CATEGORIES)[number];
export interface District { id: string; name: string; population?: number; metrics: Record<Category, number>; }
export interface Impact { districtId: string; metric: Category; delta: number; }
export interface BudgetItem { id: string; label: string; amount: number; description?: string; }
export interface Initiative { id: string; category: Category; name: string; description?: string; cost: number; impacts: Impact[]; budgetBreakdown?: BudgetItem[]; budgetBreakdownSource?: "provided-data" | "simulation-assumption"; affectedDistricts?: string[]; implementationNotes?: string[]; implementationRisks?: string[]; }
export interface CityDataset { budget: number; districts: District[]; initiatives: Initiative[]; }
export type ScenarioSelection = Record<Category, string>;
export interface ScoreSnapshot { overall: number; byCategory: Record<Category, number>; districts: Array<{ districtId: string; metrics: Record<Category, number> }>; }
export interface SimulationResult { valid: boolean; validationErrors: string[]; budget: { total: number; spent: number; remaining: number; exceeded: boolean }; selectedInitiatives: Initiative[]; baseline: ScoreSnapshot; projected: ScoreSnapshot; delta: number; }
export interface DistrictImprovement { districtId: string; delta: number; }
export interface ScenarioDiagnostics {
  budgetUtilizationPct: number;
  remainingReservePct: number;
  categorySpending: Record<Category, number>;
  categorySpendingPct: Record<Category, number>;
  aqolGain: number;
  aqolGainPer100M: number | null;
  strongestImprovement: { category: Category; delta: number };
  weakestFinalCategory: { category: Category; score: number };
  largestBudgetCategory: { category: Category; amount: number; percentage: number };
  districtBalance: { largestImprovement: DistrictImprovement; smallestImprovement: DistrictImprovement; improvementSpread: number };
}
export interface ScenarioAlternative {
  id: string;
  description: string;
  changedCategories: Category[];
  originalSelection: ScenarioSelection;
  alternativeSelection: ScenarioSelection;
  originalResult: SimulationResult;
  alternativeResult: SimulationResult;
  budgetDifference: number;
  aqolDifference: number;
  categoryDifferences: Record<Category, number>;
}
export interface AIAnalysis { summary: string; strengths: string[]; risks: string[]; tradeoffs: string[]; recommendations: Array<{ title: string; rationale: string; category?: Category }>; }
