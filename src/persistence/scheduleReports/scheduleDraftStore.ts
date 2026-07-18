import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import {
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ScheduleDraft } from '../../definition/scheduleReports';

const ASSOC_SCOPE = 'antispam-schedule-draft';

export type ScheduleDraftRecord =
	| { stage: 'confirm'; draft: ScheduleDraft }
	| { stage: 'delete' };

export class ScheduleDraftStorage {
	private static assocs(adminUserId: string): RocketChatAssociationRecord[] {
		return [
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.USER,
				adminUserId,
			),
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.MISC,
				ASSOC_SCOPE,
			),
		];
	}

	public static async save(
		persistence: IPersistence,
		adminUserId: string,
		record: ScheduleDraftRecord,
	): Promise<void> {
		await persistence.updateByAssociations(
			ScheduleDraftStorage.assocs(adminUserId),
			record,
			true,
		);
	}

	public static async get(
		read: IRead,
		adminUserId: string,
	): Promise<ScheduleDraftRecord | null> {
		const rows = await read
			.getPersistenceReader()
			.readByAssociations(ScheduleDraftStorage.assocs(adminUserId));
		if (!rows.length) return null;
		return rows[0] as ScheduleDraftRecord;
	}

	public static async clear(
		persistence: IPersistence,
		adminUserId: string,
	): Promise<void> {
		await persistence.removeByAssociations(
			ScheduleDraftStorage.assocs(adminUserId),
		);
	}
}
