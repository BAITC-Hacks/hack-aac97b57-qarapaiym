export const CATEGORIES = ["transport", "greening", "social", "safety", "services"] as const;
export type Category = (typeof CATEGORIES)[number];
export interface District { id: string; name: string; population?: number; metrics: Record<Category, number>; }
export interface Impact { districtId: string; metric: Category; delta: number; }
export interface Initiative { id: string; category: Category; name: string; description?: string; cost: number; impacts: Impact[]; }
export interface CityDataset { budget: number; districts: District[]; initiatives: Initiative[]; }
export type ScenarioSelection = Record<Category, string>;
export interface ScoreSnapshot { overall: number; byCategory: Record<Category, number>; districts: Array<{ districtId: string; metrics: Record<Category, number> }>; }
export interface SimulationResult { valid: boolean; validationErrors: string[]; budget: { total: number; spent: number; remaining: number; exceeded: boolean }; selectedInitiatives: Initiative[]; baseline: ScoreSnapshot; projected: ScoreSnapshot; delta: number; }
export interface AIAnalysis { summary: string; strengths: string[]; risks: string[]; tradeoffs: string[]; recommendations: Array<{ title: string; rationale: string; category?: Category }>; }
