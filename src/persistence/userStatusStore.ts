import {
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import {
	ESCALATION_THRESHOLDS,
	NEXT_LEVEL,
	PREV_LEVEL,
	SpammingLevel,
	UserSpamRecord,
} from '../definition/spamlevel';
import { DEFAULT_LEVEL_CONFIGS, LevelConfig } from '../definition/levelConfig';

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
		levelConfig: Record<SpammingLevel, LevelConfig> = DEFAULT_LEVEL_CONFIGS,
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
			const config = levelConfig[nextLevel];
			const cooldownMs =
				config.action === 'timeout' && config.timeoutSeconds
					? config.timeoutSeconds * 1000
					: 0;
			const updated: UserSpamRecord = {
				userId,
				username,
				spammingLevel: nextLevel,
				cooldownUntil: cooldownMs > 0 ? now + cooldownMs : 0,
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

		if (record.vouched) return { restricted: false, record };

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

	public static async vouch(
		persistence: IPersistence,
		userId: string,
		username: string,
		adminUsername: string,
	): Promise<void> {
		const record: UserSpamRecord = {
			userId,
			username,
			spammingLevel: SpammingLevel.Clean,
			cooldownUntil: 0,
			lastEscalation: 0,
			totalFlags: 0,
			flagsAtLevel: 0,
			vouched: true,
			vouchedBy: adminUsername,
		};
		await UserStatusStore.save(persistence, userId, record);
	}

	public static async resetCooldown(
		read: IRead,
		persistence: IPersistence,
		userId: string,
	): Promise<void> {
		const existing = await UserStatusStore.get(read, userId);
		if (!existing) return;
		await UserStatusStore.save(persistence, userId, {
			...existing,
			cooldownUntil: 0,
		});
	}

	public static async resetLevelClean(
		read: IRead,
		persistence: IPersistence,
		userId: string,
	): Promise<void> {
		const existing = await UserStatusStore.get(read, userId);
		if (!existing) return;
		await UserStatusStore.save(persistence, userId, {
			...existing,
			spammingLevel: SpammingLevel.Clean,
			cooldownUntil: 0,
			flagsAtLevel: 0,
		});
	}

	public static async resetLevelDown(
		read: IRead,
		persistence: IPersistence,
		userId: string,
	): Promise<void> {
		const existing = await UserStatusStore.get(read, userId);
		if (!existing) return;
		const prevLevel =
			PREV_LEVEL[existing.spammingLevel] ?? SpammingLevel.Clean;
		await UserStatusStore.save(persistence, userId, {
			...existing,
			spammingLevel: prevLevel,
			cooldownUntil: 0,
			flagsAtLevel: 0,
		});
	}
}
