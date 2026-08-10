export function daysBetween(sinceTimestamp: number): string[] {
	const startDay = new Date(sinceTimestamp);
	startDay.setUTCHours(0, 0, 0, 0);
	const today = new Date();
	today.setUTCHours(23, 59, 59, 999);

	const days: string[] = [];
	const cursor = new Date(startDay);
	while (cursor <= today) {
		days.push(cursor.toISOString().slice(0, 10));
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	return days;
}
