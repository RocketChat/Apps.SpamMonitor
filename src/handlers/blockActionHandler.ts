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
import {
	buildConfirmActionModal,
	buildResetLevelConfirmModal,
} from '../modals/confirmationModal';
import { buildManageUserModal } from '../modals/manageUsers';
import { RoomInteractionStorage } from '../persistence/roomInteraction';
import { UserStatusStore } from '../persistence/userStatusStore';
import {
	ACTIONS_REQUIRING_CONFIRM,
	CONFIRM_TO_ACTION,
	ManageUserActionId,
} from '../enums/modals/manageUsers';
import {
	EditLevelActionId,
	OverviewActionId,
} from '../enums/modals/levelConfig';
import { CONFIGURABLE_LEVELS, levelLabel } from '../definition/levelConfig';
import { SpammingLevel } from '../definition/spamlevel';
import { buildEditLevelModal } from '../modals/editLevelModal';
import { buildLevelConfigOverviewModal } from '../modals/levelOverviewModal';
import { ScheduleActionId } from '../enums/modals/scheduleReports';
import { buildScheduleSetupModal } from '../modals/scheduleReportModal';
import { ScheduleDraftStorage } from '../persistence/scheduleReports/scheduleDraftStore';
import { ScheduleStore } from '../persistence/scheduleReports/scheduleStore';
import { buildWhitelistOverviewModal } from '../modals/whiteListModal';
import { ConfigActionId } from '../definition/config';
import { buildLanguageSelectModal } from '../modals/setLanguage';
import { LanguagePreferenceStorage } from '../persistence/languagePreferenceStorage';
import { getTranslations } from '../lib/translations';
import { Translations } from '../definition/languagepreference';

export class BlockActionHandler {
	constructor(
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly persistence: IPersistence,
		private readonly modify: IModify,
		private readonly context: UIKitBlockInteractionContext,
		private readonly appId: string,
	) {}
	private cachedTranslations: Translations | undefined;
	private async getT(): Promise<Translations> {
		if (this.cachedTranslations) return this.cachedTranslations;
		const { user } = this.context.getInteractionData();
		const langStore = new LanguagePreferenceStorage(
			this.persistence,
			this.read.getPersistenceReader(),
			user.id,
		);
		const lang = await langStore.getLanguage();
		this.cachedTranslations = getTranslations(lang);
		return this.cachedTranslations;
	}
	public async handle(): Promise<IUIKitResponse> {
		const { actionId, value, user, triggerId } =
			this.context.getInteractionData();
		const t = await this.getT();
		const roomStorage = new RoomInteractionStorage(
			this.persistence,
			this.read.getPersistenceReader(),
			user.id,
		);
		if (actionId.startsWith(EditLevelActionId.RESET_TO_DEFAULT)) {
			if (!triggerId) {
				return this.context.getInteractionResponder().errorResponse();
			}

			const raw = parseInt(value ?? '', 10);
			const level: SpammingLevel = CONFIGURABLE_LEVELS.includes(
				raw as SpammingLevel,
			)
				? (raw as SpammingLevel)
				: CONFIGURABLE_LEVELS[0];

			const roomId = await roomStorage.getInteractionRoomId();

			const confirmModal = buildResetLevelConfirmModal(
				level,
				levelLabel(level),
				this.appId,
				t,
				roomId ?? undefined,
			);

			await this.modify
				.getUiController()
				.openSurfaceView(confirmModal, { triggerId }, user);

			return this.context.getInteractionResponder().successResponse();
		}
		if (actionId === EditLevelActionId.BACK_TO_OVERVIEW) {
			if (!triggerId) {
				return this.context.getInteractionResponder().errorResponse();
			}

			const overviewModal = await buildLevelConfigOverviewModal(
				this.read,
				this.appId,
				t,
			);

			await this.modify
				.getUiController()
				.openSurfaceView(overviewModal, { triggerId }, user);

			return this.context.getInteractionResponder().successResponse();
		}
		if (actionId.startsWith(ConfigActionId.OPEN_ITEM_PREFIX)) {
			if (!triggerId) {
				return this.context.getInteractionResponder().errorResponse();
			}

			const entryId =
				value ?? actionId.slice(ConfigActionId.OPEN_ITEM_PREFIX.length);

			switch (entryId) {
				case 'whitelist': {
					const modal = await buildWhitelistOverviewModal(
						this.read,
						this.appId,
						t,
					);
					await this.modify
						.getUiController()
						.openSurfaceView(modal, { triggerId }, user);
					break;
				}
				case 'language': {
					const modal = await buildLanguageSelectModal(
						this.read.getPersistenceReader(),
						this.persistence,
						this.appId,
						user.id,
						t,
					);
					await this.modify
						.getUiController()
						.openSurfaceView(modal, { triggerId }, user);
					break;
				}
				default:
					break;
			}
			return this.context.getInteractionResponder().successResponse();
		}
		if (actionId.startsWith(OverviewActionId.EDIT_LEVEL_PREFIX)) {
			if (!triggerId) {
				return this.context.getInteractionResponder().errorResponse();
			}

			const raw = parseInt(value ?? '', 10);
			const level: SpammingLevel = CONFIGURABLE_LEVELS.includes(
				raw as SpammingLevel,
			)
				? (raw as SpammingLevel)
				: CONFIGURABLE_LEVELS[0];

			const editModal = await buildEditLevelModal(
				this.read,
				this.appId,
				level,
				t,
			);

			await this.modify
				.getUiController()
				.openSurfaceView(editModal, { triggerId }, user);

			return this.context.getInteractionResponder().successResponse();
		}
		if (actionId === ScheduleActionId.BACK) {
			await ScheduleDraftStorage.clear(this.persistence, user.id);
			const existing = await ScheduleStore.get(this.read);
			const setupModal = buildScheduleSetupModal(this.appId, t, existing);

			return this.context
				.getInteractionResponder()
				.updateModalViewResponse(setupModal);
		}
		if (actionId === ScheduleActionId.DELETE) {
			const existing = await ScheduleStore.get(this.read);
			if (!existing) {
				return this.context.getInteractionResponder().successResponse();
			}

			await ScheduleDraftStorage.save(this.persistence, user.id, {
				stage: 'delete',
			});
			const deleteModal = buildScheduleSetupModal(
				this.appId,
				t,
				existing,
				null,
				'delete',
			);

			return this.context
				.getInteractionResponder()
				.updateModalViewResponse(deleteModal);
		}
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

				const modal = buildManageUserModal(record, this.appId, t);
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
			t,
			roomId,
		);
		await this.modify
			.getUiController()
			.openSurfaceView(modal, { triggerId }, user);

		return this.context.getInteractionResponder().successResponse();
	}
}
