export const slashNotifications = {
	NO_FLAGGED_USERS: 'No flagged users at this time.',
	NO_PERMISSION: 'You do not have permission to use this command.',
	NO_FLAGGED_USERS_FILTER: (filter: string) =>
		`No flagged users found for filter: *${filter}*.`,
};

export const slashCommandHelp = {
	HELP:
		'*SpamMonitor commands*\n' +
		'`/spammonitor list all` — all flagged users, highest level first\n' +
		'`/spammonitor list timeout` — users currently in an active cooldown\n' +
		'`/spammonitor list <Level>` — users at a specific level e.g. `list review` for admin review users',
};
