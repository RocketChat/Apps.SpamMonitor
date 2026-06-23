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
import { ConfirmActionMeta } from '../lib/translations/locals/en';

export function buildConfirmActionModal(
	realAction: ManageUserActionId,
	userId: string,
	username: string,
	appId: string,
	roomId?: string,
): IUIKitSurfaceViewParam {
	const meta = ConfirmActionMeta[realAction] ?? {
		title: 'Confirm Action',
		description: 'Are you sure you want to perform this action?',
		confirmLabel: 'Confirm',
	};

	const viewId = `${CONFIRM_ACTION_MODAL_ID}::${realAction}::${userId}::${roomId}`;

	const submitButton: ButtonElement = {
		type: 'button',
		appId,
		blockId: BlockId.CONFIRM_SUBMIT,
		actionId: 'confirm_action_submit',
		text: { type: TextObjectType.PLAIN_TEXT, text: meta.confirmLabel },
		style: meta.danger ? 'danger' : 'primary',
	};

	const closeButton: ButtonElement = {
		type: 'button',
		appId,
		blockId: BlockId.CONFIRM_CLOSE,
		actionId: 'confirm_action_close',
		text: { type: TextObjectType.PLAIN_TEXT, text: 'Cancel' },
	};

	const targetSection: SectionBlock = {
		type: 'section',
		blockId: BlockId.CONFIRM_TARGET,
		text: {
			type: TextObjectType.MRKDWN,
			text: `*Target:* @${username}\n\n${meta.description}`,
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
