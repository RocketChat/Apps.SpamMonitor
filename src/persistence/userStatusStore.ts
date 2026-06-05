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
	NEXT_LEVEL,
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
	private static scopeAssoc(): RocketChatAssociationRecord {
		return new RocketChatAssociationRecord(
			RocketChatAssociationModel.MISC,
			ASSOC_SCOPE,
		);
	}

	public static async get(
		read: IRead,
		userId: string,
	): Promise<UserSpamRecord | null> {
		const rows = await read
			.getPersistenceReader()
			.readByAssociations(UserStatusStore.assocs(userId));
		if (!rows.length) return null;
		if (!UserStatusStore.isValidRecord(rows[0])) return null;
		return rows[0] as UserSpamRecord;
	}

	public static async getAll(read: IRead): Promise<UserSpamRecord[]> {
		const rows = await read
			.getPersistenceReader()
			.readByAssociation(UserStatusStore.scopeAssoc());
		return (rows as unknown[])
			.filter(UserStatusStore.isValidRecord)
			.filter((r) => r.spammingLevel > SpammingLevel.Clean);
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
			const nextLevel =
				NEXT_LEVEL[current.spammingLevel] ?? current.spammingLevel;
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
			username,
			lastEscalation: now,
			totalFlags: current.totalFlags + 1,
			flagsAtLevel: newFlagsAtLevel,
		};
		await UserStatusStore.save(persistence, userId, updated);
		return updated;
	}
	private static isValidRecord(row: unknown): row is UserSpamRecord {
		if (!row || typeof row !== 'object') return false;
		const r = row as Record<string, unknown>;
		return (
			typeof r.userId === 'string' &&
			typeof r.username === 'string' &&
			typeof r.spammingLevel === 'number' &&
			r.spammingLevel in SpammingLevel &&
			typeof r.cooldownUntil === 'number' &&
			typeof r.lastEscalation === 'number' &&
			typeof r.totalFlags === 'number' &&
			typeof r.flagsAtLevel === 'number'
		);
	}

	public static async isRestricted(
		read: IRead,
		persistence: IPersistence,
		userId: string,
	): Promise<{ restricted: boolean; record: UserSpamRecord | null }> {
		const record = await UserStatusStore.get(read, userId);
		if (!record) {
			return { restricted: false, record: null };
		}

		if (record.spammingLevel === SpammingLevel.AdminReview) {
			return { restricted: true, record };
		}

		if (record.cooldownUntil > 0 && Date.now() < record.cooldownUntil) {
			return { restricted: true, record };
		}

		if (record.cooldownUntil > 0 && Date.now() >= record.cooldownUntil) {
			const lifted: UserSpamRecord = { ...record, cooldownUntil: 0 };
			await UserStatusStore.save(persistence, userId, lifted);
			return { restricted: false, record: lifted };
		}

		return { restricted: false, record };
	}
}
