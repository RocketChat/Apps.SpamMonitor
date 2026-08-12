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
import { SPAMMING_LEVEL_LABELS, SpammingLevel } from '../definition/spamlevel';
import {
	ManageUserActionId,
	CONFIRM_ACTION_MODAL_ID,
} from '../enums/modals/manageUsers';
import { sendNotification } from '../lib/utils/notifications';
import { RoomInteractionStorage } from '../persistence/roomInteraction';
import {
	AdminActionMessages,
	levelConfigNotification,
	scheduleNotification,
	scheduleValidationText,
	whitelistNotification,
} from '../lib/translations/locals/en';
import { EDIT_LEVEL_MODAL_ID } from '../enums/modals/levelConfig';
import { LevelConfigStore } from '../persistence/levelConfigStore';
import {
	diffLevelConfig,
	formatConfigChangeSummary,
	hasChanges,
	parseEditLevelConfig,
	parseLevelFromEditModalId,
} from '../modals/editLevelModal';
import { LEVEL_RESET_ACTION_ID } from '../definition/confirmationModal';
import { buildCronExpression } from '../core/scheduleCron';
import { ScheduleDraft, ScheduleRecord } from '../definition/scheduleReports';
import { CadencePreset } from '../enums/modals/scheduleReports';
import {
	SCHEDULE_SETUP_MODAL_ID,
	ScheduleBlockId,
} from '../enums/modals/scheduleReports';
import {
	buildScheduleSetupModal,
	parseScheduleSetupState,
} from '../modals/scheduleReportModal';
import { DAILY_REPORT_JOB_ID } from '../core/schedulereport';
import { LOGGED_ACTIONS, LoggedUserAction } from '../enums/scheduleReports';
import { AdminActionLogStore } from '../persistence/scheduleReports/adminActionLogStore';
import { ScheduleDraftStorage } from '../persistence/scheduleReports/scheduleDraftStore';
import { ScheduleStore } from '../persistence/scheduleReports/scheduleStore';
import { WHITELIST_OVERVIEW_MODAL_ID } from '../enums/whitelist';
import { WhitelistStore } from '../persistence/whiteListStore';
import {
	parseWhitelistChannelListInput,
	parseWhitelistRoleListInput,
} from '../modals/whiteListModal';

export class ViewSubmitHandler {
	constructor(
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly persistence: IPersistence,
		private readonly modify: IModify,
		private readonly appId: string,
		private readonly context: UIKitViewSubmitInteractionContext,
	) {}

	public async handle(): Promise<IUIKitResponse> {
		const { view, user } = this.context.getInteractionData();

		if (view.id.startsWith(EDIT_LEVEL_MODAL_ID)) {
			const roomStorage = new RoomInteractionStorage(
				this.persistence,
				this.read.getPersistenceReader(),
				user.id,
			);
			const roomId = await roomStorage.getInteractionRoomId();
			const room = roomId
				? await this.read.getRoomReader().getById(roomId)
				: null;

			await this.handleEditLevelSubmit(
				view.id,
				view.state as Record<string, Record<string, unknown>>,
				user,
				room,
				this.read,
				this.modify,
				this.persistence,
			);
			return this.context.getInteractionResponder().successResponse();
		}

		if (view.id === SCHEDULE_SETUP_MODAL_ID) {
			return this.handleScheduleSetupSubmit(
				view.id,
				view.state as Record<string, Record<string, unknown>>,
				user,
				this.appId,
			);
		}
		if (view.id === WHITELIST_OVERVIEW_MODAL_ID) {
			return this.handleWhitelistSave(
				view.state as Record<string, Record<string, unknown>>,
				user,
			);
		}
		if (!view.id.startsWith(CONFIRM_ACTION_MODAL_ID)) {
			return this.context.getInteractionResponder().successResponse();
		}

		// view.id format: confirm_action_modal::<realAction>::<userId>::<roomId>
		const parts = view.id.split('::');
		if (parts.length !== 4) {
			return this.context.getInteractionResponder().successResponse();
		}

		const [, realAction, userId, roomId] = parts;
		if (realAction === LEVEL_RESET_ACTION_ID) {
			const level = parseInt(userId, 10) as SpammingLevel;
			const room = roomId
				? await this.read.getRoomReader().getById(roomId)
				: null;
			await this.handleResetLevelToDefault(level, user, room);
			return this.context.getInteractionResponder().successResponse();
		}

		const targetUser = await this.read.getUserReader().getById(userId);
		if (!targetUser) {
			return this.context.getInteractionResponder().successResponse();
		}
		const notifyRoom = roomId
			? await this.read.getRoomReader().getById(roomId)
			: null;
		function isLoggedUserAction(value: string): value is LoggedUserAction {
			return LOGGED_ACTIONS.includes(value);
		}
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
			if (!isLoggedUserAction(realAction)) {
				console.error(
					`[ViewSubmitHandler] Unknown action in view id: ${realAction}`,
				);
				return this.context.getInteractionResponder().successResponse();
			}

			await this.executeAction(
				realAction as LoggedUserAction,
				targetUser,
				user,
				fallbackRoom,
			);
			return this.context.getInteractionResponder().successResponse();
		}
		if (!isLoggedUserAction(realAction)) {
			console.error(
				`[ViewSubmitHandler] Unknown action in view id: ${realAction}`,
			);
			return this.context.getInteractionResponder().successResponse();
		}

