import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import {
	ActionsBlock,
	ButtonElement,
	DividerBlock,
	SectionBlock,
	TextObjectType,
} from '@rocket.chat/ui-kit';
import {
	UserSpamRecord,
	SPAMMING_LEVEL_LABELS,
	SpammingLevel,
} from '../definition/spamlevel';
import {
	ManageUserActionId,
	MANAGE_USER_MODAL_ID,
	BlockId,
} from '../enums/modals/manageUsers';
import { formatCooldown, formatDate } from '../lib/utils/messageUtils';
import { ConfirmActionMeta } from '../lib/translations/locals/en';

// Falls back to a plain label if an action is ever missing from ConfirmActionMeta
function buttonLabel(action: ManageUserActionId, fallback: string): string {
	return ConfirmActionMeta[action]?.confirmLabel ?? fallback;
}

function buildActionButton(
	appId: string,
	confirmActionId: ManageUserActionId,
	labelAction: ManageUserActionId,
	fallbackLabel: string,
	userId: string,
	style?: ButtonElement['style'],
): ButtonElement {
	return {
		type: 'button',
		appId,
		blockId: BlockId.ACTIONS,
		actionId: confirmActionId,
		text: {
			type: TextObjectType.PLAIN_TEXT,
			text: buttonLabel(labelAction, fallbackLabel),
		},
		value: userId,
		...(style ? { style } : {}),
	};
}

export function buildManageUserModal(
	record: UserSpamRecord,
	appId: string,
): IUIKitSurfaceViewParam {
	const levelLabel =
		SPAMMING_LEVEL_LABELS[record.spammingLevel] ??
		String(record.spammingLevel);
	const isOnCooldown =
		record.cooldownUntil > 0 && Date.now() < record.cooldownUntil;
	const isClean = record.spammingLevel === SpammingLevel.Clean;

	const userInfoBlock: SectionBlock = {
		type: 'section',
		blockId: BlockId.USER_INFO,
		text: {
			type: TextObjectType.MRKDWN,
			text: `*User:* @${record.username}`,
		},
	};

	const detailsBlock: SectionBlock = {
		type: 'section',
		blockId: BlockId.DETAILS,
		fields: [
			{
				type: TextObjectType.MRKDWN,
				text: `*Spam Level:*\n${levelLabel}`,
			},
			{
				type: TextObjectType.MRKDWN,
				text: `*Cooldown:*\n${formatCooldown(record.cooldownUntil)}`,
			},
			{
				type: TextObjectType.MRKDWN,
				text: `*Last Escalation:*\n${formatDate(record.lastEscalation)}`,
			},
		],
	};

	const dividerBlock: DividerBlock = {
		type: 'divider',
		blockId: BlockId.DIVIDER,
	};

	const actionsHeaderBlock: SectionBlock = {
		type: 'section',
		blockId: BlockId.ACTIONS_HEADER,
		text: {
			type: TextObjectType.MRKDWN,
			text: '*Admin Actions*',
		},
	};

	const actionButtons: ButtonElement[] = [
		buildActionButton(
			appId,
			ManageUserActionId.CONFIRM_VOUCH,
			ManageUserActionId.VOUCH,
			'Vouch',
			record.userId,
			'primary',
		),
		...(isOnCooldown
			? [
					buildActionButton(
						appId,
						ManageUserActionId.CONFIRM_RESET_COOLDOWN,
						ManageUserActionId.RESET_COOLDOWN,
						'Reset Cooldown',
						record.userId,
					),
				]
			: []),
		...(!isClean
			? [
					buildActionButton(
						appId,
						ManageUserActionId.CONFIRM_RESET_LEVEL_DOWN,
						ManageUserActionId.RESET_LEVEL_DOWN,
						'Level Down',
						record.userId,
					),
					buildActionButton(
						appId,
						ManageUserActionId.CONFIRM_RESET_LEVEL_CLEAN,
						ManageUserActionId.RESET_LEVEL_CLEAN,
						'Reset to Clean',
						record.userId,
						'danger',
					),
				]
			: []),
	];

	const actionsBlock: ActionsBlock = {
		type: 'actions',
		blockId: BlockId.ACTIONS,
		elements: actionButtons,
	};

	const blocks = [
		userInfoBlock,
		detailsBlock,
		dividerBlock,
		actionsHeaderBlock,
		actionsBlock,
	];

	return {
		id: MANAGE_USER_MODAL_ID,
		type: UIKitSurfaceType.MODAL,
		title: {
			type: TextObjectType.PLAIN_TEXT,
			text: `Manage @${record.username}`,
		},
		blocks,
		close: {
			type: 'button',
			appId,
			blockId: BlockId.CLOSE,
			actionId: 'manage_user_close_action',
			style: 'danger',
			text: { type: TextObjectType.PLAIN_TEXT, text: 'Close' },
		},
	};
}
