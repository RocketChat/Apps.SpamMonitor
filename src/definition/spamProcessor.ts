import { UserSpamRecord } from './spamlevel';

export interface AnalysisResult {
	flagged: boolean;
	levelChanged: boolean;
	trigger: string;
	record: UserSpamRecord | null;
}
