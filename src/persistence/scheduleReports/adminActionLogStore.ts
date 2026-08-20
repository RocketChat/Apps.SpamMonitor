import {
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { AdminActionLogEntry } from '../../definition/scheduleReports';
import { daysBetween } from '../../lib/utils/scheduleSummaryUtils';
import {
	MAX_RECENT_ACTIONS,
	MAX_DAILY_ACTIONS,
	DAY_RECORD_RETENTION_DAYS,
	MAX_REPORT_WINDOW_DAYS,
} from '../../constants/scheduleLogStore';
import { serialize } from '../../core/cache/keyedQueue';
import { ADMIN_ACTION_DAY_INDEX_LOCK_KEY } from '../../constants/serialiseCacheLockKeys';

export class AdminActionLogStore {
	private static dayKey(timestamp: number): string {
		return new Date(timestamp).toISOString().slice(0, 10);
	}
	private static lastPrunedDay: string | null = null;
	private static recentActionsAssocs(
		userId: string,
	): RocketChatAssociationRecord[] {
		return [
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.USER,
				userId,
			),
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.MISC,
				'antispam-recent-actions',
			),
		];
	}

	private static dailyActionScopeAssoc(
		day: string,
	): RocketChatAssociationRecord {
		return new RocketChatAssociationRecord(
			RocketChatAssociationModel.MISC,
			`antispam-action-day:${day}`,
		);
	}

	private static dailyActionAssocs(
		userId: string,
		day: string,
	): RocketChatAssociationRecord[] {
		return [
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.USER,
				userId,
			),
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.MISC,
				`antispam-action-day:${day}`,
			),
		];
	}
	private static dayIndexAssoc(): RocketChatAssociationRecord {
		return new RocketChatAssociationRecord(
			RocketChatAssociationModel.MISC,
			'antispam-action-days-index',
		);
	}
	public static async log(
		persistence: IPersistence,
		read: IRead,
		entry: AdminActionLogEntry,
	): Promise<void> {
		await serialize(entry.userId, async () => {
			const day = AdminActionLogStore.dayKey(entry.timestamp);

			const dailyAssocs = AdminActionLogStore.dailyActionAssocs(
				entry.userId,
				day,
			);
			const existingDaily = await read
				.getPersistenceReader()
				.readByAssociations(dailyAssocs);
			const dailyDoc = existingDaily.length
				? (existingDaily[0] as {
						entries: AdminActionLogEntry[];
						truncated?: boolean;
					})
				: { entries: [], truncated: false };

			if (dailyDoc.entries.length < MAX_DAILY_ACTIONS) {
				dailyDoc.entries.push(entry);
			} else {
				dailyDoc.truncated = true;
			}

			await persistence.updateByAssociations(dailyAssocs, dailyDoc, true);
			await AdminActionLogStore.pruneOldDays(persistence, read, day);

			const recentAssocs = AdminActionLogStore.recentActionsAssocs(
				entry.userId,
			);
			const existingRecent = await read
				.getPersistenceReader()
				.readByAssociations(recentAssocs);
			const recentDoc = existingRecent.length
				? (existingRecent[0] as { entries: AdminActionLogEntry[] })
				: { entries: [] };
			recentDoc.entries.push(entry);
			while (recentDoc.entries.length > MAX_RECENT_ACTIONS) {
				recentDoc.entries.shift();
			}
			await persistence.updateByAssociations(
				recentAssocs,
				recentDoc,
				true,
			);
		});
	}

	public static async getByUser(
		read: IRead,
		userId: string,
	): Promise<AdminActionLogEntry[]> {
		const records = await read
			.getPersistenceReader()
			.readByAssociations(
				AdminActionLogStore.recentActionsAssocs(userId),
			);
		if (!records.length) return [];
		const doc = records[0] as { entries: AdminActionLogEntry[] };
		return (doc.entries || []).filter((r) => r.action !== undefined);
	}

	public static async getActionsForDay(
		read: IRead,
		date: string,
	): Promise<AdminActionLogEntry[]> {
		const records = await read
			.getPersistenceReader()
			.readByAssociation(AdminActionLogStore.dailyActionScopeAssoc(date));
		const all: AdminActionLogEntry[] = [];
		for (const doc of records) {
			const typed = doc as { entries: AdminActionLogEntry[] };
			if (typed.entries)
				all.push(
					...typed.entries.filter((r) => r.action !== undefined),
				);
		}
		return all;
	}

	public static async getActionsSince(
		read: IRead,
		sinceTimestamp: number,
	): Promise<AdminActionLogEntry[]> {
		if (!Number.isFinite(sinceTimestamp)) {
			throw new Error(
				`getActionsSince: invalid sinceTimestamp: ${sinceTimestamp}`,
			);
		}

		const days = daysBetween(sinceTimestamp).slice(-MAX_REPORT_WINDOW_DAYS);

		const perDay = await Promise.all(
			days.map((day) => AdminActionLogStore.getActionsForDay(read, day)),
		);
		return perDay
			.reduce((acc, day) => acc.concat(day), [])
			.filter((entry) => entry.timestamp >= sinceTimestamp);
	}
	private static async pruneOldDays(
		persistence: IPersistence,
		read: IRead,
		day: string,
	): Promise<void> {
		await serialize(ADMIN_ACTION_DAY_INDEX_LOCK_KEY, async () => {
			if (day === AdminActionLogStore.lastPrunedDay) return;
			const indexAssoc = AdminActionLogStore.dayIndexAssoc();
			const existingIndex = await read
				.getPersistenceReader()
				.readByAssociation(indexAssoc);
			const indexDoc = existingIndex.length
				? (existingIndex[0] as { days: string[] })
				: { days: [] };

			if (!indexDoc.days.includes(day)) {
				indexDoc.days.push(day);
			}

			const cutoff = new Date();
			cutoff.setUTCDate(cutoff.getUTCDate() - DAY_RECORD_RETENTION_DAYS);
			const cutoffKey = cutoff.toISOString().slice(0, 10);

			const staleDays = indexDoc.days.filter((d) => d < cutoffKey);
			if (staleDays.length) {
				await Promise.all(
					staleDays.map((staleDay) =>
						persistence.removeByAssociation(
							AdminActionLogStore.dailyActionScopeAssoc(staleDay),
						),
					),
				);
				indexDoc.days = indexDoc.days.filter((d) => d >= cutoffKey);
			}

			await persistence.updateByAssociations(
				[indexAssoc],
				indexDoc,
				true,
			);
			AdminActionLogStore.lastPrunedDay = day;
		});
	}
}
