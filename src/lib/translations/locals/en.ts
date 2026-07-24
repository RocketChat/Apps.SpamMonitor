import { MAX_ROOMS_PER_SUMMARY } from '../../../constants/scheduleLogStore';
import { ConfirmMeta } from '../../../definition/confirmationModal';
import { levelLabel } from '../../../definition/levelConfig';
import {
	SPAMMING_LEVEL_LABELS,
	SpammingLevel,
} from '../../../definition/spamlevel';
import { ManageUserActionId } from '../../../enums/modals/manageUsers';

export type NotifyFn = (username: string, duration: string) => string;

export const Messages: Record<SpammingLevel, NotifyFn | null> = {
	[SpammingLevel.Clean]: null,
	[SpammingLevel.Monitored]: (username) =>
		`Hey @${username}, we noticed some unusual activity from your account.\n\nYour messages are being monitored. Please slow down and avoid sending repeated or identical messages across multiple channels.\n\nIf this continues, further restrictions may be applied.`,
	[SpammingLevel.Restricted]: (username, duration) =>
		`@${username}, your account has been placed on a cooldown for ${duration}.\n\nYou will not be able to send messages during this period. This was triggered by repeated flagged behaviour.\n\nThe restriction will lift automatically once the cooldown expires.`,
	[SpammingLevel.Suspended]: (username, duration) =>
		`@${username}, your account has been suspended from sending messages for ${duration}.\n\nThis is due to continued spam-like behaviour after prior warnings. Your messages will be blocked until the suspension period ends.\n\nIf you believe this is a mistake, please contact an administrator.`,
	[SpammingLevel.AdminReview]: (username) =>
		`@${username}, your account has been flagged for admin review.\n\nYou are currently restricted from sending messages until an administrator reviews your account and lifts the restriction.\n\nPlease reach out to an admin directly if you need immediate assistance.`,
};

export const AdminChannelMessages = {
	welcome: () =>
		`**SpamMonitor Admin Panel**\n\n` +
		`This is the dedicated admin channel for the SpamMonitor app. ` +
		`All slash commands must be run from this channel.\n\n` +
		`---\n\n` +
		`**Spam Levels and Default Actions** \n` +
		`• \`Clean\` — No issues detected\n` +
		`• \`Monitored\` — Unusual activity flagged; user is being watched\n` +
		`• \`Restricted\` — User placed on a timed cooldown\n` +
		`• \`Suspended\` — User suspended for a longer period\n` +
		`• \`AdminReview\` — Fully blocked; awaiting manual admin action\n\n` +
		`---\n\n` +
		`**Available Commands** (\`/spammonitor <subcommand>\`)\n` +
		`• \`list\` — View all currently flagged users\n` +
		`• \`manage <username>\` — Open admin controls for a flagged user\n` +
		`• \`level\` — Configure action and notification per spam level\n\n` +
		`• \`schedule\` — Configure schedule for scheduled spam reports\n\n` +
		`• \`help\` — Show this help message\n\n` +
		`---\n\n` +
		`**Configure Settings**\n` +
		`_Configure thresholds and windows in Marketplace → Private Apps → Apps.SpamMonitor._`,

	installDm: (channelName: string) =>
		`**SpamMonitor installed!**\n\n` +
		`An admin panel channel \`#${channelName}\` has been created.\n` +
		`All slash commands are scoped to that channel only.\n` +
		`Configure settings in *Marketplace → Private Apps → Apps.SpamMonitor*.`,

	uninstallDm: (channelName: string) =>
		`**SpamMonitor uninstalled.**\n\n` +
		`The \`#${channelName}\` channel has been removed.`,
};
export const AdminActionMessages = {
	vouch: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} vouched successfully by @${adminUsername} — now fully exempt from spam monitoring.`,
	resetCooldown: (targetUsername: string, adminUsername: string) =>
		`Cooldown for @${targetUsername} reset successfully by @${adminUsername}.`,
	resetLevelDown: (
		targetUsername: string,
		adminUsername: string,
		beforeLabel: string,
		afterLabel: string,
	) =>
		`Spam level for @${targetUsername} reduced from *${beforeLabel}* → *${afterLabel}* successfully by @${adminUsername}.`,
	resetLevelClean: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} reset to *Clean* successfully by @${adminUsername}.`,
};

