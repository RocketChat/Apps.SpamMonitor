import {
	COOLDOWN_DURATIONS,
	SPAMMING_LEVEL_LABELS,
	SpammingLevel,
} from './spamlevel';
export type LevelActionType = 'ping' | 'timeout' | 'restrict';
export interface LevelConfig {
	level: SpammingLevel;
	action: LevelActionType;
	timeoutSeconds?: number;
	message: string;
}

export const CONFIGURABLE_LEVELS: SpammingLevel[] = [
	SpammingLevel.Monitored,
	SpammingLevel.Restricted,
	SpammingLevel.Suspended,
	SpammingLevel.AdminReview,
];

export const TERMINAL_LEVEL = SpammingLevel.AdminReview;

export const LEVEL_ACTION_LABELS: Record<LevelActionType, string> = {
	ping: 'Notify only (no restriction)',
	timeout: 'Timeout (temporary cooldown)',
	restrict: 'Restrict (block all messages)',
};

export const DEFAULT_LEVEL_CONFIGS: Record<SpammingLevel, LevelConfig> = {
	[SpammingLevel.Clean]: {
		level: SpammingLevel.Clean,
		action: 'ping',
		message: '',
	},
	[SpammingLevel.Monitored]: {
		level: SpammingLevel.Monitored,
		action: 'ping',
		timeoutSeconds:
			Math.floor(COOLDOWN_DURATIONS[SpammingLevel.Monitored] / 1000) ||
			undefined,
		message: '',
	},
	[SpammingLevel.Restricted]: {
		level: SpammingLevel.Restricted,
		action: 'timeout',
		timeoutSeconds: Math.floor(
			COOLDOWN_DURATIONS[SpammingLevel.Restricted] / 1000,
		),
		message: '',
	},
	[SpammingLevel.Suspended]: {
		level: SpammingLevel.Suspended,
		action: 'timeout',
		timeoutSeconds: Math.floor(
			COOLDOWN_DURATIONS[SpammingLevel.Suspended] / 1000,
		),
		message: '',
	},
	[SpammingLevel.AdminReview]: {
		level: SpammingLevel.AdminReview,
		action: 'restrict',
		message: '',
	},
};

export function actionOptionsFor(level: SpammingLevel): LevelActionType[] {
	return level === TERMINAL_LEVEL
		? ['ping', 'timeout', 'restrict']
		: ['ping', 'timeout'];
}

export function levelLabel(level: SpammingLevel): string {
	return SPAMMING_LEVEL_LABELS[level] ?? `Level ${level}`;
}
