import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	IUIKitResponse,
	UIKitBlockInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { buildConfirmActionModal } from '../modals/confirmationModal';
import { buildManageUserModal } from '../modals/manageUsers';
import { RoomInteractionStorage } from '../persistence/roomInteraction';
import { UserStatusStore } from '../persistence/userStatusStore';
import {
	ACTIONS_REQUIRING_CONFIRM,
	CONFIRM_TO_ACTION,
	ManageUserActionId,
} from '../enums/modals/manageUsers';

export class BlockActionHandler {
	constructor(
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly persistence: IPersistence,
		private readonly modify: IModify,
		private readonly context: UIKitBlockInteractionContext,
		private readonly appId: string,
	) {}

	public async handle(): Promise<IUIKitResponse> {
		const { actionId, value, user, triggerId } =
			this.context.getInteractionData();
		const roomStorage = new RoomInteractionStorage(
			this.persistence,
			this.read.getPersistenceReader(),
			user.id,
		);

		if (actionId === ManageUserActionId.OPEN_MANAGE_MODAL) {
			if (!value || !triggerId) {
				return this.context.getInteractionResponder().successResponse();
			}
			// value format: "<intent>::<userId>"
			const [intent, userId] = value.split('::');

			if (intent === ManageUserActionId.OPEN_MANAGE_MODAL) {
				const targetUser = await this.read
					.getUserReader()
					.getById(userId);
				if (!targetUser) {
					return this.context
						.getInteractionResponder()
						.successResponse();
				}

				const record = await UserStatusStore.get(this.read, userId);
				if (!record) {
					return this.context
						.getInteractionResponder()
						.successResponse();
				}

				const modal = buildManageUserModal(record, this.appId);
				await this.modify
					.getUiController()
					.openSurfaceView(modal, { triggerId }, user);

				return this.context.getInteractionResponder().successResponse();
			}

			return this.context.getInteractionResponder().successResponse();
		}

		if (!ACTIONS_REQUIRING_CONFIRM.has(actionId)) {
			return this.context.getInteractionResponder().successResponse();
		}

		if (!value || !triggerId) {
			return this.context.getInteractionResponder().successResponse();
		}

		const roomId = await roomStorage.getInteractionRoomId();
		if (!roomId) {
			return this.context.getInteractionResponder().successResponse();
		}

		const targetUser = await this.read.getUserReader().getById(value);
		if (!targetUser) {
			return this.context.getInteractionResponder().successResponse();
		}

		const realAction = CONFIRM_TO_ACTION[actionId];
		const modal = buildConfirmActionModal(
			realAction,
			targetUser.id,
			targetUser.username,
			this.appId,
			roomId,
		);
		await this.modify
			.getUiController()
			.openSurfaceView(modal, { triggerId }, user);

		return this.context.getInteractionResponder().successResponse();
	}
}
