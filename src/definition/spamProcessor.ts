import { UserSpamRecord } from './spamlevel';

export interface AnalysisResult {
	flagged: boolean;
	levelChanged: boolean;
	trigger: string;
	record: UserSpamRecord | null;
}
export interface SpamConfig {
	monitoringWindowMs: number;
	slidingWindowMs: number;
	crossChannelThreshold: number;
	rateShortBurst: number;
	rateSustained: number;
}
