import {
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import {
	COOLDOWN_DURATIONS,
	ESCALATION_THRESHOLDS,
	SpammingLevel,
	UserSpamRecord,
} from '../definition/spamlevel';

const ASSOC_SCOPE = 'antispam-status';
export class UserStatusStore {
	private static assocs(userId: string): RocketChatAssociationRecord[] {
		return [
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.USER,
				userId,
			),
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.MISC,
				ASSOC_SCOPE,
			),
		];
	}

	public static async get(
		read: IRead,
		userId: string,
	): Promise<UserSpamRecord | null> {
		const rows = await read
			.getPersistenceReader()
			.readByAssociations(UserStatusStore.assocs(userId));
		return rows.length ? (rows[0] as UserSpamRecord) : null;
	}

	public static async save(
		persistence: IPersistence,
		userId: string,
		record: UserSpamRecord,
	): Promise<void> {
		await persistence.updateByAssociations(
			UserStatusStore.assocs(userId),
			record,
			true,
		);
	}

	public static async escalate(
		read: IRead,
		persistence: IPersistence,
		userId: string,
		username: string,
	): Promise<UserSpamRecord> {
		const existing = await UserStatusStore.get(read, userId);
		const current: UserSpamRecord = existing ?? {
			userId,
			username,
			spammingLevel: SpammingLevel.Clean,
			cooldownUntil: 0,
			lastEscalation: 0,
			totalFlags: 0,
			flagsAtLevel: 0,
		};

		const now = Date.now();
		const newFlagsAtLevel = (current.flagsAtLevel ?? 0) + 1;
		const threshold = ESCALATION_THRESHOLDS[current.spammingLevel];
		const canEscalate =
			newFlagsAtLevel >= threshold &&
			current.spammingLevel < SpammingLevel.AdminReview;

		if (canEscalate) {
			const nextLevel = (current.spammingLevel + 1) as SpammingLevel;
			const updated: UserSpamRecord = {
				userId,
				username,
				spammingLevel: nextLevel,
				cooldownUntil:
					COOLDOWN_DURATIONS[nextLevel] > 0
						? now + COOLDOWN_DURATIONS[nextLevel]
						: 0,
				lastEscalation: now,
				totalFlags: current.totalFlags + 1,
				flagsAtLevel: 0,
			};
			await UserStatusStore.save(persistence, userId, updated);
			return updated;
		}

		const updated: UserSpamRecord = {
			...current,
			lastEscalation: now,
			totalFlags: current.totalFlags + 1,
			flagsAtLevel: newFlagsAtLevel,
		};
		await UserStatusStore.save(persistence, userId, updated);
		return updated;
	}
}
