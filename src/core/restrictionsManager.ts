import {
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import {
	SPAMMING_LEVEL_LABELS,
	SpammingLevel,
	UserSpamRecord,
} from '../definition/spamlevel';
import { buildMessage } from '../lib/utils/messageUtils';
import { LevelConfig } from '../definition/levelConfig';
import { FlagLogStore } from '../persistence/scheduleReports/flagLogStore';

export class RestrictionManager {
	public static async dmUser(
		read: IRead,
		modify: IModify,
		targetUser: IUser,
		text: string,
	): Promise<void> {
		const appUser = await read.getUserReader().getAppUser();
		if (!appUser) {
			return;
		}

		let room: IRoom | undefined = await read
			.getRoomReader()
			.getDirectByUsernames([appUser.username, targetUser.username]);

		if (!room) {
			const roomBuilder = modify
				.getCreator()
				.startRoom()
				.setType(RoomType.DIRECT_MESSAGE)
				.setCreator(appUser)
				.setMembersToBeAddedByUsernames([
					appUser.username,
					targetUser.username,
				]);
			const roomId = await modify.getCreator().finish(roomBuilder);
			room = await read.getRoomReader().getById(roomId);
		}

		if (!room) {
			return;
		}

		const msg = modify
			.getCreator()
			.startMessage()
			.setSender(appUser)
			.setRoom(room)
			.setText(text);
		await modify.getCreator().finish(msg);
	}

	public static async applyAction(
		read: IRead,
		modify: IModify,
		persistence: IPersistence,
		user: IUser,
		record: UserSpamRecord,
		options: {
			levelChanged?: boolean;
			trigger?: string;
			roomName?: string;
		} = {},
		config: LevelConfig,
	): Promise<void> {
		const { levelChanged = true, trigger, roomName } = options;
		if (!levelChanged || record.spammingLevel === SpammingLevel.Clean) {
			return;
		}
		await FlagLogStore.log(persistence, read, {
			userId: user.id,
			username: user.username,
			timestamp: Date.now(),
			trigger: trigger ?? 'unknown',
			action: SPAMMING_LEVEL_LABELS[record.spammingLevel].toLowerCase(),
			roomName: roomName ?? 'unknown',
		});
		const message = buildMessage(record, config);
		if (!message) return;
		await RestrictionManager.dmUser(read, modify, user, message);
	}
}
