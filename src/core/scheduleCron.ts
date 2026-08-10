const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function buildCronExpression(
	reportTime: string,
	utcOffsetMinutes: number,
	days: number[] = [],
): string {
	const [hourStr, minuteStr] = reportTime.split(':');
	const targetHour = parseInt(hourStr, 10);
	const targetMinute = parseInt(minuteStr, 10);
	if (isNaN(targetHour) || isNaN(targetMinute)) {
		return '0 18 * * *';
	}

	const localMinutes = targetHour * 60 + targetMinute;
	const rawShifted = localMinutes - utcOffsetMinutes;
	const utcTotal = ((rawShifted % (24 * 60)) + 24 * 60) % (24 * 60);
	const utcHour = Math.floor(utcTotal / 60);
	const utcMinute = Math.round(utcTotal % 60);

	// if the UTC conversion crossed a calendar-day boundary, every selected
	// day-of-week shifts by that same +/-1.
	const dayShift = Math.floor(rawShifted / (24 * 60));

	let dayField = '*';
	if (days.length) {
		const shifted = days.map((d) => (((d + dayShift) % 7) + 7) % 7);
		dayField = [...new Set(shifted)].sort((a, b) => a - b).join(',');
	}

	return `${utcMinute} ${utcHour} * * ${dayField}`;
}

export function formatTime12h(reportTime: string): string {
	const [hourStr, minuteStr] = reportTime.split(':');
	const hour = parseInt(hourStr, 10);
	const minute = parseInt(minuteStr, 10);
	const hh = String(hour % 12 === 0 ? 12 : hour % 12).padStart(2, '0');
	const mm = String(minute).padStart(2, '0');
	const ampm = hour < 12 ? 'AM' : 'PM';
	return `${hh}:${mm} ${ampm}`;
}
// Computes the next local fire time for display in the confirm modal.
// Approximates the admin's "now" via utcOffsetMinutes rather than doing a
// real IANA lookup — caveat that utcOffset is a snapshot, not a live timezone.
// not used for the actual cron (that's UTC-exact via buildCronExpression).
export function computeNextRunPreview(
	reportTime: string,
	utcOffsetMinutes: number,
	days: number[],
): string {
	const [hourStr, minuteStr] = reportTime.split(':');
	const targetHour = parseInt(hourStr, 10);
	const targetMinute = parseInt(minuteStr, 10);

	const nowUtcMs = Date.now();
	const nowLocalMs = nowUtcMs + utcOffsetMinutes * 60 * 1000;
	const nowLocal = new Date(nowLocalMs);

	const candidateDays = days.length ? days : [nowLocal.getUTCDay()];

	for (let offset = 0; offset <= 7; offset++) {
		const candidate = new Date(nowLocal);
		candidate.setUTCDate(candidate.getUTCDate() + offset);
		candidate.setUTCHours(targetHour, targetMinute, 0, 0);

		const dow = candidate.getUTCDay();
		if (!candidateDays.includes(dow)) continue;
		if (candidate.getTime() <= nowLocal.getTime()) continue;

		const label = DAY_LABELS[dow];
		const timeLabel = formatTime12h(reportTime);
		const offsetLabel = formatOffset(utcOffsetMinutes);
		return `${label} ${candidate.getUTCMonth() + 1}/${candidate.getUTCDate()} · ${timeLabel} (${offsetLabel})`;
	}

	return 'Unable to compute — check the selected days and time.';
}

export function formatOffset(utcOffsetMinutes: number): string {
	const sign = utcOffsetMinutes >= 0 ? '+' : '-';
	const abs = Math.abs(utcOffsetMinutes);
	const h = Math.floor(abs / 60);
	const m = abs % 60;
	return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}
