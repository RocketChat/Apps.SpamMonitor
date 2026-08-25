import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import {
	ButtonElement,
	SectionBlock,
	TextObjectType,
} from '@rocket.chat/ui-kit';
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

	const submitButton: ButtonElement = {
		type: 'button',
		appId,
		blockId: BlockId.CONFIRM_SUBMIT,
		actionId: BlockId.CONFIRM_SUBMIT,
		text: { type: TextObjectType.PLAIN_TEXT, text: meta.confirmLabel },
		style: meta.danger ? 'danger' : 'primary',
	};

	const closeButton: ButtonElement = {
		type: 'button',
		appId,
		blockId: BlockId.CONFIRM_CLOSE,
		actionId: BlockId.CONFIRM_CLOSE,
		text: {
			type: TextObjectType.PLAIN_TEXT,
			text: t.commonModalText.cancel,
		},
	};

	const targetSection: SectionBlock = {
		type: 'section',
		blockId: BlockId.CONFIRM_TARGET,
		text: {
			type: TextObjectType.MRKDWN,
			text: showAtMention
				? `*Target:* @${displayName}\n\n${meta.description}`
				: `*${displayName}*\n\n${meta.description}`,
		},
	};

	return {
		id: viewId,
		type: UIKitSurfaceType.MODAL,
		title: { type: TextObjectType.PLAIN_TEXT, text: meta.title },
		submit: submitButton,
		close: closeButton,
		blocks: [targetSection],
	};
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
