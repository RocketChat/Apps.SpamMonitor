import { SpammingLevel } from '../../../definition/spamlevel';

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
		`**Spam Levels**\n` +
		`• \`Clean\` — No issues detected\n` +
		`• \`Monitored\` — Unusual activity flagged; user is being watched\n` +
		`• \`Restricted\` — User placed on a timed cooldown\n` +
		`• \`Suspended\` — User suspended for a longer period\n` +
		`• \`AdminReview\` — Fully blocked; awaiting manual admin action\n\n` +
		`---\n\n` +
		`**Available Commands** (\`/spammonitor <subcommand>\`)\n` +
		`• \`list\` — View all currently flagged users\n` +
		`• \`help\` — Show this help message\n\n` +
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