		await this.executeAction(
			realAction as LoggedUserAction,
			targetUser,
			user,
			notifyRoom,
		);

		return this.context.getInteractionResponder().successResponse();
	}

	private async handleScheduleSetupSubmit(
		viewId: string,
		state: Record<string, Record<string, unknown>>,
		user: IUser,
		appId: string,
	): Promise<IUIKitResponse> {
		const stored = await ScheduleDraftStorage.get(this.read, user.id);

		if (stored?.stage === 'delete') {
			return this.finalizeScheduleDeletion(user);
		}

		if (stored?.stage === 'confirm') {
			return this.finalizeScheduleCreation(stored.draft, user);
		}

		const draft = parseScheduleSetupState(
			state,
			user.id,
			(user.utcOffset ?? 0) * 60,
		);
		if (!draft) {
			return this.context.getInteractionResponder().viewErrorResponse({
				viewId,
				errors: {
					[ScheduleBlockId.TIME_INPUT]:
						scheduleValidationText.invalidTime,
				},
			});
		}
		if (draft.preset === CadencePreset.CUSTOM && draft.days.length === 0) {
			return this.context.getInteractionResponder().viewErrorResponse({
				viewId,
				errors: {
					[ScheduleBlockId.DAY_MULTISELECT]:
						scheduleValidationText.missingCustomDays,
				},
			});
		}

		await ScheduleDraftStorage.save(this.persistence, user.id, {
			stage: 'confirm',
			draft,
		});
		const existing = await ScheduleStore.get(this.read);
		const confirmView = buildScheduleSetupModal(appId, existing, draft);

		return this.context
			.getInteractionResponder()
			.updateModalViewResponse(confirmView);
	}

	private async finalizeScheduleCreation(
		draft: ScheduleDraft,
		user: IUser,
	): Promise<IUIKitResponse> {
		try {
			const existing = await ScheduleStore.get(this.read);
			const cronExpression = buildCronExpression(
				draft.reportTime,
				draft.utcOffsetMinutes,
				draft.days,
			);
			const record: ScheduleRecord = {
				...draft,
				cronExpression,
				lastReportSentAt: existing?.lastReportSentAt ?? Date.now(),
				updatedAt: Date.now(),
			};
			await ScheduleStore.replace(this.persistence, record);
			await this.modify
				.getScheduler()
				.cancelJob(DAILY_REPORT_JOB_ID)
				.catch(() => {});
			await this.modify.getScheduler().scheduleRecurring({
				id: DAILY_REPORT_JOB_ID,
				interval: cronExpression,
				skipImmediate: true,
			});

			await ScheduleDraftStorage.clear(this.persistence, user.id);

			await this.notifyScheduleChange(
				user,
				scheduleNotification.ScheduleSet(user.username),
			);

			return this.context.getInteractionResponder().successResponse();
		} catch (err) {
			console.error(
				'[ViewSubmitHandler] Failed to finalize schedule',
				err,
			);
			return this.context.getInteractionResponder().errorResponse();
		}
	}

	private async finalizeScheduleDeletion(
		user: IUser,
	): Promise<IUIKitResponse> {
		try {
			await this.modify
				.getScheduler()
				.cancelJob(DAILY_REPORT_JOB_ID)
				.catch(() => {});
			await ScheduleStore.clear(this.persistence);
			await ScheduleDraftStorage.clear(this.persistence, user.id);

			await this.notifyScheduleChange(
				user,
				scheduleNotification.ScheduleRemoved(user.username),
			);

			return this.context.getInteractionResponder().successResponse();
		} catch (err) {
			console.error('[ViewSubmitHandler] Failed to delete schedule', err);
			return this.context.getInteractionResponder().errorResponse();
		}
	}

	private async notifyScheduleChange(
		user: IUser,
		message: string,
	): Promise<void> {
		const roomStorage = new RoomInteractionStorage(
			this.persistence,
			this.read.getPersistenceReader(),
			user.id,
		);
		const roomId = await roomStorage.getInteractionRoomId();
		const room = roomId
			? await this.read.getRoomReader().getById(roomId)
			: null;
		if (!room) return;

		await sendNotification(this.read, this.modify, user, room, { message });
	}
	private async handleResetLevelToDefault(
		level: SpammingLevel,
		admin: IUser,
		room: IRoom | null | undefined,
	): Promise<void> {
		await LevelConfigStore.resetLevel(this.read, this.persistence, level);
		if (!room) return;
		await sendNotification(this.read, this.modify, admin, room, {
			message: levelConfigNotification.LevelConfigResetToDefault(
				level,
				admin.username,
			),
		});
	}
	private async handleEditLevelSubmit(
		viewId: string,
		state: Record<string, Record<string, unknown>>,
		admin: IUser,
		room: IRoom | null | undefined,
		read: IRead,
		modify: IModify,
		persistence: IPersistence,
	): Promise<void> {
		const level = parseLevelFromEditModalId(viewId);
		if (level === undefined) return;
		const before = await LevelConfigStore.get(read, level);
		const incoming = parseEditLevelConfig(state, level, before);
		if (!incoming) return;
		const diff = diffLevelConfig(before, incoming);
		if (!hasChanges(diff)) {
			if (room) {
				await sendNotification(read, modify, admin, room, {
					message:
						levelConfigNotification.LevelConfigNoChangesFound(
							level,
						),
				});
			}
			return;
		}
		await LevelConfigStore.save(read, persistence, incoming);
		if (!room) return;
		const changeSummary = formatConfigChangeSummary(
			level,
			before,
			incoming,
			diff,
		);
		await sendNotification(read, modify, admin, room, {
			message: changeSummary,
		});
	}
	private async handleWhitelistSave(
		state: Record<string, Record<string, unknown>>,
		user: IUser,
	): Promise<IUIKitResponse> {
		const { roomIds: currentRoomIds } = await WhitelistStore.get(this.read);
		const currentLabels = await Promise.all(
			currentRoomIds.map(async (id) => {
				const room = await this.read.getRoomReader().getById(id);
				return {
					id,
					label: room?.slugifiedName ?? room?.displayName ?? id,
				};
			}),
		);
		const newChannelNames = [
			...new Set(parseWhitelistChannelListInput(state)),
		];
		const removedRooms = currentLabels.filter(
			(r) => !newChannelNames.includes(r.label),
		);
		const addedNames = newChannelNames.filter(
			(name) => !currentLabels.some((r) => r.label === name),
		);
		const notFound: string[] = [];
		for (const name of addedNames) {
			const room = await this.read.getRoomReader().getByName(name);
			if (room) {
				await WhitelistStore.addRoom(
					this.read,
					this.persistence,
					room.id,
				);
			} else {
				notFound.push(name);
			}
		}
		for (const r of removedRooms) {
			await WhitelistStore.removeRoom(this.read, this.persistence, r.id);
		}
		const { roleIds: currentRoleIds } = await WhitelistStore.get(this.read);
		const newRoleIds = [...new Set(parseWhitelistRoleListInput(state))];
		const addedRoles = newRoleIds.filter(
			(r) => !currentRoleIds.includes(r),
		);
		const removedRoles = currentRoleIds.filter(
			(r) => !newRoleIds.includes(r),
		);
		for (const roleId of addedRoles) {
			await WhitelistStore.addRole(this.read, this.persistence, roleId);
		}
		for (const roleId of removedRoles) {
			await WhitelistStore.removeRole(
				this.read,
				this.persistence,
				roleId,
			);
		}
		await this.notifyWhitelistChange(
			user,
			whitelistNotification.WhitelistUpdated(
				addedNames.filter((n) => !notFound.includes(n)),
				removedRooms.map((r) => r.label),
				addedRoles,
				removedRoles,
				notFound,
			),
		);
		return this.context.getInteractionResponder().successResponse();
	}
	private async notifyWhitelistChange(
		user: IUser,
		message: string,
	): Promise<void> {
		const roomStorage = new RoomInteractionStorage(
			this.persistence,
			this.read.getPersistenceReader(),
			user.id,
		);
		const roomId = await roomStorage.getInteractionRoomId();
		const room = roomId
			? await this.read.getRoomReader().getById(roomId)
			: null;
		if (!room) return;
		await sendNotification(this.read, this.modify, user, room, { message });
	}
	private async executeAction(
		action: LoggedUserAction,
		targetUser: IUser,
		admin: IUser,
		room: IRoom,
	): Promise<void> {
		const notify = async (message: string) => {
			await sendNotification(this.read, this.modify, admin, room, {
				message,
			});
		};
		const logAction = async (
			previousLevel?: SpammingLevel,
			newLevel?: SpammingLevel,
		) => {
			await AdminActionLogStore.log(this.persistence, this.read, {
				userId: targetUser.id,
				username: targetUser.username,
				action: action,
				adminUsername: admin.username,
				timestamp: Date.now(),
				previousLevel,
				newLevel,
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
				await logAction();
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
				await logAction();
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
				await logAction(before?.spammingLevel, after?.spammingLevel);
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
				await logAction();
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
