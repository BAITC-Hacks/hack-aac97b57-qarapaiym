export const CATEGORIES = ["transport", "greening", "social", "safety", "services"] as const;
export type Category = (typeof CATEGORIES)[number];
export const METRICS = ["T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2"] as const;
export const METRICS10 = METRICS;
export type Metric = (typeof METRICS)[number];
export const METRIC_WEIGHTS: Record<Metric, number> = {T1:.10,T2:.10,E1:.09,E2:.11,S1:.11,S2:.11,B1:.09,B2:.09,C1:.10,C2:.10};
export const METRIC_LABELS: Record<Metric, string> = {T1:"Разгрузка дорог",T2:"Общественный транспорт",E1:"Озеленение",E2:"Качество воздуха",S1:"Школы и детсады",S2:"Первичная медицина",B1:"Безопасность улиц",B2:"Безопасность движения",C1:"Надёжность ЖКХ",C2:"Обращения жителей"};
export const METRIC_CATEGORY: Record<Metric, Category> = {T1:"transport",T2:"transport",E1:"greening",E2:"greening",S1:"social",S2:"social",B1:"safety",B2:"safety",C1:"services",C2:"services"};
export interface District { id: string; name: string; population: number; metrics: Record<Metric, number>; }
export interface Impact { districtId: string; metric: Metric; delta: number; }
export interface BudgetItem { id: string; label: string; amount: number; description?: string; }
export interface Initiative { budgetBreakdown?: BudgetItem[]; budgetBreakdownSource?: "provided-data" | "simulation-assumption"; affectedDistricts?: string[]; implementationNotes?: string[]; implementationRisks?: string[]; id: string; category: Category; name: string; description?: string; cost: number; scope: "district" | "city"; lag: number; effects: Partial<Record<Metric, number>>; }
export interface CityDataset { budget: number; horizon: number; districts: District[]; initiatives: Initiative[]; }
export type ScenarioSelection = Array<{initiativeId: string; districtId?: string}>;
export interface ScoreSnapshot { overall: number; byCategory: Record<Category, number>; districts: Array<{ districtId: string; metrics: Record<Metric, number>; score: number }>; weightedAverage: number; worstDistrictScore: number; criticalCount: number; }
export interface Contribution { initiativeId: string; districtId?: string; fraction: number; impacts: Impact[]; }
export interface SynergyContribution { initiativeIds: string[]; impacts: Impact[]; }
export interface SimulationResult { valid: boolean; validationErrors: string[]; budget: { total: number; spent: number; remaining: number; exceeded: boolean }; selection: ScenarioSelection; selectedInitiatives: Array<Initiative & {districtId?: string}>; baseline: ScoreSnapshot; projected: ScoreSnapshot | null; delta: number | null; contributions: Contribution[]; synergies: SynergyContribution[]; }
export interface AIAnalysis { summary: string; strengths: string[]; risks: string[]; tradeoffs: string[]; recommendations: Array<{ title: string; rationale: string; category?: Category }>; }

export interface DistrictImprovement { districtId: string; delta: number; }
export interface ScenarioDiagnostics {
  budgetUtilizationPct: number;
  remainingReservePct: number;
  categorySpending: Record<Category, number>;
  categorySpendingPct: Record<Category, number>;
  aqolGain: number;
  aqolGainPer100Units: number | null;
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