export const ConfirmActionMeta: Partial<
	Record<ManageUserActionId, ConfirmMeta>
> = {
	[ManageUserActionId.VOUCH]: {
		title: 'Vouch for User',
		description:
			'This will mark the user as *trusted* and fully exempt them from spam monitoring.',
		confirmLabel: 'Confirm Vouch',
	},
	[ManageUserActionId.RESET_COOLDOWN]: {
		title: 'Reset Cooldown',
		description:
			'This will immediately lift the active cooldown/timeout for this user.',
		confirmLabel: 'Reset Cooldown',
	},
	[ManageUserActionId.RESET_LEVEL_DOWN]: {
		title: 'Level Down',
		description: 'This will reduce the spam level by one step.',
		confirmLabel: 'Level Down',
	},
	[ManageUserActionId.RESET_LEVEL_CLEAN]: {
		title: 'Reset to Clean',
		description:
			'This will immediately reset the spam level to *Clean*, removing all restrictions.',
		confirmLabel: 'Reset to Clean',
		danger: true,
	},
};

export const LevelConfigStrings = {
	headerText:
		'*Configure level behaviour* — choose a level, set what ' +
		'the bot does when a user reaches it, and optionally customise ' +
		'the message sent to them. Leave the message blank for the default.',
	levelOverviewModalHeader:
		'*Spam Level Configuration*\n' +
		"Review each level's behaviour below. " +
		"Press *Edit* to change a level's action, timeout, or notification message.",
	timeoutLabel:
		'Timeout duration (seconds) — only used when action is "Timeout"',
	customNotificationLabel:
		'Custom notification message use {user} and {duration} as placeholders - (leave blank for default)',
	customNotificationHint: `Leave blank to use the default message shown in the placeholder.`,
	defaultNotificationInputPlaceholder:
		'Message sent to the user when this level triggers...',
} as const;

export const levelConfigNotification = {
	LevelConfigNoChangesFound: (level: SpammingLevel) =>
		`No changes detected for *${levelLabel(level)}*.`,
	LevelConfigUpdateMessage: (adminUsername: string) =>
		`Level configuration updated* by @${adminUsername}*`,
	LevelConfigSaveSuccess: (adminUsername: string) =>
		`Level configuration saved successfully by @${adminUsername}`,
	LevelConfigResetToDefault: (level: SpammingLevel, adminUsername: string) =>
		`*${SPAMMING_LEVEL_LABELS[level]}* has been reset to its default settings by @${adminUsername}.`,
};

export const confirmationModal = {
	ManageUserAction: {
		title: 'Confirm Action',
		description: 'Are you sure you want to perform this action?',
		confirmLabel: 'Confirm',
	},
	LevelResetToDefault: {
		title: 'Reset to Defaults',
		description:
			"Are you sure you want to reset this level's action, timeout, and message back to defaults? This cannot be undone.",
		confirmLabel: 'Reset',
	},
};

export const scheduleNotification = {
	ScheduleSet: (adminUsername: string) =>
		`@${adminUsername} set up the flagged-user report schedule for this channel.`,
	ScheduleRemoved: (adminUsername: string) =>
		`@${adminUsername} removed the flagged-user report schedule for this channel. No more automatic reports will be sent.`,
};

