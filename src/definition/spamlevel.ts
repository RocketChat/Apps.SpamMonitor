export enum SpammingLevel {
	Clean = 0,
	Monitored = 1,
	Restricted = 2,
	Suspended = 3,
	AdminReview = 4,
}

export const SPAMMING_LEVEL_LABELS: Record<SpammingLevel, string> = {
	[SpammingLevel.Clean]: 'Clean',
	[SpammingLevel.Monitored]: 'Monitored',
	[SpammingLevel.Restricted]: 'Restricted',
	[SpammingLevel.Suspended]: 'Suspended',
	[SpammingLevel.AdminReview]: 'Pending Admin Review',
};

export const ESCALATION_THRESHOLDS: Record<SpammingLevel, number> = {
	[SpammingLevel.Clean]: 3,
	[SpammingLevel.Monitored]: 5,
	[SpammingLevel.Restricted]: 4,
	[SpammingLevel.Suspended]: 2,
	[SpammingLevel.AdminReview]: Infinity,
};

export const NEXT_LEVEL: Partial<Record<SpammingLevel, SpammingLevel>> = {
	[SpammingLevel.Clean]: SpammingLevel.Monitored,
	[SpammingLevel.Monitored]: SpammingLevel.Restricted,
	[SpammingLevel.Restricted]: SpammingLevel.Suspended,
	[SpammingLevel.Suspended]: SpammingLevel.AdminReview,
};

export const PREV_LEVEL: Partial<Record<SpammingLevel, SpammingLevel>> = {
	[SpammingLevel.Monitored]: SpammingLevel.Clean,
	[SpammingLevel.Restricted]: SpammingLevel.Monitored,
	[SpammingLevel.Suspended]: SpammingLevel.Restricted,
	[SpammingLevel.AdminReview]: SpammingLevel.Suspended,
};

export const COOLDOWN_DURATIONS: Record<SpammingLevel, number> = {
	[SpammingLevel.Clean]: 0,
	[SpammingLevel.Monitored]: 0,
	[SpammingLevel.Restricted]: 2 * 60 * 1000,
	[SpammingLevel.Suspended]: 12 * 60 * 1000,
	[SpammingLevel.AdminReview]: 0,
};

export interface UserSpamRecord {
	userId: string;
	username: string;
	spammingLevel: SpammingLevel;
	cooldownUntil: number;
	lastEscalation: number;
	totalFlags: number;
	flagsAtLevel: number;
	vouched?: boolean;
	vouchedBy?: string;
}
