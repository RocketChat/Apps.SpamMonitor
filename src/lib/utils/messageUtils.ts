import { COOLDOWN_DURATIONS, UserSpamRecord } from '../../definition/spamlevel';
import { Messages } from '../translations/locals/en';

function formatDuration(ms: number): string {
	if (ms <= 0) return '';
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	if (hours > 0 && minutes > 0) {
		return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
	}
	if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
	if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
	return `${totalSeconds} second${totalSeconds > 1 ? 's' : ''}`;
}

export function buildMessage(record: UserSpamRecord): string | null {
	const fn = Messages[record.spammingLevel];
	if (!fn) {
		return null;
	}
	const duration = formatDuration(COOLDOWN_DURATIONS[record.spammingLevel]);
	return fn(record.username, duration);
}
export function formatCooldown(cooldownUntil: number): string {
	const now = Date.now();
	if (!cooldownUntil || now >= cooldownUntil) return 'None';
	const remainingMs = cooldownUntil - now;
	const minutes = Math.floor(remainingMs / 60000);
	const seconds = Math.floor((remainingMs % 60000) / 1000);
	return `${minutes}m ${seconds}s remaining`;
}

export function formatDate(ts: number): string {
	if (!ts) return 'Never';
	return new Date(ts).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}
