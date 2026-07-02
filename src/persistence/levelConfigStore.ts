import {
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { DEFAULT_LEVEL_CONFIGS, LevelConfig } from '../definition/levelConfig';
import { SpammingLevel } from '../definition/spamlevel';

const ASSOC_SCOPE = 'spammonitor-level-config';

function allConfigsAssoc(): RocketChatAssociationRecord[] {
	return [
		new RocketChatAssociationRecord(
			RocketChatAssociationModel.MISC,
			ASSOC_SCOPE,
		),
	];
}

export class LevelConfigStore {
	public static async getAll(
		read: IRead,
	): Promise<Record<SpammingLevel, LevelConfig>> {
		const records = await read
			.getPersistenceReader()
			.readByAssociations(allConfigsAssoc());

		if (
			records.length &&
			LevelConfigStore.isValidConfigRecord(records[0])
		) {
			return {
				...DEFAULT_LEVEL_CONFIGS,
				...(records[0] as Record<SpammingLevel, LevelConfig>),
			};
		}
		return { ...DEFAULT_LEVEL_CONFIGS };
	}

	public static async get(
		read: IRead,
		level: SpammingLevel,
	): Promise<LevelConfig> {
		const all = await LevelConfigStore.getAll(read);
		return all[level];
	}

	public static async save(
		read: IRead,
		persistence: IPersistence,
		config: LevelConfig,
	): Promise<void> {
		const all = await LevelConfigStore.getAll(read);
		all[config.level] = config;
		await LevelConfigStore.saveAll(persistence, all);
	}

	public static async saveAll(
		persistence: IPersistence,
		configs: Record<SpammingLevel, LevelConfig>,
	): Promise<void> {
		await persistence.updateByAssociations(
			allConfigsAssoc(),
			configs,
			true,
		);
	}
	public static async resetLevel(
		read: IRead,
		persistence: IPersistence,
		level: SpammingLevel,
	): Promise<void> {
		const all = await LevelConfigStore.getAll(read);
		delete all[level];
		await LevelConfigStore.saveAll(persistence, all);
	}

	private static isValidConfigRecord(r: unknown): boolean {
		if (!r || typeof r !== 'object') return false;
		const obj = r as Record<string, unknown>;
		return Object.values(SpammingLevel).some(
			(lvl) =>
				typeof lvl === 'number' &&
				lvl in obj &&
				typeof obj[lvl] === 'object',
		);
	}
}
