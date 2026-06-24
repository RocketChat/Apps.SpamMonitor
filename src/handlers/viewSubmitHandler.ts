import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	IUIKitResponse,
	UIKitViewSubmitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UserStatusStore } from '../persistence/userStatusStore';
import { SPAMMING_LEVEL_LABELS } from '../definition/spamlevel';
import {
	ManageUserActionId,
	CONFIRM_ACTION_MODAL_ID,
} from '../enums/modals/manageUsers';
import { sendNotification } from '../lib/utils/notifications';
import { RoomInteractionStorage } from '../persistence/roomInteraction';
import { AdminActionMessages } from '../lib/translations/locals/en';

export class ViewSubmitHandler {
	constructor(
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly persistence: IPersistence,
		private readonly modify: IModify,
		private readonly context: UIKitViewSubmitInteractionContext,
	) {}

	public async handle(): Promise<IUIKitResponse> {
		const { view, user } = this.context.getInteractionData();

		if (!view.id.startsWith(CONFIRM_ACTION_MODAL_ID)) {
			return this.context.getInteractionResponder().successResponse();
		}

		// view.id format: confirm_action_modal::<realAction>::<userId>::<roomId>
		const parts = view.id.split('::');
		if (parts.length !== 4) {
			return this.context.getInteractionResponder().successResponse();
		}

		const [, realAction, userId, roomId] = parts;

		const targetUser = await this.read.getUserReader().getById(userId);
		if (!targetUser) {
			return this.context.getInteractionResponder().successResponse();
		}
		const notifyRoom = roomId
			? await this.read.getRoomReader().getById(roomId)
			: null;
		if (!notifyRoom) {
			const roomStorage = new RoomInteractionStorage(
				this.persistence,
				this.read.getPersistenceReader(),
				user.id,
			);
			const fallbackRoomId = await roomStorage.getInteractionRoomId();
			const fallbackRoom = fallbackRoomId
				? await this.read.getRoomReader().getById(fallbackRoomId)
				: null;

			if (!fallbackRoom) {
				console.error(
					`[ViewSubmitHandler] Could not resolve notify room. viewId roomId=${roomId}`,
				);
				return this.context.getInteractionResponder().successResponse();
			}

			await this.executeAction(
				realAction as ManageUserActionId,
				targetUser,
				user,
				fallbackRoom,
			);
			return this.context.getInteractionResponder().successResponse();
		}

		await this.executeAction(
			realAction as ManageUserActionId,
			targetUser,
			user,
			notifyRoom,
		);

		return this.context.getInteractionResponder().successResponse();
	}

	private async executeAction(
		action: ManageUserActionId,
		targetUser: IUser,
		admin: IUser,
		room: IRoom,
	): Promise<void> {
		const notify = async (message: string) => {
			await sendNotification(this.read, this.modify, admin, room, {
				message,
			});
		};

		switch (action) {
			case ManageUserActionId.VOUCH:
				await UserStatusStore.vouch(
					this.persistence,
					targetUser.id,
					targetUser.username,
					admin.username,
				);
				await notify(
					AdminActionMessages.vouch(
						targetUser.username,
						admin.username,
					),
				);
				break;

			case ManageUserActionId.RESET_COOLDOWN:
				await UserStatusStore.resetCooldown(
					this.read,
					this.persistence,
					targetUser.id,
				);
				await notify(
					AdminActionMessages.resetCooldown(
						targetUser.username,
						admin.username,
					),
				);
				break;

			case ManageUserActionId.RESET_LEVEL_DOWN: {
				const before = await UserStatusStore.get(
					this.read,
					targetUser.id,
				);
				await UserStatusStore.resetLevelDown(
					this.read,
					this.persistence,
					targetUser.id,
				);
				const after = await UserStatusStore.get(
					this.read,
					targetUser.id,
				);
				const beforeLabel =
					before?.spammingLevel !== undefined
						? (SPAMMING_LEVEL_LABELS[before.spammingLevel] ??
							String(before.spammingLevel))
						: 'Unknown';
				const afterLabel =
					after?.spammingLevel !== undefined
						? (SPAMMING_LEVEL_LABELS[after.spammingLevel] ??
							String(after.spammingLevel))
						: 'Clean';
				await notify(
					AdminActionMessages.resetLevelDown(
						targetUser.username,
						admin.username,
						beforeLabel,
						afterLabel,
					),
				);
				break;
			}

			case ManageUserActionId.RESET_LEVEL_CLEAN:
				await UserStatusStore.resetLevelClean(
					this.read,
					this.persistence,
					targetUser.id,
				);
				await notify(
					AdminActionMessages.resetLevelClean(
						targetUser.username,
						admin.username,
					),
				);
				break;
		}
	}
}
