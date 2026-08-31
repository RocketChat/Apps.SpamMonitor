import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import { SectionBlock } from '@rocket.chat/ui-kit';
import {
	ManageUserActionId,
	CONFIRM_ACTION_MODAL_ID,
	BlockId,
} from '../enums/modals/manageUsers';
import {
	LEVEL_RESET_ACTION_ID,
	ConfirmMeta,
} from '../definition/confirmationModal';
import { Translations } from '../definition/languagepreference';
import { button, modalShell, section } from '../lib/utils/UiKitHandler';

export function buildConfirmActionModal(
	realAction: ManageUserActionId | typeof LEVEL_RESET_ACTION_ID,
	identifier: string,
	displayName: string,
	appId: string,
	t: Translations,
	roomId?: string,
	overrideMeta?: ConfirmMeta,
	showAtMention = true,
): IUIKitSurfaceViewParam {
	const meta: ConfirmMeta =
		overrideMeta ??
		t.ConfirmActionMeta[realAction as ManageUserActionId] ??
		t.confirmationModal.ManageUserAction;

	const viewId = `${CONFIRM_ACTION_MODAL_ID}::${realAction}::${identifier}::${roomId}`;

	const targetSection: SectionBlock = section(
		showAtMention
			? `*Target:* @${displayName}\n\n${meta.description}`
			: `*${displayName}*\n\n${meta.description}`,
		{ blockId: BlockId.CONFIRM_TARGET },
	);

	return modalShell({
		id: viewId,
		title: meta.title,
		blocks: [targetSection],
		submit: button({
			appId,
			blockId: BlockId.CONFIRM_SUBMIT,
			actionId: BlockId.CONFIRM_SUBMIT,
			label: meta.confirmLabel,
			style: meta.danger ? 'danger' : 'primary',
		}),
		close: button({
			appId,
			blockId: BlockId.CONFIRM_CLOSE,
			actionId: BlockId.CONFIRM_CLOSE,
			label: t.commonModalText.cancel,
		}),
	});
}

export function buildResetLevelConfirmModal(
	level: number,
	levelDisplayName: string,
	appId: string,
	t: Translations,
	roomId?: string,
): IUIKitSurfaceViewParam {
	return buildConfirmActionModal(
		LEVEL_RESET_ACTION_ID,
		String(level),
		levelDisplayName,
		appId,
		t,
		roomId,
		t.confirmationModal.LevelResetToDefault,
		false,
	);
}
