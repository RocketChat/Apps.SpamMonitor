import { IRead, IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

export async function sendNotification(
	read: IRead,
	modify: IModify,
	user: IUser,
	room: IRoom,
	content: { message?: string },
): Promise<void> {
	const appUser = (await read.getUserReader().getAppUser()) as IUser;
	const { message } = content;

	const messageBuilder = modify
		.getCreator()
		.startMessage()
		.setSender(appUser)
		.setRoom(room)
		.setGroupable(false);

	if (message) {
		messageBuilder.setText(message);
	}

	return read.getNotifier().notifyUser(user, messageBuilder.getMessage());
}
