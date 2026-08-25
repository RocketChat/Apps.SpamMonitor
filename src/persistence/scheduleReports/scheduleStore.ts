import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import {
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ScheduleRecord } from '../../definition/scheduleReports';
import { serialize } from '../../core/cache/keyedQueue';
import { SCHEDULE_LOCK_KEY } from '../../constants/serialiseCacheLockKeys';

const ASSOC_SCOPE = 'antispam-schedule-active';

export class ScheduleStore {
	private static assoc(): RocketChatAssociationRecord {
		return new RocketChatAssociationRecord(
			RocketChatAssociationModel.MISC,
			ASSOC_SCOPE,
		);
	}

	public static async get(read: IRead): Promise<ScheduleRecord | null> {
		const rows = await read
			.getPersistenceReader()
			.readByAssociation(ScheduleStore.assoc());
		if (!rows.length) return null;
		return rows[0] as ScheduleRecord;
	}

	public static async replace(
		persistence: IPersistence,
		record: ScheduleRecord,
	): Promise<void> {
		await serialize(SCHEDULE_LOCK_KEY, async () => {
			await persistence.updateByAssociation(
				ScheduleStore.assoc(),
				record,
				true,
			);
		});
	}

	public static async markSent(
		read: IRead,
		persistence: IPersistence,
		sentAt: number,
	): Promise<void> {
		await serialize(SCHEDULE_LOCK_KEY, async () => {
			const existing = await ScheduleStore.get(read);
			if (!existing) return;
			await persistence.updateByAssociation(
				ScheduleStore.assoc(),
				{ ...existing, lastReportSentAt: sentAt },
				true,
			);
		});
	}

	public static async clear(persistence: IPersistence): Promise<void> {
		await serialize(SCHEDULE_LOCK_KEY, async () => {
			await persistence.removeByAssociation(ScheduleStore.assoc());
		});
	}
}
