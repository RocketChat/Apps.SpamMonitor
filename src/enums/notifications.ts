export const slashNotifications = {
	NO_FLAGGED_USERS: 'No flagged users at this time.',
	NO_PERMISSION: 'You do not have permission to use this command.',
	ADMIN_CHANNEL_ONLY: 'This command can only be used in the admin channel.',
	NO_FLAGGED_USERS_FILTER: (filter: string) =>
		`No flagged users found for filter: *${filter}*.`,
	USER_NOT_FOUND: (username: string) =>
		`User *@${username}* not found or has no spam record.`,
	MANAGE_MISSING_USERNAME: 'Usage: `/spammonitor manage <username>`',
};

export const slashCommandHelp = {
	HELP:
		'*SpamMonitor commands*\n' +
		'`/spammonitor list all` — all flagged users, highest level first\n' +
		'`/spammonitor list timeout` — users currently in an active cooldown\n' +
		'`/spammonitor list <Level>` — users at a specific level e.g. `list review` for admin review users\n' +
		'`/spammonitor manage <username>` — open admin controls for a flagged user',
};
