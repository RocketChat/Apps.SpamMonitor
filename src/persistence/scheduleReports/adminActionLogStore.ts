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
} from '../../constants/scheduleLogStore';

export class AdminActionLogStore {
	private static dayKey(timestamp: number): string {
		return new Date(timestamp).toISOString().slice(0, 10);
	}

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

	public static async log(
		persistence: IPersistence,
		read: IRead,
		entry: AdminActionLogEntry,
	): Promise<void> {
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
		await persistence.updateByAssociations(recentAssocs, recentDoc, true);
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
		const days = daysBetween(sinceTimestamp);
		const perDay = await Promise.all(
			days.map((day) => AdminActionLogStore.getActionsForDay(read, day)),
		);
		return perDay
			.reduce((acc, day) => acc.concat(day), [])
			.filter((entry) => entry.timestamp >= sinceTimestamp);
	}
}
