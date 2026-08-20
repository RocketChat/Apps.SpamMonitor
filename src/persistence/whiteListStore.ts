import {
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { WhitelistConfig } from '../definition/whitelist';
import { serialize } from '../core/cache/keyedQueue';
import { WHITELIST_LOCK_KEY } from '../constants/serialiseCacheLockKeys';

const WHITELIST_ASSOCIATION = new RocketChatAssociationRecord(
	RocketChatAssociationModel.MISC,
	'spam-monitor-whitelist',
);
const EMPTY_WHITELIST: WhitelistConfig = { roomIds: [], roleIds: [] };
export class WhitelistStore {
	public static async get(read: IRead): Promise<WhitelistConfig> {
		const [record] = await read
			.getPersistenceReader()
			.readByAssociation(WHITELIST_ASSOCIATION);
		if (!record) {
			return { ...EMPTY_WHITELIST };
		}
		const data = record as Partial<WhitelistConfig>;
		return {
			roomIds: Array.isArray(data.roomIds) ? [...data.roomIds] : [],
			roleIds: Array.isArray(data.roleIds) ? [...data.roleIds] : [],
		};
	}

	private static async save(
		persistence: IPersistence,
		config: WhitelistConfig,
	): Promise<void> {
		await persistence.updateByAssociation(
			WHITELIST_ASSOCIATION,
			config,
			true,
		);
	}

	public static async addRoom(
		read: IRead,
		persistence: IPersistence,
		roomId: string,
	): Promise<WhitelistConfig> {
		return serialize(WHITELIST_LOCK_KEY, async () => {
			const current = await this.get(read);
			if (!current.roomIds.includes(roomId)) {
				current.roomIds.push(roomId);
				await this.save(persistence, current);
			}
			return current;
		});
	}

	public static async removeRoom(
		read: IRead,
		persistence: IPersistence,
		roomId: string,
	): Promise<WhitelistConfig> {
		return serialize(WHITELIST_LOCK_KEY, async () => {
			const current = await this.get(read);
			current.roomIds = current.roomIds.filter((id) => id !== roomId);
			await this.save(persistence, current);
			return current;
		});
	}

	public static async addRole(
		read: IRead,
		persistence: IPersistence,
		roleId: string,
	): Promise<WhitelistConfig> {
		const normalized = roleId.toLowerCase();
		return serialize(WHITELIST_LOCK_KEY, async () => {
			const current = await this.get(read);
			if (!current.roleIds.includes(normalized)) {
				current.roleIds.push(normalized);
				await this.save(persistence, current);
			}
			return current;
		});
	}

	public static async removeRole(
		read: IRead,
		persistence: IPersistence,
		roleId: string,
	): Promise<WhitelistConfig> {
		const normalized = roleId.toLowerCase();
		return serialize(WHITELIST_LOCK_KEY, async () => {
			const current = await this.get(read);
			current.roleIds = current.roleIds.filter((id) => id !== normalized);
			await this.save(persistence, current);
			return current;
		});
	}

	public static async isRoomWhitelisted(
		read: IRead,
		roomId: string,
	): Promise<boolean> {
		const { roomIds } = await this.get(read);
		return roomIds.includes(roomId);
	}

	public static async isUserWhitelistedByRole(
		read: IRead,
		user: IUser,
	): Promise<boolean> {
		const { roleIds } = await this.get(read);
		if (roleIds.length === 0) return false;
		const userRoles = user.roles ?? [];
		return userRoles.some((r) => roleIds.includes(r.toLowerCase()));
	}
}
