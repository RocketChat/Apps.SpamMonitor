import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { SpammingLevel, UserSpamRecord } from '../definition/spamlevel';
import { buildMessage } from '../lib/utils/messageUtils';
import { LevelConfig } from '../definition/levelConfig';

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

		let room: IRoom | undefined = (await read
			.getRoomReader()
			.getDirectByUsernames([
				appUser.username,
				targetUser.username,
			])) as any;

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
		user: IUser,
		record: UserSpamRecord,
		options: { levelChanged?: boolean } = {},
		config: LevelConfig,
	): Promise<void> {
		const { levelChanged = true } = options;
		if (!levelChanged || record.spammingLevel === SpammingLevel.Clean) {
			return;
		}
		const message = buildMessage(record, config);
		if (!message) return;
		await RestrictionManager.dmUser(read, modify, user, message);
	}
}