export const dailyReportNotification = {
	title: (dateStr: string) => `**Daily Anti-Spam Report** — ${dateStr}`,

	allClear: {
		heading: '**All Clear** — no spam activity in this period.',
		flagsLine: '• Flags: 0',
		flaggedUsersLine: '• Flagged users: 0',
		trackedUsersLine: (count: number) => `• Tracked users: ${count}`,
	},

	summary: {
		heading: '**Summary:**',
		flagsLine: (count: number) => `• Flags this period: ${count}`,
		flaggedUsersLine: (count: number) =>
			`• Currently flagged users: ${count}`,
		adminActionsLine: (count: number) =>
			`• Admin actions this period: ${count}`,
		trackedUsersLine: (count: number) => `• Total tracked users: ${count}`,
	},

	levelGroup: {
		heading: (label: string, count: number) => `**${label}** (${count}):`,
		userLine: (username: string, totalFlags: number | string) =>
			`  • @${username} — ${totalFlags} total flags`,
	},

	flaggedUsers: {
		heading: '**Flagged Users (this period):**',
		userLine: (
			username: string,
			flagCount: number,
			triggerList: string,
			currentLabel: string,
		) =>
			`  • @${username} — ${flagCount} flags (${triggerList}) — currently: ${currentLabel}`,
		rooms: (roomsList: string) => `      _Rooms: ${roomsList}_`,
		roomsTruncated: (roomsList: string) =>
			`      _Rooms: ${roomsList} (+more, showing first ${MAX_ROOMS_PER_SUMMARY})_`,
	},

	adminActions: {
		heading: '**Admin Actions (this period):**',
		actionLine: (username: string, label: string, adminUsername: string) =>
			`  • @${username} — ${label} by @${adminUsername}`,
	},

	moreCount: (n: number) => `  _...and ${n} more_`,
};

export const scheduleSetupModalText = {
	everyDay: 'Every day',
	days: {
		sun: 'Sun',
		mon: 'Mon',
		tue: 'Tue',
		wed: 'Wed',
		thu: 'Thu',
		fri: 'Fri',
		sat: 'Sat',
	},
	cadenceLabels: {
		daily: 'Daily',
		weekdays: 'Weekdays',
		weekly: 'Weekly',
		custom: 'Custom',
	},
	setup: {
		headerDefault:
			'Configure when the flagged-user report gets sent to this channel.',
		headerExisting: (desc: string) =>
			`*Current schedule:* ${desc}\n\nSet up a replacement below — this overwrites the existing schedule when confirmed.`,
		deleteButton: 'Delete current schedule',
		cadenceLabel: 'Cadence',
		cadencePlaceholder: 'Select cadence',
		cadenceHint:
			'*Daily:* every day  ·  *Weekdays:* Mon–Fri  ·  *Weekly:* every Monday\n*Custom:* pick the exact days below (only used when Cadence = Custom).',
		daysLabel: 'Days (Custom cadence only)',
		daysPlaceholder: 'Select days',
		timeLabel: 'Time',
		title: 'Schedule Report',
		previewButton: 'Preview',
	},
	confirm: {
		title: 'Confirm Schedule',
		backButton: '← Back',
		confirmButton: 'Confirm & Schedule',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
			nextRun: string,
			hadExisting: boolean,
		) =>
			`*Cadence:* ${cadence}\n` +
			`*Days:* ${days}\n` +
			`*Time:* ${time} (${offset})\n\n` +
			`*Next run:* ${nextRun}` +
			(hadExisting ? `\n\n_This replaces the existing schedule._` : ''),
	},
	delete: {
		title: 'Delete Schedule',
		confirmButton: 'Delete Schedule',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
		) =>
			`*Existing schedule:*\n` +
			`*Cadence:* ${cadence}\n` +
			`*Days:* ${days}\n` +
			`*Time:* ${time} (${offset})\n\n` +
			`*This will stop and remove the running schedule job. No more automatic reports will be sent until a new schedule is set up.*`,
	},
};

export const commonModalText = {
	cancel: 'Cancel',
};
export const scheduleValidationText = {
	invalidTime: 'Enter a valid time as HH:MM, e.g. 09:00',
	missingCustomDays: 'Select at least one day for Custom cadence.',
};
