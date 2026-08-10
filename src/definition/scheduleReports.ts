import { CadencePreset } from '../enums/modals/scheduleReports';
import { LoggedUserAction } from '../enums/scheduleReports';
import { SpammingLevel } from './spamlevel';

export interface ScheduleDraft {
	adminUserId: string;
	preset: CadencePreset;
	days: number[];
	reportTime: string;
	utcOffsetMinutes: number;
}

export interface ScheduleRecord extends ScheduleDraft {
	cronExpression: string;
	lastReportSentAt: number;
	updatedAt: number;
}
export interface FlagLogEntry {
	userId: string;
	username: string;
	timestamp: number;
	trigger: string;
	action: string;
	roomName: string;
}

export interface DailyFlagSummary {
	userId: string;
	username: string;
	date: string;
	flagCount: number;
	triggers: Record<string, number>;
	actions: Record<string, number>;
	rooms: string[];
}

export interface AdminActionLogEntry {
	userId: string;
	username: string;
	action: LoggedUserAction;
	adminUsername: string;
	timestamp: number;
	previousLevel?: SpammingLevel;
	newLevel?: SpammingLevel;
}
